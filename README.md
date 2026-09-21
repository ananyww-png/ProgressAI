# ProgressAI — Infrastructure Project Early-Warning System

**SIH26103 · MoSPI** — Upload a PAIMANA / CUF project-monitoring Excel report and get:

- automatic column mapping (works with the ministry's own report headers)
- **time-overrun forecast** per project (pace / SPI based)
- **cost-overrun forecast** (EVM-style estimate at completion)
- **ML delay probability** (logistic regression, cross-validated against an SPI-rule baseline)
- **risk score 0–100** with explainable drivers, and **early-warning alerts** (hidden delay, burn anomaly, stalled, past due)
- **AI recommendations** per project and a portfolio brief via **OpenRouter** (rule-based fallback when no key)
- **Ask ProgressAI** — an LLM assistant that answers questions about the uploaded portfolio, with clickable project links
- uploads persisted in **MongoDB** (in-memory fallback)

See [PLAN.md](PLAN.md) for the approach, API and roadmap.

## Run it

```bash
# 1. Backend (Python 3.10+)
pip install -r backend/requirements.txt
cp backend/.env.example backend/.env      # add MONGO_URI and OPENROUTER_API_KEY
python backend/make_sample.py              # writes backend/sample_data/sample_paimana_report.xlsx
npm run api                                # http://localhost:8000

# 2. Frontend
npm install
npm run dev                                # http://localhost:3000
```

Open http://localhost:3000, drop an `.xlsx` / `.csv`, or click **Try with sample data**.

## Deploy on Vercel

One Vercel project serves both parts: Vite builds the frontend to `dist/`, and `api/index.py` runs the
FastAPI app in `backend/` as a Python function (`vercel.json` routes `/api/*` to it).

1. Import the repo in Vercel (framework: Vite — picked up from `vercel.json`).
2. **Settings → Environment Variables**: add `MONGO_URI`, `MONGO_DB`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`
   (same values as `backend/.env`), then redeploy.
3. MongoDB Atlas → Network Access must allow `0.0.0.0/0` (Vercel IPs change). MongoDB is required on Vercel —
   functions don't share memory, so the in-memory fallback can't hold uploads between requests.

Vercel limits uploads to 4.5 MB per request; a full PAIMANA export is well under that.

## Expected columns (any order, any reasonable header wording)

Project ID · Project name · Ministry · Sector · State · Implementing agency · Original cost · Revised cost ·
Cumulative expenditure · Date of approval / start · Original completion · Anticipated completion ·
Physical progress % · Status · Reasons for delay

Only a project name/ID column is mandatory; forecasts that need a missing column are skipped and the
dashboard lists what was missing.

## Layout

```
backend/
  main.py          FastAPI routes
  parser.py        Excel/CSV → records (header detection, fuzzy column aliases, date/number parsing)
  analytics.py     forecasts, logistic regression, risk score, alerts, portfolio aggregates
  llm.py           OpenRouter prompts + rule-based fallback
  store.py         MongoDB / in-memory store
  make_sample.py   synthetic PAIMANA-style workbook
src/
  App.tsx  UploadScreen.tsx  Dashboard.tsx  ProjectDrawer.tsx  AIPanel.tsx  Assistant.tsx  ui.tsx  api.ts  types.ts
```

## Sample data

`python backend/make_sample.py` writes four synthetic files to `backend/sample_data/` (also one-click on the upload screen):

| File | Projects | What it exercises |
|---|---|---|
| `sample_paimana_report.xlsx` | 180 | All-sector ministry export: title rows above the header, Total row, "Mar-2028" dates |
| `railways_zone_review.xlsx` | 70 | Cover sheet first, different header wording, progress as 0–1 fraction, dd/mm/yyyy text dates |
| `state_projects_export.csv` | 90 | Flat CSV, generic headers ("Title", "Approved Cost"), "45%" text progress, comma numbers |
| `early_stage_sanctions.xlsx` | 45 | Only 7 columns — no expenditure or revised dates; shows graceful degradation |

All sample data is synthetic, not real PAIMANA figures.
