"""
ai_config_routes.py

Routes for managing User Bring-Your-Own-Key (BYOK) AI configurations.
Supports saving, retrieving, and testing keys for Groq, Anthropic, OpenAI, OpenRouter, and Platform.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.crypto import encrypt_secret, decrypt_secret, mask_api_key
from app.models.user import User
from app.models.user_ai_credential import UserAiCredential, AiProviderType
from app.schemas.ai_config import (
    SaveAiConfigRequest,
    TestAiConfigRequest,
    AiConfigResponse,
    TestAiConfigResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai-config", tags=["ai-config"])


@router.get("", response_model=AiConfigResponse)
def get_user_ai_config(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieves metadata for the current user's AI configuration (no plaintext secrets)."""
    cred = db.query(UserAiCredential).filter(UserAiCredential.user_id == current_user.id).first()
    if not cred:
        return AiConfigResponse(
            user_id=current_user.id,
            provider="platform",
            key_hint=None,
            custom_model_name=None,
            is_active=True,
            is_custom=False,
        )

    return AiConfigResponse(
        id=cred.id,
        user_id=cred.user_id,
        provider=cred.provider.value if hasattr(cred.provider, "value") else str(cred.provider),
        key_hint=cred.key_hint,
        custom_model_name=cred.custom_model_name,
        is_active=cred.is_active,
        is_custom=cred.provider != AiProviderType.PLATFORM and bool(cred.encrypted_api_key),
        updated_at=cred.updated_at.isoformat() if cred.updated_at else None,
    )


@router.post("", response_model=AiConfigResponse)
def save_user_ai_config(
    req: SaveAiConfigRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Saves or updates the user's BYOK AI credentials securely using AES encryption."""
    cred = db.query(UserAiCredential).filter(UserAiCredential.user_id == current_user.id).first()
    if not cred:
        cred = UserAiCredential(user_id=current_user.id)
        db.add(cred)

    provider_enum = AiProviderType(req.provider)
    cred.provider = provider_enum
    cred.custom_model_name = req.custom_model_name

    if provider_enum == AiProviderType.PLATFORM:
        cred.encrypted_api_key = None
        cred.key_hint = None
    elif req.api_key:
        cleaned_key = req.api_key.strip()
        cred.encrypted_api_key = encrypt_secret(cleaned_key)
        cred.key_hint = mask_api_key(cleaned_key)

    cred.is_active = True
    db.commit()
    db.refresh(cred)

    return AiConfigResponse(
        id=cred.id,
        user_id=cred.user_id,
        provider=cred.provider.value if hasattr(cred.provider, "value") else str(cred.provider),
        key_hint=cred.key_hint,
        custom_model_name=cred.custom_model_name,
        is_active=cred.is_active,
        is_custom=cred.provider != AiProviderType.PLATFORM and bool(cred.encrypted_api_key),
        updated_at=cred.updated_at.isoformat() if cred.updated_at else None,
    )


@router.post("/test", response_model=TestAiConfigResponse)
def test_user_ai_config(
    req: TestAiConfigRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Tests an AI provider connection with a ping prompt to verify key validity."""
    provider = req.provider
    api_key = req.api_key

    # If key not provided in test payload, try stored user key
    if not api_key and provider != "platform":
        cred = db.query(UserAiCredential).filter(UserAiCredential.user_id == current_user.id).first()
        if cred and cred.encrypted_api_key:
            try:
                api_key = decrypt_secret(cred.encrypted_api_key)
            except Exception:
                raise HTTPException(status_code=400, detail="Failed to decrypt stored credentials")

    if provider != "platform" and not api_key:
        raise HTTPException(status_code=400, detail="API key is required for provider testing")

    try:
        if provider == "groq":
            from groq import Groq
            client = Groq(api_key=api_key)
            model = req.custom_model_name or "llama-3.3-70b-versatile"
            resp = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": "Respond with 'PONG'"}],
                max_tokens=10,
            )
            return TestAiConfigResponse(
                success=True,
                provider=provider,
                model_used=model,
                message="Successfully connected to Groq API.",
            )

        elif provider == "openai":
            from openai import OpenAI
            client = OpenAI(api_key=api_key)
            model = req.custom_model_name or "gpt-4o-mini"
            resp = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": "Respond with 'PONG'"}],
                max_tokens=10,
            )
            return TestAiConfigResponse(
                success=True,
                provider=provider,
                model_used=model,
                message="Successfully connected to OpenAI API.",
            )

        elif provider == "anthropic":
            import anthropic
            client = anthropic.Anthropic(api_key=api_key)
            model = req.custom_model_name or "claude-3-5-sonnet-20241022"
            resp = client.messages.create(
                model=model,
                max_tokens=10,
                messages=[{"role": "user", "content": "Respond with 'PONG'"}],
            )
            return TestAiConfigResponse(
                success=True,
                provider=provider,
                model_used=model,
                message="Successfully connected to Anthropic Claude API.",
            )

        elif provider == "openrouter":
            from openai import OpenAI
            client = OpenAI(api_key=api_key, base_url="https://openrouter.ai/api/v1")
            model = req.custom_model_name or "meta-llama/llama-3.3-70b-instruct"
            resp = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": "Respond with 'PONG'"}],
                max_tokens=10,
            )
            return TestAiConfigResponse(
                success=True,
                provider=provider,
                model_used=model,
                message="Successfully connected to OpenRouter API.",
            )

        else:
            return TestAiConfigResponse(
                success=True,
                provider="platform",
                model_used="Platform Managed (Groq/Claude)",
                message="Platform AI routing active and ready.",
            )

    except Exception as e:
        logger.error(f"Test AI configuration failed: {e}")
        return TestAiConfigResponse(
            success=False,
            provider=provider,
            model_used=req.custom_model_name,
            message=f"Connection failed: {str(e)}",
        )
