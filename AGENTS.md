# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Stack
- **Backend**: Python 3.12, FastAPI + SQLAlchemy 2.0 + Alembic 1.20, PostgreSQL (`ai_services_platform` DB, user: `watsonx_user`)
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, plain JS (not TypeScript despite `@types/*` dev deps)
- **Auth**: JWT via `python-jose` (HS256) + OAuth (Google/Microsoft/GitHub/LinkedIn) via `httpx`
- **AI**: Groq SDK (`/api/chat`, `/api/genie/draft-site`) + Anthropic SDK — Claude Sonnet (`/api/agent/fb-marketing/chat`)

## Commands

### Backend (run from `backend/`)
```bash
venv\Scripts\activate        # Windows — activate venv first
uvicorn app.main:app --reload
pytest
pytest tests/test_api/test_file.py::test_name -v   # single test
alembic upgrade head          # run migrations (alembic.ini is configured)
alembic revision --autogenerate -m "description"   # generate migration
```

### Frontend (run from `frontend/`)
```bash
npm run dev   # :3000
npm run build
npm run lint  # next lint
```

## Critical Architecture Gotchas

### Three separate `Base` / engine instances — use only one
- `app/core/database.py`: the **canonical** `engine`, `SessionLocal`, `Base`, `get_db`
- `app/db/session.py`: dead duplicate engine (no `Base`) — import nothing from here
- `app/db/base.py`: orphaned third `Base = declarative_base()` — never imported anywhere, ignore it
- `app/db/__init__.py`'s `create_tables()` correctly imports from `app.core.database` — follow that pattern
- Routes must use `from ...core.database import get_db`; core/middleware files use `from app.core.database import get_db`

### `app/db/init_db.py` is a dead file
`app/main.py` calls `from app.db import init_db` which resolves to `app/db/__init__.py`, not `app/db/init_db.py`. The `init_db.py` file still imports the deprecated `app/models/course.py` (renamed to `offer.py`) and uses `app/db/session.py`'s engine. Do not use or reference it.

### Middleware execution order is inverted
In `app/main.py`, `app.add_middleware()` is added in reverse-execution order (FastAPI applies last-added first):
```python
app.add_middleware(SecurityHeadersMiddleware)  # executes last
app.add_middleware(RequestLoggingMiddleware)   # executes second
app.add_middleware(AuthenticationMiddleware)   # executes first
```

### ~~Public paths are prefix-matched, not exact~~ — FIXED (Phase 0)
`AuthenticationMiddleware` was rewritten in Phase 0. It now uses **exact `(method, path)` matching** via a compiled regex per route — `"/"` no longer leaks to every route. The old `PUBLIC_PATHS` list is gone; the new `PUBLIC_ROUTES` list is a list of `(method, path)` tuples where `{param}` matches one URL segment. Rate limiting (per-client-IP, sliding window) is also wired in the same middleware. The `middleware_old.py` file is the archived pre-Phase-0 version — do not use it.

### Password hashing uses two incompatible implementations
- `app/core/auth.py` (`SecurityService.hash_password`) uses `passlib.CryptContext` with bcrypt
- `app/db/__init__.py` (`_hash_password`) uses raw `bcrypt` directly
Both produce valid bcrypt hashes but **only passlib** is used for login verification. The admin account created at startup uses raw bcrypt; if login fails for the admin, this is why. Do not mix them.

### `User.to_dict()` crashes when `oauth_provider` is `None`
`app/models/user.py` calls `self.oauth_provider.value` unconditionally — will raise `AttributeError` for local password users where `oauth_provider=None`. Add a null guard before calling `.value`.

### Frontend token storage is split across two locations
- `frontend/middleware.js` reads auth token from **cookies** (`token` key) — controls route protection
- `frontend/context/AuthContext.js` stores/reads from **`localStorage`** (`auth_token` key) — controls in-app state
These are not in sync. A user can be authenticated in-app but the middleware won't see it (or vice versa).

### Next.js API rewrites proxy to backend
`/api/*` in the frontend is rewritten to `http://localhost:8000/api/*` via `next.config.js`. All backend routes must have the `/api` prefix to be callable from the frontend.

### `next.config.js` has hardcoded legacy redirects
Old paths like `/platform/ai-genie`, `/platform/website-builder` redirect to the real current routes. The live platform directories are `ai-website-builder/`, `content-studio/`, `offers-payments/` — do not add pages at the old names.

### Alembic has 17 applied migrations
`alembic.ini` is fully configured. Migration scripts are in `alembic/versions/` — always run `alembic upgrade head` from `backend/` before starting the server. If you add a new model, import it in `alembic/env.py` before running `--autogenerate`.

Current migration chain (oldest → newest):
1. `aabc0f0a2cfd` — Rename Course→Offer, Resource→ContentAsset
2. `f7e3dc7821f6` — chat_messages, user_subscriptions, payments
3. `b9e4dc8910ab` — leads table
4. `c3a1e9f02b4d` — Community tenant rearchitecture
5. `a1b2c3d4e5f6` — newsletter_subscribers table
6. `a3f9b1c2d4e5` — fb_agent_states table
7. `d4e5f6a7b8c9` — user_site_settings table (with unique `(user_id, key)` constraint)
8. `e5f6a7b8c9d0` — extend offer_type enum
9. `f1a2b3c4d5e6` — schema_version column on user_site_settings
10. `80d89c47ebd9` — merge heads before founder_sites (Phase 1 prep)
11. `c4d5e6f7a8b9` — founder_sites table + founder_site_slug_history (Phase 1 / Migration 10)
12. `d2e3f4a5b6c7` — offer tier fields: tier, price_usd, deliverables, is_highlighted, sort_order, founder_site_id (Phase 1 / Migration 11)
13. `e3f4a5b6c7d8` — unique (user_id, key) constraint on user_site_settings (Phase 1 / Migration 12)
14. `g2h3i4j5k6l7` — add `template_slug` + `template_section` columns to user_site_settings + composite index (Phase 2 / Template system)
15. `b7c8d9e0f1a2` — add `ai_generations_count` + `ai_generation_credits` columns to users (Phase 2 / AI credit tracking)
16. `h3i4j5k6l7m8` — merge heads: `b7c8d9e0f1a2`, `e3f4a5b6c7d8`, `g2h3i4j5k6l7` (bookkeeping only — no DDL)

> ⚠️ Migration 12 (`e3f4a5b6c7d8`) adds a unique constraint on `user_site_settings(user_id, key)`. Before running it on a DB that had the old wizard, de-duplicate any rows with the same `(user_id, key)` first.

> ℹ️ Migration 14 (`g2h3i4j5k6l7`) adds `template_slug` / `template_section` as **nullable** columns — safe to apply to existing rows. Existing `user_site_settings` rows with `key = 'template'` will have `NULL` until they are re-saved through the wizard or the build endpoint.

### New route files added (not in older docs)
- `genie_routes.py` — `POST /api/genie/draft-site` (Groq wizard prefill); **`POST /api/genie/intake`** (Phase 1 — schema 2.0 intake, returns `{prefill, needsConfirmation, followUps, saved, remaining_credits}`); **`POST /api/genie/save-wizard`** (Phase 1 — saves completed Genie state directly, skipping the 13-step wizard); **`GET /api/genie/status`** (returns saved draft for the logged-in user)
- `site_build_routes.py` — `POST /api/sites/build` (Phase 1 — requires login, validates slug via `reserved_names.py`, creates/updates `founder_sites` row, syncs offers, returns preview URL); **`GET /api/sites/public/{slug}`** (Phase 1 — returns published site payload including `templateSlug`; no auth required)
- `fb_agent_routes.py` — `POST /api/agent/fb-marketing/chat`: Facebook Marketing specialist via Anthropic Claude Sonnet
- `agent_session_routes.py` — live specialist session lifecycle: start / heartbeat / stop / message / get

### New service files added (Phase 1)
- `services/reserved_names.py` — single source of truth for reserved usernames and site slugs; used by registration, `content_routes.py`, and `site_build_routes.py`. Call `is_available(name, db=db, check_site_slug=True)` — returns `(True, None)` or `(False, reason)`.
- `services/offer_sync_service.py` — turns wizard `offers.tiers` into real `Offer` rows matched by `(creator_id, tier)`; never deletes offers; call `sync_offers_from_wizard(db, user, offers_payload, founder_site=...)`.

### New model files added (Phase 1)
- `models/founder_site.py` — `FounderSite` (one row per founder's public site: `user_id` unique, `slug` unique, `theme`, `status`, `custom_domain`, `published_at`) and `FounderSiteSlugHistory` (every old slug preserved for 301 redirects and to block re-claiming).

### New frontend files added (Phase 1)
- `frontend/lib/wizard-schema.js` — exports `WIZARD_SCHEMA` (full blank schema 2.0 template) and `applyProgrammaticDefaults(prefill, userInput)` (fills social links, YouTube slot, FAQs — never overwrites user-supplied or LLM values). Import from `@/lib/wizard-schema`.
- `frontend/app/platform/ai-website-builder/page.js` — **replaced** (Phase 1): now calls `POST /api/genie/intake`, shows structured review of the Genie draft, saves via `POST /api/genie/save-wizard`, redirects to `/setup-wizard` (not `/platform/my-website`).
- `frontend/app/setup-wizard/page.js` — **replaced** (Phase 1): 13-step schema 2.0 wizard; reads Genie prefill from `sessionStorage('genie_prefill')` and saved DB draft from `GET /api/genie/status`; shows `ConfirmedChip` for pre-filled fields; submits to `POST /api/sites/build`. `SITE_DOMAIN_SUFFIX` is set to `.opcgenie.com`. Exports `TEMPLATE_CATALOGUE` — imported by `ai-website-builder/page.js` for the template selection step.
- `frontend/app/setup-wizard-legacy/page.js` — **new** (Phase 1): placeholder redirect → `/setup-wizard`. Remove at start of Phase 3.

### New frontend files added (Phase 2)
- `frontend/app/templates/page.js` — **new** (Phase 2): Template gallery at `/templates`; 16 templates across 5 categories (11 live, 5 coming soon); sticky left sidebar with `IntersectionObserver`; each live card links to `/templates/{slug}`.
- `frontend/app/templates/{slug}/page.js` — **new** (Phase 2): 11 fully-built template preview pages, each a self-contained static founder website with sample data:
  - **Service-Based**: `consultant-advisor` (Navy + Gold), `coach-mentor` (Terracotta + Cream), `freelancer-creative` (Electric Violet + Lime), `agency-of-one` (Slate + Cyan)
  - **Knowledge & Content**: `course-creator` (Deep Teal + Amber), `author-speaker` (Burgundy + Blush), `newsletter-community` (Indigo + Mint)
  - **Local & Trade**: `local-service-pro` (Forest + Saffron), `clinic-practitioner` (Medical Blue + Lavender), `tutor-training` (Sunflower + Sky)
  - **Product & Commerce**: `digital-product-seller` (Hot Pink + Dark)
  - Coming soon (no page file yet): `physical-artisan`, `saas-tool-maker`, `community-led`, `subscription-retainer`, `event-workshop-host`
- `frontend/app/[username]/page.js` — **updated** (Phase 2): now dynamically imports the matching template component when `payload.templateSlug` is set; falls back to the built-in `GenericSite` renderer for legacy sites (no `templateSlug`).

### `UserSiteSettings` — new `template_slug` / `template_section` columns (Phase 2)
Migration `g2h3i4j5k6l7` adds two nullable columns to `user_site_settings`:
- `template_slug` (VARCHAR 100) — denormalised copy of `value['slug']` when `key = 'template'`, e.g. `"clinic-practitioner"`. Used by `GET /api/sites/public/{slug}` to return `templateSlug` in the payload without parsing JSONB.
- `template_section` (VARCHAR 100) — denormalised copy of `value['sectionId']`, e.g. `"local-trade"`.
- A composite index `ix_user_site_settings_template_slug` on `(user_id, template_slug)` enables fast per-user template lookups.

### `User` — new AI credit tracking columns (Phase 2)
Migration `b7c8d9e0f1a2` adds two integer columns to `users` (both default to 0):
- `ai_generations_count` — total number of AI site generations the user has run
- `ai_generation_credits` — purchased/granted credits for additional AI generations

### `site_settings` DB rows are seeded once and never auto-updated
`seed_default_settings()` in `settings_routes.py` only inserts rows that **don't exist yet**. Changing `DEFAULT_SETTINGS` in the source file will NOT update already-seeded rows in the DB. To update live data, run a direct SQL `UPDATE` or use the admin settings UI at `/admin/settings`.

### `UserSiteSettings` is per-founder, not global
`user_site_settings` table stores setup-wizard config scoped to `user_id`. Each row has a `key` (e.g. `"brand"`, `"hero"`, `"site_build_payload"`) and a `schema_version` field (`"1.0"` or `"2.0"`). Do not confuse with the global `site_settings` table (platform-wide JSONB key-value store). Phase 1 loaders must filter `schema_version = '2.0'` to ignore old v1 keys.

### `FounderSite` — one row per founder's public website (Phase 1)
Created by `POST /api/sites/build`. Columns: `user_id` (unique FK → users), `slug` (unique, 3-100 chars, no reserved words), `theme` (string, default `"professional"`), `status` (`"draft"` | `"published"`), `custom_domain` (nullable), `published_at` (nullable). Old slugs are preserved in `founder_site_slug_history` for 301 redirects and to prevent re-claiming.

### `Offer` tier fields (Phase 1 additions)
`offers` table gained: `tier` (`"front_door"` | `"core"` | `"recurring"`), `price_usd` (Numeric), `deliverables` (JSONB list of strings), `is_highlighted` (Boolean), `sort_order` (Integer), `founder_site_id` (FK → founder_sites, nullable, CASCADE). Wizard tiers are synced into these rows by `offer_sync_service.py`.

### Auth middleware new env variables (Phase 0)
```
AUTH_MIDDLEWARE_MODE=enforce   # "enforce" (default) blocks requests; "report" logs but never blocks
RATE_LIMIT_ENABLED=true        # "false" disables per-IP rate limiting for local dev
```

## Code Style

### Backend
- Pydantic v2: validators use `@field_validator(..., mode="before")` not `@validator`
- `Settings` uses `model_config = SettingsConfigDict(...)` not `class Config:`
- `DATABASE_URL` is a `@property` on `Settings` — cannot be set via env var directly; set `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD` instead
- Auth exceptions subclass `HTTPException` directly (`AuthenticationError`, `AuthorizationError`, `InvalidTokenError` in `app/core/auth.py`) — raise by instantiation, not inline `HTTPException`
- Relative imports (`from ...core.database`) in route files; absolute imports (`from app.core.database`) in core/middleware files

### Frontend
- App Router (`app/` directory), `.js` files only — no `.tsx` or `.ts`
- Client components need `'use client'` directive at top
- **`frontend/site.config.js`** is the single source of truth for all UI copy, nav links, pricing, hero text, features, testimonials — edit here, not in component files
- Tailwind custom tokens: `primary-*` (blue scale), `gray-*` (slate scale), custom animations `fade-in`, `slide-up`, `slide-down`, `scale-in`, `float`, `glow`; box shadows `shadow-glow`, `shadow-glow-lg`, `shadow-inner-glow`; fonts `font-sans` (Inter) and `font-mono` (JetBrains Mono)
- `clsx` + `tailwind-merge` available for conditional class merging
- `useAuth()` from `context/AuthContext.js` for auth state; `withAuth(Component, {role})` HOC for page-level protection
- `useSiteConfig()` from `hooks/useSiteConfig.js` — fetches `/api/settings/public` on mount; DB values override `site.config.js` static defaults. Always use this hook on public pages instead of importing `site.config.js` directly
- Feature card statuses (`Available` / `Live Demo` / `Coming Soon`) and their links are stored in the `features` key in the `site_settings` DB table. To change them at runtime, UPDATE the DB row directly or use `/admin/settings` — editing `DEFAULT_SETTINGS` in `settings_routes.py` only affects fresh installs

## Environment Variables (Backend `.env`)
```
SECRET_KEY=                   # Required; defaults to random token (rotates on restart — invalidates all JWTs!)
DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD
FIRST_SUPERUSER=              # Super-admin email (seeded on first startup)
FIRST_SUPERUSER_PASSWORD=

# AI — at least one required for AI features
GROQ_API_KEY=                 # Required for /api/chat and /api/genie/draft-site
GROQ_MODEL=                   # Optional override (default: groq/compound-mini)
ANTHROPIC_API_KEY=            # Required for /api/agent/fb-marketing/chat (Claude Sonnet)
ANTHROPIC_MODEL=              # Optional override (default: claude-sonnet-4-5)

# OAuth (configure at least one provider)
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
MICROSOFT_CLIENT_ID / MICROSOFT_CLIENT_SECRET
GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET
LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET

# Payments
RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET / RAZORPAY_WEBHOOK_SECRET
STRIPE_SECRET_KEY / STRIPE_PUBLISHABLE_KEY / STRIPE_WEBHOOK_SECRET

FRONTEND_URL=http://localhost:3000   # Used to build payment redirect URLs
```
`SECRET_KEY` defaults to `secrets.token_urlsafe(32)` **per process** — all JWTs are invalidated on every backend restart unless set in `.env`.
