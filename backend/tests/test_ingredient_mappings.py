"""Production whitelist invariants and normalization behavior."""

from app.data.ingredient_mappings import (
    FIRST_TIER_MAPPINGS,
    REVERSE_SOURCE_NAMES,
    SECOND_TIER_MAPPINGS,
    normalize_ingredient_name,
    relaxed_mapping,
)
from app.data.pantry import SUPPORTED_IDS


def test_production_whitelist_shape_and_targets():
    assert len(FIRST_TIER_MAPPINGS) == 103
    assert len(SECOND_TIER_MAPPINGS) == 299
    assert not set(FIRST_TIER_MAPPINGS).intersection(SECOND_TIER_MAPPINGS)
    assert all(set(targets) <= SUPPORTED_IDS for targets in FIRST_TIER_MAPPINGS.values())
    assert all(len(targets) == 1 and set(targets) <= SUPPORTED_IDS
               for targets in SECOND_TIER_MAPPINGS.values())


def test_normalization_is_character_only_and_matching_is_explicit():
    assert normalize_ingredient_name("  JAMÓN_IBÉRICO  ") == "jamon iberico"
    assert relaxed_mapping("free-range eggs, beaten") == (("egg",), "alias")
    assert relaxed_mapping("Chicken Thighs") == (("chicken-breast",), "family")
    assert relaxed_mapping("Penne_Rigate") == (("spaghetti",), "family")
    assert relaxed_mapping("Chicken Stock Concentrate") is None
    assert relaxed_mapping("salted unknown sea monster") is None


def test_recipe_radar_reverse_index_preserves_mealdb_source_names():
    assert "chicken thighs" in REVERSE_SOURCE_NAMES["chicken-breast"]
    assert "basmati rice" in REVERSE_SOURCE_NAMES["rice"]
    assert "jamón ibérico" in REVERSE_SOURCE_NAMES["ham"]

