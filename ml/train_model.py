"""
ProgressAI - Machine Learning Model Trainer
Trains multi-task models for:
1. Discipline Classification (Civil, Piping, Electrical, Instrumentation, Static, Rotating, HSE)
2. L5/L6 Schedule Activity Matching & Calibrated Confidence Estimation
3. Ambiguity / Planner Review Detection
"""

import os
import re
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import classification_report, accuracy_score

def clean_text(text: str) -> str:
    """Normalize text while preserving equipment codes and line tags."""
    t = text.lower()
    # Normalize tag dashes
    t = re.sub(r'(\w+)[-_](\d+)', r'\1 \2', t)
    t = re.sub(r'\s+', ' ', t).trim() if hasattr(t, 'trim') else re.sub(r'\s+', ' ', t).strip()
    return t

def train():
    os.makedirs("ml/models", exist_ok=True)
    dataset_path = "ml/data/construction_dataset.csv"

    if not os.path.exists(dataset_path):
        print(f"Dataset not found at {dataset_path}. Running generator first...")
        from generate_dataset import generate_dataset
        df = generate_dataset(1250)
        os.makedirs("ml/data", exist_ok=True)
        df.to_csv(dataset_path, index=False)
    else:
        df = pd.read_csv(dataset_path)

    print(f"Loaded dataset: {len(df)} samples across {df['discipline'].nunique()} disciplines and {df['activity_id'].nunique()} activities.")

    # Clean text
    df['cleaned_text'] = df['text'].apply(clean_text)

    # Train/Test Split
    X_train, X_test, y_disc_train, y_disc_test, y_act_train, y_act_test, y_amb_train, y_amb_test = train_test_split(
        df['cleaned_text'],
        df['discipline'],
        df['activity_id'],
        df['is_ambiguous'],
        test_size=0.2,
        random_state=42,
        stratify=df['discipline']
    )

    # 1. Feature Extraction: Character & Word N-gram TF-IDF
    print("\n--- Training Vectorizer ---")
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 3),
        analyzer='word',
        min_df=2,
        sublinear_tf=True
    )
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)
    print(f"Vocabulary size: {len(vectorizer.vocabulary_)} features")

    # 2. Discipline Classifier
    print("\n--- Training Discipline Classifier ---")
    disc_clf = LogisticRegression(C=5.0, max_iter=1000, class_weight='balanced')
    disc_clf.fit(X_train_vec, y_disc_train)
    y_disc_pred = disc_clf.predict(X_test_vec)
    disc_acc = accuracy_score(y_disc_test, y_disc_pred)
    print(f"Discipline Classification Accuracy: {disc_acc * 100:.2f}%")
    print(classification_report(y_disc_test, y_disc_pred))

    # 3. Schedule Activity Matcher with Calibrated Probabilities
    print("\n--- Training Schedule Activity Matcher ---")
    base_act_clf = LogisticRegression(C=10.0, max_iter=1000)
    calibrated_act_clf = CalibratedClassifierCV(estimator=base_act_clf, cv=3)
    calibrated_act_clf.fit(X_train_vec, y_act_train)
    y_act_pred = calibrated_act_clf.predict(X_test_vec)
    act_acc = accuracy_score(y_act_test, y_act_pred)
    print(f"Schedule Activity Matching Accuracy: {act_acc * 100:.2f}%")

    # 4. Ambiguity / Review Queue Detector
    print("\n--- Training Ambiguity / Planner Review Detector ---")
    amb_clf = LogisticRegression(C=2.0, max_iter=500, class_weight='balanced')
    amb_clf.fit(X_train_vec, y_amb_train)
    y_amb_pred = amb_clf.predict(X_test_vec)
    amb_acc = accuracy_score(y_amb_test, y_amb_pred)
    print(f"Ambiguity Detection Accuracy: {amb_acc * 100:.2f}%")

    # 5. Activity ID to Name Metadata Mapping
    activity_metadata = df[['activity_id', 'activity_name', 'discipline']].drop_duplicates().set_index('activity_id').to_dict('index')

    # 6. Save Model Artifacts
    print("\n--- Serializing Model Artifacts ---")
    joblib.dump(vectorizer, "ml/models/vectorizer.pkl")
    joblib.dump(disc_clf, "ml/models/discipline_model.pkl")
    joblib.dump(calibrated_act_clf, "ml/models/activity_matcher.pkl")
    joblib.dump(amb_clf, "ml/models/ambiguity_model.pkl")
    joblib.dump(activity_metadata, "ml/models/activity_metadata.pkl")

    print("All models successfully trained and serialized to 'ml/models/'.")

if __name__ == "__main__":
    train()
