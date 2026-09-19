"""
Tests for services/reserved_names.py

These tests do not touch the database. They only check the pure logic:
format rules and the reserved-word list. Run them with:

    pytest backend/tests/test_services/test_reserved_names.py -v

(run from the backend folder, with your virtual environment active)
"""

from app.services.reserved_names import (
    is_valid_format,
    is_reserved,
    is_available,
    normalize,
)


def test_normalize_lowercases_and_strips():
    assert normalize("  Jane-Doe  ") == "jane-doe"


def test_valid_format_accepts_normal_slug():
    assert is_valid_format("jane-doe") is True
    assert is_valid_format("studio2") is True


def test_valid_format_rejects_too_short():
    assert is_valid_format("ab") is False


def test_valid_format_rejects_leading_or_trailing_hyphen():
    assert is_valid_format("-jane") is False
    assert is_valid_format("jane-") is False


def test_valid_format_rejects_uppercase_and_symbols():
    assert is_valid_format("Jane_Doe") is False
    assert is_valid_format("jane doe") is False
    assert is_valid_format("jane@doe") is False


def test_reserved_frontend_route_is_blocked():
    assert is_reserved("admin") is True
    assert is_reserved("PRICING") is True   # case-insensitive
    assert is_reserved("dashboard") is True


def test_reserved_backend_route_is_blocked():
    assert is_reserved("api") is True
    assert is_reserved("health") is True


def test_reserved_safety_word_is_blocked():
    assert is_reserved("www") is True
    assert is_reserved("genie") is True


def test_normal_name_is_not_reserved():
    assert is_reserved("jane-doe-studio") is False


def test_is_available_true_for_good_name_no_db():
    ok, reason = is_available("jane-doe-studio")
    assert ok is True
    assert reason is None


def test_is_available_false_for_reserved_name():
    ok, reason = is_available("admin")
    assert ok is False
    assert "reserved" in reason.lower()


def test_is_available_false_for_bad_format():
    ok, reason = is_available("ab")
    assert ok is False
    assert reason is not None