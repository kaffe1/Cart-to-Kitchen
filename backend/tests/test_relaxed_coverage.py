"""Audit rules never enable unknown ingredients or change the live resolver."""
import pytest

from app.data.pantry import SUPPORTED_IDS
from app.data.ingredient_mappings import (
    FIRST_TIER_MAPPINGS as ALIASES,
    SECOND_TIER_MAPPINGS as FAMILIES,
)
from app.db import bootstrap, make_engine, make_session_factory
from app.services.recipe_service import _name_index
from scripts.relaxed_coverage import evaluate, resolve
from scripts.relaxed_rules import ADAPTATIONS


@pytest.fixture
def known():
    engine = make_engine("sqlite://")
    bootstrap(engine)
    with make_session_factory(engine)() as db:
        return {name: row.id for name, row in _name_index(db).items()}


def test_every_simulation_target_belongs_to_existing_110_items():
    seen = set()
    for rules in (ALIASES, FAMILIES, ADAPTATIONS):
        assert not seen.intersection(rules), "Conflicting tiers must be reviewed explicitly"
        seen.update(rules)
        assert all(targets and set(targets) <= SUPPORTED_IDS for targets in rules.values())


def test_tiers_distinguish_names_from_substitutions(known):
    assert resolve("Lemons", known, 0) is None
    assert resolve("Lemons", known, 1) == ("lemon",)
    assert resolve("Chicken Thighs", known, 1) is None
    assert resolve("Chicken Thighs", known, 2) == ("chicken-breast",)
    assert resolve("Fish Sauce", known, 2) is None
    assert resolve("Fish Sauce", known, 3) == ("soy-sauce",)
    assert resolve("Self-Raising Flour", known, 3) == ("flour", "baking-powder", "salt")
    assert resolve("Mayonnaise", known, 3) == ("egg", "vegetable-oil", "vinegar")


def test_never_uses_substring_fuzzy_matching_or_drops_unknowns(known):
    for name in ("Unlisted mystery spice", "Gelatine Leafs", "Coconut", "Orange", "Lamb Kidney", "salted unknown sea monster"):
        assert resolve(name, known, 3) is None
    meals = [
        {"id": "1", "name": "strict", "ingredients": ["Milk"]},
        {"id": "2", "name": "alias", "ingredients": ["Lemons"]},
        {"id": "3", "name": "family", "ingredients": ["Chicken Thighs"]},
        {"id": "4", "name": "adapted", "ingredients": ["Fish Sauce"]},
        {"id": "5", "name": "unknown", "ingredients": ["Salt", "Gelatine Leafs"]},
    ]
    assert [evaluate(meals, known, n)["covered"] for n in range(4)] == [1, 2, 3, 4]
    assert "fish sauce" not in known and "lemons" not in known


def test_empty_recipe_is_not_reported_as_cookable(known):
    assert evaluate([{"id": "0", "name": "empty", "ingredients": []}], known, 3)["covered"] == 0
