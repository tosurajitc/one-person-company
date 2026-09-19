"""
Tests for genie_routes.py

These tests replace (monkeypatch) the Groq call itself, so they need no
GROQ_API_KEY and no network access. They use an in-memory SQLite database
only for the "saved" behavior tests (logged-in callers), and never touch
your real PostgreSQL database.

Run with:
    pytest tests\\test_api\\test_genie_routes.py -v
"""

import asyncio

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.types import JSON
from fastapi import HTTPException

from app.core.database import Base
from app.models.user import User
from app.models.user_site_settings import UserSiteSettings
# Not used directly by these tests, but importing it registers the
# founder_sites table with SQLAlchemy's shared metadata. Without this,
# create_all() fails with NoReferencedTableError, because the Offer model
# (imported elsewhere in your app, e.g. via conftest.py) has a foreign key
# to founder_sites.id, and SQLAlchemy can only resolve that FK if the
# FounderSite model has been imported somewhere in the same process.
import app.models.founder_site  # noqa: F401
from app.api.routes import genie_routes
from app.api.routes.genie_routes import (
    intake,
    draft_site,
    IntakeRequest,
    DraftSiteRequest,
    _get_nested,
    _confirmation_and_followups,
)


@compiles(JSONB, "sqlite")
def _compile_jsonb_sqlite(element, compiler, **kw):
    return compiler.visit_JSON(JSON(), **kw)


class FakeRequest:
    def __init__(self):
        self.headers = {}
        self.cookies = {}


def run(coro):
    return asyncio.run(coro)


@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


@pytest.fixture
def jane(db_session):
    user = User(email="jane@example.com", full_name="Jane Doe", username="jane-doe")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def real_intake_body(**overrides):
    """A request shaped exactly like the real AI Website Builder page sends."""
    base = dict(
        schemaVersion="2.0",
        start={"businessType": "consulting", "market": "india", "language": "en"},
        basics={"ownerName": "Jane Doe", "brandName": "Jane Doe Consulting", "email": "jane@example.com", "whatsapp": ""},
        answers={
            "whatAndWho": "I'm a CA in Kolkata. I help freelancers with GST and income tax.",
            "problem": "They miss GST deadlines and get surprise tax bills.",
            "result": "Clean books, every return filed on time.",
        },
        links={"website": "", "linkedin": "https://linkedin.com/in/janedoe", "instagram": "", "other": ""},
        pastedMaterial="",
        description="I'm a CA in Kolkata. They miss GST deadlines. Clean books, filed on time.",
    )
    base.update(overrides)
    return IntakeRequest(**base)


# ---------------------------------------------------------------------------
# _get_nested / _confirmation_and_followups -- unchanged logic, still correct
# ---------------------------------------------------------------------------

def test_get_nested_reads_simple_path():
    assert _get_nested({"positioning": {"buyer": "freelancers"}}, "positioning.buyer") == "freelancers"


def test_get_nested_reads_list_index():
    data = {"offers": {"tiers": [{"name": "Tax Check"}]}}
    assert _get_nested(data, "offers.tiers.0.name") == "Tax Check"


def test_filled_critical_fields_need_confirmation():
    prefill = {
        "positioning": {"buyer": "freelancers", "problem": "messy books", "outcome": "clean books"},
        "offers": {"tiers": [{"name": "Tax Health Check"}]},
    }
    needs_confirmation, follow_ups = _confirmation_and_followups(prefill)
    assert set(needs_confirmation) == {
        "positioning.buyer", "positioning.problem", "positioning.outcome", "offers.tiers.0.name",
    }
    assert follow_ups == []


def test_missing_critical_fields_become_followups():
    prefill = {"positioning": {"buyer": "freelancers"}}
    needs_confirmation, follow_ups = _confirmation_and_followups(prefill)
    assert needs_confirmation == ["positioning.buyer"]
    assert len(follow_ups) == 3


# ---------------------------------------------------------------------------
# /genie/intake -- request validation
# ---------------------------------------------------------------------------

def test_intake_requires_groq_key(monkeypatch, db_session):
    monkeypatch.setattr(genie_routes.settings, "GROQ_API_KEY", "")
    body = real_intake_body()
    with pytest.raises(HTTPException) as exc_info:
        run(intake(body, FakeRequest(), db_session, current_user=None))
    assert exc_info.value.status_code == 503


def test_intake_requires_some_input(monkeypatch, db_session):
    monkeypatch.setattr(genie_routes.settings, "GROQ_API_KEY", "fake-key-for-test")
    body = IntakeRequest()  # everything blank
    with pytest.raises(HTTPException) as exc_info:
        run(intake(body, FakeRequest(), db_session, current_user=None))
    assert exc_info.value.status_code == 422


def test_intake_rejects_oversized_input(monkeypatch, db_session):
    monkeypatch.setattr(genie_routes.settings, "GROQ_API_KEY", "fake-key-for-test")
    body = real_intake_body(pastedMaterial="x" * 8001)
    with pytest.raises(HTTPException) as exc_info:
        run(intake(body, FakeRequest(), db_session, current_user=None))
    assert exc_info.value.status_code == 422


# ---------------------------------------------------------------------------
# /genie/intake -- happy path, matching the real request/response contract
# ---------------------------------------------------------------------------

def test_intake_anonymous_caller_gets_saved_false(monkeypatch, db_session):
    monkeypatch.setattr(genie_routes.settings, "GROQ_API_KEY", "fake-key-for-test")

    async def fake_groq_call(description: str):
        assert "whatAndWho" in description  # confirms answers made it into the composed text
        return {
            "positioning": {"buyer": "freelancers", "problem": "missed deadlines", "outcome": "clean books"},
            "offers": {"tiers": [{"tier": "core", "name": "GST Filing"}]},
        }

    import app.api.routes.chat_routes as chat_routes
    monkeypatch.setattr(chat_routes, "_call_groq_prefill_async", fake_groq_call)

    resp = run(intake(real_intake_body(), FakeRequest(), db_session, current_user=None))

    assert resp.prefill["positioning"]["buyer"] == "freelancers"
    assert "positioning.buyer" in resp.needsConfirmation
    assert resp.saved is False  # no logged-in user, matching old /api/chat/prefill (guest) behavior


def test_intake_logged_in_caller_gets_saved_true(monkeypatch, db_session, jane):
    monkeypatch.setattr(genie_routes.settings, "GROQ_API_KEY", "fake-key-for-test")

    async def fake_groq_call(description: str):
        return {"positioning": {"buyer": "freelancers", "problem": "x", "outcome": "y"}}

    import app.api.routes.chat_routes as chat_routes
    monkeypatch.setattr(chat_routes, "_call_groq_prefill_async", fake_groq_call)

    resp = run(intake(real_intake_body(), FakeRequest(), db_session, current_user=jane))

    assert resp.saved is True  # matching old /api/chat/prefill-and-save behavior

    row = (
        db_session.query(UserSiteSettings)
        .filter(UserSiteSettings.user_id == jane.id, UserSiteSettings.key == "genie_intake_draft")
        .first()
    )
    assert row is not None
    assert row.value["positioning"]["buyer"] == "freelancers"


def test_intake_links_dict_shape_is_accepted(monkeypatch, db_session):
    """Confirms the fix for the real contract: links is a dict of named
    fields (website/linkedin/instagram/other), not a list."""
    monkeypatch.setattr(genie_routes.settings, "GROQ_API_KEY", "fake-key-for-test")

    async def fake_groq_call(description: str):
        assert "linkedin.com" in description
        return {"positioning": {}}

    import app.api.routes.chat_routes as chat_routes
    monkeypatch.setattr(chat_routes, "_call_groq_prefill_async", fake_groq_call)

    body = real_intake_body(links={"website": "", "linkedin": "https://linkedin.com/in/janedoe", "instagram": "", "other": ""})
    resp = run(intake(body, FakeRequest(), db_session, current_user=None))
    assert resp.saved is False


def test_intake_handles_groq_failure_gracefully(monkeypatch, db_session):
    monkeypatch.setattr(genie_routes.settings, "GROQ_API_KEY", "fake-key-for-test")

    async def failing_groq_call(description: str):
        raise RuntimeError("Groq API is down")

    import app.api.routes.chat_routes as chat_routes
    monkeypatch.setattr(chat_routes, "_call_groq_prefill_async", failing_groq_call)

    with pytest.raises(HTTPException) as exc_info:
        run(intake(real_intake_body(), FakeRequest(), db_session, current_user=None))
    assert exc_info.value.status_code == 502


# ---------------------------------------------------------------------------
# /genie/draft-site -- confirm the existing endpoint still works unchanged
# ---------------------------------------------------------------------------

def test_draft_site_still_works_after_json_import_cleanup(monkeypatch):
    monkeypatch.setattr(genie_routes.settings, "GROQ_API_KEY", "fake-key-for-test")

    async def fake_groq_call(description: str):
        return {"start": {}, "positioning": {"buyer": "freelancers"}}

    import app.api.routes.chat_routes as chat_routes
    monkeypatch.setattr(chat_routes, "_call_groq_prefill_async", fake_groq_call)

    body = DraftSiteRequest(start={"description": "I run a small bakery"})
    resp = run(draft_site(body, FakeRequest()))

    assert resp["start"]["description"] == "I run a small bakery"
    assert resp["positioning"]["buyer"] == "freelancers"