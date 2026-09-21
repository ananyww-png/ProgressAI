"""OpenRouter-backed recommendations, with a deterministic rule-based fallback."""

import asyncio
import json
import os
import re

import httpx

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

SYSTEM = (
    "You are an infrastructure project-monitoring analyst for India's Ministry of Statistics and Programme "
    "Implementation (PAIMANA portal). You get project-level data and model forecasts. Give specific, practical "
    "interventions that a central ministry, implementing agency or state government can take. Refer to the "
    "numbers you were given. Reply with JSON only, no markdown."
)

PROJECT_SCHEMA = (
    '{"summary": "2-3 sentence diagnosis", '
    '"root_causes": ["likely cause", ...], '
    '"recommendations": [{"action": "what to do", "owner": "who", "priority": "High|Medium|Low", '
    '"impact": "expected effect on time/cost"}], '
    '"watch_items": ["metric or milestone to track next month", ...]}'
)

BRIEF_SCHEMA = (
    '{"summary": "3-4 sentence portfolio diagnosis", '
    '"root_causes": ["systemic issue", ...], '
    '"recommendations": [{"action": "...", "owner": "...", "priority": "High|Medium|Low", "impact": "..."}], '
    '"watch_items": ["project or sector to watch", ...]}'
)


DEFAULT_MODELS = "deepseek/deepseek-v4.1-flash,z-ai/glm-5.3-flash,qwen/qwen3.8-flash"


def _models() -> list[str]:
    """OPENROUTER_MODEL is a comma-separated chain of models, tried in order."""
    return [m.strip() for m in os.getenv("OPENROUTER_MODEL", DEFAULT_MODELS).split(",") if m.strip()]


def llm_status() -> dict:
    return {"configured": bool(os.getenv("OPENROUTER_API_KEY")), "model": " → ".join(_models())}


def _extract_json(text: str) -> dict:
    text = re.sub(r"^```(json)?|```$", "", text.strip(), flags=re.M).strip()
    start, end = text.find("{"), text.rfind("}")
    return json.loads(text[start:end + 1])


async def _post(client, key: str, model: str, messages: list[dict], deadline: float, reasoning_off: bool):
    # Route to the fastest host for the model — the same model varies from ~4s to ~30s by provider.
    body = {"model": model, "temperature": 0.3, "messages": messages, "max_tokens": 1500,
            "provider": {"sort": "throughput"}}
    if reasoning_off:
        body["reasoning"] = {"enabled": False}  # no hidden thinking: faster and cheaper
    # wait_for is a hard deadline — httpx timeouts reset on OpenRouter's keep-alive bytes.
    return await asyncio.wait_for(client.post(OPENROUTER_URL, timeout=deadline, headers={
        "Authorization": f"Bearer {key}",
        "HTTP-Referer": os.getenv("APP_URL", "http://localhost:3000"),
        "X-Title": "ProgressAI",
    }, json=body), deadline)


async def _complete(messages: list[dict], parse, deadline: float = 30) -> tuple:
    """Run the model chain; `parse(text)` validates the reply (raise to try the next model)."""
    key = os.getenv("OPENROUTER_API_KEY")
    if not key:
        raise RuntimeError("OPENROUTER_API_KEY not set")
    errors = []
    async with httpx.AsyncClient() as client:
        for model in _models():
            try:
                res = await _post(client, key, model, messages, deadline, reasoning_off=True)
                if res.status_code == 400 and "reasoning" in res.text.lower():
                    # Some models (e.g. GLM) require reasoning; retry with it allowed.
                    res = await _post(client, key, model, messages, deadline, reasoning_off=False)
                res.raise_for_status()
                data = res.json()
                out = parse((data["choices"][0]["message"]["content"] or "").strip())
            except Exception as exc:  # noqa: BLE001 — rate limits, timeouts, bad output: try the next model
                errors.append(f"{model}: {type(exc).__name__} {str(exc)[:80]}")
                print(f"[llm] {errors[-1]}")
                continue
            return out, data.get("model", model)
    raise RuntimeError("; ".join(errors))


def _parse_recs(text: str) -> dict:
    out = _extract_json(text)
    if not out.get("recommendations"):
        raise ValueError("response had no recommendations")
    return out


async def _chat(prompt: str) -> dict:
    out, model = await _complete(
        [{"role": "system", "content": SYSTEM}, {"role": "user", "content": prompt}], _parse_recs)
    out["source"], out["model"] = "openrouter", model
    return out


# ─── Project Intelligence Assistant (chat over the uploaded portfolio) ─────

ASSISTANT = (
    "You are ProgressAI, a project-intelligence assistant for India's infrastructure monitoring (MoSPI / PAIMANA). "
    "You have the COMPLETE uploaded report below: a portfolio summary AND a row for every project. Never say you "
    "lack project-level data — look the project up in the table. Answer using only this data; if something truly "
    "isn't in it, say which field is missing. Costs are ₹ crore. 'fc_delay_mo' is our AI forecast delay in months, "
    "'rep_delay_mo' what the agency reports; a big gap is a hidden delay. When a FOCUS PROJECTS block is given, "
    "it holds the full record of the project(s) the user means — prioritise it, and treat 'this project', 'it' or "
    "'yourself' as that project. Be concise: lead with the answer, use short bullets, quote numbers. Whenever you "
    "mention a specific project, write its ID in square brackets like [RAI-2026-0058] so the UI can link it. "
    "Suggest concrete interventions (who should do what) when asked what to do."
)

TABLE_COLS = [("project_id", "id"), ("name", "name"), ("sector", "sector"), ("state", "state"),
              ("agency", "agency"), ("revised_cost", "rev_cost"), ("expenditure", "spent"), ("progress", "prog%"),
              ("planned_progress", "plan%"), ("reported_delay_months", "rep_delay_mo"),
              ("predicted_delay_months", "fc_delay_mo"), ("predicted_cost_overrun_pct", "fc_cost_ovr%"),
              ("risk_score", "risk"), ("delay_reason", "reasons")]

FOCUS_KEYS = ["project_id", "name", "ministry", "sector", "state", "agency", "status", "delay_reason",
              "original_cost", "revised_cost", "expenditure", "forecast_cost", "progress", "planned_progress",
              "spi", "cpi", "spend_ratio", "start_date", "original_end", "anticipated_end", "forecast_end",
              "reported_delay_months", "predicted_delay_months", "reported_cost_overrun_pct",
              "predicted_cost_overrun_pct", "delay_probability", "risk_score", "risk_level"]
STOP = {"the", "of", "and", "project", "projects", "phase", "stage", "line", "at", "in", "to", "for", "new",
        "ii", "iii", "pkg", "about", "tell", "me", "what", "is", "how", "doing", "your", "self", "yourself"}


def _portfolio_context(doc: dict) -> str:
    s = doc["summary"]
    head = {
        "report_date": doc["as_of"], "file": doc["filename"], "projects": s["total_projects"],
        "original_cost": _crore(s["original_cost"]), "revised_cost": _crore(s["revised_cost"]),
        "expenditure": _crore(s["expenditure"]), "avg_forecast_delay_mo": s["avg_predicted_delay"],
        "avg_reported_delay_mo": s["avg_reported_delay"], "risk_counts": s["risk_counts"],
        "alerts": s["alert_types"], "sectors": s["sectors"], "top_delay_reasons": s["delay_reasons"],
        "delay_model": {k: doc["model"][k] for k in ("accuracy", "baseline_accuracy", "drivers")} if doc.get("model") else None,
    }
    fmt = lambda v: "" if v is None else (f"{v:.0f}" if isinstance(v, float) else str(v).replace("|", "/"))
    rows = ["|".join(c for _, c in TABLE_COLS)]
    for p in sorted(doc["projects"], key=lambda p: -p["risk_score"])[:400]:
        alerts = ",".join(a["type"] for a in p["alerts"])
        rows.append("|".join(fmt(p.get(k)) for k, _ in TABLE_COLS) + (f"|alerts:{alerts}" if alerts else ""))
    return (f"PORTFOLIO SUMMARY:\n{json.dumps(head, default=str)}\n\n"
            f"ALL {len(doc['projects'])} PROJECTS (pipe-separated, sorted by risk, highest first):\n" + "\n".join(rows))


def _tokens(text: str) -> set[str]:
    return {t for t in re.findall(r"[a-z0-9]+", text.lower()) if len(t) > 2 and t not in STOP}


def find_projects(doc: dict, text: str, focus_id: str | None = None, limit: int = 5) -> list[dict]:
    """Projects a question refers to: explicit IDs first, then the open project, then name matches."""
    by_id = {p["project_id"].lower(): p for p in doc["projects"]}
    ids = re.findall(r"[a-z0-9][a-z0-9/_.-]*\d", text.lower())
    found = [by_id[i] for i in dict.fromkeys(ids) if i in by_id]
    if focus_id and focus_id.lower() in by_id:
        found.append(by_id[focus_id.lower()])
    q = _tokens(text)
    if q and not found:
        scored = []
        for p in doc["projects"]:
            name = _tokens(p["name"])
            hit = len(q & name)
            if name and (hit >= 2 or (hit == 1 and len(name) == 1)):
                scored.append((hit / len(name), p["risk_score"], p))
        found += [p for *_, p in sorted(scored, key=lambda x: (-x[0], -x[1]))[:limit]]
    return list({p["project_id"]: p for p in found}.values())[:limit]


def _focus_block(projects: list[dict]) -> str:
    recs = []
    for p in projects:
        r = {k: p.get(k) for k in FOCUS_KEYS if p.get(k) is not None}
        r["alerts"] = [a["text"] for a in p.get("alerts", [])]
        r["risk_drivers"] = [f"{d['factor']} ({d['contribution']:.0f} pts)" for d in p.get("drivers", [])]
        recs.append(r)
    return "FOCUS PROJECTS (full records):\n" + json.dumps(recs, default=str, ensure_ascii=False)


async def assistant_reply(doc: dict, history: list[dict], focus_id: str | None = None) -> dict:
    turns = [{"role": m["role"], "content": str(m["content"])[:4000]}
             for m in history[-12:] if m.get("role") in ("user", "assistant")]
    question = turns[-1]["content"] if turns else ""
    # Look up projects from the question; for follow-ups ("what about its cost?") reuse the previous question's.
    focus = find_projects(doc, question, focus_id)
    if not focus and len(turns) >= 3:
        focus = find_projects(doc, turns[-3]["content"])
    if focus:
        turns[-1] = {"role": "user", "content": f"{_focus_block(focus)}\n\nQUESTION: {question}"}
    messages = [{"role": "system", "content": ASSISTANT + "\n\n" + _portfolio_context(doc)}] + turns

    def parse(text: str) -> str:
        if not text:
            raise ValueError("empty reply")
        return text

    try:
        text, model = await _complete(messages, parse)
        return {"content": text, "source": "openrouter", "model": model,
                "focus": [p["project_id"] for p in focus]}
    except Exception as exc:  # noqa: BLE001
        return {"content": _offline_answer(doc, question, focus), "source": "rules",
                "fallback_reason": str(exc)[:200]}


def _offline_answer(doc: dict, question: str, focus: list[dict] | None = None) -> str:
    """Deterministic answer when no LLM is reachable."""
    if focus:
        lines = []
        for p in focus:
            lines.append(f"**[{p['project_id']}] {p['name']}** — {p['sector']}, {p.get('state') or '—'}; "
                         f"risk {p['risk_score']} ({p['risk_level']}).")
            lines.append(f"- Progress {p.get('progress') or 0:.0f}% vs {p.get('planned_progress') or 0:.0f}% planned; "
                         f"forecast delay {p.get('predicted_delay_months') or 0:.0f} mo "
                         f"(agency reports {p.get('reported_delay_months') or 0:.0f}).")
            lines += [f"- {a['text']}" for a in p.get("alerts", [])]
        return "The AI model is unreachable right now; here is the stored record:\n" + "\n".join(lines)
    q = question.lower()
    ps = [p for p in doc["projects"] if any(
        (p.get(k) or "").lower() in q for k in ("sector", "state", "agency", "ministry") if p.get(k))] or doc["projects"]
    top = sorted(ps, key=lambda p: -p["risk_score"])[:5]
    lines = [f"- [{p['project_id']}] {p['name']} — risk {p['risk_score']}, forecast delay "
             f"{p.get('predicted_delay_months') or 0:.0f} mo" for p in top]
    return ("The AI model is unreachable right now, so here are the highest-risk projects matching your "
            "question:\n" + "\n".join(lines))


# ─── Project recommendations & portfolio brief ─────────────────────────────

def _crore(v) -> str:
    return f"₹{v / 100000:.2f} lakh crore" if v >= 100000 else f"₹{v:,.0f} crore"


def _project_facts(p: dict) -> dict:
    keys = ["project_id", "name", "ministry", "sector", "state", "agency", "status", "delay_reason",
            "original_cost", "revised_cost", "expenditure", "progress", "planned_progress", "spi", "cpi",
            "start_date", "original_end", "anticipated_end", "forecast_end", "reported_delay_months",
            "predicted_delay_months", "reported_cost_overrun_pct", "predicted_cost_overrun_pct",
            "forecast_cost", "delay_probability", "risk_score", "risk_level"]
    facts = {k: p.get(k) for k in keys if p.get(k) is not None}
    facts["alerts"] = [a["text"] for a in p.get("alerts", [])]
    facts["risk_drivers"] = [d["factor"] for d in p.get("drivers", [])[:3]]
    return facts


async def recommend_project(p: dict, as_of) -> dict:
    prompt = (f"Report date: {as_of}. Costs are in ₹ crore.\nProject data:\n"
              f"{json.dumps(_project_facts(p), default=str, indent=1)}\n\n"
              f"Return 3-5 recommendations as JSON matching: {PROJECT_SCHEMA}")
    try:
        return await _chat(prompt)
    except Exception as exc:  # noqa: BLE001 — any LLM failure falls back to rules
        out = rule_recommendations(p)
        out["fallback_reason"] = str(exc)[:200]
        return out


async def portfolio_brief(summary: dict, top: list[dict], as_of) -> dict:
    compact = {k: v for k, v in summary.items() if k != "sectors"}
    for k in ("original_cost", "revised_cost", "expenditure"):
        compact[k] = _crore(summary[k])
    compact["sectors"] = summary["sectors"][:10]
    compact["highest_risk_projects"] = [
        {k: p.get(k) for k in ("name", "sector", "state", "risk_score", "predicted_delay_months",
                               "predicted_cost_overrun_pct", "delay_reason")} for p in top]
    prompt = (f"Report date: {as_of}. Costs in ₹ crore.\nPortfolio summary:\n"
              f"{json.dumps(compact, default=str, indent=1)}\n\n"
              f"Return 4-6 portfolio-level recommendations as JSON matching: {BRIEF_SCHEMA}")
    try:
        return await _chat(prompt)
    except Exception as exc:  # noqa: BLE001
        out = rule_brief(summary, top)
        out["fallback_reason"] = str(exc)[:200]
        return out


# ─── Rule-based fallback ────────────────────────────────────────────────────

REASON_PLAYBOOK = {
    "land": ("Set up a district-level land acquisition cell with the State Revenue Department and track parcels weekly.",
             "State Govt / District Collector"),
    "forest": ("Escalate pending forest/wildlife clearance to the MoEFCC Regional Empowered Committee.",
               "Implementing agency + MoEFCC"),
    "environment": ("Fast-track environment clearance via PARIVESH with a dedicated nodal officer.",
                    "Implementing agency + MoEFCC"),
    "contract": ("Invoke contract review: re-baseline milestones, apply LD clauses or re-tender stalled packages.",
                 "Implementing agency"),
    "fund": ("Release the pending tranche or re-appropriate funds at RE stage; link releases to milestones.",
             "Administrative Ministry / Dept. of Expenditure"),
    "utility": ("Hold a joint utility-shifting meeting with state DISCOMs and municipal bodies with dated targets.",
                "Implementing agency + State utilities"),
    "law": ("Coordinate with the State Home Department for site security and local grievance redressal.",
            "State Govt"),
    "rehabilitation": ("Expedite R&R package disbursement and grievance camps with the district administration.",
                       "State Govt / District Collector"),
    "monsoon": ("Re-sequence works to finish critical-path activities before the monsoon; add geotechnical investigation for pending reaches.",
                "Implementing agency"),
    "design": ("Freeze design changes; route further scope changes through a formal change-control board.",
               "Implementing agency"),
}


def rule_recommendations(p: dict) -> dict:
    recs, causes = [], []
    reason = (p.get("delay_reason") or "").lower()
    for key, (action, owner) in REASON_PLAYBOOK.items():
        if key in reason:
            causes.append(key.capitalize() + "-related bottleneck reported by agency")
            recs.append({"action": action, "owner": owner, "priority": "High",
                         "impact": "Removes the reported bottleneck on the critical path"})
    types = {a["type"] for a in p.get("alerts", [])}
    if "Hidden delay" in types:
        causes.append("Execution pace is far slower than the reported timeline assumes")
        recs.append({"action": "Ask the agency for a re-baselined schedule with monthly physical targets; "
                               "review in the next PRAGATI / ministry review meeting.",
                     "owner": "Administrative Ministry", "priority": "High",
                     "impact": f"Surfaces ~{p.get('predicted_delay_months', 0):.0f} months of unreported slippage early"})
    if "Burn anomaly" in types:
        causes.append("Expenditure is running ahead of physical progress")
        recs.append({"action": "Commission a third-party physical & financial audit before the next fund release.",
                     "owner": "IPMD / MoSPI + Ministry", "priority": "High",
                     "impact": "Contains further cost escalation"})
    if "Stalled" in types:
        recs.append({"action": "Deploy additional contractor resources or split the package; set a 90-day recovery plan.",
                     "owner": "Implementing agency", "priority": "Medium",
                     "impact": "Recovers pace towards planned progress"})
    if (p.get("predicted_cost_overrun_pct") or 0) > 20:
        recs.append({"action": "Prepare an early Revised Cost Estimate with price-variation analysis to avoid a late surprise.",
                     "owner": "Implementing agency + Finance", "priority": "Medium",
                     "impact": f"Forecast overrun {p.get('predicted_cost_overrun_pct', 0):.0f}% vs original sanction"})
    if not recs:
        recs.append({"action": "Continue monthly monitoring; no intervention needed at current pace.",
                     "owner": "Implementing agency", "priority": "Low", "impact": "Keeps project on track"})
    return {
        "summary": (f"{p.get('name')} is {p.get('risk_level', '').lower()} risk (score {p.get('risk_score')}). "
                    f"Forecast delay ≈ {p.get('predicted_delay_months') or 0:.0f} months and cost overrun ≈ "
                    f"{p.get('predicted_cost_overrun_pct') or 0:.0f}% versus the original sanction."),
        "root_causes": causes or [d["factor"] for d in p.get("drivers", [])[:3]],
        "recommendations": recs[:5],
        "watch_items": ["Monthly physical progress vs planned", "Expenditure vs physical progress",
                        "Anticipated completion date revisions"],
        "source": "rules",
    }


def rule_brief(summary: dict, top: list[dict]) -> dict:
    worst = sorted(summary["sectors"], key=lambda s: -(s["avg_risk"] or 0))[:3]
    reasons = [r["reason"] for r in summary.get("delay_reasons", [])[:3]]
    return {
        "summary": (f"{summary['risk_counts']['High']} of {summary['total_projects']} projects are high risk. "
                    f"Average forecast delay is {summary.get('avg_predicted_delay') or 0:.0f} months. "
                    f"Riskiest sectors: {', '.join(s['sector'] for s in worst)}."),
        "root_causes": reasons or ["Progress lagging planned schedule across sectors"],
        "recommendations": [
            {"action": f"Hold a focused review of the {len(top)} highest-risk projects with their ministries.",
             "owner": "IPMD / MoSPI", "priority": "High", "impact": "Prioritises interventions where slippage is largest"},
            {"action": "Require re-baselined schedules from agencies flagged for hidden delay.",
             "owner": "Administrative Ministries", "priority": "High", "impact": "Makes reported timelines realistic"},
            {"action": "Set up state-level task forces for recurring land and clearance bottlenecks.",
             "owner": "State Govts", "priority": "Medium", "impact": "Clears the most frequent delay cause"},
        ],
        "watch_items": [p["name"] for p in top[:5]],
        "source": "rules",
    }
