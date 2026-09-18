"""
ProgressAI - Python ML Inference API
Lightweight Flask REST service exposing /api/match for real-time natural language progress linking.
"""

from flask import Flask, request, jsonify
from predict import predict_site_update

app = Flask(__name__)

# Enable simple CORS
@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    return response

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "online", "model": "ProgressAI-ML-v1"})

@app.route("/api/match", methods=["POST"])
def match():
    data = request.get_json(force=True) or {}
    text = data.get("text", "").strip()
    if not text:
        return jsonify({"error": "Empty text provided"}), 400

    result = predict_site_update(text)
    return jsonify(result)

if __name__ == "__main__":
    print("Starting ProgressAI Python ML API on http://127.0.0.1:5000 ...")
    app.run(host="0.0.0.0", port=5000, debug=False)
