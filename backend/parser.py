"""Excel / CSV parsing with automatic header detection and fuzzy column mapping to CUF fields."""

import csv
import io
import re
from datetime import date, datetime, timedelta

from openpyxl import load_workbook

# Each field lists alias phrases; a header matches an alias when it contains all of its words.
# Order within FIELDS matters for tie-breaking: more specific fields come first.
FIELDS = {
    "revised_cost": ["revised cost", "latest cost", "anticipated cost", "latest approved cost", "current cost", "rce"],
    "original_cost": ["original cost", "sanctioned cost", "approved cost", "initial cost", "estimated cost", "project cost", "cost"],
    "expenditure": ["cumulative expenditure", "expenditure", "spent", "actual cost", "exp incurred"],
    "anticipated_end": ["anticipated date", "anticipated completion", "revised completion", "expected completion",
                        "revised date", "likely completion", "anticipated commissioning", "revised doc"],
    "original_end": ["original date of commissioning", "original completion", "scheduled completion", "original doc",
                     "planned completion", "target date", "original date", "completion date", "end date"],
    "start_date": ["date of approval", "approval date", "sanction date", "start date", "date of start",
                   "commencement", "award date", "zero date"],
    "progress": ["physical progress", "progress", "complete", "completed", "completion percent"],
    "project_id": ["project id", "project code", "proj id", "project no", "id", "code"],
    "name": ["project name", "name of project", "name of the project", "project title", "project", "name", "title"],
    "ministry": ["ministry", "department"],
    "sector": ["sector", "category", "sub sector"],
    "state": ["state", "location", "region"],
    "agency": ["implementing agency", "executing agency", "agency", "psu", "organisation", "organization"],
    "status": ["status", "stage"],
    "delay_reason": ["reasons for delay", "reason", "reasons", "bottleneck", "bottlenecks", "issue", "issues", "remarks", "constraint", "constraints"],
    "report_date": ["report date", "as on", "as of", "reporting month"],
}

LABELS = {
    "project_id": "Project ID", "name": "Project name", "ministry": "Ministry", "sector": "Sector",
    "state": "State", "agency": "Implementing agency", "original_cost": "Original cost",
    "revised_cost": "Revised cost", "expenditure": "Expenditure", "start_date": "Start / approval date",
    "original_end": "Original completion", "anticipated_end": "Anticipated completion",
    "progress": "Physical progress %", "status": "Status", "delay_reason": "Reason for delay",
    "report_date": "Report date",
}
DATE_FIELDS = {"start_date", "original_end", "anticipated_end", "report_date"}
NUM_FIELDS = {"original_cost", "revised_cost", "expenditure", "progress"}
MONTHS = {m: i + 1 for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"])}


def _norm(text) -> str:
    return re.sub(r"[^a-z0-9%]+", " ", str(text or "").lower()).strip()


def _score(header: str, alias: str) -> float:
    h, a = _norm(header).split(), alias.split()
    if not h or not all(w in h for w in a):
        return 0.0
    # Reward aliases covering more of the header, and longer (more specific) aliases.
    return len(a) / len(h) + 0.25 * len(a)


def map_columns(headers: list) -> dict:
    """Return {field: column_index}; each column and field is used at most once."""
    candidates = []
    for col, header in enumerate(headers):
        if not _norm(header):
            continue
        for rank, (field, aliases) in enumerate(FIELDS.items()):
            best = max(_score(header, a) for a in aliases)
            if best:
                candidates.append((best, -rank, field, col))
    mapping, used = {}, set()
    for _, _, field, col in sorted(candidates, reverse=True):
        if field not in mapping and col not in used:
            mapping[field] = col
            used.add(col)
    return mapping


def parse_number(value):
    if value is None or value == "":
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).lower().replace(",", "")
    match = re.search(r"-?\d+(\.\d+)?", text)
    return float(match.group()) if match else None


def parse_date(value):
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if isinstance(value, (int, float)) and 20000 < value < 80000:  # Excel serial date
        return date(1899, 12, 30) + timedelta(days=int(value))
    text = str(value).strip()
    for fmt in ("%d-%m-%Y", "%d/%m/%Y", "%Y-%m-%d", "%d.%m.%Y", "%d-%b-%Y", "%d %b %Y", "%d-%b-%y",
                "%b-%Y", "%b %Y", "%B %Y", "%B-%Y", "%m/%Y", "%m-%Y", "%b-%y", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            pass
    match = re.search(r"([a-z]{3})[a-z]*[\s,'-]*(\d{2,4})", text.lower())
    if match and match.group(1) in MONTHS:
        year = int(match.group(2))
        return date(year + 2000 if year < 100 else year, MONTHS[match.group(1)], 1)
    return None


def _read_rows(filename: str, content: bytes) -> list[list[list]]:
    """Return a list of sheets, each a list of rows."""
    if filename.lower().endswith(".csv"):
        text = content.decode("utf-8-sig", errors="replace")
        return [list(csv.reader(io.StringIO(text)))]
    wb = load_workbook(io.BytesIO(content), read_only=True, data_only=True)
    return [[list(r) for r in ws.iter_rows(values_only=True)] for ws in wb.worksheets]


def _find_header(rows: list[list]) -> tuple[int, dict]:
    best = (-1, {})
    for i, row in enumerate(rows[:25]):
        mapping = map_columns(row)
        if len(mapping) > len(best[1]):
            best = (i, mapping)
    return best


def parse_file(filename: str, content: bytes) -> dict:
    sheets = _read_rows(filename, content)
    header_idx, mapping, rows = -1, {}, []
    for sheet in sheets:
        idx, m = _find_header(sheet)
        if len(m) > len(mapping):
            header_idx, mapping, rows = idx, m, sheet
    if "name" not in mapping and "project_id" not in mapping:
        raise ValueError("Could not find a project name or ID column. Check that the sheet has a header row.")

    headers = rows[header_idx]
    records, skipped = [], 0
    for row in rows[header_idx + 1:]:
        if not any(c not in (None, "") for c in row):
            continue
        rec = {}
        for field, col in mapping.items():
            raw = row[col] if col < len(row) else None
            if field in DATE_FIELDS:
                rec[field] = parse_date(raw)
            elif field in NUM_FIELDS:
                rec[field] = parse_number(raw)
            else:
                rec[field] = str(raw).strip() if raw not in (None, "") else None
        if not rec.get("name") and not rec.get("project_id"):
            skipped += 1
            continue
        # Skip "Total" / subtotal rows common in government reports.
        if re.match(r"^(grand )?total", (rec.get("name") or rec.get("project_id") or "").lower()):
            skipped += 1
            continue
        records.append(rec)

    # Progress may be stored as a 0–1 fraction.
    progress_vals = [r["progress"] for r in records if r.get("progress") is not None]
    if progress_vals and max(progress_vals) <= 1.0:
        for r in records:
            if r.get("progress") is not None:
                r["progress"] *= 100

    for i, r in enumerate(records):
        r["project_id"] = r.get("project_id") or f"P{i + 1:04d}"
        r["name"] = r.get("name") or r["project_id"]

    missing = [LABELS[f] for f in ("original_cost", "revised_cost", "expenditure", "start_date",
                                   "original_end", "anticipated_end", "progress") if f not in mapping]
    return {
        "records": records,
        "mapping": [{"field": f, "label": LABELS[f], "column": str(headers[c])} for f, c in mapping.items()],
        "missing": missing,
        "skipped_rows": skipped,
    }
