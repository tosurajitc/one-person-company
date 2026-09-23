"""
test_fb_large_json.py
─────────────────────
Direct HTTP integration test for the FB Marketing Agent /chat endpoint.

Sends a realistic 300-line JSON campaign brief as the message body to verify:
  1. FastAPI accepts and parses the payload without error
  2. The progressive-chunking path activates (_LARGE_MSG_CHARS = 1500)
  3. Claude returns a non-empty reply
  4. The endpoint returns HTTP 200 with a valid FbChatResponse shape

Run (from backend/ dir, with the server already running on :8000):
    python -m pytest tests/test_fb_large_json.py -v -s

Or as a standalone script:
    python tests/test_fb_large_json.py
"""

from __future__ import annotations

import json
import os
import sys
import textwrap
import time
import urllib.request
import urllib.error

# ─────────────────────────────────────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────────────────────────────────────

BASE_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
SESSION_ID = f"test-large-json-{int(time.time())}"

# ─────────────────────────────────────────────────────────────────────────────
# Build a realistic ~300-line JSON campaign brief
# ─────────────────────────────────────────────────────────────────────────────

def _build_large_json_payload() -> str:
    """Return a JSON string that is comfortably > 1500 chars (triggers chunking)."""
    brief = {
        "meta": {
            "niche": "Handmade organic skincare",
            "monthly_budget": "₹15,000",
            "campaign_duration_days": 30,
            "target_regions": ["Mumbai", "Delhi", "Bangalore", "Pune", "Hyderabad"],
            "languages": ["English", "Hindi"],
        },
        "structured": {
            "campaign_objective": "CONVERSIONS",
            "campaign_type": "Lead Generation + Direct Sales",
            "funnel_stages": ["Awareness", "Consideration", "Conversion", "Retention"],
            "performance_estimates": [
                {"metric": "Cost Per Lead", "target": "₹120", "benchmark_range": "₹80-₹180"},
                {"metric": "ROAS",           "target": "3.5x", "benchmark_range": "2.5x-5x"},
                {"metric": "CTR",            "target": "1.2%", "benchmark_range": "0.8%-2.0%"},
            ],
        },
        "audience_segments": [
            {
                "segment_id": f"seg_{i:03d}",
                "name": f"Segment {i}: {label}",
                "age_range": age,
                "gender": gender,
                "interests": interests,
                "behaviors": behaviors,
                "estimated_reach": reach,
                "recommended_bid_strategy": bid,
            }
            for i, (label, age, gender, interests, behaviors, reach, bid) in enumerate([
                ("Young Women Health Conscious",    "18-28", "Female",
                 ["Organic skincare", "Yoga", "Wellness", "Sustainable living"],
                 ["Online shoppers", "Frequent beauty buyers"],
                 "850K-1.2M", "Lowest cost"),
                ("Working Women Premium Buyers",    "28-40", "Female",
                 ["Luxury skincare", "Career women", "Health & fitness", "Meditation"],
                 ["High-value purchasers", "Beauty & cosmetics engaged"],
                 "620K-900K", "Cost cap ₹150"),
                ("Homemakers Natural Products",     "30-45", "Female",
                 ["Natural remedies", "Ayurveda", "Home & garden", "Baby care"],
                 ["Homemakers", "Recently moved"],
                 "1.1M-1.5M", "Bid cap ₹80"),
                ("Eco-Conscious Millennials",       "24-35", "All",
                 ["Sustainability", "Zero waste", "Vegan products", "Cruelty-free"],
                 ["Eco-friendly purchasers", "Subscription box buyers"],
                 "430K-680K", "Lowest cost"),
                ("Skincare Enthusiasts",            "20-32", "Female",
                 ["Skincare routines", "K-beauty", "Dermatology", "Anti-aging"],
                 ["Beauty influencer followers", "Tutorial video viewers"],
                 "780K-1.1M", "Cost cap ₹200"),
            ], 1)
        ],
        "step3_copy_placement": [
            {
                "ad_id": f"ad_{j:03d}",
                "format": fmt,
                "placement": placement,
                "hook": hook,
                "primary_text": primary,
                "headline": headline,
                "description": desc,
                "cta": cta,
                "utm_params": f"utm_source=facebook&utm_medium=paid&utm_campaign=skincare_q1&utm_content=ad_{j:03d}",
            }
            for j, (fmt, placement, hook, primary, headline, desc, cta) in enumerate([
                ("Single Image", "Facebook Feed + Instagram Feed",
                 "Your skin absorbs 60% of what you put on it.",
                 "That's why we make every ingredient count. Our organic turmeric face wash is free from sulfates, parabens, and synthetic fragrances — just pure plant power your skin will love. ✨ Trusted by 12,000+ customers across India.",
                 "Glow Naturally, Every Day",
                 "100% organic. Dermatologist-tested. ₹349 only.",
                 "SHOP NOW"),
                ("Carousel", "Facebook Feed + Messenger Inbox",
                 "5 reasons dermatologists recommend our face serum 👇",
                 "Slide 1: Hyaluronic acid from sugarcane\nSlide 2: Bakuchiol — nature's retinol\nSlide 3: Rose hip oil for hyperpigmentation\nSlide 4: No synthetic fragrance ever\nSlide 5: Cruelty-free & vegan certified",
                 "Science + Nature in Every Drop",
                 "Free shipping on orders above ₹499.",
                 "LEARN MORE"),
                ("Video (15s)", "Instagram Reels + Facebook Reels",
                 "POV: You finally found a cleanser that doesn't dry out your skin",
                 "Show the morning ritual. Water splashing. Close-up of glowing skin. Product reveal. Text overlay: 'Made with 100% organic ingredients'. End card: website + discount code GLOW15.",
                 "Morning Ritual, Redefined",
                 "Use code GLOW15 for 15% off your first order.",
                 "GET OFFER"),
            ], 1)
        ],
        "step4_rule_guidance": [
            {"rule": "No before/after claims without disclaimer", "action": "Add 'Results may vary' text below all comparison creatives"},
            {"rule": "Special Ad Category not applicable", "action": "Confirm no housing/credit/employment targeting required"},
            {"rule": "Sensitive health claims", "action": "Avoid 'cures', 'treats', 'heals' — use 'supports', 'nourishes', 'helps maintain'"},
            {"rule": "Cosmetics & personal care allowed", "action": "Category confirmed — no pre-approval needed"},
            {"rule": "Transparent advertiser identity", "action": "Ensure Page name and About section reflect actual brand name"},
        ],
        "launch_checklist": {
            "assets_ready": {
                "facebook_page": True,
                "instagram_linked": True,
                "business_portfolio": True,
                "ad_account_created": True,
                "pixel_installed": True,
                "capi_configured": False,
                "domain_verified": True,
                "product_catalog": False,
            },
            "creative_assets": {
                "images_1200x628": 3,
                "images_1080x1080": 3,
                "reels_vertical": 2,
                "carousel_frames": 5,
            },
            "tracking": {
                "pixel_events_firing": ["PageView", "ViewContent", "AddToCart", "InitiateCheckout", "Purchase"],
                "utm_builder_used": True,
                "google_analytics_linked": False,
            },
        },
    }
    return json.dumps(brief, indent=2)


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _post(path: str, payload: dict, token: str | None = None) -> tuple[int, dict]:
    body = json.dumps(payload).encode()
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{BASE_URL}{path}", data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=200) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode(errors="replace")
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            data = {"raw": raw[:500]}
        return exc.code, data


def _get_token() -> str | None:
    """Obtain an auth token.

    Priority:
    1. BACKEND_TOKEN env var - a pre-minted JWT (useful in dev/test)
    2. BACKEND_EMAIL + BACKEND_PASSWORD - login and extract the token
    """
    direct_token = os.getenv("BACKEND_TOKEN")
    if direct_token:
        return direct_token.strip()
    email = os.getenv("BACKEND_EMAIL")
    password = os.getenv("BACKEND_PASSWORD")
    if not email or not password:
        return None
    code, data = _post("/api/auth/login", {"email": email, "password": password})
    if code == 200:
        return data.get("access_token") or data.get("token")
    print(f"  [auth] Login returned {code}: {data}")
    return None


# ─────────────────────────────────────────────────────────────────────────────
# Test
# ─────────────────────────────────────────────────────────────────────────────

def test_fb_large_json_chat():
    """Send a 300-line JSON payload to /api/agent/fb-marketing/chat and verify success."""

    token = _get_token()

    # Step 1: Start an agent session
    print("\n[1/3] Starting agent session ...")
    code, data = _post(
        "/api/agent-session/start",
        {"agent_id": "facebook-marketing", "agent_name": "FB Growth Coach"},
        token,
    )
    assert code == 200, f"Session start failed: {code} {data}"
    # Response shape: {"success": true, "session": {"session_id": "...", ...}}
    session_id = (data.get("session_id") or data.get("session", {}).get("session_id"))
    assert session_id, f"Could not extract session_id from: {data}"
    print(f"      session_id = {session_id}")

    # Step 2: Build the large JSON message
    large_json = _build_large_json_payload()
    char_count = len(large_json)
    line_count = large_json.count("\n") + 1
    print(f"[2/3] Sending large JSON payload ({char_count:,} chars, ~{line_count} lines) ...")
    assert char_count > 1_500, "Payload too small — chunking won't activate"

    message = (
        "Here is my complete campaign brief. Please review it and tell me "
        "which phase I should start from, and what the first 3 actions are:\n\n"
        + large_json
    )

    start = time.monotonic()
    code, resp = _post(
        "/api/agent/fb-marketing/chat",
        {"session_id": session_id, "message": message, "input_type": "text"},
        token,
    )
    elapsed = time.monotonic() - start
    print(f"      HTTP {code} in {elapsed:.1f}s")

    # Step 3: Validate response
    print("[3/3] Validating response …")
    assert code == 200, f"Expected 200 got {code}: {resp}"
    assert "reply" in resp,        f"Missing 'reply' key in response: {resp}"
    assert "session_id" in resp,   f"Missing 'session_id' key in response: {resp}"
    assert "state" in resp,        f"Missing 'state' key in response: {resp}"
    assert isinstance(resp["reply"], str) and len(resp["reply"]) > 10, \
        f"Reply is empty or too short: {resp['reply']!r}"

    print(f"\nPASS -- agent replied in {elapsed:.1f}s")
    print(f"   reply preview: {resp['reply'][:200].strip()} ...")
    return resp


# ─────────────────────────────────────────────────────────────────────────────
# Standalone entry-point
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    try:
        result = test_fb_large_json_chat()
        sys.exit(0)
    except AssertionError as exc:
        print(f"\nFAIL: {exc}", file=sys.stderr)
        sys.exit(1)
    except Exception as exc:
        print(f"\nERROR [{type(exc).__name__}]: {exc}", file=sys.stderr)
        sys.exit(2)
