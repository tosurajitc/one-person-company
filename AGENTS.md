# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Stack
- **Backend**: Python 3.12, FastAPI + SQLAlchemy 2.0 + Alembic, PostgreSQL (`ai_services_platform` DB, user: `watsonx_user`)
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, plain JS (not TypeScript despite `@types/*` dev deps)
- **Auth**: JWT via `python-jose` (HS256) + OAuth (Google/Microsoft/GitHub/LinkedIn) via `httpx`

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
`/platform/ai-genie`, `/platform/website-builder`, `/platform/offers`, `/platform/content-studio` all redirect to renamed paths. Do not add new pages at those old paths.

### Alembic is configured and has one migration
`alembic.ini` is fully configured with a hardcoded DB URL. One migration exists in `alembic/versions/` (renaming `course`→`offer`, `resource`→something). Run from `backend/`. If you add a new model, import it in `alembic/env.py` before running `--autogenerate`.

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

## Environment Variables (Backend `.env`)
```
SECRET_KEY=          # Required; defaults to random token (rotates on restart if not set!)
DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD
GROQ_API_KEY         # Optional, for future chat
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
MICROSOFT_CLIENT_ID / MICROSOFT_CLIENT_SECRET
GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET
LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET
FIRST_SUPERUSER / FIRST_SUPERUSER_PASSWORD   # Set in Settings; does NOT auto-create an account (admin@admin.com/password is hardcoded in create_super_admin)
```
`SECRET_KEY` defaults to `secrets.token_urlsafe(32)` **per process** — all JWTs are invalidated on every backend restart unless set in `.env`.
