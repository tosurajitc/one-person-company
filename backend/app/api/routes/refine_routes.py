"""
refine_routes.py

POST /api/genie/refine-answer
─────────────────────────────
Single-shot endpoint that improves one intake-form answer using the LLM.
Completely separate from /api/chat:

  • No chat history loaded or saved.
  • No RAG / knowledge-base lookup.
  • No daily-message quota consumed.
  • Tight system prompt focused only on text improvement.
  • Temperature 0.4, max_tokens 350 — faithful rewrite, not a creative essay.

Token usage IS tracked on the user profile exactly like /api/chat:
  user.ai_tokens_used   +=  call_tokens
  user.wallet_consumed  +=  cost_inr          (₹0.15 / 1 000 tokens)
  user.wallet_balance   -=  cost_inr

Anonymous (unauthenticated) callers may also use this endpoint; their
token usage is simply not persisted.
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.core.auth import AuthService
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter()


# ── Request / Response schemas ──────────────────────────────────────────────

class RefineRequest(BaseModel):
    question_title: str          # e.g. "What problem do clients come to you with?"
    fills: str                   # e.g. "The problem, their fears, FAQ topics"
    answer: str                  # the founder's raw draft answer
    business_context: str = ""   # optional — business type + market hint


class RefineResponse(BaseModel):
    refined: str                 # improved answer text — ready to drop into the textarea
    original: str                # echo of the input so the frontend can offer undo
    tokens_used: int = 0
    total_tokens_used: int = 0


# ── System prompt ────────────────────────────────────────────────────────────

_REFINE_SYSTEM = """\
You are a copywriting assistant helping a solo business owner improve one answer \
on their website intake form. Your only job is to rewrite the answer so it is \
clearer, more specific, and more persuasive — while keeping every fact, number, \
name and price the owner mentioned exactly as they wrote it.

Rules:
1. Write in first person from the founder's perspective.
2. Do NOT invent any new facts, clients, numbers, results or credentials.
3. Keep every specific detail the owner provided (years of experience, prices, \
client types, tools, locations). If a number or name appears in the draft, it \
must appear in the refined version.
4. Aim for 3 to 5 sentences. Be concrete and specific — no vague filler phrases \
like "proven track record" or "passionate about helping".
5. Return ONLY the improved answer text — no preamble, no explanation, no \
quotation marks around it, no markdown.
"""


# ── Auth helper ──────────────────────────────────────────────────────────────

def _get_optional_user(request: Request, db: Session) -> Optional[User]:
    token: Optional[str] = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ", 1)[1]
    if not token:
        token = request.cookies.get("token")
    if not token:
        return None
    return AuthService.get_user_from_token(token, db)


# ── Route ─────────────────────────────────────────────────────────────────────

@router.post("/genie/refine-answer", response_model=RefineResponse)
async def refine_answer(
    body: RefineRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Improve a single intake-form answer with the LLM.
    Tracks token usage on the authenticated user's profile if a valid JWT is present.
    """
    if not settings.GROQ_API_KEY and not settings.ANTHROPIC_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI is not configured. Please set GROQ_API_KEY or ANTHROPIC_API_KEY.",
        )

    answer = (body.answer or "").strip()
    if not answer:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="answer must not be empty.",
        )
    if len(answer) > 3000:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="answer must be 3 000 characters or fewer.",
        )

    # Build the user message sent to the model
    context_hint = f"\nBusiness context: {body.business_context.strip()}" if body.business_context.strip() else ""
    user_message = (
        f"Question the founder was answering: {body.question_title}\n"
        f"This answer fills: {body.fills}{context_hint}\n\n"
        f"Founder's draft answer:\n{answer}\n\n"
        "Please improve it."
    )

    # ── LLM call ─────────────────────────────────────────────────────────────
    refined = ""
    call_tokens = 0

    try:
        if settings.GROQ_API_KEY:
            from groq import AsyncGroq
            client = AsyncGroq(api_key=settings.GROQ_API_KEY)
            resp = await client.chat.completions.create(
                model=settings.GROQ_MODEL or "llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": _REFINE_SYSTEM},
                    {"role": "user",   "content": user_message},
                ],
                temperature=0.4,
                max_tokens=350,
            )
            refined = (resp.choices[0].message.content or "").strip()
            if hasattr(resp, "usage") and resp.usage:
                call_tokens = getattr(resp.usage, "total_tokens", 0) or 0

        elif settings.ANTHROPIC_API_KEY:
            import anthropic
            aclient = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            haiku = getattr(settings, "ANTHROPIC_HAIKU_MODEL", None) or "claude-3-5-haiku-20241022"
            resp = await aclient.messages.create(
                model=haiku,
                max_tokens=350,
                temperature=0.4,
                system=_REFINE_SYSTEM,
                messages=[{"role": "user", "content": user_message}],
            )
            refined = (resp.content[0].text if resp.content else "").strip()
            if hasattr(resp, "usage") and resp.usage:
                call_tokens = (
                    getattr(resp.usage, "input_tokens", 0) +
                    getattr(resp.usage, "output_tokens", 0)
                )

    except Exception as exc:
        logger.error("refine_answer LLM error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI could not improve this answer right now. Please try again.",
        )

    if not refined:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI returned an empty response. Please try again.",
        )

    # ── Token & cost tracking ─────────────────────────────────────────────────
    user = _get_optional_user(request, db)
    total_tokens = 0
    if user and call_tokens:
        user.ai_tokens_used        = (user.ai_tokens_used or 0) + call_tokens
        user.ai_refine_tokens_used = (user.ai_refine_tokens_used or 0) + call_tokens
        total_tokens = user.ai_tokens_used
        rate = getattr(settings, "INR_PER_1K_TOKENS", 0.15)
        cost_inr = round((call_tokens / 1000.0) * rate, 4)
        if cost_inr > 0:
            user.wallet_consumed = float(user.wallet_consumed or 0.0) + cost_inr
            user.wallet_balance  = max(0.0, float(user.wallet_balance or 0.0) - cost_inr)
        try:
            db.commit()
        except Exception as db_exc:
            db.rollback()
            logger.error("refine_answer token tracking commit failed: %s", db_exc)

    return RefineResponse(
        refined=refined,
        original=answer,
        tokens_used=call_tokens,
        total_tokens_used=total_tokens,
    )
