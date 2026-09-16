from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, Enum as SAEnum
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class SessionStatus(str, enum.Enum):
    ACTIVE = "active"
    STOPPED = "stopped"
    EXPIRED = "expired"


class AgentSessionMessageRole(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class AgentSession(Base):
    __tablename__ = "agent_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    agent_id = Column(String(64), nullable=False, index=True)  # e.g., 'blog-posts', 'social-media'
    agent_name = Column(String(128), nullable=False)
    status = Column(SAEnum(SessionStatus), default=SessionStatus.ACTIVE, nullable=False)
    rate_per_minute = Column(Float, default=10.0, nullable=False)  # Currency per minute after free minute
    currency = Column(String(10), default="INR", nullable=False)
    free_seconds = Column(Integer, default=60, nullable=False)
    total_seconds = Column(Integer, default=0, nullable=False)
    billable_minutes = Column(Integer, default=0, nullable=False)
    total_charged = Column(Float, default=0.0, nullable=False)
    started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_heartbeat_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.session_id,
            "user_id": self.user_id,
            "agent_id": self.agent_id,
            "agent_name": self.agent_name,
            "status": self.status.value,
            "rate_per_minute": self.rate_per_minute,
            "currency": self.currency,
            "free_seconds": self.free_seconds,
            "total_seconds": self.total_seconds,
            "billable_minutes": self.billable_minutes,
            "total_charged": self.total_charged,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "last_heartbeat_at": self.last_heartbeat_at.isoformat() if self.last_heartbeat_at else None,
            "ended_at": self.ended_at.isoformat() if self.ended_at else None,
        }


class AgentSessionMessage(Base):
    __tablename__ = "agent_session_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), ForeignKey("agent_sessions.session_id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(SAEnum(AgentSessionMessageRole), nullable=False)
    content = Column(Text, nullable=False)
    input_type = Column(String(20), default="text")  # 'text' or 'voice'
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.session_id,
            "role": self.role.value,
            "content": self.content,
            "input_type": self.input_type,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
