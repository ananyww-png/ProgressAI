# ProgressAI — Plan (SIH26103 · MoSPI)

**Problem:** PAIMANA tracks ~1,981 central infrastructure projects (≥ ₹150 Cr). Monitoring today is
*descriptive*. SIH26103 asks for a *predictive + prescriptive* early-warning system: forecast time and
cost overruns, score project risk, and recommend interventions — using open-source tools.

## The user flow (one path, no noise)

```
Upload Excel / CSV  ──►  Parse & map columns  ──►  Predict + score  ──►  Dashboard  ──►  AI recommendations
 (PAIMANA / CUF       (auto-detect header row,    (delay, cost, risk,   (KPIs, sector      (OpenRouter LLM,
  report export)        fuzzy column aliases)       early warnings)       charts, table)     rule fallback)
                                   │
                                   └──► stored in MongoDB (datasets collection)
```

1. **Upload** — drag an `.xlsx` / `.csv` (or use the built-in sample). Nothing else on screen.
2. **Parse** — the backend picks the best sheet, finds the header row, and maps columns like
   *“Original Cost (₹ Cr)”*, *“Anticipated Date of Commissioning”*, *“Physical Progress %”* to CUF fields.
   Unmapped / missing fields are shown, never silently dropped.
3. **Dashboard** — built from whatever was parsed: portfolio KPIs, risk distribution, overrun by sector,
   early-warning list, sortable/filterable project table.
4. **Project drawer** — predicted delay, predicted cost at completion, risk score + its drivers, alerts,
   and **“Get AI recommendations”** (OpenRouter). A portfolio-level AI brief sits on the dashboard.

## Prediction approach (explainable, open source, pure Python)

| Output | Method |
|---|---|
| **Time-overrun forecast** | Pace-based: `SPI = physical progress ÷ planned progress (elapsed/planned duration)`. Forecast duration = elapsed ÷ progress, blended with the sector’s reported overrun when progress is low (early-stage forecasts are unstable). |
| **Cost-overrun forecast** | EVM-style: `CPI = progress ÷ (expenditure ÷ revised cost)`; Estimate-at-Completion = revised cost ÷ CPI, blended the same way. |
| **Delay probability (ML)** | Logistic regression trained on the uploaded portfolio (label = reported delay > 3 months), features: SPI gap, burn-vs-progress gap, cost revision, elapsed ratio, log cost. Holdout accuracy is reported next to a conventional baseline (SPI < 0.9 rule) — answers SIH ask (b). Feature weights = **delay-driver analysis**. |
| **Risk score 0–100** | Weighted: forecast delay, forecast cost overrun, pace gap, burn anomaly, ML probability. High ≥ 65, Medium ≥ 40. |
| **Early warnings** | Rules: *hidden delay* (pace says ≥ 6 months later than the agency reports), spend running ahead of progress, stalled projects, past original completion date, cost revised > 25%. |

## Stack

- **Frontend:** React + Vite + Tailwind + Recharts (`src/`)
- **Backend:** FastAPI + openpyxl + pymongo + httpx (`backend/`) — no pandas/numpy needed
- **DB:** MongoDB (`MONGO_URI`) — falls back to in-memory if unreachable so the demo never breaks
- **LLM:** OpenRouter (`OPENROUTER_API_KEY`, `OPENROUTER_MODEL`) — cheap paid model chain (`deepseek/deepseek-v4.1-flash → z-ai/glm-5.3-flash → qwen/qwen3.8-flash`); falls back to rule-based recommendations

## API

| Method | Path | Purpose |
|---|---|---|
| GET  | `/api/health` | DB + LLM status |
| GET  | `/api/sample` | download the sample PAIMANA-style workbook |
| POST | `/api/upload` | multipart file → parse, analyse, store → full dataset |
| GET  | `/api/datasets` | recent uploads |
| GET  | `/api/datasets/{id}` | dataset with projects + summary |
| POST | `/api/datasets/{id}/projects/{pid}/recommend` | AI recommendations for one project (cached) |
| POST | `/api/datasets/{id}/brief` | AI portfolio brief |
| POST | `/api/datasets/{id}/chat` | Project Intelligence Assistant — chat grounded in the uploaded portfolio |

## Milestones

- [x] **M1 — Prototype demo**: upload → parse → dashboard → predictions → AI recommendations, Mongo persistence
- [ ] **M2 — Historical training**: ingest multiple monthly reports, train on OCMS/PAIMANA history (time-series of progress per project), gradient boosting (scikit-learn / LightGBM) vs logistic baseline
- [ ] **M3 — CUF attribution**: ablation study — predictive power from CUF fields vs extra variables (weather, land-acquisition status, contractor history)
- [x] **M4 — LLM assistant**: “Ask ProgressAI” chat over the uploaded portfolio; project IDs in answers open the project drawer
- [ ] **M5 — Deploy**: Docker compose (web + api + mongo), role-based access, monthly auto-ingest via API

## Demo script (3 minutes)

1. Open app → upload `sample_paimana_report.xlsx` (or click *Try sample data*).
2. Point at column-mapping chips: “it understood the ministry’s own report headers.”
3. KPIs → ₹ original vs revised vs spent; risk distribution; overrun by sector.
4. Early warnings → open a **hidden-delay** project: agency says on time, pace says +14 months.
5. Click **Get AI recommendations** → OpenRouter returns root causes + actions with owners.
6. Show ML card: logistic model accuracy vs SPI-rule baseline.
7. Click **Ask ProgressAI** → “Which sector needs intervention first?” → click a project ID in the answer.
