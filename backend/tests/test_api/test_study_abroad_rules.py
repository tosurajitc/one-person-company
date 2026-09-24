"""Unit tests for study_abroad_rules (pure functions; no database)."""
from datetime import date

from app.services import study_abroad_rules as r

TODAY = date(2026, 9, 24)


def good_td():
    return {
        "practice": {"type": "education"},
        "credentials": [{"kind": "membership", "issuing_body": "Sample Body", "number": "S-1"}],
        "policies": {
            "privacy": {"body": "x"},
            "refund": {"body": "x"},
            "cancellation": {"body": "x"},
            "grievance": {"email": "g@example.com"},
        },
        "destinations": [{"country_code": "CA", "last_verified": "2026-08-20"}],
    }


# ---- honesty rules -------------------------------------------------------
def test_flags_promised_outcomes():
    for text in ["We offer guaranteed PR for all clients", "100% visa success", "Guaranteed admission at top colleges",
                 "sure-shot visa", "Your visa is guaranteed", "we promise you admission"]:
        assert r.find_banned_phrases(text), text


def test_allows_negated_and_question_forms():
    assert r.find_banned_phrases("We do not guarantee admission or a visa.") == []
    assert r.find_banned_phrases("Can you promise admission or a visa?") == []
    assert r.find_banned_phrases("No one can guarantee a visa outcome.") == []


# ---- submission validation ----------------------------------------------
def test_submission_requires_fields_and_valid_type():
    td = good_td()
    clean, custom, errors = r.validate_submission(td, "nope", None, {}, {})
    assert errors["type"]
    assert errors["full_name"] and errors["email"] and errors["phone"] and errors["target_countries"]


def test_submission_ok_and_drops_unknown_keys():
    td = good_td()
    profile = {"full_name": "A B", "email": "a@b.co", "phone": "+91 99999 99999", "target_countries": ["CA"],
               "passport_number": "X1234567", "date_of_birth": "2000-01-01"}
    clean, custom, errors = r.validate_submission(td, "discovery", "phone", profile, {"x_unknown": "1"})
    assert errors == {}
    assert "passport_number" not in clean
    assert "date_of_birth" not in clean  # disabled by default
    assert custom == {}


def test_custom_fields_defined_by_site_only_and_conditional():
    td = good_td()
    td["prescreen"] = {"custom_fields": [
        {"key": "x_src", "label": "Source", "type": "select", "options": ["A", "B"], "required": True},
        {"key": "x_ca", "label": "Programme", "type": "text", "show_when": {"field": "target_countries", "includes": "CA"}, "required": True},
    ]}
    base = {"full_name": "A B", "email": "a@b.co", "phone": "+91 99999 99999", "target_countries": ["AU"]}
    _, custom, errors = r.validate_submission(td, "discovery", "phone", base, {"x_src": "A", "x_ca": "ignored"})
    assert errors == {} and custom == {"x_src": "A"}  # x_ca hidden when country is not CA
    base["target_countries"] = ["CA"]
    _, _, errors = r.validate_submission(td, "discovery", "phone", base, {"x_src": "A"})
    assert "x_ca" in errors


def test_mode_must_be_offered():
    td = good_td()
    base = {"full_name": "A B", "email": "a@b.co", "phone": "+91 99999 99999", "target_countries": ["CA"]}
    _, _, errors = r.validate_submission(td, "discovery", "office", base, {})
    assert "mode" in errors


# ---- custom field definitions -------------------------------------------
def test_blocklist_applies_to_free_entry_only():
    bad = [{"key": "x_pp", "label": "Passport number", "type": "text"}]
    ok = [{"key": "x_pp", "label": "I hold a valid passport", "type": "checkbox"}]
    assert r.validate_custom_field_defs(bad)
    assert r.validate_custom_field_defs(ok) == []


def test_custom_field_limits():
    many = [{"key": f"x_{i}", "label": "q", "type": "text"} for i in range(13)]
    assert any("at most" in e["message"] for e in r.validate_custom_field_defs(many))
    assert r.validate_custom_field_defs([{"key": "email", "label": "q", "type": "text"}])  # missing x_ prefix


# ---- template_data validation -------------------------------------------
def test_good_template_passes():
    res = r.validate_template_data(good_td(), TODAY)
    assert res["errors"] == []


def test_credentials_required_and_migration_rules():
    td = good_td()
    td["credentials"] = []
    assert any(e["path"] == "credentials" for e in r.validate_template_data(td, TODAY)["errors"])
    td = good_td()
    td["practice"] = {"type": "education_and_migration"}
    paths = [e["path"] for e in r.validate_template_data(td, TODAY)["errors"]]
    assert "practice.authorisation_statement" in paths and "credentials" in paths


def test_stale_destination_warns_and_missing_date_errors():
    td = good_td()
    td["destinations"] = [{"country_code": "DE", "last_verified": "2026-01-10"}, {"country_code": "FR"}]
    res = r.validate_template_data(td, TODAY)
    assert any(w["path"] == "destinations[0].last_verified" for w in res["warnings"])
    assert any(e["path"] == "destinations[1].last_verified" for e in res["errors"])


def test_story_without_consent_warns_and_with_consent_needs_scope():
    td = good_td()
    td["success_stories"] = [{"consent_confirmed": False}, {"consent_confirmed": True}]
    res = r.validate_template_data(td, TODAY)
    assert any(w["path"] == "success_stories[0]" for w in res["warnings"])
    assert any(e["path"] == "success_stories[1].consent_date" for e in res["errors"])
    assert any(e["path"] == "success_stories[1].consent_scope" for e in res["errors"])


def test_banned_phrase_blocks_publish_and_webhook_must_be_https():
    td = good_td()
    td["destinations"][0]["headline"] = "Guaranteed admission every year"
    td["integrations"] = {"webhook_url": "http://insecure.example"}
    paths = [e["path"] for e in r.validate_template_data(td, TODAY)["errors"]]
    assert "destinations[0].headline" in paths and "integrations.webhook_url" in paths


def test_destination_image_url_must_be_https_or_single_slash_path():
    td = good_td()
    for bad in ("//evil.example/x.jpg", "javascript:alert(1)", "http://insecure.example/x.jpg", "ca.jpg"):
        td["destinations"][0]["image_url"] = bad
        assert any(e["path"] == "destinations[0].image_url" for e in r.validate_template_data(td, TODAY)["errors"]), bad
    for ok in ("", "/templates/study-migration/ca.jpg", "https://cdn.example.com/ca.jpg"):
        td["destinations"][0]["image_url"] = ok
        assert not any(e["path"] == "destinations[0].image_url" for e in r.validate_template_data(td, TODAY)["errors"]), ok


def test_adviser_photo_url_validated_via_business_block():
    for bad in ("//evil.example/a.jpg", "javascript:alert(1)", "http://insecure.example/a.jpg", "a.jpg"):
        errs = r.validate_template_data(good_td(), TODAY, {"founder_photo_url": bad})["errors"]
        assert any(e["path"] == "business.founder_photo_url" for e in errs), bad
    for ok in ("", "/templates/study-migration/anita.jpg", "https://cdn.example.com/anita.jpg"):
        errs = r.validate_template_data(good_td(), TODAY, {"founder_photo_url": ok})["errors"]
        assert not any(e["path"] == "business.founder_photo_url" for e in errs), ok
    assert r.validate_template_data(good_td(), TODAY)["errors"] == []  # business is optional
