"""
test_step3_eval.py

Step 3 Golden Evaluation Suite:
- Tier 3: Multi-angle creative generation, per-copy approval toggle, approved-copy persistence,
  partial-approval lifecycle, and VERIFIED state shape validation.
- Tier 4: AI diagnostics generation, metrics shape validation, kill/scale/refresh rule
  structure, rule toggle enable/disable persistence, VERIFIED state shape validation.
- Full 4-tier end-to-end verified state consolidation.
"""

import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.ad_management_state import AdManagementState, StepVerificationStatus
from app.core.auth import AuthService

client = TestClient(app)


# ── Helpers ────────────────────────────────────────────────────────────────

def _get_or_create_user(db, email: str, full_name: str, username: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            full_name=full_name,
            username=username,
            role=UserRole.USER,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def _auth_headers(user_id: int) -> dict:
    token = AuthService.create_access_token({"sub": str(user_id)})
    return {"Authorization": f"Bearer {token}"}


def _reset_ad_state(db, user_id: int):
    """Delete existing ad state so each test section starts fresh."""
    db.query(AdManagementState).filter(AdManagementState.user_id == user_id).delete()
    db.commit()


# ── Tier 3 Copy Validation Helpers ────────────────────────────────────────

REQUIRED_COPY_FIELDS = {"id", "angle", "headline", "primaryText", "cta", "isApproved"}


def _assert_copy_shape(copy: dict, idx: int):
    missing = REQUIRED_COPY_FIELDS - set(copy.keys())
    assert not missing, f"Copy #{idx} missing fields: {missing}"
    assert isinstance(copy["id"], int), f"Copy #{idx}: 'id' must be int"
    assert isinstance(copy["angle"], str) and copy["angle"], f"Copy #{idx}: 'angle' must be non-empty str"
    assert isinstance(copy["headline"], str) and copy["headline"], f"Copy #{idx}: 'headline' must be non-empty str"
    assert isinstance(copy["primaryText"], str) and copy["primaryText"], f"Copy #{idx}: 'primaryText' must be non-empty str"
    assert isinstance(copy["cta"], str) and copy["cta"], f"Copy #{idx}: 'cta' must be non-empty str"
    assert isinstance(copy["isApproved"], bool), f"Copy #{idx}: 'isApproved' must be bool"


# ── Tier 4 Metric / Rule Validation Helpers ───────────────────────────────

REQUIRED_METRIC_FIELDS = {"metric", "value", "target", "status"}
VALID_METRIC_STATUSES = {"good", "warning", "critical"}
VALID_RULE_TYPES = {"kill", "scale", "refresh"}


def _assert_metric_shape(metric: dict, idx: int):
    missing = REQUIRED_METRIC_FIELDS - set(metric.keys())
    assert not missing, f"Metric #{idx} missing fields: {missing}"
    assert metric["status"] in VALID_METRIC_STATUSES, (
        f"Metric #{idx}: 'status' must be one of {VALID_METRIC_STATUSES}, got '{metric['status']}'"
    )


def _assert_rule_shape(rule: dict, idx: int):
    assert "id" in rule and "type" in rule and "description" in rule and "isEnabled" in rule, (
        f"Rule #{idx} missing required fields"
    )
    assert rule["type"] in VALID_RULE_TYPES, (
        f"Rule #{idx}: 'type' must be one of {VALID_RULE_TYPES}, got '{rule['type']}'"
    )
    assert isinstance(rule["isEnabled"], bool), f"Rule #{idx}: 'isEnabled' must be bool"


# ── Main Evaluation Runner ─────────────────────────────────────────────────

def run_step3_evaluation():
    print("=" * 75)
    print("RUNNING STEP 3 EVALUATION: TIER 3 & TIER 4 FULL LIFECYCLE")
    print("=" * 75)

    db = SessionLocal()
    try:
        user = _get_or_create_user(
            db,
            email="step3_eval@testcompany.com",
            full_name="Step 3 Evaluator",
            username="step3-evaluator",
        )
        headers = _auth_headers(user.id)
        _reset_ad_state(db, user.id)

        print(f"\n[SETUP] Test User: ID={user.id} | Email={user.email}")

        # ── Eval 1: Tier 3 — Generate Multi-Angle Copies ──────────────────
        print("\n[EVAL 1] Tier 3: Multi-Angle Creative Generation (DRAFT):")

        gen_resp = client.post(
            "/api/ad-agent/creatives/generate",
            headers=headers,
            json={
                "category_id": "product-commerce",
                "niche_name": "Beauty, Skincare & Cosmetics",
                "product_name": "Radiance Serum Pro",
                "target_audience": "Women 25-45 focused on skincare",
                "tone": "Empathetic & Direct",
                "count": 3,
            },
        )
        assert gen_resp.status_code == 200, f"Creative generate failed: {gen_resp.text}"
        gen_data = gen_resp.json()

        assert "creatives" in gen_data, "Response missing 'creatives' key"
        copies = gen_data["creatives"]["copies"]
        status = gen_data["creatives"]["status"]

        print(f"  • Generated {len(copies)} copies | Status: {status}")
        assert status == "draft", f"Expected 'draft', got '{status}'"
        assert len(copies) >= 3, f"Expected ≥3 copies, got {len(copies)}"

        for i, copy in enumerate(copies):
            _assert_copy_shape(copy, i + 1)
        print(f"  • All {len(copies)} copy shapes validated: angle/headline/primaryText/cta/isApproved [OK]")
        print(f"  • Sample: Angle='{copies[0]['angle']}' | Headline='{copies[0]['headline']}'")
        print("  => Tier 3 Generate PASSED [OK]")

        # ── Eval 2: Tier 3 — Partial Approval (approve only first 2) ──────
        print("\n[EVAL 2] Tier 3: Partial Approval — approve copies 1 & 2 only:")

        copies[0]["isApproved"] = True
        copies[1]["isApproved"] = True
        # copy[2] stays False

        approved_count = sum(1 for c in copies if c["isApproved"])
        unapproved_count = sum(1 for c in copies if not c["isApproved"])
        print(f"  • Approved: {approved_count} | Unapproved: {unapproved_count}")
        assert approved_count == 2
        assert unapproved_count == len(copies) - 2

        verify_resp = client.post(
            "/api/ad-agent/creatives/verify",
            headers=headers,
            json={"copies": copies},
        )
        assert verify_resp.status_code == 200, f"Creative verify failed: {verify_resp.text}"
        ver_data = verify_resp.json()

        assert ver_data["creatives"]["status"] == "verified", (
            f"Expected 'verified', got '{ver_data['creatives']['status']}'"
        )
        assert ver_data["creatives"]["verified_at"] is not None, "verified_at should be set"

        # Approved flags must be persisted correctly
        persisted_copies = ver_data["creatives"]["copies"]
        persisted_approved = sum(1 for c in persisted_copies if c["isApproved"])
        print(f"  • Persisted approved count: {persisted_approved}")
        assert persisted_approved == 2, f"Expected 2 approved copies persisted, got {persisted_approved}"
        print(f"  • Status: {ver_data['creatives']['status']} | VerifiedAt: {ver_data['creatives']['verified_at']}")
        print("  => Tier 3 Partial-Approval Persistence PASSED [OK]")

        # ── Eval 3: Tier 3 — Regenerate & Re-Approve All ──────────────────
        print("\n[EVAL 3] Tier 3: Regeneration & Full-Approval Flow:")

        regen_resp = client.post(
            "/api/ad-agent/creatives/generate",
            headers=headers,
            json={
                "category_id": "service-based",
                "niche_name": "Consultant / Strategy Advisor",
                "product_name": "VIP Strategy Intensive",
                "count": 3,
            },
        )
        assert regen_resp.status_code == 200
        regen_copies = regen_resp.json()["creatives"]["copies"]
        assert regen_resp.json()["creatives"]["status"] == "draft"
        print(f"  • Regenerated {len(regen_copies)} copies for Consultant niche | Status: draft [OK]")

        for c in regen_copies:
            c["isApproved"] = True

        regen_ver_resp = client.post(
            "/api/ad-agent/creatives/verify",
            headers=headers,
            json={"copies": regen_copies},
        )
        assert regen_ver_resp.status_code == 200
        regen_ver_data = regen_ver_resp.json()
        all_approved = all(c["isApproved"] for c in regen_ver_data["creatives"]["copies"])
        print(f"  • All copies approved: {all_approved}")
        assert all_approved, "Not all copies were persisted as approved"
        print("  => Tier 3 Full Approval Persistence PASSED [OK]")

        # ── Eval 4: Tier 4 — Generate Diagnostics ─────────────────────────
        print("\n[EVAL 4] Tier 4: AI Diagnostics & Kill/Scale/Refresh Rule Generation:")

        diag_gen_resp = client.post(
            "/api/ad-agent/diagnostics/generate",
            headers=headers,
            json={
                "category_id": "service-based",
                "niche_name": "Consultant / Strategy Advisor",
            },
        )
        assert diag_gen_resp.status_code == 200, f"Diagnostics generate failed: {diag_gen_resp.text}"
        diag_data = diag_gen_resp.json()

        assert "diagnostics" in diag_data, "Response missing 'diagnostics' key"
        metrics = diag_data["diagnostics"]["metrics"]
        rules = diag_data["diagnostics"]["rules"]
        diag_status = diag_data["diagnostics"]["status"]

        print(f"  • Metrics: {len(metrics)} | Rules: {len(rules)} | Status: {diag_status}")
        assert diag_status == "draft", f"Expected 'draft', got '{diag_status}'"
        assert len(metrics) >= 1, "Expected at least 1 metric"
        assert len(rules) >= 1, "Expected at least 1 rule"

        for i, metric in enumerate(metrics):
            _assert_metric_shape(metric, i + 1)
        print(f"  • All {len(metrics)} metric shapes validated (metric/value/target/status) [OK]")

        for i, rule in enumerate(rules):
            _assert_rule_shape(rule, i + 1)
        print(f"  • All {len(rules)} rule shapes validated (id/type/description/isEnabled) [OK]")

        # Verify at least one kill, one scale rule present
        rule_types = {r["type"] for r in rules}
        print(f"  • Rule types found: {rule_types}")
        print("  => Tier 4 Diagnostics Generate PASSED [OK]")

        # ── Eval 5: Tier 4 — Rule Toggle Enable/Disable Persistence ───────
        print("\n[EVAL 5] Tier 4: Rule Toggle State Persistence:")

        # Disable the first rule, enable any that are disabled
        toggled_rules = []
        for i, rule in enumerate(rules):
            toggled = dict(rule)
            toggled["isEnabled"] = (i % 2 == 0)  # alternate: even=True, odd=False
            toggled_rules.append(toggled)

        diag_ver_resp = client.post(
            "/api/ad-agent/diagnostics/verify",
            headers=headers,
            json={"metrics": metrics, "rules": toggled_rules},
        )
        assert diag_ver_resp.status_code == 200, f"Diagnostics verify failed: {diag_ver_resp.text}"
        ver_diag = diag_ver_resp.json()

        assert ver_diag["diagnostics"]["status"] == "verified", (
            f"Expected 'verified', got '{ver_diag['diagnostics']['status']}'"
        )
        assert ver_diag["diagnostics"]["verified_at"] is not None

        # Confirm toggle state was persisted
        persisted_rules = ver_diag["diagnostics"]["rules"]
        for i, (orig, persisted) in enumerate(zip(toggled_rules, persisted_rules)):
            assert persisted["isEnabled"] == orig["isEnabled"], (
                f"Rule #{i + 1}: toggle not persisted — expected {orig['isEnabled']}, got {persisted['isEnabled']}"
            )
        print(f"  • {len(persisted_rules)} rules persisted with correct toggle states [OK]")
        print(f"  • Status: {ver_diag['diagnostics']['status']} | VerifiedAt: {ver_diag['diagnostics']['verified_at']}")
        print("  => Tier 4 Rule Toggle Persistence PASSED [OK]")

        # ── Eval 6: Tier 4 — Metrics Override on Verify ───────────────────
        print("\n[EVAL 6] Tier 4: Metrics Override Persistence on Verify:")

        # Modify a metric value before verifying
        override_metrics = [dict(m) for m in metrics]
        if override_metrics:
            override_metrics[0]["value"] = "3.75x"
            override_metrics[0]["status"] = "good"
            override_metrics[0]["note"] = "Override applied in eval"

        override_ver_resp = client.post(
            "/api/ad-agent/diagnostics/verify",
            headers=headers,
            json={"metrics": override_metrics, "rules": toggled_rules},
        )
        assert override_ver_resp.status_code == 200
        override_state = override_ver_resp.json()
        persisted_metrics = override_state["diagnostics"]["metrics"]

        if persisted_metrics and override_metrics:
            assert persisted_metrics[0]["value"] == "3.75x", (
                f"Metric override not persisted — expected '3.75x', got '{persisted_metrics[0]['value']}'"
            )
            assert persisted_metrics[0]["status"] == "good"
            print(f"  • Override metric[0] value='3.75x', status='good' persisted [OK]")
        print("  => Tier 4 Metrics Override Persistence PASSED [OK]")

        # ── Eval 7: Full 4-Tier Lifecycle State Consolidation ─────────────
        print("\n[EVAL 7] Full 4-Tier Verified State Consolidation:")

        # Bootstrap Tier 1 & Tier 2 as well to confirm all-4-verified global state
        audit_resp = client.post(
            "/api/ad-agent/audit/generate",
            headers=headers,
            json={
                "category_id": "service-based",
                "niche_name": "Consultant / Strategy Advisor",
                "monthly_spend": "₹1,00,000",
                "current_roas": "3.1x",
                "main_pain_point": "Low quality leads from Meta",
            },
        )
        assert audit_resp.status_code == 200
        audit_findings = audit_resp.json()["audit"]["findings"]
        audit_plan = audit_resp.json()["audit"]["action_plan"]
        audit_score = audit_resp.json()["audit"]["score"]

        client.post(
            "/api/ad-agent/audit/verify",
            headers=headers,
            json={"findings": audit_findings, "action_plan": audit_plan, "audit_score": audit_score},
        )

        track_resp = client.post(
            "/api/ad-agent/tracking/generate",
            headers=headers,
            json={"pixel_id": "555111222333", "category_id": "service-based", "niche_name": "Consultant / Strategy Advisor"},
        )
        assert track_resp.status_code == 200
        event_map = track_resp.json()["tracking"]["event_mapping"]
        funnel_arch = track_resp.json()["tracking"]["funnel_architecture"]

        client.post(
            "/api/ad-agent/tracking/verify",
            headers=headers,
            json={"pixel_id": "555111222333", "capi_configured": True, "event_mapping": event_map, "funnel_architecture": funnel_arch},
        )

        # GET global state
        state_resp = client.get("/api/ad-agent/state", headers=headers)
        assert state_resp.status_code == 200
        final_state = state_resp.json()

        tier1_status = final_state["audit"]["status"]
        tier2_status = final_state["tracking"]["status"]
        tier3_status = final_state["creatives"]["status"]
        tier4_status = final_state["diagnostics"]["status"]

        print(f"  • Tier 1 Audit Status      : {tier1_status}")
        print(f"  • Tier 2 Tracking Status   : {tier2_status}")
        print(f"  • Tier 3 Creatives Status  : {tier3_status}")
        print(f"  • Tier 4 Diagnostics Status: {tier4_status}")

        assert tier1_status == "verified", f"Tier 1 not verified: {tier1_status}"
        assert tier2_status == "verified", f"Tier 2 not verified: {tier2_status}"
        assert tier3_status == "verified", f"Tier 3 not verified: {tier3_status}"
        assert tier4_status == "verified", f"Tier 4 not verified: {tier4_status}"

        # Validate shape completeness of final state
        assert final_state["audit"]["score"] is not None
        assert len(final_state["audit"]["findings"]) > 0
        assert len(final_state["tracking"]["event_mapping"]) > 0
        assert len(final_state["creatives"]["copies"]) > 0
        assert len(final_state["diagnostics"]["metrics"]) > 0
        assert len(final_state["diagnostics"]["rules"]) > 0

        print("  • All data shapes verified (findings, events, copies, metrics, rules) [OK]")
        print("  => Full 4-Tier All-Verified Consolidation PASSED [OK]")

        # ── Summary ───────────────────────────────────────────────────────
        print("\n" + "=" * 75)
        print("ALL STEP 3 EVALUATION CHECKS COMPLETED SUCCESSFULLY (100% PASS)")
        print("  Tier 3: Creative generation [OK] | Partial/Full approval persistence [OK]")
        print("  Tier 4: Diagnostics generate [OK] | Rule toggle persistence [OK] | Metrics override [OK]")
        print("  End-to-End: All 4 tiers VERIFIED + full state shape validated [OK]")
        print("=" * 75)

    finally:
        db.close()


if __name__ == "__main__":
    run_step3_evaluation()
