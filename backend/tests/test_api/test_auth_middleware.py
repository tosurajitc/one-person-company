"""
Phase 0 - tests for app/core/middleware.py

Location: backend/tests/test_api/test_auth_middleware.py
Run from backend/:
    pytest tests/test_api/test_auth_middleware.py -v

These tests build a tiny FastAPI app with the real middleware and fake users,
so they never touch your database or call Groq/Razorpay.
"""

import pytest
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient

from app.core import middleware as mw
from app.core.middleware import AuthenticationMiddleware


# ---------------------------------------------
# Fake users and token lookup
# ---------------------------------------------
class FakeUser:
    def __init__(self, admin=False, active=True):
        self._admin = admin
        self.is_active = active
        self.email = "admin@test.com" if admin else "user@test.com"

    def is_admin(self):
        return self._admin


TOKENS = {
    "user-token": FakeUser(admin=False),
    "admin-token": FakeUser(admin=True),
    "inactive-token": FakeUser(active=False),
}


class FakeSession:
    def close(self):
        pass


@pytest.fixture(autouse=True)
def fake_auth(monkeypatch):
    monkeypatch.setattr(mw, "SessionLocal", lambda: FakeSession())

    def get_user_from_token(token, db):
        return TOKENS.get(token)

    monkeypatch.setattr(mw.AuthService, "get_user_from_token", staticmethod(get_user_from_token), raising=False)
    # Set explicitly so a value in backend/.env never changes test results
    monkeypatch.setenv("AUTH_MIDDLEWARE_MODE", "enforce")
    monkeypatch.setenv("RATE_LIMIT_ENABLED", "false")


def make_client():
    app = FastAPI()
    app.add_middleware(AuthenticationMiddleware)

    @app.api_route("/{full_path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
    async def catch_all(full_path: str, request: Request):
        user = getattr(request.state, "user", None)
        return {"ok": True, "user": getattr(user, "email", None)}

    return TestClient(app)


def auth(token):
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------
# Rule tables
# ---------------------------------------------
PUBLIC = [
    ("GET", "/"),
    ("GET", "/health"),
    ("GET", "/docs"),
    ("POST", "/api/auth/login"),
    ("POST", "/api/auth/register"),
    ("POST", "/api/auth/signup"),
    ("POST", "/api/auth/logout"),
    ("POST", "/api/auth/oauth/callback"),
    ("GET", "/api/auth/verify"),
    ("GET", "/api/auth/me"),
    ("GET", "/api/settings/public"),
    ("GET", "/api/settings/playbook_categories"),
    ("GET", "/api/pages/public"),
    ("GET", "/api/pages/slug/about-us"),
    ("GET", "/api/resources/public"),
    ("GET", "/api/content/offers/public/priya/brand-session"),
    ("GET", "/api/public/priya/community/founders-circle"),
    ("POST", "/api/contact"),
    ("GET", "/api/contact/health"),
    ("POST", "/api/leads"),
    ("POST", "/api/subscribers"),
    ("POST", "/api/chat"),
    ("POST", "/api/chat/prefill"),
    ("POST", "/api/genie/draft-site"),
    ("POST", "/api/payments/webhook/razorpay"),
    ("POST", "/api/payments/webhook/stripe"),
]

PROTECTED = [
    # Guests may not buy or use agents
    ("POST", "/api/payments/create-order"),
    ("POST", "/api/payments/verify"),
    ("GET", "/api/payments/subscription"),
    ("POST", "/api/agent-session/start"),
    ("POST", "/api/agent-session/heartbeat"),
    ("POST", "/api/agent-session/stop"),
    ("POST", "/api/agent-session/message"),
    ("GET", "/api/agent-session/as_123"),
    ("POST", "/api/agent/fb-marketing/chat"),
    ("POST", "/api/agent/fb-marketing/state"),
    ("GET", "/api/agent/fb-marketing/state/abc"),
    # Saving data
    ("POST", "/api/sites/build"),
    ("POST", "/api/chat/prefill-and-save"),
    ("POST", "/api/settings/setup"),
    ("GET", "/api/settings/mine"),
    ("POST", "/api/public/priya/community/founders-circle/join"),
    # Same path, different method from a public route
    ("GET", "/api/leads"),
    ("GET", "/api/subscribers"),
    ("PATCH", "/api/subscribers/5"),
    ("GET", "/api/pages"),
    ("GET", "/api/resources"),
    ("GET", "/api/content/offers"),
    ("GET", "/api/protected"),
    # Look-alikes of public routes must NOT be public
    ("GET", "/api/settings/public-admin"),
    ("GET", "/api/pages/slug/a/b"),
    ("POST", "/api/chat/anything-else"),
    ("GET", "/anything"),
]

ADMIN = [
    ("GET", "/api/admin/communities"),
    ("POST", "/api/admin/community-templates"),
    ("GET", "/api/admin/status"),
    ("GET", "/api/contacts"),
    ("GET", "/api/contacts/12"),
    ("PUT", "/api/contacts/12"),
    ("DELETE", "/api/contacts/12"),
    ("GET", "/api/db-status"),
]


# ---------------------------------------------
# Tests
# ---------------------------------------------
@pytest.mark.parametrize("method,path", PUBLIC)
def test_public_routes_work_without_token(method, path):
    r = make_client().request(method, path)
    assert r.status_code == 200, f"{method} {path} should be public"


@pytest.mark.parametrize("method,path", PROTECTED)
def test_protected_routes_need_token(method, path):
    client = make_client()
    assert client.request(method, path).status_code == 401, f"{method} {path} should need login"
    r = client.request(method, path, headers=auth("user-token"))
    assert r.status_code == 200
    assert r.json()["user"] == "user@test.com"


@pytest.mark.parametrize("method,path", ADMIN)
def test_admin_routes_need_admin(method, path):
    client = make_client()
    assert client.request(method, path).status_code == 401
    assert client.request(method, path, headers=auth("user-token")).status_code == 403
    assert client.request(method, path, headers=auth("admin-token")).status_code == 200


def test_contact_form_public_but_contact_list_admin():
    client = make_client()
    assert client.post("/api/contact").status_code == 200
    assert client.get("/api/contacts").status_code == 401


def test_cookie_token_is_accepted():
    client = make_client()
    client.cookies.set("token", "user-token")
    r = client.post("/api/payments/create-order")
    assert r.status_code == 200
    assert r.json()["user"] == "user@test.com"


def test_invalid_and_inactive_tokens_rejected():
    client = make_client()
    assert client.get("/api/settings/mine", headers=auth("wrong")).status_code == 401
    assert client.get("/api/settings/mine", headers=auth("inactive-token")).status_code == 401
    assert client.get("/api/settings/mine", headers={"Authorization": "Basic abc"}).status_code == 401


def test_options_preflight_always_allowed():
    assert make_client().options("/api/payments/create-order").status_code == 200


def test_report_mode_logs_but_does_not_block(monkeypatch, caplog):
    monkeypatch.setenv("AUTH_MIDDLEWARE_MODE", "report")
    client = make_client()
    with caplog.at_level("WARNING"):
        r = client.get("/api/contacts")
    assert r.status_code == 200
    assert "WOULD BLOCK" in caplog.text


def test_rate_limit_blocks_after_limit(monkeypatch):
    monkeypatch.setenv("RATE_LIMIT_ENABLED", "true")
    client = make_client()
    codes = [client.post("/api/contact").status_code for _ in range(6)]
    assert codes[:5] == [200] * 5
    assert codes[5] == 429


def test_every_public_rule_matches_a_real_route():
    """Catches typos: each PUBLIC_ROUTES entry must exist in the real app."""
    try:
        from app.main import app as real_app
    except Exception as exc:  # pragma: no cover
        pytest.skip(f"Could not import app.main: {exc}")

    def collect(routes):
        for route in routes:
            if hasattr(route, "effective_route_contexts"):
                yield from collect(list(route.effective_route_contexts()))
            elif getattr(route, "path", None) and getattr(route, "methods", None):
                yield route
            elif getattr(route, "routes", None):
                yield from collect(route.routes)

    real = {(m, r.path) for r in collect(real_app.routes) for m in r.methods}
    missing = [(m, p) for m, p in AuthenticationMiddleware.PUBLIC_ROUTES if (m, p) not in real]
    assert not missing, f"PUBLIC_ROUTES entries with no matching route: {missing}"