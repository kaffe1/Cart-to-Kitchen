"""Pure-function tests: the logic whose edge cases cannot be reached through
live HTTP (clock and inventory state are not controllable there). All HTTP
behaviour is covered by the Postman collection — see README."""

from datetime import UTC, datetime
from types import SimpleNamespace
from zoneinfo import ZoneInfo

from app.profanity import MAX_REVIEW_TEXT_LENGTH, PATTERN, check_review
from app.services.recipe_service import history_public, match_tiers
from app.services.wallet_service import grants_between, next_grant_at
from app.errors import RuleValidation

import pytest

STOCKHOLM = ZoneInfo("Europe/Stockholm")


def test_history_timestamp_is_explicitly_serialized_as_utc():
    entry = SimpleNamespace(
        id=1,
        meal_id="recipe-1",
        meal_name="Test meal",
        cooked_at=datetime(2026, 10, 19, 12, 30),
        review_text=None,
        review_image=None,
    )

    assert history_public(entry)["cookedAt"] == "2026-10-19T12:30:00+00:00"


# --- wallet grant math --------------------------------------------------------


def _naive_stockholm(y, m, d, h, minute=0):
    return datetime(y, m, d, h, minute, tzinfo=STOCKHOLM).astimezone(UTC).replace(tzinfo=None)


def test_grants_accrue_for_full_working_hours_only():
    assert grants_between(_naive_stockholm(2026, 9, 29, 9), _naive_stockholm(2026, 9, 29, 12)) == 3
    assert grants_between(_naive_stockholm(2026, 9, 29, 9, 30), _naive_stockholm(2026, 9, 29, 11, 30)) == 2
    assert grants_between(_naive_stockholm(2026, 9, 29, 7), _naive_stockholm(2026, 9, 29, 9)) == 0
    assert grants_between(_naive_stockholm(2026, 9, 29, 18), _naive_stockholm(2026, 9, 29, 20)) == 0
    assert grants_between(_naive_stockholm(2026, 9, 28, 16), _naive_stockholm(2026, 9, 29, 10)) == 2


def test_next_grant_boundaries():
    assert next_grant_at(_naive_stockholm(2026, 9, 29, 8, 30)) == datetime(2026, 9, 29, 9, 0, tzinfo=STOCKHOLM)
    assert next_grant_at(_naive_stockholm(2026, 9, 29, 12, 10)) == datetime(2026, 9, 29, 13, 0, tzinfo=STOCKHOLM)
    assert next_grant_at(_naive_stockholm(2026, 9, 29, 17, 30)) is None


# --- three-tier match ---------------------------------------------------------


def _recipe(id, missing):
    return {"id": id, "name": id.title(), "thumbUrl": f"{id}.jpg", "ingredientIds": missing}


def test_match_tiers_boundaries():
    tiers = match_tiers([_recipe("all", []), _recipe("one", ["a"]), _recipe("two", ["a", "b"]), _recipe("three", ["a", "b", "c"])])
    assert [r["id"] for r in tiers["ready"]] == ["all"]
    assert [r["id"] for r in tiers["almost"]] == ["one", "two"]
    assert [r["id"] for r in tiers["needShopping"]] == ["three"]
    assert tiers["almost"][0]["missingCount"] == 1


# --- review profanity filter --------------------------------------------------


def test_profanity_rejects_listed_words_not_substrings():
    with pytest.raises(RuleValidation):
        check_review("This tastes like shit")
    with pytest.raises(RuleValidation):
        check_review("DAMN good meal")
    check_review("The hellfire chicken was great")  # substring, not the word
    check_review("A classic dish, loved it")  # "class" inside classic stays


def test_profanity_pattern_word_boundaries():
    assert PATTERN.search("what a damn joke")
    assert not PATTERN.search("hellfire")


def test_review_length_counts_visible_text_instead_of_html_tags():
    check_review(f"<p><strong>{'a' * MAX_REVIEW_TEXT_LENGTH}</strong></p>")
    with pytest.raises(RuleValidation) as error:
        check_review(f"<p>{'a' * (MAX_REVIEW_TEXT_LENGTH + 1)}</p>")
    assert error.value.details == {"code": "REVIEW_TOO_LONG"}


def test_review_rejects_markup_without_visible_text():
    with pytest.raises(RuleValidation) as error:
        check_review("<p><strong></strong></p>")
    assert error.value.details == {"code": "REVIEW_EMPTY"}
