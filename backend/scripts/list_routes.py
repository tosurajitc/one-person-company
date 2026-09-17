"""
Phase 0 — Step 1: Route inventory (READ-ONLY)
------------------------------------------------------------------
Lists every FastAPI route and shows how the authentication middleware treats it,
so we can fix PUBLIC_PATHS without breaking anything.

It does NOT change code, call endpoints, or write to the database.

Location:  backend/scripts/list_routes.py
Run from:  backend/
    venv\\Scripts\\activate            (Windows)
    python scripts/list_routes.py

    or with Docker:
    docker compose exec backend python scripts/list_routes.py

Output:
    - A table printed to the console
    - backend/scripts/route_inventory.csv  (open in Excel, add your decisions)

Columns:
    method, path          the route
    module, endpoint      where it is defined
    public_now            True if the current middleware lets it through without a token
    public_after_fix      True if it stays public once "/" becomes an exact match
    auth_dependency       auth dependencies the endpoint itself declares (e.g. get_current_user)
    review                what to decide for this route (see REVIEW NOTES below)
"""

from __future__ import annotations

import csv
import sys
from pathlib import Path

# Make "app" importable when run as: python scripts/list_routes.py
BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import importlib  # noqa: E402

from app.core.middleware import AuthenticationMiddleware  # noqa: E402
from app.main import app  # noqa: E402

AUTH_DEPENDENCY_HINTS = ("current_user", "admin", "auth", "token", "verify")
OUTPUT_CSV = Path(__file__).resolve().parent / "route_inventory.csv"


def is_public_now(path: str) -> bool:
    """Exactly what the middleware does today (prefix match, including the '/' bug)."""
    return any(path.startswith(p) for p in AuthenticationMiddleware.PUBLIC_PATHS)


def is_public_after_fix(path: str) -> bool:
    """Proposed behaviour: '/' matches only the root, every other entry stays a prefix."""
    for p in AuthenticationMiddleware.PUBLIC_PATHS:
        if p == "/":
            if path == "/":
                return True
        elif path.startswith(p):
            return True
    return False


def is_admin_path(path: str) -> bool:
    return any(path.startswith(p) for p in AuthenticationMiddleware.ADMIN_PATHS)


def collect_dependency_names(dependant, found=None) -> list[str]:
    """Walk the endpoint's dependency tree and collect callable names."""
    if found is None:
        found = []
    for dep in getattr(dependant, "dependencies", []) or []:
        call = getattr(dep, "call", None)
        name = getattr(call, "__name__", None) or type(call).__name__
        if name and name not in found:
            found.append(name)
        collect_dependency_names(dep, found)
    return found


def review_note(public_now: bool, public_after: bool, auth_deps: list[str], admin: bool) -> str:
    if public_now and not public_after:
        if admin:
            return "OK - admin path; open today, will require an admin token after fix"
        if auth_deps:
            return "OK - protected by its own dependency; will also need a token after fix"
        return "DECIDE - open today, will return 401 after fix (add to PUBLIC_PATHS if guests use it)"
    if public_after and auth_deps:
        return "CHECK - listed as public but endpoint expects a logged-in user"
    if public_after:
        return "Public (unchanged)"
    if admin:
        return "Admin only (unchanged)"
    return "Protected (unchanged)"


ROUTE_MODULES = [
    "contact_routes", "auth_routes", "settings_routes", "content_routes", "page_routes",
    "resource_routes", "community_routes", "chat_routes", "payment_routes", "lead_routes",
    "subscriber_routes", "agent_session_routes", "fb_agent_routes", "site_build_routes", "genie_routes",
]


def iter_http_routes(routes, seen=None):
    """Yield every HTTP route with its full path (prefix included).

    Works on both FastAPI styles:
      - older versions copy included routes into app.routes as APIRoute objects
      - newer versions keep an included-router wrapper whose
        effective_route_contexts() returns the routes with prefixes applied
    """
    if seen is None:
        seen = set()
    for route in routes:
        if hasattr(route, "effective_route_contexts"):
            route_contexts = route.effective_route_contexts()
            for context in iter_http_routes(list(route_contexts), seen):
                yield context
            continue
        path = getattr(route, "path", None)
        methods = getattr(route, "methods", None)
        endpoint = getattr(route, "endpoint", None)
        if path and methods and endpoint is not None:
            key = (path, tuple(sorted(methods)))
            if key not in seen:
                seen.add(key)
                yield route
            continue
        nested = getattr(route, "routes", None)  # mounts / sub-applications
        if nested:
            yield from iter_http_routes(nested, seen)


def print_router_diagnostics() -> None:
    print("\nRoutes defined in each route file (before prefixes):")
    for name in ROUTE_MODULES:
        try:
            module = importlib.import_module(f"app.api.routes.{name}")
            router = getattr(module, "router", None)
            count = len(getattr(router, "routes", []) or []) if router is not None else "no router"
            print(f"  {name:<24} {count}")
        except Exception as exc:  # show import problems instead of hiding them
            print(f"  {name:<24} IMPORT ERROR: {exc}")
    types = {}
    for r in app.routes:
        types[type(r).__name__] = types.get(type(r).__name__, 0) + 1
    print(f"Top-level app.routes by type: {types}")


def main() -> None:
    print_router_diagnostics()
    rows = []
    for route in iter_http_routes(app.routes):
        dependant = getattr(route, "dependant", None)
        dep_names = collect_dependency_names(dependant) if dependant is not None else []
        auth_deps = [n for n in dep_names if any(h in n.lower() for h in AUTH_DEPENDENCY_HINTS)]
        public_now = is_public_now(route.path)
        public_after = is_public_after_fix(route.path)
        admin = is_admin_path(route.path)
        for method in sorted(route.methods or []):
            if method in {"HEAD", "OPTIONS"}:
                continue
            rows.append({
                "method": method,
                "path": route.path,
                "module": getattr(route.endpoint, "__module__", ""),
                "endpoint": getattr(route.endpoint, "__name__", ""),
                "public_now": public_now,
                "public_after_fix": public_after,
                "admin_path": admin,
                "auth_dependency": ", ".join(auth_deps),
                "review": review_note(public_now, public_after, auth_deps, admin),
            })

    rows.sort(key=lambda r: (r["review"], r["path"], r["method"]))

    # Console table
    print(f"\nPUBLIC_PATHS currently: {AuthenticationMiddleware.PUBLIC_PATHS}\n")
    header = f"{'METHOD':<7} {'PATH':<55} {'NOW':<6} {'AFTER':<6} REVIEW"
    print(header)
    print("-" * len(header) + "-" * 40)
    for r in rows:
        print(f"{r['method']:<7} {r['path'][:55]:<55} {str(r['public_now']):<6} {str(r['public_after_fix']):<6} {r['review']}")

    # Summary
    decide = [r for r in rows if r["review"].startswith("DECIDE")]
    check = [r for r in rows if r["review"].startswith("CHECK")]
    print(f"\nTotal routes: {len(rows)}")
    print(f"Open today because of '/' bug:        {sum(1 for r in rows if r['public_now'] and not r['public_after_fix'])}")
    print(f"  of which need a decision (DECIDE):  {len(decide)}")
    print(f"Listed public but expect a user (CHECK): {len(check)}")

    # CSV
    with OUTPUT_CSV.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()) + ["decision"] if rows else ["decision"])
        writer.writeheader()
        for r in rows:
            writer.writerow({**r, "decision": ""})
    print(f"\nSaved: {OUTPUT_CSV}")
    print("Next: fill the 'decision' column with PUBLIC or PROTECTED for every DECIDE row.\n")


if __name__ == "__main__":
    main()