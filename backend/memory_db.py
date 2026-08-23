"""In-memory Mongo-like store used when Atlas/local Mongo is unavailable."""

from __future__ import annotations

import copy
import re
from typing import Any, Dict, List, Optional

from bson import ObjectId


def _as_plain(value: Any) -> Any:
    if isinstance(value, ObjectId):
        return str(value)
    return value


def _normalize_query(query: Any) -> Any:
    if isinstance(query, dict):
        return {key: _normalize_query(val) for key, val in query.items()}
    if isinstance(query, list):
        return [_normalize_query(item) for item in query]
    return _as_plain(query)


def _get(doc: Dict[str, Any], key: str) -> Any:
    return _as_plain(doc.get(key))


def _matches(doc: Dict[str, Any], query: Optional[Dict[str, Any]]) -> bool:
    if not query:
        return True

    for key, expected in query.items():
        if key == "$or":
            if not any(_matches(doc, part) for part in expected):
                return False
            continue
        if key == "$and":
            if not all(_matches(doc, part) for part in expected):
                return False
            continue

        actual = _get(doc, key)
        if isinstance(expected, dict):
            if "$regex" in expected:
                flags = re.IGNORECASE if "i" in str(expected.get("$options", "")) else 0
                if not re.search(str(expected["$regex"]), str(actual or ""), flags):
                    return False
            elif "$in" in expected:
                haystack = [_as_plain(item) for item in expected["$in"]]
                if actual not in haystack:
                    return False
            elif "$gt" in expected:
                if actual is None or actual <= expected["$gt"]:
                    return False
            elif "$gte" in expected:
                if actual is None or actual < expected["$gte"]:
                    return False
            else:
                if actual != _normalize_query(expected):
                    return False
        elif actual != _as_plain(expected):
            return False
    return True


class InsertOneResult:
    def __init__(self, inserted_id: Any):
        self.inserted_id = inserted_id


class MemoryCursor:
    def __init__(self, docs: List[Dict[str, Any]]):
        self._docs = docs

    def sort(self, key: str, direction: int = 1):
        reverse = direction < 0
        self._docs.sort(key=lambda doc: doc.get(key) or 0, reverse=reverse)
        return self

    def skip(self, count: int):
        self._docs = self._docs[count:]
        return self

    def limit(self, count: int):
        if count:
            self._docs = self._docs[:count]
        return self

    async def to_list(self, length: Optional[int] = None):
        docs = self._docs if length is None else self._docs[:length]
        return [copy.deepcopy(doc) for doc in docs]


class MemoryCollection:
    def __init__(self):
        self._docs: List[Dict[str, Any]] = []

    def find(self, query: Optional[Dict[str, Any]] = None):
        query = _normalize_query(query or {})
        return MemoryCursor([doc for doc in self._docs if _matches(doc, query)])

    async def find_one(self, query: Optional[Dict[str, Any]] = None):
        query = _normalize_query(query or {})
        for doc in self._docs:
            if _matches(doc, query):
                return copy.deepcopy(doc)
        return None

    async def insert_one(self, document: Dict[str, Any]):
        stored = copy.deepcopy(document)
        if "_id" not in stored:
            stored["_id"] = ObjectId()
        self._docs.append(stored)
        return InsertOneResult(stored["_id"])

    async def insert_many(self, documents: List[Dict[str, Any]]):
        for document in documents:
            await self.insert_one(document)

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any]):
        query = _normalize_query(query)
        for doc in self._docs:
            if not _matches(doc, query):
                continue
            if "$set" in update:
                doc.update(copy.deepcopy(update["$set"]))
            if "$inc" in update:
                for key, amount in update["$inc"].items():
                    doc[key] = (doc.get(key) or 0) + amount
            if "$addToSet" in update:
                for key, value in update["$addToSet"].items():
                    current = doc.setdefault(key, [])
                    if value not in current:
                        current.append(value)
            if "$pull" in update:
                for key, value in update["$pull"].items():
                    current = doc.get(key, [])
                    doc[key] = [item for item in current if item != value]
            return
        return None

    async def delete_one(self, query: Dict[str, Any]):
        query = _normalize_query(query)
        for index, doc in enumerate(self._docs):
            if _matches(doc, query):
                self._docs.pop(index)
                return
        return None

    async def count_documents(self, query: Optional[Dict[str, Any]] = None):
        query = _normalize_query(query or {})
        return sum(1 for doc in self._docs if _matches(doc, query))


class MemoryDB:
    def __init__(self):
        self._collections: Dict[str, MemoryCollection] = {}

    def __getattr__(self, name: str) -> MemoryCollection:
        if name.startswith("_"):
            raise AttributeError(name)
        if name not in self._collections:
            self._collections[name] = MemoryCollection()
        return self._collections[name]
