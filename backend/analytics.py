"""Forecasting, ML delay model, risk scoring, early warnings and portfolio aggregates."""

import math
import random
from collections import Counter, defaultdict
from datetime import date, timedelta
from statistics import mean, median

DAYS_PER_MONTH = 30.44


def _months(days: float) -> float:
    return round(days / DAYS_PER_MONTH, 1)


def _clamp(x: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, x))


# ─── Per-project base metrics ───────────────────────────────────────────────

def base_metrics(r: dict, as_of: date) -> dict:
    orig, rev, spent, prog = r.get("original_cost"), r.get("revised_cost"), r.get("expenditure"), r.get("progress")
    start, end, antic = r.get("start_date"), r.get("original_end"), r.get("anticipated_end")
    rev = rev or orig
    m = {"cost_base": rev}

    m["reported_cost_overrun_pct"] = round((rev - orig) / orig * 100, 1) if orig and rev else None
    m["spend_ratio"] = round(spent / rev * 100, 1) if spent is not None and rev else None
    m["reported_delay_months"] = _months((antic - end).days) if antic and end else None

    planned_days = (end - start).days if start and end else None
    elapsed_days = (as_of - start).days if start else None
    m["planned_days"], m["elapsed_days"] = planned_days, elapsed_days
    if planned_days and planned_days > 0 and elapsed_days is not None:
        m["planned_progress"] = round(_clamp(elapsed_days / planned_days) * 100, 1)
        m["elapsed_ratio"] = round(elapsed_days / planned_days, 2)
    else:
        m["planned_progress"] = m["elapsed_ratio"] = None

    pp = m["planned_progress"]
    m["spi"] = round(prog / pp, 2) if prog is not None and pp and pp >= 5 else None
    m["cpi"] = round((prog / 100) / (spent / rev), 2) if prog is not None and spent and rev else None
    return m


# ─── Logistic regression (pure Python) ──────────────────────────────────────

FEATURES = ["spi_gap", "burn_gap", "cost_revision", "elapsed_ratio", "log_cost"]
FEATURE_LABELS = {
    "spi_gap": "Physical progress behind plan",
    "burn_gap": "Spending ahead of physical progress",
    "cost_revision": "Cost already revised upward",
    "elapsed_ratio": "Share of planned duration elapsed",
    "log_cost": "Project size (cost)",
}


def _features(r: dict, m: dict) -> list[float] | None:
    if m["spi"] is None or m["elapsed_ratio"] is None:
        return None
    burn = ((m["spend_ratio"] or 0) - (r.get("progress") or 0)) / 100
    return [
        _clamp(1 - m["spi"], -1, 1),
        _clamp(burn, -1, 1),
        _clamp((m["reported_cost_overrun_pct"] or 0) / 100, -1, 3),
        _clamp(m["elapsed_ratio"], 0, 3),
        math.log10(max(m["cost_base"] or 150, 1)),
    ]


def _standardize(X):
    cols = list(zip(*X))
    mu = [mean(c) for c in cols]
    sd = [(max(mean((v - mu[j]) ** 2 for v in c), 1e-9)) ** 0.5 for j, c in enumerate(cols)]
    return mu, sd


def _sigmoid(z):
    return 1 / (1 + math.exp(-max(-30, min(30, z))))


def _fit(train):
    mu, sd = _standardize([x for x, _ in train])
    scale = lambda x: [(v - mu[j]) / sd[j] for j, v in enumerate(x)]
    w, b, lr, l2 = [0.0] * len(FEATURES), 0.0, 0.1, 0.01
    Xtr = [(scale(x), y) for x, y in train]
    for _ in range(400):
        gw, gb = [0.0] * len(w), 0.0
        for x, y in Xtr:
            err = _sigmoid(sum(wi * xi for wi, xi in zip(w, x)) + b) - y
            gw = [g + err * xi for g, xi in zip(gw, x)]
            gb += err
        n = len(Xtr)
        w = [wi - lr * (g / n + l2 * wi) for wi, g in zip(w, gw)]
        b -= lr * gb / n
    return w, lambda x: _sigmoid(sum(wi * xi for wi, xi in zip(w, scale(x))) + b)


def train_delay_model(samples: list[tuple[list[float], int]], folds: int = 5) -> dict | None:
    """Train on (features, label); report k-fold CV accuracy vs a conventional SPI<0.9 rule."""
    labels = [y for _, y in samples]
    if len(samples) < 20 or len(set(labels)) < 2:
        return None
    idx = list(range(len(samples)))
    random.Random(42).shuffle(idx)
    acc, base = [], []
    for k in range(folds):
        test = [samples[i] for i in idx[k::folds]]
        train = [samples[i] for j, i in enumerate(idx) if j % folds != k]
        if len({y for _, y in train}) < 2:
            continue
        _, predict = _fit(train)
        acc += [int((predict(x) >= 0.5) == bool(y)) for x, y in test]
        # Conventional baseline: flag as delayed when SPI < 0.9 (spi_gap > 0.1).
        base += [int((x[0] > 0.1) == bool(y)) for x, y in test]

    w, predict = _fit(samples)
    importance = sorted(
        [{"feature": FEATURE_LABELS[f], "weight": round(wi, 3)} for f, wi in zip(FEATURES, w)],
        key=lambda d: -abs(d["weight"]))
    return {
        "predict": predict,
        "info": {
            "type": "Logistic regression (L2)",
            "label": "Reported delay > 3 months",
            "evaluation": f"{folds}-fold cross-validation",
            "train_size": len(samples), "test_size": len(acc),
            "accuracy": round(mean(acc) * 100, 1), "baseline_accuracy": round(mean(base) * 100, 1),
            "baseline": "Rule: SPI < 0.9",
            "positive_rate": round(mean(labels) * 100, 1),
            "drivers": importance,
        },
    }


# ─── Forecasts, risk, alerts ────────────────────────────────────────────────

def _forecast(r: dict, m: dict, sector_delay_ratio: float, sector_cost_ratio: float) -> dict:
    prog = r.get("progress")
    start, end = r.get("start_date"), r.get("original_end")
    out = {"forecast_end": None, "predicted_delay_months": None, "forecast_cost": None,
           "predicted_cost_overrun_pct": None}

    # Early-stage pace is noisy, so trust it progressively as progress grows.
    weight = _clamp((prog or 0) / 40)
    if start and end and m["planned_days"] and m["planned_days"] > 0 and m["elapsed_days"] is not None:
        planned = m["planned_days"]
        prior_total = planned * (1 + sector_delay_ratio)
        if prog is not None and prog >= 100:
            total = max(m["elapsed_days"], planned) if r.get("anticipated_end") is None else \
                (r["anticipated_end"] - start).days
        elif prog and prog > 0 and m["elapsed_days"] > 0:
            pace_total = m["elapsed_days"] / (prog / 100)
            total = weight * pace_total + (1 - weight) * prior_total
        else:
            total = prior_total
        total = min(total, planned * 3.5)
        total = max(total, m["elapsed_days"] + 30 if (prog or 0) < 100 else total)
        f_end = start + timedelta(days=round(total))
        out["forecast_end"] = f_end
        out["predicted_delay_months"] = max(0.0, _months((f_end - end).days))

    orig, base, spent = r.get("original_cost"), m["cost_base"], r.get("expenditure")
    if base:
        prior_cost = base * (1 + sector_cost_ratio)
        if m["cpi"] and prog and prog > 0:
            eac = weight * (base / _clamp(m["cpi"], 0.3, 3)) + (1 - weight) * prior_cost
        else:
            eac = prior_cost
        eac = max(eac, spent or 0, base * 0.9)
        eac = min(eac, (orig or base) * 3)
        out["forecast_cost"] = round(eac, 1)
        if orig:
            out["predicted_cost_overrun_pct"] = round((eac - orig) / orig * 100, 1)
    return out


def _risk(r: dict, m: dict, f: dict, prob: float | None) -> tuple[int, list[dict]]:
    parts = {
        "Forecast schedule slippage": (0.30, _clamp((f["predicted_delay_months"] or 0) / 36)),
        "Forecast cost overrun": (0.25, _clamp((f["predicted_cost_overrun_pct"] or 0) / 60)),
        "Physical progress behind plan": (0.15, _clamp(1 - m["spi"]) if m["spi"] is not None else 0),
        "Spending ahead of progress": (0.10, _clamp(((m["spend_ratio"] or 0) - (r.get("progress") or 0)) / 30)),
    }
    if prob is not None:
        parts["ML delay probability"] = (0.20, prob)
    total_w = sum(w for w, _ in parts.values())
    score = round(sum(w * v for w, v in parts.values()) / total_w * 100)
    drivers = sorted(
        [{"factor": k, "contribution": round(w * v / total_w * 100, 1)} for k, (w, v) in parts.items() if v > 0],
        key=lambda d: -d["contribution"])
    return score, drivers


def _alerts(r: dict, m: dict, f: dict, as_of: date) -> list[dict]:
    alerts = []
    prog = r.get("progress") or 0
    pred, rep = f["predicted_delay_months"], m["reported_delay_months"]
    if pred is not None and pred - (rep or 0) >= 6:
        alerts.append({"type": "Hidden delay", "severity": "critical",
                       "text": f"Current pace implies ~{pred:.0f} months delay; agency reports {rep or 0:.0f}."})
    if m["spend_ratio"] is not None and m["spend_ratio"] - prog >= 15:
        alerts.append({"type": "Burn anomaly", "severity": "serious",
                       "text": f"{m['spend_ratio']:.0f}% of cost spent for {prog:.0f}% physical progress."})
    if m["spi"] is not None and m["spi"] < 0.6 and prog < 100:
        alerts.append({"type": "Stalled", "severity": "serious",
                       "text": f"Progress is {m['spi']:.2f}× of planned ({prog:.0f}% vs {m['planned_progress']:.0f}%)."})
    if r.get("original_end") and r["original_end"] < as_of and prog < 100:
        alerts.append({"type": "Past due", "severity": "warning",
                       "text": f"Original completion {r['original_end'].isoformat()} has passed at {prog:.0f}% progress."})
    if m["reported_cost_overrun_pct"] is not None and m["reported_cost_overrun_pct"] >= 25:
        alerts.append({"type": "Cost revised", "severity": "warning",
                       "text": f"Cost already revised +{m['reported_cost_overrun_pct']:.0f}% over sanction."})
    return alerts


def analyse(records: list[dict], as_of: date | None = None) -> dict:
    report_dates = [r["report_date"] for r in records if r.get("report_date")]
    as_of = as_of or (max(report_dates) if report_dates else date.today())

    metrics = [base_metrics(r, as_of) for r in records]

    # Sector priors from reported overruns (used to stabilise early-stage forecasts).
    sd_ratio, sc_ratio = defaultdict(list), defaultdict(list)
    for r, m in zip(records, metrics):
        s = r.get("sector") or "Unspecified"
        if m["reported_delay_months"] is not None and m["planned_days"]:
            sd_ratio[s].append(max(0, m["reported_delay_months"] * DAYS_PER_MONTH / m["planned_days"]))
        if m["reported_cost_overrun_pct"] is not None:
            sc_ratio[s].append(max(0, m["reported_cost_overrun_pct"] / 100))
    all_d = [v for vs in sd_ratio.values() for v in vs]
    all_c = [v for vs in sc_ratio.values() for v in vs]
    prior_d = lambda s: median(sd_ratio[s]) if len(sd_ratio[s]) >= 3 else (median(all_d) if all_d else 0.2)
    prior_c = lambda s: median(sc_ratio[s]) if len(sc_ratio[s]) >= 3 else (median(all_c) if all_c else 0.1)

    feats = [_features(r, m) for r, m in zip(records, metrics)]
    samples = [(x, int(m["reported_delay_months"] > 3)) for x, m in zip(feats, metrics)
               if x is not None and m["reported_delay_months"] is not None]
    model = train_delay_model(samples)

    projects = []
    for r, m, x in zip(records, metrics, feats):
        sector = r.get("sector") or "Unspecified"
        f = _forecast(r, m, prior_d(sector), prior_c(sector))
        prob = round(model["predict"](x), 3) if model and x is not None else None
        score, drivers = _risk(r, m, f, prob)
        alerts = _alerts(r, m, f, as_of)
        level = "High" if score >= 65 else "Medium" if score >= 40 else "Low"
        projects.append({**r, **m, **f, "sector": sector, "delay_probability": prob,
                         "risk_score": score, "risk_level": level, "drivers": drivers, "alerts": alerts})

    return {"as_of": as_of, "projects": projects, "summary": summarise(projects),
            "model": model["info"] if model else None}


# ─── Portfolio aggregates ───────────────────────────────────────────────────

def _sum(ps, key):
    return round(sum(p.get(key) or 0 for p in ps), 1)


def _avg(ps, key):
    vals = [p[key] for p in ps if p.get(key) is not None]
    return round(mean(vals), 1) if vals else None


def summarise(projects: list[dict]) -> dict:
    by_sector = defaultdict(list)
    for p in projects:
        by_sector[p["sector"]].append(p)
    sectors = sorted([{
        "sector": s, "count": len(ps),
        "original_cost": _sum(ps, "original_cost"), "revised_cost": _sum(ps, "revised_cost"),
        "expenditure": _sum(ps, "expenditure"),
        "avg_predicted_delay": _avg(ps, "predicted_delay_months"),
        "avg_cost_overrun": _avg(ps, "predicted_cost_overrun_pct"),
        "avg_risk": _avg(ps, "risk_score"),
        "high_risk": sum(p["risk_level"] == "High" for p in ps),
    } for s, ps in by_sector.items()], key=lambda d: -d["count"])

    reasons = Counter()
    for p in projects:
        for part in (p.get("delay_reason") or "").replace(";", ",").split(","):
            if part.strip():
                reasons[part.strip()] += 1
    alert_types = Counter(a["type"] for p in projects for a in p["alerts"])

    return {
        "total_projects": len(projects),
        "original_cost": _sum(projects, "original_cost"),
        "revised_cost": _sum(projects, "revised_cost"),
        "expenditure": _sum(projects, "expenditure"),
        "avg_progress": _avg(projects, "progress"),
        "avg_predicted_delay": _avg(projects, "predicted_delay_months"),
        "avg_reported_delay": _avg(projects, "reported_delay_months"),
        "delayed_projects": sum((p.get("predicted_delay_months") or 0) > 3 for p in projects),
        "risk_counts": {lvl: sum(p["risk_level"] == lvl for p in projects) for lvl in ("High", "Medium", "Low")},
        "alert_count": sum(len(p["alerts"]) for p in projects),
        "alert_types": [{"type": t, "count": c} for t, c in alert_types.most_common()],
        "sectors": sectors,
        "delay_reasons": [{"reason": k, "count": v} for k, v in reasons.most_common(8)],
    }
