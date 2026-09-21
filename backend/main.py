"""ProgressAI API — upload a PAIMANA-style report, get forecasts, risk scores and AI recommendations."""

import re
from datetime import date, datetime, timezone
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

from fastapi import FastAPI, File, HTTPException, UploadFile  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.responses import FileResponse  # noqa: E402
from pydantic import BaseModel  # noqa: E402

import llm  # noqa: E402
from analytics import analyse  # noqa: E402
from parser import parse_file  # noqa: E402
from store import Store  # noqa: E402

SAMPLE = Path(__file__).parent / "sample_data" / "sample_paimana_report.xlsx"
MAX_BYTES = 15 * 1024 * 1024

app = FastAPI(title="ProgressAI API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
store = Store()


def _jsonable(value):
    """Dates → ISO strings, recursively (Mongo can't store datetime.date)."""
    if isinstance(value, dict):
        return {k: _jsonable(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_jsonable(v) for v in value]
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    return value


def _key(project_id: str) -> str:
    return re.sub(r"[.$]", "_", project_id)


def _load(dataset_id: str) -> dict:
    doc = store.get(dataset_id)
    if not doc:
        raise HTTPException(404, "Dataset not found")
    return doc


@app.get("/api/health")
def health():
    return {"status": "ok", "store": store.mode, "llm": llm.llm_status()}


SAMPLE_INFO = {
    "sample_paimana_report.xlsx": ("PAIMANA monthly report", "180 projects · 12 sectors · ministry export with title rows"),
    "railways_zone_review.xlsx": ("Railways zonal review", "70 projects · cover sheet, fractional progress, text dates"),
    "state_projects_export.csv": ("State dashboard export", "90 projects · CSV with generic headers"),
    "early_stage_sanctions.xlsx": ("New sanctions (minimal)", "45 projects · only 7 columns, no expenditure or revised dates"),
}


@app.get("/api/samples")
def samples():
    return [{"file": f, "title": t, "description": d}
            for f, (t, d) in SAMPLE_INFO.items() if (SAMPLE.parent / f).exists()]


@app.get("/api/sample")
@app.get("/api/sample/{name}")
def sample(name: str = SAMPLE.name):
    path = SAMPLE.parent / name
    if name not in SAMPLE_INFO or not path.exists():
        raise HTTPException(404, "Sample not generated. Run: python make_sample.py")
    return FileResponse(path, filename=name)


@app.post("/api/upload")
async def upload(file: UploadFile = File(...)):
    name = file.filename or "upload.xlsx"
    if not name.lower().endswith((".xlsx", ".xlsm", ".csv")):
        raise HTTPException(400, "Upload an .xlsx, .xlsm or .csv file")
    content = await file.read()
    if len(content) > MAX_BYTES:
        raise HTTPException(413, "File is larger than 15 MB")
    try:
        parsed = parse_file(name, content)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    except Exception as exc:  # noqa: BLE001 — corrupt workbook etc.
        raise HTTPException(422, f"Could not read the file: {exc}") from exc
    if not parsed["records"]:
        raise HTTPException(422, "No project rows found under the header row")

    result = analyse(parsed["records"])
    doc = _jsonable({
        "filename": name,
        "uploaded_at": datetime.now(timezone.utc),
        "as_of": result["as_of"],
        "mapping": parsed["mapping"],
        "missing": parsed["missing"],
        "skipped_rows": parsed["skipped_rows"],
        "model": result["model"],
        "summary": result["summary"],
        "projects": result["projects"],
        "recommendations": {},
        "brief": None,
    })
    store.save(doc)
    return doc


@app.get("/api/datasets")
def datasets():
    return store.list()


@app.get("/api/datasets/{dataset_id}")
def dataset(dataset_id: str):
    return _load(dataset_id)


@app.post("/api/datasets/{dataset_id}/projects/{project_id}/recommend")
async def recommend(dataset_id: str, project_id: str, refresh: bool = False):
    doc = _load(dataset_id)
    cached = (doc.get("recommendations") or {}).get(_key(project_id))
    if cached and not refresh:
        return cached
    project = next((p for p in doc["projects"] if p["project_id"] == project_id), None)
    if not project:
        raise HTTPException(404, "Project not found")
    out = await llm.recommend_project(project, doc["as_of"])
    out["generated_at"] = datetime.now(timezone.utc).isoformat()
    store.set_field(dataset_id, f"recommendations.{_key(project_id)}", out)
    return out


class ChatRequest(BaseModel):
    messages: list[dict]
    focus_project_id: str | None = None


@app.post("/api/datasets/{dataset_id}/chat")
async def chat(dataset_id: str, body: ChatRequest):
    doc = _load(dataset_id)
    if not body.messages or body.messages[-1].get("role") != "user":
        raise HTTPException(400, "Last message must be from the user")
    return await llm.assistant_reply(doc, body.messages, body.focus_project_id)


@app.post("/api/datasets/{dataset_id}/brief")
async def brief(dataset_id: str, refresh: bool = False):
    doc = _load(dataset_id)
    if doc.get("brief") and not refresh:
        return doc["brief"]
    top = sorted(doc["projects"], key=lambda p: -p["risk_score"])[:8]
    out = await llm.portfolio_brief(doc["summary"], top, doc["as_of"])
    out["generated_at"] = datetime.now(timezone.utc).isoformat()
    store.set_field(dataset_id, "brief", out)
    return out
