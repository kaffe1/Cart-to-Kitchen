"""Thin TheMealDB client: search + detail, trimmed to the fields the frontend
displays. Failures surface as ExternalApi (502) — no caching, no retries."""

from __future__ import annotations

import httpx

from ..errors import ExternalApi

BASE_URL = "https://www.themealdb.com/api/json/v1/1"
TIMEOUT_SECONDS = 8.0


def _get(path: str, params: dict) -> dict:
    try:
        response = httpx.get(
            f"{BASE_URL}/{path}", params=params, timeout=TIMEOUT_SECONDS
        )
        response.raise_for_status()
        return response.json()
    except httpx.HTTPError as exc:
        raise ExternalApi("recipe service is unavailable") from exc


def _ingredients(meal: dict) -> list[dict]:
    out = []
    for index in range(1, 21):
        name = meal.get(f"strIngredient{index}")
        if not name:
            break
        out.append({"name": name, "measure": meal.get(f"strMeasure{index}") or ""})
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
    meals = _get("lookup.php", {"i": meal_id}).get("meals") or []
    if not meals:
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
