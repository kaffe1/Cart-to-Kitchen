"""Compare explicit relaxed matching scenarios without changing production rules.

python -m scripts.relaxed_coverage [--snapshot path-to-minimal-snapshot.json]
"""
import argparse
import hashlib
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from app.data.pantry import SUPPORTED_IDS
from app.data.ingredient_mappings import (
    FIRST_TIER_MAPPINGS as ALIASES,
    SECOND_TIER_MAPPINGS as FAMILIES,
    normalize_ingredient_name as normalize,
)
from app.db import bootstrap, make_engine, make_session_factory
from app.integrations.mealdb import _ingredients
from app.services.recipe_service import _name_index
from scripts.mealdb_coverage import fetch_catalogue
from scripts.relaxed_rules import ADAPTATIONS


def resolve(name, known, level):
    raw = name.strip().lower()
    if raw in known:
        return (known[raw],)
    if level == 0:
        return None
    key = normalize(name)
    normalized_known = {normalize(n): target for n, target in known.items()}
    if key in normalized_known:
        return (normalized_known[key],)
    rules = {**ALIASES, **(FAMILIES if level >= 2 else {}), **(ADAPTATIONS if level >= 3 else {})}
    if key in rules:
        return rules[key]
    return None


def evaluate(meals, known, level):
    covered, excluded, missing_distribution, blockers, used = [], [], Counter(), Counter(), {}
    for meal in meals:
        missing, mappings = set(), []
        for ingredient in meal["ingredients"]:
            targets = resolve(ingredient, known, level)
            if targets:
                assert set(targets) <= SUPPORTED_IDS
                if ingredient.strip().lower() not in known:
                    mappings.append({"name": ingredient, "requires": targets})
                    used[normalize(ingredient)] = targets
            else:
                missing.add(ingredient.strip().lower())
        entry = {"id": meal["id"], "name": meal["name"]}
        if not meal["ingredients"]:
            excluded.append({**entry, "missing": ["[empty ingredients]"]})
            continue
        missing_distribution[len(missing)] += 1
        blockers.update(missing)
        if not missing:
            covered.append({**entry, "relaxedMappings": mappings})
        else:
            excluded.append({**entry, "missing": sorted(missing)})
    return {
        "covered": len(covered), "percent": round(len(covered) / len(meals) * 100, 2),
        "missingDistribution": dict(sorted(missing_distribution.items())),
        "topBlockers": blockers.most_common(30),
        "coveredMeals": covered, "excludedMeals": excluded, "usedMappings": used,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--snapshot", type=Path)
    parser.add_argument("--summary", action="store_true")
    args = parser.parse_args()
    if args.snapshot:
        snapshot = json.loads(args.snapshot.read_text())
    else:
        raw, metadata = fetch_catalogue()
        snapshot = {"metadata": metadata, "meals": [{"id": meal["idMeal"], "name": meal["strMeal"],
                    "ingredients": [i["name"] for i in _ingredients(meal)]} for meal in raw.values()]}
    engine = make_engine("sqlite://")
    bootstrap(engine)
    with make_session_factory(engine)() as db:
        known = {name: row.id for name, row in _name_index(db).items()}
    for rules in (ALIASES, FAMILIES, ADAPTATIONS):
        assert all(set(targets) <= SUPPORTED_IDS for targets in rules.values())
    results = {name: evaluate(snapshot["meals"], known, level)
               for level, name in enumerate(("strict", "aliases", "families", "adaptations"))}
    if args.summary:
        results = {name: {k: v for k, v in result.items() if k not in {"coveredMeals", "excludedMeals", "usedMappings"}}
                   for name, result in results.items()}
    output = {
        "measuredAt": datetime.now(timezone.utc).isoformat(), "mealCount": len(snapshot["meals"]),
        "snapshotSha256": hashlib.sha256(json.dumps(snapshot, sort_keys=True).encode()).hexdigest(),
        "metadata": snapshot["metadata"], "results": results,
        "warning": "Tier 1 and Tier 2 are production whitelist rules. Tier 3 remains audit-only; substitutions are game abstractions, not culinary guarantees.",
    }
    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
