"""
Tests for offer_sync_service.py

Uses an in-memory SQLite database. Does not touch your real PostgreSQL
database.

Run with:
    pytest tests\\test_services\\test_offer_sync_service.py -v
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.types import JSON
import pytest

from app.core.database import Base
from app.models.user import User
from app.models.offer import Offer, OfferStatus, OfferType
from app.models.founder_site import FounderSite
from app.services.offer_sync_service import sync_offers_from_wizard


@compiles(JSONB, "sqlite")
def _compile_jsonb_sqlite(element, compiler, **kw):
    return compiler.visit_JSON(JSON(), **kw)


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


def two_tiers_payload():
    return {
        "tiers": [
            {
                "tier": "front_door",
                "order": 1,
                "name": "Tax Health Check",
                "slug": "tax-health-check",
                "summary": "A quick review of your filings.",
                "deliverables": ["Review of last 12 months", "Written report"],
                "duration": "1 week",
                "billing": "one_time",
                "prices": {"INR": 4999, "USD": 99},
                "highlight": False,
            },
            {
                "tier": "core",
                "order": 2,
                "name": "GST Setup & First-Year Filing",
                "slug": "gst-setup-first-year-filing",
                "summary": "Full GST setup and filing for your first year.",
                "deliverables": ["GST registration", "Monthly filings"],
                "duration": "4 weeks",
                "billing": "one_time",
                "prices": {"INR": 35000, "USD": 650},
                "highlight": True,
            },
        ],
        "mostBought": "core",
    }


def test_creates_one_offer_per_tier(db_session, jane):
    synced = sync_offers_from_wizard(db_session, jane, two_tiers_payload())
    db_session.commit()

    assert len(synced) == 2
    offers = db_session.query(Offer).filter(Offer.creator_id == jane.id).all()
    assert len(offers) == 2
    tiers = {o.tier for o in offers}
    assert tiers == {"front_door", "core"}


def test_price_and_currency_prefer_inr(db_session, jane):
    sync_offers_from_wizard(db_session, jane, two_tiers_payload())
    db_session.commit()

    core = db_session.query(Offer).filter(Offer.creator_id == jane.id, Offer.tier == "core").first()
    assert float(core.price) == 35000.0
    assert core.currency == "INR"
    assert float(core.price_usd) == 650.0


def test_usd_only_tier_uses_usd_as_primary(db_session, jane):
    payload = {
        "tiers": [
            {
                "tier": "front_door",
                "order": 1,
                "name": "Global Strategy Call",
                "slug": "global-strategy-call",
                "summary": "A focused strategy session.",
                "deliverables": ["60-minute call"],
                "duration": "60 minutes",
                "billing": "one_time",
                "prices": {"USD": 99},
                "highlight": False,
            }
        ]
    }
    sync_offers_from_wizard(db_session, jane, payload)
    db_session.commit()

    offer = db_session.query(Offer).filter(Offer.creator_id == jane.id).first()
    assert offer.currency == "USD"
    assert float(offer.price) == 99.0
    assert float(offer.price_usd) == 99.0


def test_highlight_maps_to_is_highlighted(db_session, jane):
    sync_offers_from_wizard(db_session, jane, two_tiers_payload())
    db_session.commit()

    front_door = db_session.query(Offer).filter(Offer.creator_id == jane.id, Offer.tier == "front_door").first()
    core = db_session.query(Offer).filter(Offer.creator_id == jane.id, Offer.tier == "core").first()
    assert front_door.is_highlighted is False
    assert core.is_highlighted is True


def test_resubmitting_updates_the_same_row_not_a_new_one(db_session, jane):
    sync_offers_from_wizard(db_session, jane, two_tiers_payload())
    db_session.commit()
    first_count = db_session.query(Offer).filter(Offer.creator_id == jane.id).count()

    # Founder edits the price and re-submits the wizard.
    updated_payload = two_tiers_payload()
    updated_payload["tiers"][1]["prices"]["INR"] = 40000

    sync_offers_from_wizard(db_session, jane, updated_payload)
    db_session.commit()

    second_count = db_session.query(Offer).filter(Offer.creator_id == jane.id).count()
    assert second_count == first_count  # no duplicate row created

    core = db_session.query(Offer).filter(Offer.creator_id == jane.id, Offer.tier == "core").first()
    assert float(core.price) == 40000.0


def test_removing_a_tier_from_the_wizard_does_not_delete_its_offer(db_session, jane):
    sync_offers_from_wizard(db_session, jane, two_tiers_payload())
    db_session.commit()

    # Founder removes the "front_door" tier by clearing its name -- the
    # wizard would normally filter this out before sending the payload,
    # so only "core" arrives this time.
    only_core_payload = {"tiers": [two_tiers_payload()["tiers"][1]]}
    sync_offers_from_wizard(db_session, jane, only_core_payload)
    db_session.commit()

    offers = db_session.query(Offer).filter(Offer.creator_id == jane.id).all()
    tiers = {o.tier for o in offers}
    # front_door's old Offer row must still exist -- never silently deleted.
    assert tiers == {"front_door", "core"}


def test_founder_site_link_is_set_when_provided(db_session, jane):
    site = FounderSite(user_id=jane.id, slug="jane-studio")
    db_session.add(site)
    db_session.commit()
    db_session.refresh(site)

    sync_offers_from_wizard(db_session, jane, two_tiers_payload(), founder_site=site)
    db_session.commit()

    offers = db_session.query(Offer).filter(Offer.creator_id == jane.id).all()
    assert all(o.founder_site_id == site.id for o in offers)


def test_unnamed_tier_is_skipped(db_session, jane):
    payload = {
        "tiers": [
            {"tier": "recurring", "order": 3, "name": "", "prices": {}},
        ]
    }
    synced = sync_offers_from_wizard(db_session, jane, payload)
    db_session.commit()

    assert synced == []
    assert db_session.query(Offer).filter(Offer.creator_id == jane.id).count() == 0