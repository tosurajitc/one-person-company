"""
reserved_names.py

Purpose
-------
A username and a founder site slug both end up as the first part of a
public URL, for example:

    /jane-doe                (a username, used today by content_routes.py
                               and community_routes.py to find a founder)
    /jane-doe-studio          (a future founder_sites.slug, Phase 1)

If someone were allowed to register the username "admin" or claim the
site slug "pricing", their public page would silently swallow a real
page of the app (/admin, /pricing). This module is the single place
that decides whether a name is safe to hand out. Nothing here talks to
the database by itself except the optional username-uniqueness check;
everything else is a plain, fast, in-memory check.

This file does not change any route yet. It only provides functions
that other files (registration, content_routes.py, site_build_routes.py)
will call in their own follow-up changes.

Where the reserved words below came from
-----------------------------------------
1. Every top-level folder under frontend/app/ in folder_structure.txt
   (these are real Next.js routes today).
2. Every path listed in PUBLIC_PATHS / ADMIN_PATHS in
   backend/app/core/middleware.py (these are real API routes today).
3. A short list of common words that would be confusing or unsafe as a
   username/slug even though no route uses them yet (www, api, null,
   and so on). Safe to extend later -- see RESERVED_SAFETY_WORDS below.
"""

from __future__ import annotations

import re
from typing import Optional, Tuple


# ---------------------------------------------------------------------------
# 1. Reserved words taken directly from existing frontend routes
#    (see folder_structure.txt, frontend/app/*)
# ---------------------------------------------------------------------------
RESERVED_FRONTEND_ROUTES = frozenset({
    "admin",
    "community",
    "contact",
    "dashboard",
    "get_started",
    "get-started",
    "login",
    "marketing",
    "platform",
    "pricing",
    "profile",
    "resources",
    "setup-wizard",
    "setup-wizard-legacy",
    "signout",
    "templates",       # theme gallery, added in Phase 4 -- reserved now to be safe
})


# ---------------------------------------------------------------------------
# 2. Reserved words taken directly from backend/app/core/middleware.py
#    (PUBLIC_PATHS and ADMIN_PATHS, first path segment only)
# ---------------------------------------------------------------------------
RESERVED_BACKEND_ROUTES = frozenset({
    "docs",
    "redoc",
    "openapi.json",
    "openapi",
    "health",
    "api",
    "db-status",
})


# ---------------------------------------------------------------------------
# 3. General safety words -- no route uses these today, but they would be
#    confusing or risky to hand out as a public username/slug.
#    Add to this list freely; it does not require touching any route file.
# ---------------------------------------------------------------------------
RESERVED_SAFETY_WORDS = frozenset({
    "www", "mail", "ftp", "smtp", "root", "null", "undefined", "none",
    "true", "false", "test", "staging", "dev", "development", "production",
    "static", "public", "assets", "favicon", "robots", "sitemap",
    "account", "accounts", "billing", "payment", "payments", "checkout",
    "cart", "blog", "help", "support", "about", "terms", "privacy", "legal",
    "security", "status", "system", "config", "settings", "owner",
    "moderator", "mod", "superadmin", "super-admin", "super_admin",
    "me", "you", "user", "users",
    # brand-specific words worth protecting even though no route claims them yet
    "shukto", "shuktoai", "opc", "opcgenie", "genie",
})


# ---------------------------------------------------------------------------
# Combined lookup set. This is what is_reserved() checks against.
# ---------------------------------------------------------------------------
RESERVED_NAMES = (
    RESERVED_FRONTEND_ROUTES
    | RESERVED_BACKEND_ROUTES
    | RESERVED_SAFETY_WORDS
)


# ---------------------------------------------------------------------------
# Format rule: lowercase letters, numbers, single hyphens, 3-100 characters,
# must start and end with a letter or number (no leading/trailing hyphen).
# This matches the slugs already produced by content_routes.py and
# community_routes.py (re.sub based slugify).
# ---------------------------------------------------------------------------
_SLUG_FORMAT = re.compile(r"^[a-z0-9](?:[a-z0-9-]{1,98}[a-z0-9])?$")


def normalize(name: str) -> str:
    """Lowercase and strip whitespace. Does not change hyphens/underscores."""
    return (name or "").strip().lower()


def is_valid_format(name: str) -> bool:
    """
    True if the name is 3-100 characters, lowercase letters/numbers/hyphens
    only, and does not start or end with a hyphen.
    """
    name = normalize(name)
    if len(name) < 3 or len(name) > 100:
        return False
    return bool(_SLUG_FORMAT.match(name))


def is_reserved(name: str) -> bool:
    """True if the name (case-insensitive) is in the reserved word list."""
    return normalize(name) in RESERVED_NAMES


def is_username_taken(name: str, db, exclude_user_id: Optional[int] = None) -> bool:
    """
    True if some other user already has this username.
    Requires a live SQLAlchemy session (db). Import of the User model is
    done inside the function so this module can be imported anywhere
    without needing the app's database wired up.
    """
    from app.models.user import User  # local import: keeps this module light to import

    query = db.query(User).filter(User.username == normalize(name))
    if exclude_user_id is not None:
        query = query.filter(User.id != exclude_user_id)
    return query.first() is not None


def is_site_slug_taken(name: str, db, exclude_user_id: Optional[int] = None) -> bool:
    """
    True if some other founder already has this site slug, either as their
    current slug or as an old slug still redirecting (slug history).

    NOTE: founder_sites and its slug-history table are created by
    Migration 10, which has not been written yet in this phase. Until that
    migration and the FounderSite model exist, this function will raise a
    clear ImportError rather than a confusing crash. Wire this into
    site_build_routes.py only after Migration 10 and models/founder_site.py
    are in place.
    """
    try:
        from app.models.founder_site import FounderSite, FounderSiteSlugHistory
    except ImportError as exc:
        raise ImportError(
            "is_site_slug_taken() needs models/founder_site.py and Migration 10 "
            "to exist first. Finish those before calling this function."
        ) from exc

    slug = normalize(name)

    current_query = db.query(FounderSite).filter(FounderSite.slug == slug)
    if exclude_user_id is not None:
        current_query = current_query.filter(FounderSite.user_id != exclude_user_id)
    if current_query.first() is not None:
        return True

    history_query = db.query(FounderSiteSlugHistory).filter(
        FounderSiteSlugHistory.old_slug == slug
    )
    if history_query.first() is not None:
        return True

    return False


def is_available(
    name: str,
    db=None,
    exclude_user_id: Optional[int] = None,
    check_site_slug: bool = False,
) -> Tuple[bool, Optional[str]]:
    """
    The one function other route files should call.

    Returns (True, None) if the name can be used, or (False, reason) if not.
    reason is a short, user-facing string safe to put straight into an
    HTTPException detail field.

    db=None            -- only format and reserved-word checks run (no DB hit)
    db=<session>        -- also checks against existing usernames
    check_site_slug=True -- also checks founder_sites + slug history
                            (only works once Migration 10 and
                            models/founder_site.py exist -- see
                            is_site_slug_taken() above)
    """
    name = normalize(name)

    if not is_valid_format(name):
        return False, (
            "Use 3-100 characters: lowercase letters, numbers, and hyphens only. "
            "It cannot start or end with a hyphen."
        )

    if is_reserved(name):
        return False, f'"{name}" is a reserved word and cannot be used.'

    if db is not None:
        if is_username_taken(name, db, exclude_user_id=exclude_user_id):
            return False, f'"{name}" is already taken.'

        if check_site_slug:
            if is_site_slug_taken(name, db, exclude_user_id=exclude_user_id):
                return False, f'"{name}" is already in use as a site address.'

    return True, None