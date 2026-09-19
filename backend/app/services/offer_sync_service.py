"""
offer_sync_service.py

Turns the setup wizard's pricing-ladder tiers (schema 2.0's `offers.tiers`,
built by buildSitePayload() in the wizard) into real Offer rows.

Each wizard tier looks like this once it reaches the backend:

    {
        "tier": "front_door" | "core" | "recurring",
        "order": 1 | 2 | 3,
        "name": "GST Setup & First-Year Filing",
        "slug": "gst-setup-first-year-filing",
        "summary": "The result the client gets.",
        "deliverables": ["Item one", "Item two"],
        "duration": "4 weeks",
        "billing": "one_time" | "monthly",
        "prices": {"INR": 35000, "USD": 650},   # either key may be missing
        "highlight": true | false,               # matches offers.mostBought
    }

Matching rule: one Offer row per (creator, tier). "tier" is the stable key
("front_door" / "core" / "recurring"), not the offer's name or slug, since
a founder can rename or re-price a tier and it should still update the
same row rather than create a duplicate.

Safety rule from the build plan: never delete a paid offer. This service
only ever creates or updates rows for tiers present in the payload -- it
never deletes anything. If a founder clears out a tier in the wizard, its
old Offer row is simply left alone (and stops being updated), rather than
being removed. A separate, deliberate "archive this offer" action would be
needed to actually remove one -- not something a wizard resubmit should
ever do silently.

This file does not commit the database session itself -- the caller
(site_build_routes.py) commits once, alongside founder_sites and
user_site_settings, so a single build either saves everything or nothing.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.models.user import User
from app.models.offer import Offer, OfferStatus, OfferType
from app.models.founder_site import FounderSite


def sync_offers_from_wizard(
    db: Session,
    user: User,
    offers_payload: Dict[str, Any],
    founder_site: Optional[FounderSite] = None,
) -> List[Offer]:
    """
    Create or update one Offer row per named tier in offers_payload["tiers"].

    Does not commit. Returns the list of Offer objects that were created or
    touched, in the same order as the input tiers, so the caller can log or
    inspect them before committing.
    """
    tiers = offers_payload.get("tiers") or []
    synced: List[Offer] = []

    for tier_data in tiers:
        offer = _sync_one_tier(db, user, tier_data, founder_site)
        if offer is not None:
            synced.append(offer)

    return synced


def _sync_one_tier(
    db: Session,
    user: User,
    tier_data: Dict[str, Any],
    founder_site: Optional[FounderSite],
) -> Optional[Offer]:
    tier_key = (tier_data.get("tier") or "").strip()
    name = (tier_data.get("name") or "").strip()

    # The wizard already filters out unnamed tiers before sending the
    # payload, but stay defensive in case this is ever called from
    # somewhere else with raw, unfiltered data.
    if not tier_key or not name:
        return None

    prices = tier_data.get("prices") or {}
    price_inr = prices.get("INR")
    price_usd = prices.get("USD")

    # Offer.price / Offer.currency hold one "primary" price. Prefer INR
    # when both are set, since that matches the wizard's own default
    # market. price_usd is saved separately either way, so a USD figure
    # is never lost even when INR is the primary price.
    if price_inr is not None:
        price = price_inr
        currency = "INR"
    elif price_usd is not None:
        price = price_usd
        currency = "USD"
    else:
        price = None
        currency = "INR"

    existing = (
        db.query(Offer)
        .filter(Offer.creator_id == user.id, Offer.tier == tier_key)
        .first()
    )

    if existing is None:
        existing = Offer(
            creator_id=user.id,
            offer_type=OfferType.SERVICE,
            # Published by default: a tier the founder has actually named
            # and priced in the wizard is meant to be shown once their
            # site goes live, not sit hidden as a draft.
            status=OfferStatus.PUBLISHED,
            tier=tier_key,
        )
        db.add(existing)

    existing.title = name
    existing.instructor = user.full_name
    existing.slug = tier_data.get("slug") or existing.slug
    existing.description = tier_data.get("summary") or None
    existing.duration = tier_data.get("duration") or None
    existing.price = price
    existing.currency = currency
    existing.price_usd = price_usd
    existing.deliverables = tier_data.get("deliverables") or []
    existing.is_highlighted = bool(tier_data.get("highlight"))
    existing.sort_order = tier_data.get("order") or 0

    if founder_site is not None:
        existing.founder_site_id = founder_site.id

    return existing