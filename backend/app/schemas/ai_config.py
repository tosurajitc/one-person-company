"""
ai_config.py

Pydantic schemas for User AI Credential (BYOK - Bring Your Own Key) configuration and validation.
"""

from __future__ import annotations
from typing import Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime


class SaveAiConfigRequest(BaseModel):
    """Payload to configure or update user's custom AI API key."""
    provider: Literal["platform", "groq", "anthropic", "openai", "openrouter"] = Field(
        default="platform",
        description="AI Provider to use: platform, groq, anthropic, openai, openrouter"
    )
    api_key: Optional[str] = Field(
        default=None,
        description="Plaintext API key (will be AES-256 encrypted at rest before storing)"
    )
    custom_model_name: Optional[str] = Field(
        default=None,
        description="Optional model identifier override (e.g., 'llama-3.3-70b-versatile', 'claude-3-5-sonnet-20241022')"
    )


class TestAiConfigRequest(BaseModel):
    """Payload to test an API key before saving."""
    provider: Literal["platform", "groq", "anthropic", "openai", "openrouter"]
    api_key: Optional[str] = None
    custom_model_name: Optional[str] = None


class AiConfigResponse(BaseModel):
    """Safe response containing metadata about active AI provider (no decrypted secrets exposed)."""
    id: Optional[int] = None
    user_id: int
    provider: str
    key_hint: Optional[str] = None
    custom_model_name: Optional[str] = None
    is_active: bool = True
    is_custom: bool = False
    updated_at: Optional[str] = None


class TestAiConfigResponse(BaseModel):
    """Result of testing an AI key connectivity."""
    success: bool
    provider: str
    model_used: Optional[str] = None
    message: str
