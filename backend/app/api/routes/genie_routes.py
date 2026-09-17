"""
genie_routes.py

POST /api/genie/draft-site  — called from the setup wizard Step 1 "AI draft" button.
                              Receives { start: { description, businessType, market, language } }
                              and returns a partial DEFAULT_STATE-shaped dict (schema 2.0)
                              that the wizard deep-merges into its state.

This is a lightweight wrapper around the same Groq prefill machinery used by
/api/chat/prefill, but called from within the wizard itself (not the intake page)
and only given the brief business description from Step 1.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class DraftSiteRequest(BaseModel):
    """Sent by the wizard's handleAiDraft() — just the Step 1 'start' group."""
    start: Dict[str, Any] = {}


# The wizard calls deepMerge(DEFAULT_STATE, draft) directly on the JSON response,
# so the response body must BE the partial state dict, not a wrapper around it.
DraftSiteResponse = Dict[str, Any]


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------

@router.post("/genie/draft-site")
async def draft_site(
    body: DraftSiteRequest,
    request: Request,
):
    """
    Generate a partial wizard state (schema 2.0) from the Step 1 description.
    Called by handleAiDraft() inside the setup wizard.

    Only fills fields the user hasn't yet typed — the wizard merges this on top
    of its existing state using preferUserInput().
    """
    if not settings.GROQ_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI Genie is not configured yet. Set GROQ_API_KEY in the environment.",
        )

    description = (body.start.get("description") or "").strip()
    if not description:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="start.description is required.",
        )
    if len(description) > 4000:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="start.description must be 4000 characters or fewer.",
        )

    # Reuse the same async parallel Groq machinery as the /chat/prefill endpoint
    try:
        from app.api.routes.chat_routes import _call_groq_prefill_async
        draft = await _call_groq_prefill_async(description)
    except __import__("json").JSONDecodeError as exc:
        logger.error("draft-site JSON parse error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Genie returned malformed data. Try a longer description.",
        )
    except Exception as exc:
        logger.error("draft-site Groq error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI Genie is temporarily unavailable. Your progress is saved; continue manually.",
        )

    # Merge the caller's start values on top — user input always wins
    draft_start = draft.get("start", {})
    for k, v in body.start.items():
        if v and k != "description":   # description already consumed above
            draft_start[k] = v
    draft_start["description"] = description
    draft["start"] = draft_start

    return draft
