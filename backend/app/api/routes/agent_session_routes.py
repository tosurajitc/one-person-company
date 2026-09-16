"""
agent_session_routes.py

Per-minute billing session management and chat routing for Specialist Agents.
Pricing model: First 1 minute (60s) free, billed per subsequent 1 minute.
"""

from __future__ import annotations

import logging
import math
import secrets
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import AuthService
from app.models.agent_session import AgentSession, AgentSessionMessage, SessionStatus, AgentSessionMessageRole
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(tags=["agent-session"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class StartSessionRequest(BaseModel):
    agent_id: str
    agent_name: str
    rate_per_minute: Optional[float] = 10.0
    currency: Optional[str] = "INR"


class HeartbeatRequest(BaseModel):
    session_id: str


class StopSessionRequest(BaseModel):
    session_id: str


class SendMessageRequest(BaseModel):
    session_id: str
    content: str
    input_type: Optional[str] = "text"  # 'text' | 'voice'


class AgentInfo(BaseModel):
    id: str
    title: str
    description: str
    rate_per_minute: float
    currency: str
    free_seconds: int


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_current_user(request: Request, db: Session) -> Optional[User]:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ", 1)[1]
    return AuthService.get_user_from_token(token, db)


def calculate_billing(started_at: datetime, ended_at: datetime, free_seconds: int = 60, rate_per_minute: float = 10.0):
    if not started_at:
        return 0, 0, 0.0
    now = ended_at or datetime.now(timezone.utc)
    if started_at.tzinfo is None:
        started_at = started_at.replace(tzinfo=timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)

    total_seconds = max(0, int((now - started_at).total_seconds()))
    if total_seconds <= free_seconds:
        billable_minutes = 0
        total_charged = 0.0
    else:
        chargeable_seconds = total_seconds - free_seconds
        billable_minutes = math.ceil(chargeable_seconds / 60.0)
        total_charged = round(billable_minutes * rate_per_minute, 2)

    return total_seconds, billable_minutes, total_charged


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/start")
def start_session(
    payload: StartSessionRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Start an active agent session with a running timer and 60-second free tier."""
    user = _get_current_user(request, db)
    session_id = f"as_{secrets.token_hex(16)}"
    now = datetime.now(timezone.utc)

    session = AgentSession(
        session_id=session_id,
        user_id=user.id if user else None,
        agent_id=payload.agent_id,
        agent_name=payload.agent_name,
        rate_per_minute=payload.rate_per_minute or 10.0,
        currency=payload.currency or "INR",
        free_seconds=60,
        total_seconds=0,
        billable_minutes=0,
        total_charged=0.0,
        status=SessionStatus.ACTIVE,
        started_at=now,
        last_heartbeat_at=now,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return {
        "success": True,
        "session": session.to_dict(),
        "free_seconds": 60,
    }


@router.post("/heartbeat")
def heartbeat_session(
    payload: HeartbeatRequest,
    db: Session = Depends(get_db),
):
    """Periodic client heartbeat updating elapsed seconds & live billing status."""
    session = db.query(AgentSession).filter(AgentSession.session_id == payload.session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    if session.status != SessionStatus.ACTIVE:
        return {
            "success": False,
            "session": session.to_dict(),
            "status": session.status.value,
        }

    now = datetime.now(timezone.utc)
    total_seconds, billable_minutes, total_charged = calculate_billing(
        session.started_at, now, session.free_seconds, session.rate_per_minute
    )

    session.last_heartbeat_at = now
    session.total_seconds = total_seconds
    session.billable_minutes = billable_minutes
    session.total_charged = total_charged
    db.commit()
    db.refresh(session)

    return {
        "success": True,
        "session": session.to_dict(),
        "is_free": total_seconds <= session.free_seconds,
        "seconds_remaining_in_free": max(0, session.free_seconds - total_seconds),
    }


@router.post("/stop")
def stop_session(
    payload: StopSessionRequest,
    db: Session = Depends(get_db),
):
    """Stop the session clock, compute final billable units, and finalize total charge."""
    session = db.query(AgentSession).filter(AgentSession.session_id == payload.session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    if session.status == SessionStatus.STOPPED:
        return {
            "success": True,
            "session": session.to_dict(),
            "already_stopped": True,
        }

    now = datetime.now(timezone.utc)
    total_seconds, billable_minutes, total_charged = calculate_billing(
        session.started_at, now, session.free_seconds, session.rate_per_minute
    )

    session.status = SessionStatus.STOPPED
    session.ended_at = now
    session.total_seconds = total_seconds
    session.billable_minutes = billable_minutes
    session.total_charged = total_charged
    db.commit()
    db.refresh(session)

    return {
        "success": True,
        "session": session.to_dict(),
    }


@router.get("/{session_id}")
def get_session(
    session_id: str,
    db: Session = Depends(get_db),
):
    """Retrieve session details, elapsed time, billing info, and message history."""
    session = db.query(AgentSession).filter(AgentSession.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    messages = (
        db.query(AgentSessionMessage)
        .filter(AgentSessionMessage.session_id == session_id)
        .order_by(AgentSessionMessage.created_at.asc())
        .all()
    )

    return {
        "session": session.to_dict(),
        "messages": [m.to_dict() for m in messages],
    }


@router.post("/message")
def send_message(
    payload: SendMessageRequest,
    db: Session = Depends(get_db),
):
    """Store chat messages during the active session (agent LLM integration will plug here)."""
    session = db.query(AgentSession).filter(AgentSession.session_id == payload.session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    if session.status != SessionStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot send message to stopped session")

    # Record user message
    user_msg = AgentSessionMessage(
        session_id=session.session_id,
        role=AgentSessionMessageRole.USER,
        content=payload.content,
        input_type=payload.input_type or "text",
    )
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    # Placeholder assistant acknowledgment (specialist agent LLM will be hooked here)
    reply_content = (
        f"[{session.agent_name} Specialist Agent Placeholder] "
        f"I received your request regarding '{payload.content[:80]}...'. "
        f"The specialist agent model will be integrated here to produce high-converting drafts."
    )
    asst_msg = AgentSessionMessage(
        session_id=session.session_id,
        role=AgentSessionMessageRole.ASSISTANT,
        content=reply_content,
        input_type="text",
    )
    db.add(asst_msg)
    db.commit()
    db.refresh(asst_msg)

    return {
        "success": True,
        "user_message": user_msg.to_dict(),
        "assistant_message": asst_msg.to_dict(),
    }
