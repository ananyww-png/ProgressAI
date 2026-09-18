# ProgressAI — Python Machine Learning Model & Dataset

This package provides a standalone Python ML pipeline for **ProgressAI**, automating:
1. Construction site report text parameter extraction.
2. Engineering discipline classification across 7 trades.
3. Primavera L5/L6 schedule activity matching with calibrated confidence scores (0–100%).
4. Ambiguity detection for routing low-confidence updates to the human planner review queue.

---

## 📁 Architecture

```
ml/
├── data/
│   └── construction_dataset.csv  # 1,250 synthetic & augmented EPC field logs
├── models/
│   ├── vectorizer.pkl            # TF-IDF N-gram feature extractor
│   ├── discipline_model.pkl      # Calibrated Discipline Classifier
│   ├── activity_matcher.pkl      # Calibrated L5/L6 Activity Matcher
│   ├── ambiguity_model.pkl       # Planner Review Triage Detector
│   └── activity_metadata.pkl     # WBS ID to milestone name mapping
├── generate_dataset.py           # Domain synthetic dataset generator
├── train_model.py                # Model training and calibration script
├── predict.py                    # CLI and Python inference module
└── api.py                        # Lightweight Flask REST service
```

---

## 🚀 Quickstart

### 1. Generate Dataset
```bash
python ml/generate_dataset.py
```
Generates 1,250 realistic construction progress logs across Civil, Piping, Electrical, Instrumentation, Static Equipment, Rotating Equipment, and HSE, including both clear tagged notes and ambiguous entries.

### 2. Train Models
```bash
python ml/train_model.py
```
Trains multi-task models using character and word N-gram TF-IDF vectorization and Calibrated Logistic Regression. Evaluates test accuracy and serializes models to `ml/models/`.

### 3. Run Predictions via CLI
```bash
# Scenario 1 (High confidence spool erection):
python ml/predict.py "Line 24 spool erection started at 9:15 AM and completed at 4:30 PM."

# Scenario 2 (Ambiguous cable note requiring planner triage):
python ml/predict.py "Cable work completed."

# Foundation pour:
python ml/predict.py "Constructed Foundation F102 casting of 65 m3 M35 grade concrete completed."
```

### 4. Run REST API (Optional)
```bash
python ml/api.py
```
Listens on `http://localhost:5000/api/match`.
POST payload:
```json
{
  "text": "Line 24 spool erection started at 9:15 AM and completed at 4:30 PM."
}
```
Response:
```json
{
  "extracted_parameters": {
    "discipline": "Piping",
    "actual_start": "09:15 AM",
    "actual_end": "04:30 PM",
    "status": "Completed"
  },
  "schedule_match": {
    "activity_id": "PIP-L6-024",
    "activity_name": "Erect Line 24-XX",
    "confidence": 96.0,
    "confidence_category": "HIGH"
  },
  "alternatives": [
    { "activity_id": "PIP-L6-024", "confidence": 96.0 },
    { "activity_id": "PIP-L6-042", "confidence": 61.0 },
    { "activity_id": "PIP-L6-025", "confidence": 38.0 }
  ]
}
```
