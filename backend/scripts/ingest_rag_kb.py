"""
ingest_rag_kb.py

Standalone ingestion script to process frontend/docs/SETUP_WIZARD_RAG_KB.md
and index all sections into Qdrant Vector DB on Railway.
"""

import os
import sys
import asyncio
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.services.rag_service import rag_service
from app.core.config import settings

async def main():
    kb_path = backend_dir.parent / "frontend" / "docs" / "SETUP_WIZARD_RAG_KB.md"
    print(f"Loading Knowledge Base from: {kb_path}")
    if not kb_path.exists():
        print(f"Error: Knowledge document not found at {kb_path}")
        return

    print(f"Connecting to Qdrant at: {settings.QDRANT_URL}")
    print(f"Target Collection: {settings.QDRANT_COLLECTION}")

    result = await rag_service.ingest_kb_document(str(kb_path))
    print(f"Ingestion Result: {result}")

    # Run quick test search
    test_query = "How do I change my pricing tiers and what step is it in?"
    print(f"\nTesting vector similarity search for query: '{test_query}'")
    context = await rag_service.search_relevant_context(test_query, top_k=2)
    print("\n--- Retrieved RAG Context Preview ---")
    clean_preview = (context[:600] + "..." if len(context) > 600 else context).encode('ascii', errors='ignore').decode('ascii')
    print(clean_preview)
    print("-------------------------------------")

if __name__ == "__main__":
    asyncio.run(main())
