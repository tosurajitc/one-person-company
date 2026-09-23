"""
user_ai_credential.py

Stores encrypted BYOK (Bring Your Own Key) credentials for users.
Keys are encrypted at rest via AES (app.core.crypto) and decrypted only in memory during execution.
"""

from __future__ import annotations

import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum as SAEnum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class AiProviderType(str, enum.Enum):
    PLATFORM = "platform"
    GROQ = "groq"
    ANTHROPIC = "anthropic"
    OPENAI = "openai"
    OPENROUTER = "openrouter"


class UserAiCredential(Base):
    __tablename__ = "user_ai_credentials"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    provider = Column(SAEnum(AiProviderType), default=AiProviderType.PLATFORM, nullable=False)
    encrypted_api_key = Column(Text, nullable=True)  # Ciphertext from app.core.crypto.encrypt_secret
    key_hint = Column(String(32), nullable=True)     # Safe display string (e.g., 'gsk_...4a9f')
    custom_model_name = Column(String(128), nullable=True) # Optional model override (e.g. 'llama-3.3-70b-versatile')
    
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", backref="ai_credential")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "provider": self.provider.value if hasattr(self.provider, "value") else str(self.provider),
            "key_hint": self.key_hint,
            "custom_model_name": self.custom_model_name,
            "is_active": self.is_active,
            "is_custom": self.provider != AiProviderType.PLATFORM and bool(self.encrypted_api_key),
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
