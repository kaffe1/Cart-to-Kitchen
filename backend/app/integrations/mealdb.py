"""Thin TheMealDB client: search + detail, trimmed to the fields the frontend
displays. Bounded response caching and concurrency; failures surface as 502."""

from __future__ import annotations

import httpx
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from functools import lru_cache
from time import monotonic

from ..errors import ExternalApi

BASE_URL = "https://www.themealdb.com/api/json/v1/1"
TIMEOUT_SECONDS = 8.0
MAX_FILTER_TERMS = 12
MAX_HYDRATED_CANDIDATES = 72


@dataclass(frozen=True)
class DiscoveryQuery:
    """One MealDB filter term and the App ingredients that produced it."""

    name: str
    ingredient_ids: frozenset[str]


@dataclass(frozen=True)
class DiscoveryCandidate:
    """Hydrated meal plus distinct App ingredient hits used for retrieval."""

    meal: dict
    hit_ingredient_ids: frozenset[str]


def _get(path: str, params: dict) -> dict:
    return _cached_get(path, tuple(sorted(params.items())), int(monotonic() // 600))


@lru_cache(maxsize=512)
def _cached_get(path: str, parameters: tuple, window: int) -> dict:
    try:
        response = httpx.get(
            f"{BASE_URL}/{path}", params=dict(parameters), timeout=TIMEOUT_SECONDS
        )
        response.raise_for_status()
        return response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise ExternalApi("recipe service is unavailable") from exc


def _ingredients(meal: dict) -> list[dict]:
    out = []
    for index in range(1, 21):
        name = meal.get(f"strIngredient{index}")
        if not name or not name.strip():
            continue
        out.append({"name": name.strip(), "measure": (meal.get(f"strMeasure{index}") or "").strip()})
    return out


def search(query: str) -> list[dict]:
    """Meals matching a free-text query, with their ingredient lists — the
    search payload already carries every field, so no per-meal lookups."""
    meals = _get("search.php", {"s": query}).get("meals") or []
    return [
        {
            "id": m["idMeal"],
            "name": m["strMeal"],
            "thumbUrl": m["strMealThumb"],
            "ingredients": _ingredients(m),
        }
        for m in meals
    ]


def detail(meal_id: str) -> dict | None:
    """One meal with instructions and the ingredient/measure list."""
    meals = _get("lookup.php", {"i": meal_id}).get("meals")
    # TheMealDB answers malformed IDs with {"meals": "Invalid ID"}.
    if not isinstance(meals, list) or not meals:
        return None
    m = meals[0]
    return {
        "id": m["idMeal"],
        "name": m["strMeal"],
        "thumbUrl": m["strMealThumb"],
        "category": m.get("strCategory"),
        "area": m.get("strArea"),
        "instructions": m.get("strInstructions"),
        "ingredients": _ingredients(m),
    }


def discover(queries: list[DiscoveryQuery]) -> list[DiscoveryCandidate]:
    """Retrieve a wider ranked pool so catalogue support can be checked first.

    MealDB V1 filters one ingredient at a time and does not include full
    ingredient lists. Query aliases belonging to the same App ingredient count
    as one hit, preventing a broadly-mapped ingredient from receiving duplicate
    weight. Final 18-item selection happens in the service after normalization.
    """
    selected_queries = queries[:MAX_FILTER_TERMS]

    def candidates(query: DiscoveryQuery):
        meals = _get("filter.php", {"i": query.name.replace(" ", "_")}).get("meals") or []
        return query, meals

    hits: dict[str, set[str]] = {}
    with ThreadPoolExecutor(max_workers=6) as pool:
        for query, meals in pool.map(candidates, selected_queries):
            for meal in meals:
                hits.setdefault(meal["idMeal"], set()).update(query.ingredient_ids)
        ids = sorted(hits, key=lambda mid: (-len(hits[mid]), mid))[:MAX_HYDRATED_CANDIDATES]
        meals = pool.map(detail, ids)
        return [
            DiscoveryCandidate(meal=meal, hit_ingredient_ids=frozenset(hits[meal_id]))
            for meal_id, meal in zip(ids, meals)
            if meal is not None
        ]
