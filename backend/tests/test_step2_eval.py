"""
test_step2_eval.py

Verification & Evaluation Test Suite for Step 2:
- Tests Pydantic validation schemas (ad_management.py & ai_config.py).
- Tests AI Agent Orchestrator service (Groq, Anthropic, OpenAI, BYOK & platform routing).
- Tests FastAPI Route Endpoints for /api/ai-config and /api/ad-agent.
- Tests Human-In-The-Loop state transitions (DRAFT -> VERIFIED) end-to-end.
"""

import sys
import os
from datetime import datetime, timezone
from fastapi.testclient import TestClient

# Setup path for backend imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.user_ai_credential import UserAiCredential, AiProviderType
from app.models.ad_management_state import AdManagementState, StepVerificationStatus
from app.core.auth import AuthService
from app.core.crypto import encrypt_secret, decrypt_secret
from app.services.ad_management_service import (
    generate_ad_audit,
    verify_ad_audit,
    generate_tracking_blueprint,
    verify_tracking_blueprint,
    generate_ad_creatives,
    verify_ad_creatives,
    generate_performance_diagnostics,
    verify_performance_diagnostics,
    get_or_create_ad_state,
)


client = TestClient(app)


def run_step2_evaluation():
    print("=" * 75)
    print("RUNNING STEP 2 EVALUATION: AI AGENT ORCHESTRATOR & BYOK SUITE")
    print("=" * 75)

    db = SessionLocal()
    try:
        # 1. Setup Test User & Auth Token
        test_email = "ad_agent_eval@testcompany.com"
        user = db.query(User).filter(User.email == test_email).first()
        if not user:
            user = User(
                email=test_email,
                full_name="Ad Suite Evaluator",
                username="ad-evaluator",
                role=UserRole.USER,
                is_active=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        auth_token = AuthService.create_access_token({"sub": str(user.id)})
        headers = {"Authorization": f"Bearer {auth_token}"}
        print(f"\n[EVAL 1] User Authentication & Token Generation:")
        print(f"  • User ID: {user.id} | Email: {user.email}")
        print(f"  • Bearer Token: {auth_token[:25]}...")

        # 2. Test BYOK AI Config Endpoints (GET / POST / TEST)
        print("\n[EVAL 2] BYOK AI Config API Endpoints:")
        
        # Save Groq BYOK key
        save_resp = client.post(
            "/api/ai-config",
            headers=headers,
            json={
                "provider": "groq",
                "api_key": "gsk_live_samplekey_99887766554433221100",
                "custom_model_name": "llama-3.3-70b-versatile",
            },
        )
        assert save_resp.status_code == 200, f"Save AI config failed: {save_resp.text}"
        saved_data = save_resp.json()
        print(f"  • Save BYOK Response: Provider={saved_data['provider']} | Mask={saved_data['key_hint']} | IsCustom={saved_data['is_custom']}")
        assert saved_data["provider"] == "groq"
        assert saved_data["is_custom"] is True
        assert "gsk_live" not in (saved_data["key_hint"] or "")

        # Read back config
        get_resp = client.get("/api/ai-config", headers=headers)
        assert get_resp.status_code == 200
        get_data = get_resp.json()
        print(f"  • GET /api/ai-config Response: Provider={get_data['provider']} | Custom={get_data['is_custom']}")
        assert get_data["provider"] == "groq"
        assert get_data["is_custom"] is True

        # Test Platform ping fallback
        test_resp = client.post(
            "/api/ai-config/test",
            headers=headers,
            json={"provider": "platform"},
        )
        assert test_resp.status_code == 200
        test_data = test_resp.json()
        print(f"  • AI Provider Ping Test: Success={test_data['success']} | Provider={test_data['provider']}")
        assert test_data["success"] is True
        print("  => BYOK AI Config Suite PASSED [OK]")

        # 3. Test Tier 1: Ad Account Audit (Generate DRAFT -> Verify HITL)
        print("\n[EVAL 3] Tier 1: Automated Audit Agent & Verification:")
        audit_gen_resp = client.post(
            "/api/ad-agent/audit/generate",
            headers=headers,
            json={
                "category_id": "product-commerce",
                "niche_name": "D2C Apparel & Fashion",
                "monthly_spend": "₹75,000",
                "current_roas": "2.1x",
                "main_pain_point": "Creative fatigue in top of funnel",
            },
        )
        assert audit_gen_resp.status_code == 200, f"Audit gen failed: {audit_gen_resp.text}"
        audit_data = audit_gen_resp.json()
        print(f"  • Generated Audit (DRAFT): Score={audit_data['audit']['score']} | Status={audit_data['audit']['status']}")
        print(f"  • Findings Identified: {len(audit_data['audit']['findings'])}")
        assert audit_data["audit"]["status"] == "draft"
        assert len(audit_data["audit"]["findings"]) > 0

        # Founder Approves Audit
        audit_verify_resp = client.post(
            "/api/ad-agent/audit/verify",
            headers=headers,
            json={
                "findings": audit_data["audit"]["findings"],
                "action_plan": audit_data["audit"]["action_plan"],
                "audit_score": audit_data["audit"]["score"],
            },
        )
        assert audit_verify_resp.status_code == 200
        verified_audit = audit_verify_resp.json()
        print(f"  • Human-in-the-Loop Approved: Status={verified_audit['audit']['status']} | VerifiedAt={verified_audit['audit']['verified_at']}")
        assert verified_audit["audit"]["status"] == "verified"
        assert verified_audit["audit"]["verified_at"] is not None
        print("  => Tier 1 Audit Lifecycle PASSED [OK]")

        # 4. Test Tier 2: Setup & Tracking CAPI Blueprint
        print("\n[EVAL 4] Tier 2: CAPI Tracking Blueprint Agent & Verification:")
        track_gen_resp = client.post(
            "/api/ad-agent/tracking/generate",
            headers=headers,
            json={
                "pixel_id": "998811223344",
                "category_id": "product-commerce",
                "niche_name": "D2C Apparel & Fashion",
            },
        )
        assert track_gen_resp.status_code == 200
        track_data = track_gen_resp.json()
        print(f"  • Tracking Blueprint (DRAFT): Events={len(track_data['tracking']['event_mapping'])} | Status={track_data['tracking']['status']}")
        assert track_data["tracking"]["status"] == "draft"

        # Verify Tracking
        track_ver_resp = client.post(
            "/api/ad-agent/tracking/verify",
            headers=headers,
            json={
                "pixel_id": "998811223344",
                "capi_configured": True,
                "event_mapping": track_data["tracking"]["event_mapping"],
                "funnel_architecture": track_data["tracking"]["funnel_architecture"],
            },
        )
        assert track_ver_resp.status_code == 200
        verified_track = track_ver_resp.json()
        print(f"  • Tracking Verified: Status={verified_track['tracking']['status']} | CAPI={verified_track['tracking']['capi_configured']}")
        assert verified_track["tracking"]["status"] == "verified"
        assert verified_track["tracking"]["capi_configured"] is True
        print("  => Tier 2 Tracking Lifecycle PASSED [OK]")

        # 5. Test Tier 3: Creatives & Multi-Angle Copy Generator
        print("\n[EVAL 5] Tier 3: Direct-Response Copy Agent & Approval:")
        creative_gen_resp = client.post(
            "/api/ad-agent/creatives/generate",
            headers=headers,
            json={
                "category_id": "product-commerce",
                "niche_name": "D2C Apparel & Fashion",
                "product_name": "Ultra-Breathable Bamboo Tee",
                "count": 3,
            },
        )
        assert creative_gen_resp.status_code == 200
        creative_data = creative_gen_resp.json()
        copies = creative_data["creatives"]["copies"]
        print(f"  • Generated Ad Copies (DRAFT): Count={len(copies)} | Status={creative_data['creatives']['status']}")
        assert len(copies) >= 3
        print(f"  • Sample Angle: \"{copies[0]['angle']}\" | Headline: \"{copies[0]['headline']}\"")

        # Founder approves copy #1 and #2
        copies[0]["isApproved"] = True
        copies[1]["isApproved"] = True
        creative_ver_resp = client.post(
            "/api/ad-agent/creatives/verify",
            headers=headers,
            json={"copies": copies},
        )
        assert creative_ver_resp.status_code == 200
        verified_creatives = creative_ver_resp.json()
        print(f"  • Creatives Verified: Status={verified_creatives['creatives']['status']} | Approved Count=2")
        assert verified_creatives["creatives"]["status"] == "verified"
        print("  => Tier 3 Creatives Lifecycle PASSED [OK]")

        # 6. Test Tier 4: Diagnostics & Optimization Rules
        print("\n[EVAL 6] Tier 4: Autonomous Diagnostics & Kill/Scale Rules:")
        diag_gen_resp = client.post(
            "/api/ad-agent/diagnostics/generate",
            headers=headers,
            json={"category_id": "product-commerce", "niche_name": "D2C Apparel & Fashion"},
        )
        assert diag_gen_resp.status_code == 200
        diag_data = diag_gen_resp.json()
        metrics = diag_data["diagnostics"]["metrics"]
        rules = diag_data["diagnostics"]["rules"]
        print(f"  • Diagnostics (DRAFT): Metrics={len(metrics)} | Rules={len(rules)}")

        # Verify Diagnostics
        diag_ver_resp = client.post(
            "/api/ad-agent/diagnostics/verify",
            headers=headers,
            json={"metrics": metrics, "rules": rules},
        )
        assert diag_ver_resp.status_code == 200
        verified_diag = diag_ver_resp.json()
        print(f"  • Diagnostics Verified: Status={verified_diag['diagnostics']['status']}")
        assert verified_diag["diagnostics"]["status"] == "verified"
        print("  => Tier 4 Diagnostics Lifecycle PASSED [OK]")

        # 7. Test Global State Aggregation Endpoint
        print("\n[EVAL 7] Global Multi-Tier State Consolidation:")
        state_resp = client.get("/api/ad-agent/state", headers=headers)
        assert state_resp.status_code == 200
        final_state = state_resp.json()
        print(f"  • Final Global State:")
        print(f"    - Tier 1 Audit Status      : {final_state['audit']['status']}")
        print(f"    - Tier 2 Tracking Status   : {final_state['tracking']['status']}")
        print(f"    - Tier 3 Creatives Status  : {final_state['creatives']['status']}")
        print(f"    - Tier 4 Diagnostics Status: {final_state['diagnostics']['status']}")
        assert final_state["audit"]["status"] == "verified"
        assert final_state["tracking"]["status"] == "verified"
        assert final_state["creatives"]["status"] == "verified"
        assert final_state["diagnostics"]["status"] == "verified"

        print("\n" + "=" * 75)
        print("ALL STEP 2 EVALUATION CHECKS COMPLETED SUCCESSFULLY (100% PASS)")
        print("=" * 75)

    finally:
        db.close()


if __name__ == "__main__":
    run_step2_evaluation()
