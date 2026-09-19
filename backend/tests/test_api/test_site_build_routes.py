"""
Tests for site_build_routes.py

These tests use an in-memory SQLite database and replace (monkeypatch)
AuthService.get_user_from_token for the duration of each test, so they
never touch your real PostgreSQL database and never need a real JWT.
They call build_site() directly (the same function FastAPI calls),
wrapped in asyncio.run() since build_site is an async function and this
project does not have the pytest-asyncio plugin installed.

Run with:
    pytest tests\\test_api\\test_site_build_routes.py -v
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
from app.models.founder_site import FounderSite, FounderSiteSlugHistory
from app.core.auth import AuthService
from app.models.offer import Offer
from app.api.routes.site_build_routes import build_site, BuildRequest


# SQLite does not know Postgres's JSONB type. This teaches the *test*
# database to treat it as plain JSON -- your real Postgres database is
# untouched and keeps using real JSONB.
@compiles(JSONB, "sqlite")
def _compile_jsonb_sqlite(element, compiler, **kw):
    return compiler.visit_JSON(JSON(), **kw)


class FakeRequest:
    """Stands in for FastAPI's Request, just enough for _get_current_user_required."""
    def __init__(self, token=None):
        self.headers = {"Authorization": f"Bearer {token}"} if token else {}
        self.cookies = {}


def make_body(subdomain, brand="Jane's Studio", theme=None, offers=None):
    site = {"subdomain": subdomain}
    if theme:
        site["theme"] = theme
    return BuildRequest(site=site, business={"brandName": brand}, offers=offers or {})


def one_tier_offers(price_inr=4999):
    return {
        "tiers": [
            {
                "tier": "front_door",
                "order": 1,
                "name": "Tax Health Check",
                "slug": "tax-health-check",
                "summary": "A quick review.",
                "deliverables": ["Review", "Report"],
                "duration": "1 week",
                "billing": "one_time",
                "prices": {"INR": price_inr},
                "highlight": False,
            }
        ]
    }


def run_build(body, request, db):
    """Small helper so tests don't repeat asyncio.run(...) everywhere."""
    return asyncio.run(build_site(body, request, db))


@pytest.fixture
def db_session():
    """A fresh in-memory database for each test."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


@pytest.fixture
def jane_and_bob(db_session, monkeypatch):
    """
    Two real users, with fake login tokens.

    This replaces AuthService.get_user_from_token for the duration of the
    test only (monkeypatch automatically restores the real method
    afterwards), so it works no matter how your real AuthService does its
    JWT decoding -- the test never sends it a real token.
    """
    jane = User(email="jane@example.com", full_name="Jane Doe", username="jane-doe")
    bob = User(email="bob@example.com", full_name="Bob Roe", username="bob-roe")
    db_session.add_all([jane, bob])
    db_session.commit()
    db_session.refresh(jane)
    db_session.refresh(bob)

    token_to_user = {
        "jane-token": jane,
        "bob-token": bob,
    }

    def fake_get_user_from_token(token, db):
        return token_to_user.get(token)

    monkeypatch.setattr(AuthService, "get_user_from_token", staticmethod(fake_get_user_from_token))

    return jane, bob


def test_anonymous_request_is_rejected(db_session):
    with pytest.raises(HTTPException) as exc_info:
        run_build(make_body("jane-studio"), FakeRequest(token=None), db_session)
    assert exc_info.value.status_code == 401


def test_reserved_slug_is_rejected(db_session, jane_and_bob):
    with pytest.raises(HTTPException) as exc_info:
        run_build(make_body("admin"), FakeRequest(token="jane-token"), db_session)
    assert exc_info.value.status_code == 422


def test_normal_build_creates_founder_site(db_session, jane_and_bob):
    jane, _ = jane_and_bob
    resp = run_build(make_body("jane-studio", theme="warm"), FakeRequest(token="jane-token"), db_session)
    assert resp.success is True
    assert resp.slug == "jane-studio"

    site = db_session.query(FounderSite).filter(FounderSite.user_id == jane.id).first()
    assert site is not None
    assert site.slug == "jane-studio"
    assert site.theme == "warm"


def test_other_founder_cannot_steal_slug(db_session, jane_and_bob):
    run_build(make_body("jane-studio"), FakeRequest(token="jane-token"), db_session)
    with pytest.raises(HTTPException) as exc_info:
        run_build(make_body("jane-studio"), FakeRequest(token="bob-token"), db_session)
    assert exc_info.value.status_code == 422


def test_rebuild_with_unchanged_slug_succeeds(db_session, jane_and_bob):
    run_build(make_body("jane-studio"), FakeRequest(token="jane-token"), db_session)
    # Rebuilding with the same slug should NOT be blocked as "taken".
    resp = run_build(make_body("jane-studio", brand="Jane's Studio v2"), FakeRequest(token="jane-token"), db_session)
    assert resp.success is True


def test_slug_change_records_history(db_session, jane_and_bob):
    jane, _ = jane_and_bob
    run_build(make_body("jane-studio"), FakeRequest(token="jane-token"), db_session)
    run_build(make_body("jane-new-address"), FakeRequest(token="jane-token"), db_session)

    site = db_session.query(FounderSite).filter(FounderSite.user_id == jane.id).first()
    assert site.slug == "jane-new-address"

    history = db_session.query(FounderSiteSlugHistory).filter(
        FounderSiteSlugHistory.founder_site_id == site.id
    ).all()
    assert len(history) == 1
    assert history[0].old_slug == "jane-studio"


def test_old_slug_stays_blocked_after_change(db_session, jane_and_bob):
    run_build(make_body("jane-studio"), FakeRequest(token="jane-token"), db_session)
    run_build(make_body("jane-new-address"), FakeRequest(token="jane-token"), db_session)

    with pytest.raises(HTTPException) as exc_info:
        run_build(make_body("jane-studio"), FakeRequest(token="bob-token"), db_session)
    assert exc_info.value.status_code == 422


def test_site_build_payload_is_saved(db_session, jane_and_bob):
    jane, _ = jane_and_bob
    run_build(make_body("jane-studio"), FakeRequest(token="jane-token"), db_session)

    keys = {
        row.key for row in db_session.query(UserSiteSettings).filter(UserSiteSettings.user_id == jane.id)
    }
    assert "site_build_payload" in keys


def test_build_creates_offers_from_wizard_tiers(db_session, jane_and_bob):
    """A build with offers.tiers should create real Offer rows, linked to the site."""
    jane, _ = jane_and_bob
    run_build(
        make_body("jane-studio", offers=one_tier_offers()),
        FakeRequest(token="jane-token"),
        db_session,
    )

    site = db_session.query(FounderSite).filter(FounderSite.user_id == jane.id).first()
    offers = db_session.query(Offer).filter(Offer.creator_id == jane.id).all()

    assert len(offers) == 1
    assert offers[0].tier == "front_door"
    assert offers[0].title == "Tax Health Check"
    assert float(offers[0].price) == 4999.0
    # This is the part that needed the db.flush() fix: a brand-new site's
    # id must exist in time for the offer to link to it.
    assert offers[0].founder_site_id == site.id


def test_rebuild_updates_offer_instead_of_duplicating(db_session, jane_and_bob):
    """Resubmitting the wizard with a changed price should update the same
    Offer row, not create a second one -- matching offer_sync_service.py's
    own (creator, tier) matching rule, now proven through the real route."""
    jane, _ = jane_and_bob
    run_build(
        make_body("jane-studio", offers=one_tier_offers(price_inr=4999)),
        FakeRequest(token="jane-token"),
        db_session,
    )
    run_build(
        make_body("jane-studio", offers=one_tier_offers(price_inr=5999)),
        FakeRequest(token="jane-token"),
        db_session,
    )

    offers = db_session.query(Offer).filter(Offer.creator_id == jane.id).all()
    assert len(offers) == 1
    assert float(offers[0].price) == 5999.0