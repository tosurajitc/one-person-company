"""Server-side rules for the study-abroad consultant template (V1).

Mirrors frontend/lib/study-migration-schema.js and frontend/lib/custom-fields.js.
Keep the two in sync when changing limits, field keys or the honesty rules.

Used by:
  - study_consult_routes.py   -> validate_submission()
  - site_build_routes.py      -> validate_template_data()  (call before publishing; not wired yet)
"""
from __future__ import annotations

import re
from datetime import date, datetime, timezone
from typing import Any

STALE_AFTER_MONTHS = 6
MAX_CUSTOM_FIELDS = 12
MAX_EXTRAS = 8
MAX_OPTIONS = 20

CREDENTIAL_KINDS = {"licence", "membership", "certification", "partner_status"}
CONSULT_MODES = {"online", "video", "phone", "office"}
PRACTICE_TYPES = {"education", "education_and_migration"}

# Built-in pre-screen fields. key -> (type, locked, default_enabled, default_required)
BUILTIN_FIELDS: dict[str, tuple[str, bool, bool, bool]] = {
    "full_name": ("text", True, True, True),
    "email": ("email", True, True, True),
    "phone": ("tel", False, True, True),
    "city": ("text", False, True, False),
    "nationality": ("text", False, True, False),
    "date_of_birth": ("date", False, False, False),
    "current_level": ("select", False, True, False),
    "graduation_year": ("number", False, True, False),
    "marks": ("text", False, True, False),
    "backlogs_or_gaps": ("select", False, True, False),
    "target_countries": ("multi_select", False, True, True),
    "degree_level": ("select", False, True, False),
    "field_of_study": ("text", False, True, False),
    "intended_intake": ("text", False, True, False),
    "test_type": ("select", False, True, False),
    "test_status": ("select", False, True, False),
    "test_score": ("text", False, True, False),
    "years_experience": ("number", False, True, False),
    "work_field": ("text", False, True, False),
    "budget_range": ("text", False, True, False),
    "funding_source": ("select", False, True, False),
    "scholarship_expected": ("yes_no", False, True, False),
    "prior_visa_refusal": ("yes_no", False, True, False),
    "applying_with_dependants": ("yes_no", False, True, False),
}

DEFAULT_CONSULTATION_TYPES = [
    {"key": "discovery", "title": "Discovery call", "duration_min": 15, "modes": ["phone", "video"], "fee": None}
]

_KEY_RE = re.compile(r"^x_[a-z0-9_]{1,40}$")
_SAFE_IMG = re.compile(r"^(https://|/(?!/))", re.I)
_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
_EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
CUSTOM_TYPES = {"text", "long_text", "number", "select", "multi_select", "date", "checkbox", "url"}
_FREE_ENTRY = {"text", "long_text", "number"}

_BLOCKED_LABELS = [
    re.compile(p, re.I)
    for p in (
        r"passport",
        r"national\s*id",
        r"aadh?aa?r",
        r"\bpan\b",
        r"\bssn\b",
        r"social\s*security",
        r"bank\s*(account|details|statement)",
        r"account\s*number",
        r"card\s*number",
        r"credit\s*card",
        r"debit\s*card",
        r"\bcvv\b",
        r"\biban\b",
        r"\bpassword\b",
        r"\botp\b",
        r"driving\s*licen[cs]e",
        r"tax\s*(id|number)",
    )
]

# ---------------------------------------------------------------------------
# Honesty rules
# ---------------------------------------------------------------------------

_OBJ = (
    r"(?:visas?|admissions?|pr|permanent\s+residen(?:ce|cy)|approvals?|scholarships?|jobs?|success|"
    r"offer\s+letters?|study\s+permits?)"
)
_BANNED = [
    re.compile(
        rf"\b(?:guarantee[ds]?|guaranteeing|assured|assure[ds]?|promise[ds]?)\s+(?:a\s+|an\s+|the\s+|your\s+|you\s+)?{_OBJ}\b",
        re.I,
    ),
    re.compile(r"\b(?:100\s*%|hundred\s+percent)\s*(?:visa|admission|success|approval|guarantee|placement|pr)\b", re.I),
    re.compile(r"\bsure[\s-]?shot\b", re.I),
    re.compile(r"\bno\s+risk\s+of\s+(?:refusal|rejection)\b", re.I),
    re.compile(r"\b(?:visa|admission|pr)\s+(?:is\s+)?(?:guaranteed|assured|certain)\b", re.I),
]
_NEGATION = re.compile(
    r"\b(?:not|never|cannot|can't|cant|don't|dont|doesn't|doesnt|won't|wont|no|without|neither|nor)\b", re.I
)
_SENTENCES = re.compile(r"[^.!?]+[.!?]*")


def find_banned_phrases(text: str) -> list[str]:
    """Phrases that promise outcomes. Questions and negated sentences are allowed."""
    if not isinstance(text, str) or not text:
        return []
    hits: list[str] = []
    for sentence in _SENTENCES.findall(text) or [text]:
        if sentence.strip().endswith("?"):
            continue
        for rx in _BANNED:
            m = rx.search(sentence)
            if not m:
                continue
            before = sentence[max(0, m.start() - 40) : m.start()]
            if _NEGATION.search(before):
                continue
            hits.append(m.group(0).strip())
    return hits


def _walk_strings(value: Any, path: str = ""):
    if isinstance(value, str):
        yield path, value
    elif isinstance(value, list):
        for i, v in enumerate(value):
            yield from _walk_strings(v, f"{path}[{i}]")
    elif isinstance(value, dict):
        for k, v in value.items():
            yield from _walk_strings(v, f"{path}.{k}" if path else str(k))


# ---------------------------------------------------------------------------
# Dates
# ---------------------------------------------------------------------------


def _parse_date(s: Any) -> date | None:
    if not isinstance(s, str) or not _DATE_RE.match(s):
        return None
    try:
        return date.fromisoformat(s)
    except ValueError:
        return None


def months_since(s: str, today: date | None = None) -> float:
    d = _parse_date(s)
    if d is None:
        return float("inf")
    t = today or datetime.now(timezone.utc).date()
    months = (t.year - d.year) * 12 + (t.month - d.month)
    if t.day < d.day:
        months -= 1
    return months


def is_stale(s: str | None, months: int = STALE_AFTER_MONTHS, today: date | None = None) -> bool:
    return not s or months_since(s, today) >= months


# ---------------------------------------------------------------------------
# Custom fields
# ---------------------------------------------------------------------------


def validate_custom_field_defs(defs: Any) -> list[dict]:
    errors: list[dict] = []
    if defs is None:
        return errors
    if not isinstance(defs, list):
        return [{"index": -1, "message": "Custom fields must be a list."}]
    if len(defs) > MAX_CUSTOM_FIELDS:
        errors.append({"index": -1, "message": f"Use at most {MAX_CUSTOM_FIELDS} custom questions."})
    seen: set[str] = set()
    for i, d in enumerate(defs):
        def add(msg: str, _i: int = i) -> None:
            errors.append({"index": _i, "message": msg})

        if not isinstance(d, dict):
            add("Invalid question.")
            continue
        key = d.get("key") or ""
        if not _KEY_RE.match(key):
            add("Key must start with x_ and use lowercase letters, numbers and underscores.")
        elif key in seen:
            add("Key is used twice.")
        elif key in BUILTIN_FIELDS:
            add("Key clashes with a built-in field.")
        seen.add(key)
        label = str(d.get("label") or "").strip()
        ftype = d.get("type")
        if not label:
            add("Question text is required.")
        if len(label) > 120:
            add("Question text is too long (120 characters maximum).")
        if ftype not in CUSTOM_TYPES:
            add("Unsupported answer type.")
        if ftype in _FREE_ENTRY and any(rx.search(label) for rx in _BLOCKED_LABELS):
            add("This question asks for identity or payment details. Collect those later through a secure channel.")
        if ftype in ("select", "multi_select"):
            opts = d.get("options") or []
            if not isinstance(opts, list) or not (2 <= len(opts) <= MAX_OPTIONS):
                add(f"Provide between 2 and {MAX_OPTIONS} options.")
            elif any((not isinstance(o, str)) or not o.strip() or len(o) > 80 for o in opts):
                add("Each option must be text of 80 characters or fewer.")
        sw = d.get("show_when")
        if sw is not None:
            ok = isinstance(sw, dict) and isinstance(sw.get("field"), str) and (("equals" in sw) != ("includes" in sw))
            if not ok:
                add("show_when needs a field and either equals or includes.")
    return errors


def _is_visible(d: dict, ctx: dict) -> bool:
    sw = d.get("show_when")
    if not sw:
        return True
    v = ctx.get(sw.get("field"))
    if "includes" in sw:
        return sw["includes"] in v if isinstance(v, list) else v == sw["includes"]
    if "equals" in sw:
        return v == sw["equals"] or (v is not None and str(v) == str(sw["equals"]))
    return True


def _empty(v: Any) -> bool:
    return v is None or v == "" or (isinstance(v, list) and len(v) == 0)


def validate_custom_answers(defs: list[dict], answers: dict, ctx: dict) -> tuple[dict, dict]:
    """Returns (clean, errors). Answers for keys not defined by the site are dropped."""
    clean: dict[str, Any] = {}
    errors: dict[str, str] = {}
    answers = answers or {}
    context = {**ctx, **answers}
    for d in defs or []:
        key = d.get("key")
        if not key or not _is_visible(d, context):
            continue
        v = answers.get(key)
        ftype = d.get("type")
        if _empty(v) or (ftype == "checkbox" and v is False):
            if d.get("required"):
                errors[key] = "This answer is required."
            continue
        opts = d.get("options") or []
        if ftype == "text":
            if not isinstance(v, str) or len(v) > 200:
                errors[key] = "Use 200 characters or fewer."
            else:
                clean[key] = v.strip()
        elif ftype == "long_text":
            if not isinstance(v, str) or len(v) > 2000:
                errors[key] = "Use 2000 characters or fewer."
            else:
                clean[key] = v.strip()
        elif ftype == "number":
            if isinstance(v, bool) or not isinstance(v, (int, float)):
                errors[key] = "Enter a number."
            else:
                clean[key] = v
        elif ftype == "select":
            if v not in opts:
                errors[key] = "Choose one of the options."
            else:
                clean[key] = v
        elif ftype == "multi_select":
            if not isinstance(v, list) or any(x not in opts for x in v):
                errors[key] = "Choose from the listed options."
            else:
                clean[key] = v
        elif ftype == "date":
            if _parse_date(v) is None:
                errors[key] = "Enter a valid date."
            else:
                clean[key] = v
        elif ftype == "checkbox":
            clean[key] = v is True
        elif ftype == "url":
            if isinstance(v, str) and re.match(r"^https?://\S+$", v):
                clean[key] = v
            else:
                errors[key] = "Enter a web address starting with http:// or https://."
    return clean, errors


# ---------------------------------------------------------------------------
# Pre-screen fields and submission validation
# ---------------------------------------------------------------------------


def prescreen_fields(td: dict) -> list[dict]:
    """Built-in fields switched on for this site, with the owner's required flags applied."""
    cfg = ((td or {}).get("prescreen") or {}).get("fields") or {}
    out = []
    for key, (ftype, locked, d_enabled, d_required) in BUILTIN_FIELDS.items():
        c = cfg.get(key) or {}
        enabled = True if locked else c.get("enabled", d_enabled)
        required = d_required if locked else c.get("required", d_required)
        if enabled:
            out.append({"key": key, "type": ftype, "required": bool(required)})
    return out


def _coerce_builtin(f: dict, raw: Any) -> tuple[Any, str | None]:
    t = f["type"]
    if _empty(raw):
        return None, None
    if t in ("text", "select"):
        if not isinstance(raw, str) or len(raw) > 200:
            return None, "Use 200 characters or fewer."
        return raw.strip(), None
    if t == "email":
        if not isinstance(raw, str) or len(raw) > 254 or not _EMAIL_RE.match(raw.strip()):
            return None, "Enter a valid email address."
        return raw.strip(), None
    if t == "tel":
        if not isinstance(raw, str) or len(raw) > 40 or len(re.sub(r"\D", "", raw)) < 7:
            return None, "Enter a phone number with at least 7 digits."
        return raw.strip(), None
    if t == "number":
        if isinstance(raw, bool) or not isinstance(raw, (int, float)):
            return None, "Enter a number."
        return raw, None
    if t == "date":
        if _parse_date(raw) is None:
            return None, "Enter a valid date."
        return raw, None
    if t == "yes_no":
        if raw not in ("yes", "no"):
            return None, "Choose yes or no."
        return raw, None
    if t == "multi_select":
        if not isinstance(raw, list) or len(raw) > 20 or any((not isinstance(x, str)) or len(x) > 40 for x in raw):
            return None, "Choose from the listed options."
        return raw, None
    return None, "Unsupported field."


def validate_submission(
    td: dict,
    type_key: str,
    mode: str | None,
    profile: dict,
    custom: dict,
) -> tuple[dict, dict, dict]:
    """Validate a visitor's request against THIS site's configuration.

    Returns (clean_profile, clean_custom, field_errors). Unknown profile and custom keys are dropped.
    """
    errors: dict[str, str] = {}
    td = td or {}
    types = td.get("consultation_types") or DEFAULT_CONSULTATION_TYPES
    match = next((t for t in types if t.get("key") == type_key), None)
    if not match:
        errors["type"] = "Choose one of the listed sessions."
    else:
        modes = match.get("modes") or []
        if modes and mode not in modes:
            errors["mode"] = "Choose how you would like to meet."

    clean_profile: dict[str, Any] = {}
    profile = profile or {}
    for f in prescreen_fields(td):
        value, err = _coerce_builtin(f, profile.get(f["key"]))
        if err:
            errors[f["key"]] = err
        elif value is None:
            if f["required"]:
                errors[f["key"]] = "This answer is required."
        else:
            clean_profile[f["key"]] = value

    defs = ((td.get("prescreen") or {}).get("custom_fields")) or []
    clean_custom, cerrors = validate_custom_answers(defs, custom or {}, clean_profile)
    errors.update(cerrors)
    return clean_profile, clean_custom, errors


# ---------------------------------------------------------------------------
# template_data validation (call from the build route before publishing)
# ---------------------------------------------------------------------------


def _has_policy(p: Any) -> bool:
    return isinstance(p, dict) and bool((p.get("url") or "").strip() or (p.get("body") or "").strip())


def validate_template_data(td: dict | None, today: date | None = None, business: dict | None = None) -> dict[str, list[dict]]:
    """Returns {"errors": [...], "warnings": [...]}. Errors block publishing."""
    td = td or {}
    errors: list[dict] = []
    warnings: list[dict] = []

    def err(path: str, msg: str) -> None:
        errors.append({"path": path, "message": msg})

    def warn(path: str, msg: str) -> None:
        warnings.append({"path": path, "message": msg})

    t = today or datetime.now(timezone.utc).date()
    practice = td.get("practice") or {}
    migration = practice.get("type") == "education_and_migration"
    if practice.get("type", "education") not in PRACTICE_TYPES:
        err("practice.type", "Unknown practice type.")

    photo = str((business or {}).get("founder_photo_url") or "").strip()
    if photo and not _SAFE_IMG.match(photo):
        err("business.founder_photo_url", "Use an https:// address or a path starting with a single /.")

    creds = td.get("credentials") or []
    if not creds:
        err("credentials", "Add at least one licence, registration or membership.")
    for i, c in enumerate(creds):
        if c.get("kind") not in CREDENTIAL_KINDS:
            err(f"credentials[{i}].kind", "Choose a credential type.")
        if not (c.get("issuing_body") or "").strip():
            err(f"credentials[{i}].issuing_body", "Enter who issued this.")
        if not (c.get("number") or "").strip():
            err(f"credentials[{i}].number", "Enter the registration or membership number.")
        vu = c.get("valid_until")
        if vu:
            d = _parse_date(vu)
            if d is None:
                err(f"credentials[{i}].valid_until", "Enter a valid date.")
            elif d < t:
                warn(f"credentials[{i}].valid_until", "This credential has expired.")

    if migration:
        if not (practice.get("authorisation_statement") or "").strip():
            err("practice.authorisation_statement", "Migration advice needs a statement of who is authorised to give it.")
        if not any(c.get("kind") == "licence" for c in creds):
            err("credentials", "Migration advice needs at least one licence or authorisation entry.")

    pol = td.get("policies") or {}
    for key, label in (("privacy", "privacy policy"), ("refund", "fee-refund policy"), ("cancellation", "cancellation policy")):
        if not _has_policy(pol.get(key)):
            err(f"policies.{key}", f"Add a {label} (link or text).")
    g = pol.get("grievance") or {}
    if not ((g.get("email") or "").strip() or (g.get("phone") or "").strip()):
        err("policies.grievance", "Add a grievance contact (email or phone).")

    for i, d in enumerate(td.get("destinations") or []):
        lv = d.get("last_verified")
        if not d.get("country_code"):
            err(f"destinations[{i}].country_code", "Choose a country.")
        img = str(d.get("image_url") or "").strip()
        if img and not _SAFE_IMG.match(img):
            err(f"destinations[{i}].image_url", "Use an https:// address or a path starting with a single /.")
        if _parse_date(lv) is None:
            err(f"destinations[{i}].last_verified", "Enter the date you last checked this information.")
        elif is_stale(lv, today=t):
            warn(f"destinations[{i}].last_verified", f"Last checked more than {STALE_AFTER_MONTHS} months ago.")

    for i, s in enumerate(td.get("success_stories") or []):
        if s.get("consent_confirmed") is True:
            if _parse_date(s.get("consent_date")) is None:
                err(f"success_stories[{i}].consent_date", "Record the date the student gave permission.")
            if not s.get("consent_scope"):
                err(f"success_stories[{i}].consent_scope", "Record what the student allowed you to publish.")
        else:
            warn(f"success_stories[{i}]", "No recorded permission, so this story will not appear.")

    for e in validate_custom_field_defs((td.get("prescreen") or {}).get("custom_fields")):
        err("prescreen.custom_fields" + (f"[{e['index']}]" if e["index"] >= 0 else ""), e["message"])

    wh = ((td.get("integrations") or {}).get("webhook_url") or "").strip()
    if wh and not wh.lower().startswith("https://"):
        err("integrations.webhook_url", "The webhook address must start with https://.")

    for path, text in _walk_strings(td):
        for phrase in find_banned_phrases(text):
            err(path, f'Remove "{phrase}". Outcomes cannot be promised.')

    return {"errors": errors, "warnings": warnings}
