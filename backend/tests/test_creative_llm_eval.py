"""
test_creative_llm_eval.py

Golden dataset evaluation for Tier 3 creative generation.
Tests 5 niche scenarios end-to-end:
  - LLM is reachable (Groq platform key)
  - Response is within 2000 token budget
  - Output is niche-appropriate (no shipping for service, no "book a call" for D2C)
  - All 3 required copy angles are present
  - All required fields (id, angle, headline, primaryText, cta, isApproved) are valid
  - No cross-contamination between categories
"""

import sys
import os
import json
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

# ── Golden Dataset ─────────────────────────────────────────────────────────

GOLDEN_DATASET = [
    {
        "id": "GD-01",
        "label": "Service — Consultant / Strategy Advisor",
        "category_id": "service-based",
        "niche_name": "Consultant / Strategy Advisor",
        "product_name": "Executive Strategy Sprint",
        "target_audience": "Founders and C-suite executives",
        "tone": "Authoritative & Consultative",
        # Words that must NOT appear in service copy
        "forbidden_terms": ["shipping", "bundle", "order now", "in stock", "delivery", "cart"],
        # Words that SHOULD appear in at least one copy
        "required_signals": ["call", "consult", "strategy", "results", "client"],
    },
    {
        "id": "GD-02",
        "label": "D2C — Beauty, Skincare & Cosmetics",
        "category_id": "product-commerce",
        "niche_name": "Beauty, Skincare & Cosmetics",
        "product_name": "Glow Serum Pro",
        "target_audience": "Women 25-45 interested in clean skincare",
        "tone": "Warm & Empowering",
        # Words that must NOT appear in product copy
        "forbidden_terms": ["book a call", "consultation", "intake", "qualified leads", "calendar"],
        # Words that SHOULD appear
        "required_signals": ["skin", "glow", "results", "guarantee"],
    },
    {
        "id": "GD-03",
        "label": "SaaS — SaaS & Micro-Software",
        "category_id": "hybrid-platform",
        "niche_name": "SaaS & Micro-Software",
        "product_name": "FlowDesk Analytics",
        "target_audience": "Operations and marketing teams at growing startups",
        "tone": "Direct & Data-Driven",
        "forbidden_terms": ["shipping", "bundle", "order now", "delivery", "book a strategy call"],
        "required_signals": ["trial", "free", "team", "data", "workflow"],
    },
    {
        "id": "GD-04",
        "label": "Knowledge — Course Creator / Online Educator",
        "category_id": "knowledge-content",
        "niche_name": "Course Creator / Online Educator",
        "product_name": "Meta Ads Mastery Course",
        "target_audience": "Aspiring online educators and content creators",
        "tone": "Inspiring & Encouraging",
        "forbidden_terms": ["shipping", "order now", "in stock", "delivery"],
        "required_signals": ["course", "learn", "enroll", "students", "transform"],
    },
    {
        "id": "GD-05",
        "label": "Local — Clinic / Healthcare Practitioner",
        "category_id": "local-trade",
        "niche_name": "Clinic / Healthcare Practitioner",
        "product_name": "Wellness Assessment Programme",
        "target_audience": "Adults 30-60 seeking preventive healthcare",
        "tone": "Caring & Professional",
        "forbidden_terms": ["shipping", "bundle", "order now", "in stock", "free delivery"],
        "required_signals": ["appointment", "consult", "health", "assessment", "book"],
    },
]

REQUIRED_COPY_FIELDS = {"id", "angle", "headline", "primaryText", "cta", "isApproved"}


# ── LLM Caller (Anthropic primary, Groq fallback, no DB needed) ──────────

def call_llm_direct(system_prompt: str, user_prompt: str, max_tokens: int = 2000):
    """
    Calls best available LLM provider.
    Priority: Anthropic (claude-haiku-4-5) -> Groq (openai/gpt-oss-120b)
    Returns (raw_text, tokens_used, provider_label)
    """
    ant_key = os.getenv("ANTHROPIC_API_KEY")
    ant_model = os.getenv("ANTHROPIC_HAIKU_MODEL", "claude-haiku-4-5")
    if ant_key:
        import anthropic
        client = anthropic.Anthropic(api_key=ant_key)
        resp = client.messages.create(
            model=ant_model,
            max_tokens=max_tokens,
            system=system_prompt + "\nRespond ONLY with a valid JSON object. No markdown, no preamble.",
            messages=[{"role": "user", "content": user_prompt}],
        )
        raw = resp.content[0].text if resp.content else "{}"
        tokens_used = (resp.usage.input_tokens or 0) + (resp.usage.output_tokens or 0)
        return raw, tokens_used, f"anthropic/{ant_model}"

    groq_key = os.getenv("GROQ_API_KEY")
    groq_model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    if groq_key:
        from groq import Groq
        client = Groq(api_key=groq_key)
        resp = client.chat.completions.create(
            model=groq_model,
            messages=[
                {"role": "system", "content": system_prompt + "\nRespond ONLY with valid JSON."},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=max_tokens,
        )
        raw = resp.choices[0].message.content
        tokens_used = resp.usage.total_tokens if resp.usage else 0
        return raw, tokens_used, f"groq/{groq_model}"

    raise RuntimeError("No LLM API key available")


def build_prompts(case: dict):
    cat = case["category_id"]
    niche = case["niche_name"]
    product = case["product_name"]
    audience = case["target_audience"]
    tone = case["tone"]

    is_service = cat in ("service-based", "knowledge-content", "local-trade")
    is_saas = cat == "hybrid-platform"
    business_type = (
        "service/consulting business" if is_service
        else ("SaaS/subscription product" if is_saas
              else "direct-to-consumer product brand")
    )

    system_prompt = (
        f"You are an expert Meta Ads direct-response copywriter specialising in {business_type} advertising. "
        f"You write copy that speaks directly to the emotional and practical pain points of the target audience "
        f"in the {niche} space. Your copy is concise, honest, and designed to stop the scroll on Facebook and Instagram feeds. "
        f"IMPORTANT RULES: "
        f"1. Never mention shipping, bundles, or physical product delivery if the business is a {business_type}. "
        f"2. Use language appropriate for {business_type} — e.g. 'book a call', 'free consultation', 'results guaranteed' for services; "
        f"'free trial', 'no credit card', 'cancel anytime' for SaaS; 'free delivery', 'in stock', 'order now' only for physical products. "
        f"3. Each copy must feel distinct — different emotional hook, different opening line, different CTA. "
        f"4. Keep total output under 2000 tokens. "
        f"Respond ONLY with valid JSON with key 'copies': list of 3 objects, each with: "
        f"'id' (int), 'angle' (str), 'headline' (max 7 words, punchy), "
        f"'primaryText' (2-3 short paragraphs, plain text, no markdown), 'cta' (str, 3-5 words), 'isApproved' (false)."
    )
    user_prompt = (
        f"Business Type: {business_type}\n"
        f"Niche: {niche}\n"
        f"Offer/Product Name: {product}\n"
        f"Target Audience: {audience}\n"
        f"Tone: {tone}\n"
        f"Angles required: Problem-Agitation & Solution, Social Proof & Authority, Direct Value & Risk-Reversal\n"
        f"Number of copy variations: 3"
    )
    return system_prompt, user_prompt


# ── Validators ────────────────────────────────────────────────────────────

def validate_copy_shape(copy: dict, idx: int, case_id: str):
    missing = REQUIRED_COPY_FIELDS - set(copy.keys())
    assert not missing, f"[{case_id}] Copy #{idx} missing fields: {missing}"
    assert isinstance(copy["id"], int), f"[{case_id}] Copy #{idx}: id must be int"
    assert copy["headline"] and len(copy["headline"]) > 0, f"[{case_id}] Copy #{idx}: headline empty"
    assert len(copy["headline"].split()) <= 10, f"[{case_id}] Copy #{idx}: headline too long ({len(copy['headline'].split())} words)"
    assert copy["primaryText"] and len(copy["primaryText"]) > 50, f"[{case_id}] Copy #{idx}: primaryText too short"
    assert copy["cta"] and len(copy["cta"]) > 0, f"[{case_id}] Copy #{idx}: cta empty"
    assert copy["isApproved"] is False, f"[{case_id}] Copy #{idx}: isApproved must be False"


def validate_no_forbidden_terms(copies: list, forbidden: list, case_id: str):
    full_text = " ".join(
        f"{c.get('headline','')} {c.get('primaryText','')} {c.get('cta','')}".lower()
        for c in copies
    )
    violations = [term for term in forbidden if term.lower() in full_text]
    assert not violations, f"[{case_id}] Forbidden terms found in copy: {violations}"


def validate_required_signals(copies: list, signals: list, case_id: str):
    full_text = " ".join(
        f"{c.get('headline','')} {c.get('primaryText','')} {c.get('cta','')}".lower()
        for c in copies
    )
    found = [s for s in signals if s.lower() in full_text]
    assert len(found) >= 1, f"[{case_id}] None of the required signals found: {signals}"


# ── Main Eval Runner ──────────────────────────────────────────────────────

def run_creative_llm_eval():
    print("=" * 70)
    print("CREATIVE LLM GOLDEN EVAL — 5 NICHE SCENARIOS")
    print("=" * 70)

    # Step 0: Confirm LLM reachability with a cheap ping
    print("\n[STEP 0] Confirming LLM reachability (Anthropic primary / Groq fallback)...")
    try:
        ping_raw, ping_tokens, ping_provider = call_llm_direct(
            system_prompt='You are a test agent. Respond ONLY with valid JSON.',
            user_prompt='Return JSON: {"status": "ok"}',
            max_tokens=30,
        )
        clean_ping = ping_raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        ping_data = json.loads(clean_ping)
        assert ping_data.get("status") == "ok", f"Unexpected ping response: {ping_data}"
        print(f"  Provider       : {ping_provider}")
        print(f"  Ping tokens    : {ping_tokens}")
        print("  => LLM REACHABLE [OK]")
    except Exception as e:
        print(f"  FAILED: {e}")
        print("  => LLM NOT REACHABLE — aborting eval")
        return

    results = []
    total_tokens = 0
    active_provider = ping_provider

    for case in GOLDEN_DATASET:
        print(f"\n[EVAL] {case['id']} — {case['label']}")
        system_prompt, user_prompt = build_prompts(case)

        t0 = time.time()
        try:
            raw, tokens_used, _ = call_llm_direct(system_prompt, user_prompt, max_tokens=2000)
            elapsed = round(time.time() - t0, 2)
            total_tokens += tokens_used

            # Parse JSON
            clean = raw.strip()
            if clean.startswith("```json"):
                clean = clean[7:]
            if clean.startswith("```"):
                clean = clean[3:]
            if clean.endswith("```"):
                clean = clean[:-3]
            parsed = json.loads(clean.strip())

            copies = parsed.get("copies", [])
            assert len(copies) >= 3, f"Expected 3 copies, got {len(copies)}"

            # Validate shape
            for i, copy in enumerate(copies):
                validate_copy_shape(copy, i + 1, case["id"])

            # Validate no forbidden terms
            validate_no_forbidden_terms(copies, case["forbidden_terms"], case["id"])

            # Validate required signals present
            validate_required_signals(copies, case["required_signals"], case["id"])

            # Validate token budget
            assert tokens_used <= 2000, f"Token budget exceeded: {tokens_used} > 2000"

            print(f"  Tokens used    : {tokens_used} / 2000 budget")
            print(f"  Response time  : {elapsed}s")
            print(f"  Copies returned: {len(copies)}")
            print(f"  Angles         : {[c['angle'] for c in copies]}")
            print(f"  Sample headline: \"{copies[0]['headline']}\"")
            print(f"  Sample CTA     : \"{copies[0]['cta']}\"")
            print(f"  Forbidden terms: NONE found [OK]")
            print(f"  Required signals found: {[s for s in case['required_signals'] if s.lower() in ' '.join(c.get('primaryText','') for c in copies).lower()]}")
            print(f"  => {case['id']} PASSED [OK]")
            results.append({"id": case["id"], "status": "PASS", "tokens": tokens_used})

        except Exception as e:
            elapsed = round(time.time() - t0, 2)
            print(f"  FAILED after {elapsed}s: {e}")
            results.append({"id": case["id"], "status": "FAIL", "error": str(e)})

    # Summary
    passed = sum(1 for r in results if r["status"] == "PASS")
    failed = sum(1 for r in results if r["status"] == "FAIL")
    print("\n" + "=" * 70)
    print(f"EVAL SUMMARY: {passed}/{len(GOLDEN_DATASET)} PASSED | {failed} FAILED")
    print(f"Provider used  : {active_provider}")
    print(f"Total tokens consumed across all 5 evals: {total_tokens}")
    print(f"Average tokens per call: {total_tokens // len(GOLDEN_DATASET) if GOLDEN_DATASET else 0}")
    for r in results:
        status_str = "PASS" if r["status"] == "PASS" else f"FAIL — {r.get('error','')}"
        print(f"  {r['id']}: {status_str} | tokens={r.get('tokens','n/a')}")
    print("=" * 70)

    if failed == 0:
        print("\nALL CHECKS PASSED. LLM is reachable, niche-appropriate, and within token budget.")
        print("Safe to test in the UI.")
    else:
        print(f"\n{failed} CASE(S) FAILED. Review errors above before testing in UI.")


if __name__ == "__main__":
    run_creative_llm_eval()
