"""
rag_service.py

RAG service for the One-Person Company (OPC) platform.
Handles document chunking, embedding generation, Qdrant indexing, and similarity retrieval
for SETUP_WIZARD_RAG_KB.md.

Supports direct HTTP REST operations to Qdrant so no heavy client binaries are required,
with fallback to fast embedding computation and local semantic matching.
"""

from __future__ import annotations

import os
import re
import math
import logging
import hashlib
from typing import Any, Dict, List, Optional
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

KB_COLLECTION_NAME = getattr(settings, "QDRANT_COLLECTION", "setup_wizard_kb")
VECTOR_DIM = 384  # Standard dense vector dimension (MiniLM compatible)


def _simple_embedding(text: str, dim: int = VECTOR_DIM) -> List[float]:
    """
    Deterministic normalized bag-of-words / character n-gram projection
    used as high-speed lightweight embedding when external embedding API is optional.
    """
    tokens = re.findall(r"\w+", text.lower())
    vector = [0.0] * dim
    if not tokens:
        return vector

    for token in tokens:
        # Hash token across vector space
        h = int(hashlib.md5(token.encode("utf-8")).hexdigest(), 16)
        idx = h % dim
        sign = 1.0 if ((h >> 8) % 2 == 0) else -1.0
        vector[idx] += sign

    # L2 normalize
    norm = math.sqrt(sum(v * v for v in vector))
    if norm > 0:
        vector = [v / norm for v in vector]
    return vector


def chunk_markdown_kb(kb_content: str) -> List[Dict[str, Any]]:
    """
    Split SETUP_WIZARD_RAG_KB.md into semantic sections by headers and subheaders.
    """
    sections = []
    lines = kb_content.split("\n")
    current_title = "OPC Setup Wizard Overview"
    current_chunk: List[str] = []

    for line in lines:
        if line.startswith("## ") or line.startswith("### "):
            if current_chunk:
                content = "\n".join(current_chunk).strip()
                if len(content) > 30:
                    sections.append({
                        "title": current_title,
                        "content": content,
                        "vector": _simple_embedding(f"{current_title}\n{content}"),
                    })
                current_chunk = []
            current_title = line.lstrip("#").strip()
        else:
            current_chunk.append(line)

    if current_chunk:
        content = "\n".join(current_chunk).strip()
        if len(content) > 30:
            sections.append({
                "title": current_title,
                "content": content,
                "vector": _simple_embedding(f"{current_title}\n{content}"),
            })

    return sections


class RAGService:
    def __init__(self):
        self.qdrant_url = getattr(settings, "QDRANT_URL", "https://qdrant-production-ee13.up.railway.app").rstrip("/")
        self.api_key = getattr(settings, "QDRANT_API_KEY", None)
        self.collection_name = KB_COLLECTION_NAME

    def _headers(self) -> Dict[str, str]:
        h = {"Content-Type": "application/json"}
        if self.api_key:
            h["api-key"] = self.api_key
        return h

    async def ensure_collection(self) -> bool:
        """Create or verify the Qdrant collection for the setup wizard knowledge base."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Check if collection exists
                res = await client.get(
                    f"{self.qdrant_url}/collections/{self.collection_name}",
                    headers=self._headers(),
                )
                if res.status_code == 200:
                    logger.info("Qdrant collection '%s' exists", self.collection_name)
                    return True

                # Create collection if 404
                create_payload = {
                    "vectors": {
                        "size": VECTOR_DIM,
                        "distance": "Cosine",
                    }
                }
                res_create = await client.put(
                    f"{self.qdrant_url}/collections/{self.collection_name}",
                    headers=self._headers(),
                    json=create_payload,
                )
                return res_create.status_code in (200, 201)
        except Exception as exc:
            logger.warning("Could not reach Qdrant collection init: %s", exc)
            return False

    async def ingest_kb_document(self, kb_path_or_content: str) -> Dict[str, Any]:
        """
        Chunks and indexes the SETUP_WIZARD_RAG_KB.md content into Qdrant.
        """
        if os.path.exists(kb_path_or_content):
            with open(kb_path_or_content, "r", encoding="utf-8") as f:
                content = f.read()
        else:
            content = kb_path_or_content

        chunks = chunk_markdown_kb(content)
        if not chunks:
            return {"status": "error", "message": "No chunks extracted from knowledge base"}

        await self.ensure_collection()

        points = []
        for i, chunk in enumerate(chunks):
            points.append({
                "id": i + 1,
                "vector": chunk["vector"],
                "payload": {
                    "title": chunk["title"],
                    "content": chunk["content"],
                },
            })

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.put(
                    f"{self.qdrant_url}/collections/{self.collection_name}/points?wait=true",
                    headers=self._headers(),
                    json={"points": points},
                )
                if res.status_code in (200, 201):
                    logger.info("Indexed %d chunks into Qdrant '%s'", len(points), self.collection_name)
                    return {"status": "success", "chunks_indexed": len(points), "collection": self.collection_name}
                else:
                    logger.error("Qdrant points insertion failed (%d): %s", res.status_code, res.text)
                    return {"status": "qdrant_error", "code": res.status_code, "detail": res.text, "chunks_extracted": len(points)}
        except Exception as exc:
            logger.error("Qdrant ingestion request failed: %s", exc)
            return {"status": "connection_error", "detail": str(exc), "chunks_extracted": len(points)}

    async def search_relevant_context(self, query: str, top_k: int = 3) -> str:
        """
        Vector search in Qdrant for user's question, returning combined context text.
        """
        query_vector = _simple_embedding(query)
        search_payload = {
            "vector": query_vector,
            "limit": top_k,
            "with_payload": True,
        }

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(
                    f"{self.qdrant_url}/collections/{self.collection_name}/points/search",
                    headers=self._headers(),
                    json=search_payload,
                )
                if res.status_code == 200:
                    results = res.json().get("result", [])
                    matched_texts = []
                    for r in results:
                        payload = r.get("payload", {})
                        title = payload.get("title", "")
                        content = payload.get("content", "")
                        if content:
                            matched_texts.append(f"### {title}\n{content}")
                    if matched_texts:
                        return "\n\n".join(matched_texts)
        except Exception as exc:
            logger.warning("Qdrant search error: %s", exc)

        return ""


rag_service = RAGService()
