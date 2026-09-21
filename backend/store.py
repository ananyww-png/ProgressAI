"""MongoDB persistence with an in-memory write-through cache, so the demo keeps working if the DB drops."""

import os
import uuid

from pymongo import DESCENDING, MongoClient
from pymongo.errors import PyMongoError

LIST_FIELDS = {"filename": 1, "uploaded_at": 1, "as_of": 1, "summary.total_projects": 1, "summary.risk_counts": 1}


class Store:
    def __init__(self):
        self._mem, self._col = {}, None
        uri = os.getenv("MONGO_URI")
        if not uri:
            return
        client = MongoClient(uri, serverSelectionTimeoutMS=4000)
        self._col = client[os.getenv("MONGO_DB", "progressai")]["datasets"]
        try:
            self._col.create_index([("uploaded_at", DESCENDING)])
        except PyMongoError as exc:
            print(f"[store] MongoDB unreachable at startup ({exc.__class__.__name__}); will keep retrying.")

    @property
    def mode(self) -> str:
        if self._col is None:
            return "memory"
        try:
            self._col.database.client.admin.command("ping")
            return "mongodb"
        except PyMongoError:
            return "memory"

    def _db(self, fn, fallback):
        if self._col is None:
            return fallback()
        try:
            return fn()
        except PyMongoError as exc:
            print(f"[store] MongoDB error ({exc.__class__.__name__}); using in-memory copy.")
            return fallback()

    def save(self, doc: dict) -> str:
        doc["_id"] = doc.get("_id") or uuid.uuid4().hex[:12]
        self._mem[doc["_id"]] = doc
        self._db(lambda: self._col.replace_one({"_id": doc["_id"]}, doc, upsert=True), lambda: None)
        return doc["_id"]

    def get(self, dataset_id: str) -> dict | None:
        if dataset_id in self._mem:
            return self._mem[dataset_id]
        doc = self._db(lambda: self._col.find_one({"_id": dataset_id}), lambda: None)
        if doc:
            self._mem[dataset_id] = doc
        return doc

    def list(self, limit: int = 10) -> list[dict]:
        def from_mem():
            docs = sorted(self._mem.values(), key=lambda d: d["uploaded_at"], reverse=True)[:limit]
            return [{"_id": d["_id"], "filename": d["filename"], "uploaded_at": d["uploaded_at"], "as_of": d["as_of"],
                     "summary": {"total_projects": d["summary"]["total_projects"],
                                 "risk_counts": d["summary"]["risk_counts"]}} for d in docs]
        return self._db(lambda: list(self._col.find({}, LIST_FIELDS).sort("uploaded_at", DESCENDING).limit(limit)),
                        from_mem)

    def set_field(self, dataset_id: str, path: str, value) -> None:
        doc = self._mem.get(dataset_id)
        if doc is not None:
            *parents, leaf = path.split(".")
            node = doc
            for key in parents:
                node = node.setdefault(key, {})
            node[leaf] = value
        self._db(lambda: self._col.update_one({"_id": dataset_id}, {"$set": {path: value}}), lambda: None)
