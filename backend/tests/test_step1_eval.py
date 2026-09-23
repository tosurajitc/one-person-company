"""
test_step1_eval.py

Verification & Evaluation Test Suite for Step 1:
- Validates AES-256 Symmetric Encryption, Decryption, and Masking.
- Tests insertion, retrieval, and decryption of UserAiCredential (BYOK).
- Tests full lifecycle of AdManagementState (Draft -> Verified -> Applied) using a Golden Eval Dataset.
"""

import sys
import os
from datetime import datetime

# Setup path for backend imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.user_ai_credential import UserAiCredential, AiProviderType
from app.models.ad_management_state import AdManagementState, StepVerificationStatus
from app.core.crypto import encrypt_secret, decrypt_secret, mask_api_key

# ─────────────────────────────────────────────────────────────────────────────
# GOLDEN EVALUATION DATASET (Step 1 Baseline)
# ─────────────────────────────────────────────────────────────────────────────
GOLDEN_EVAL_DATASET = {
    "user": {
        "email": "golden_founder@sharmadigital.com",
        "full_name": "Sharma Digital Founder",
        "username": "sharma-digital-eval",
    },
    "byok_credential": {
        "provider": AiProviderType.GROQ,
        "raw_api_key": "gsk_prod_998877665544332211aabbccddeeff00",
        "custom_model_name": "llama-3.3-70b-versatile",
    },
    "ad_state_stage_1_draft": {
        "category_id": "product-commerce",
        "niche_name": "D2C Apparel & Fashion",
        "monthly_ad_spend": "₹50,000",
        "audit": {
            "score": 72,
            "status": StepVerificationStatus.DRAFT,
            "findings": [
                {
                    "severity": "high",
                    "category": "Tracking & Pixel",
                    "issue": "Meta CAPI Not Active",
                    "impact": "Up to 24% iOS purchase events lost",
                    "fix": "Activate server-side Conversions API",
                },
                {
                    "severity": "high",
                    "category": "Creative Fatigue",
                    "issue": "Frequency > 3.8 on ASC",
                    "impact": "CPA increased by 38%",
                    "fix": "Inject 3 new UGC video hooks",
                },
            ],
            "action_plan": [
                "Deploy CAPI tracking fix",
                "Test 3 fresh UGC hooks",
                "Set up automated kill-rules for CTR < 0.90%",
            ],
        },
    },
    "ad_state_stage_2_verified": {
        "tracking": {
            "status": StepVerificationStatus.VERIFIED,
            "pixel_id": "492019482910394",
            "capi_configured": True,
            "event_mapping": [
                {"name": "PageView", "status": "Active (Browser + CAPI)", "matchQuality": "8.8 / 10"},
                {"name": "Purchase", "status": "Browser + CAPI Deduplicated", "matchQuality": "9.2 / 10"},
            ],
            "funnel_architecture": {
                "tof": {"name": "Advantage+ Shopping (ASC)", "budget_pct": 70},
                "mof": {"name": "Social Engagers (180D)", "budget_pct": 15},
                "bof": {"name": "Catalog & Cart Recovery", "budget_pct": 15},
            },
        },
        "creatives": {
            "status": StepVerificationStatus.VERIFIED,
            "copies": [
                {
                    "id": 1,
                    "angle": "Direct Pain Point",
                    "headline": "Stop Burning Meta Ad Budget On Ineffective Creatives",
                    "primaryText": "If your D2C brand's CPA keeps creeping up, it's ad fatigue...",
                    "cta": "Shop Now",
                    "isApproved": True,
                }
            ],
        },
        "diagnostics": {
            "status": StepVerificationStatus.VERIFIED,
            "metrics": [
                {"metric": "Blended ROAS", "value": "2.84x", "target": "> 3.50x", "status": "warning"},
                {"metric": "CPA", "value": "₹412", "target": "< ₹320", "status": "danger"},
            ],
            "rules": [
                {"id": 1, "type": "kill", "condition": "Spend > ₹3,400 with 0 purchases", "action": "Pause Ad", "isEnabled": True},
                {"id": 2, "type": "scale", "condition": "ROAS > 3.5x over 4 days", "action": "Increase Budget +15%", "isEnabled": True},
            ],
        },
    },
}


def run_eval():
    print("=" * 70)
    print("RUNNING STEP 1 EVALUATION: CRYPTO & DATABASE STATE INTEGRITY")
    print("=" * 70)

    db = SessionLocal()
    try:
        # 1. Test Crypto Module
        raw_key = GOLDEN_EVAL_DATASET["byok_credential"]["raw_api_key"]
        encrypted = encrypt_secret(raw_key)
        decrypted = decrypt_secret(encrypted)
        masked = mask_api_key(raw_key)

        print("\n[TEST 1] Crypto Engine Validation:")
        print(f"  • Raw Secret       : {raw_key}")
        print(f"  • Encrypted Cipher : {encrypted[:30]}... (AES-256 Fernet)")
        print(f"  • Decrypted Secret : {decrypted}")
        print(f"  • Safe Mask Display: {masked}")

        assert decrypted == raw_key, "Decryption does not match raw secret!"
        assert encrypted != raw_key, "Ciphertext cannot match plain secret!"
        assert masked == "gsk_pr...ff00", f"Unexpected mask: {masked}"
        print("  => Crypto Unit Test PASSED [OK]")

        # 2. Get or Create Test User
        user_info = GOLDEN_EVAL_DATASET["user"]
        user = db.query(User).filter(User.email == user_info["email"]).first()
        if not user:
            user = User(
                email=user_info["email"],
                full_name=user_info["full_name"],
                username=user_info["username"],
                role=UserRole.USER,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        print(f"\n[TEST 2] User Database Binding:")
        print(f"  • User ID: {user.id} | Email: {user.email}")

        # 3. Test BYOK Credential Storage
        cred = db.query(UserAiCredential).filter(UserAiCredential.user_id == user.id).first()
        if not cred:
            cred = UserAiCredential(
                user_id=user.id,
                provider=GOLDEN_EVAL_DATASET["byok_credential"]["provider"],
                encrypted_api_key=encrypted,
                key_hint=masked,
                custom_model_name=GOLDEN_EVAL_DATASET["byok_credential"]["custom_model_name"],
            )
            db.add(cred)
        else:
            cred.encrypted_api_key = encrypted
            cred.key_hint = masked
        db.commit()
        db.refresh(cred)

        print("\n[TEST 3] BYOK UserAiCredential Storage & Decryption:")
        print(f"  • Stored Credential ID: {cred.id}")
        print(f"  • Stored Provider     : {cred.provider.value}")
        print(f"  • Stored Mask Hint    : {cred.key_hint}")
        print(f"  • On-demand Decryption: {decrypt_secret(cred.encrypted_api_key)}")

        assert decrypt_secret(cred.encrypted_api_key) == raw_key
        assert cred.to_dict()["is_custom"] is True
        print("  => BYOK Credential Test PASSED [OK]")

        # 4. Test AdManagementState Draft Creation (Stage 1)
        draft_data = GOLDEN_EVAL_DATASET["ad_state_stage_1_draft"]
        state = db.query(AdManagementState).filter(AdManagementState.user_id == user.id).first()
        if not state:
            state = AdManagementState(
                user_id=user.id,
                category_id=draft_data["category_id"],
                niche_name=draft_data["niche_name"],
                monthly_ad_spend=draft_data["monthly_ad_spend"],
                audit_status=draft_data["audit"]["status"],
                audit_score=draft_data["audit"]["score"],
                audit_findings=draft_data["audit"]["findings"],
                audit_action_plan=draft_data["audit"]["action_plan"],
            )
            db.add(state)
        else:
            state.category_id = draft_data["category_id"]
            state.niche_name = draft_data["niche_name"]
            state.monthly_ad_spend = draft_data["monthly_ad_spend"]
            state.audit_status = draft_data["audit"]["status"]
            state.audit_score = draft_data["audit"]["score"]
            state.audit_findings = draft_data["audit"]["findings"]
            state.audit_action_plan = draft_data["audit"]["action_plan"]
        db.commit()
        db.refresh(state)

        print("\n[TEST 4] AdManagementState Draft Creation (Human Review Phase):")
        print(f"  • State ID    : {state.id}")
        print(f"  • Audit Status: {state.audit_status.value} (Awaiting Founder Review)")
        print(f"  • Audit Score : {state.audit_score}/100")
        print(f"  • Findings Count: {len(state.audit_findings)}")
        assert state.audit_status == StepVerificationStatus.DRAFT
        print("  => Draft State Creation PASSED [OK]")

        # 5. Simulate Founder Verification & State Transition (Human In The Loop)
        verified_data = GOLDEN_EVAL_DATASET["ad_state_stage_2_verified"]
        state.audit_status = StepVerificationStatus.VERIFIED
        state.audit_verified_at = datetime.utcnow()

        state.tracking_status = verified_data["tracking"]["status"]
        state.pixel_id = verified_data["tracking"]["pixel_id"]
        state.capi_configured = verified_data["tracking"]["capi_configured"]
        state.event_mapping = verified_data["tracking"]["event_mapping"]
        state.funnel_architecture = verified_data["tracking"]["funnel_architecture"]
        state.tracking_verified_at = datetime.utcnow()

        state.creative_status = verified_data["creatives"]["status"]
        state.generated_copies = verified_data["creatives"]["copies"]
        state.creatives_verified_at = datetime.utcnow()

        state.diagnostics_status = verified_data["diagnostics"]["status"]
        state.performance_metrics = verified_data["diagnostics"]["metrics"]
        state.active_rules = verified_data["diagnostics"]["rules"]
        state.diagnostics_verified_at = datetime.utcnow()

        db.commit()
        db.refresh(state)

        print("\n[TEST 5] Human-In-The-Loop Verification Transition:")
        print(f"  • Audit Status      : {state.audit_status.value} at {state.audit_verified_at}")
        print(f"  • Tracking Status   : {state.tracking_status.value} (CAPI Active: {state.capi_configured})")
        print(f"  • Creatives Approved: {state.creative_status.value} ({len(state.generated_copies)} copies approved)")
        print(f"  • Rules Verified    : {state.diagnostics_status.value} ({len(state.active_rules)} active rules)")

        state_dict = state.to_dict()
        assert state_dict["audit"]["status"] == "verified"
        assert state_dict["tracking"]["capi_configured"] is True
        assert len(state_dict["creatives"]["copies"]) == 1
        assert len(state_dict["diagnostics"]["rules"]) == 2
        print("  => Full State Verification Transition PASSED [OK]")

        print("\n" + "=" * 70)
        print("ALL STEP 1 EVALUATION CHECKS COMPLETED SUCCESSFULLY (100% PASS)")
        print("=" * 70)

    finally:
        db.close()


if __name__ == "__main__":
    run_eval()
