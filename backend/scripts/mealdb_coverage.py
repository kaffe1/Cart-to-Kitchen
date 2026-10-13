"""Read-only coverage audit using public searches/category lists and app matching.

From backend/: python -m scripts.mealdb_coverage
Uses an isolated in-memory catalogue; never touches the user's database.
The free API may cap results: this reports the retrieved sample, not an assumed
full database. No undocumented pagination or enumeration of numeric IDs.
"""
import json
import string
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

import httpx

from app.db import bootstrap, make_engine, make_session_factory
from app.data.pantry import PANTRY_IDS, STORE_IDS
from app.integrations.mealdb import BASE_URL, _ingredients
from app.services.recipe_service import _name_index


def fetch_catalogue():
    with httpx.Client(timeout=25) as client:
        def by_letter(letter):
            response = client.get(f"{BASE_URL}/search.php", params={"f": letter})
            response.raise_for_status()
            return letter, response.json().get("meals") or []

        with ThreadPoolExecutor(max_workers=3) as pool:
            batches = dict(pool.map(by_letter, string.ascii_lowercase))
        meals = {meal["idMeal"]: meal for batch in batches.values() for meal in batch}
        # Categories can expose names starting with numbers or non-ASCII letters.
        response = client.get(f"{BASE_URL}/list.php", params={"c": "list"})
        response.raise_for_status()
        categories = response.json()["meals"]

        def by_category(category):
            response = client.get(f"{BASE_URL}/filter.php", params={"c": category["strCategory"]})
            response.raise_for_status()
            return response.json().get("meals") or []

        with ThreadPoolExecutor(max_workers=3) as pool:
            category_ids = {meal["idMeal"] for batch in pool.map(by_category, categories) for meal in batch}
        missing_ids = sorted(category_ids - meals.keys())
        for meal_id in missing_ids:
            response = client.get(f"{BASE_URL}/lookup.php", params={"i": meal_id})
            response.raise_for_status()
            for meal in response.json().get("meals") or []:
                meals[meal["idMeal"]] = meal
    return meals, {
        "perLetter": {letter: len(batch) for letter, batch in batches.items()},
        "categoryCount": len(categories), "categoryMeals": len(category_ids),
        "extraMealsFromCategories": [{"id": mid, "name": meals[mid]["strMeal"]} for mid in missing_ids if mid in meals],
        "missingDetails": sorted(category_ids - meals.keys()),
    }


def audit():
    meals, metadata = fetch_catalogue()
    engine = make_engine("sqlite://")
    bootstrap(engine)
    with make_session_factory(engine)() as db:
        known = _name_index(db)
        covered = []
        missing_distribution = Counter()
        blockers = Counter()
        one_missing = []
        empty = []
        for meal in meals.values():
            ingredients = _ingredients(meal)
            if not ingredients:
                empty.append(meal["idMeal"])
                continue
            missing = sorted({i["name"].strip().lower() for i in ingredients if i["name"].strip().lower() not in known})
            missing_distribution[len(missing)] += 1
            blockers.update(missing)
            entry = {"id": meal["idMeal"], "name": meal["strMeal"]}
            if not missing:
                covered.append(entry)
            elif len(missing) == 1:
                one_missing.append({**entry, "missing": missing[0]})
    total = len(meals) - len(empty)
    return {
        "retrievedAt": datetime.now(timezone.utc).isoformat(),
        "source": BASE_URL,
        "scope": "Union of 26 public first-letter queries and all public category lists; missing details via lookup",
        "catalogue": {"store": len(STORE_IDS), "pantry": len(PANTRY_IDS)},
        **metadata,
        "retrievedMeals": len(meals), "validMeals": total, "emptyIngredientMeals": empty,
        "fullyCovered": len(covered), "coveragePercent": round(len(covered) / total * 100, 2) if total else 0,
        "missingIngredientDistribution": dict(sorted(missing_distribution.items())),
        "topUnsupportedNames": blockers.most_common(20),
        "coveredMeals": sorted(covered, key=lambda r: r["name"]),
        "oneUnsupportedIngredientMeals": sorted(one_missing, key=lambda r: r["missing"]),
    }


if __name__ == "__main__":
    print(json.dumps(audit(), ensure_ascii=False, indent=2))
