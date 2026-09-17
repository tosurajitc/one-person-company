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

### Public paths are prefix-matched, not exact
`AuthenticationMiddleware.PUBLIC_PATHS` uses `path.startswith()` — adding `/api/contact` makes ALL `/api/contact*` paths public. Be precise.

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

### Alembic has 9 applied migrations
`alembic.ini` is fully configured. Nine migration scripts are in `alembic/versions/` — always run `alembic upgrade head` from `backend/` before starting the server. If you add a new model, import it in `alembic/env.py` before running `--autogenerate`.

Current migration chain (oldest → newest):
1. `aabc0f0a2cfd` — Rename Course→Offer, Resource→ContentAsset
2. `f7e3dc7821f6` — chat_messages, user_subscriptions, payments
3. `b9e4dc8910ab` — leads table
4. `c3a1e9f02b4d` — Community tenant rearchitecture
5. `a1b2c3d4e5f6` — newsletter_subscribers table
6. `a3f9b1c2d4e5` — fb_agent_states table
7. `d4e5f6a7b8c9` — user_site_settings table
8. `e5f6a7b8c9d0` — extend offer_type enum
9. `f1a2b3c4d5e6` — schema_version on user_site_settings

### New route files added (not in older docs)
- `genie_routes.py` — `POST /api/genie/draft-site`: wizard AI prefill via Groq; returns partial schema 2.0 state
- `site_build_routes.py` — `POST /api/sites/build`: receives full wizard payload, persists to `user_site_settings`, returns preview URL
- `fb_agent_routes.py` — `POST /api/agent/fb-marketing/chat`: Facebook Marketing specialist via Anthropic Claude Sonnet
- `agent_session_routes.py` — live specialist session lifecycle: start / heartbeat / stop / message / get

### `site_settings` DB rows are seeded once and never auto-updated
`seed_default_settings()` in `settings_routes.py` only inserts rows that **don't exist yet**. Changing `DEFAULT_SETTINGS` in the source file will NOT update already-seeded rows in the DB. To update live data, run a direct SQL `UPDATE` or use the admin settings UI at `/admin/settings`.

### `UserSiteSettings` is per-founder, not global
`user_site_settings` table stores setup-wizard config scoped to `user_id`. Each row has a `key` (e.g. `"brand"`, `"hero"`) and a `schema_version` field (`"1.0"` or `"2.0"`). Do not confuse with the global `site_settings` table (platform-wide JSONB key-value store).

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
