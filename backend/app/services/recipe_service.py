"""Recipe flows: catalogue proxying, the three-tier match, and cooking.

The match is a pure function over (inventory, resolved recipe ingredients) so
its tier boundaries can be tested with fixed inputs. TheMealDB ingredient
names resolve through strict catalogue aliases, then the reviewed Tier 1 and
Tier 2 whitelist. Only the 30 default pantry items are unlimited; recipes
requiring anything outside the supported 110 ingredients cannot be cooked.
"""

from __future__ import annotations
import re

from sqlalchemy.orm import Session

from ..data.models import User
from ..data.ingredient_mappings import (
    REVERSE_SOURCE_NAMES,
    normalize_ingredient_name,
    relaxed_mapping,
)
from ..data.repositories import (
    IngredientRepository,
    ShoppingRepository,
    ingredient_aliases,
)
from ..errors import NotFound, RuleValidation
from ..integrations import mealdb

# "Almost ready" = at most this many distinct ingredients missing.
ALMOST_READY_MAX_MISSING = 2
DISCOVERY_RESULT_LIMIT = 18
DISCOVERY_QUERY_LIMIT = 12


def _name_index(db: Session) -> dict[str, object]:
    """Lower-cased names/aliases → catalogue row."""
    index: dict[str, object] = {}
    # Sellable aliases must win over pantry aliases (e.g. Eggs vs Egg).
    for row in sorted(IngredientRepository(db).all(), key=lambda row: not row.is_pantry):
        keys = {row.name.lower(), row.id, *(a.lower() for a in ingredient_aliases(row))}
        for key in keys:
            index[key] = row
    return index


def _resolution_context(db: Session) -> tuple[dict[str, object], dict[str, object]]:
    catalogue = {row.id: row for row in IngredientRepository(db).all()}
    strict = {
        normalize_ingredient_name(name): row
        for name, row in _name_index(db).items()
    }
    return strict, catalogue


def _resolve_name(
    name: str, strict: dict[str, object], catalogue: dict[str, object]
) -> tuple[tuple[object, ...], str] | None:
    row = strict.get(normalize_ingredient_name(name))
    if row is not None:
        return (row,), "exact"
    mapped = relaxed_mapping(name)
    if mapped is None:
        return None
    target_ids, resolution = mapped
    return tuple(catalogue[target_id] for target_id in target_ids), resolution


def _resolve(db: Session, ingredient_names: list[str]) -> list[object]:
    strict, catalogue = _resolution_context(db)
    resolved = {}
    for name in ingredient_names:
        match = _resolve_name(name, strict, catalogue)
        if match is not None:
            for row in match[0]:
                resolved[row.id] = row
    return list(resolved.values())


def normalize_meal(db: Session, meal: dict) -> dict:
    strict, catalogue = _resolution_context(db)
    requirements = {}
    ingredients = []
    unsupported = []
    for ingredient in meal["ingredients"]:
        match = _resolve_name(ingredient["name"], strict, catalogue)
        if match is None:
            ingredient_id = normalize_ingredient_name(ingredient["name"]).replace(" ", "-")
            unsupported.append(ingredient["name"])
            ingredients.append({**ingredient, "ingredientId": ingredient_id,
                                "resolvedIngredientIds": [], "resolution": "unsupported",
                                "substitution": False, "emoji": "🧂", "isPantry": False})
            requirements[ingredient_id] = {"ingredientId": ingredient_id, "amount": 1,
                                           "automatic": False}
            continue
        rows, resolution = match
        ingredient_id = rows[0].id
        for row in rows:
            requirements[row.id] = {"ingredientId": row.id, "amount": 1,
                                     "automatic": row.is_pantry}
        ingredients.append({
            **ingredient,
            "ingredientId": ingredient_id,
            "resolvedIngredientIds": [row.id for row in rows],
            "resolvedIngredientNames": [row.name for row in rows],
            "resolution": resolution,
            "substitution": resolution == "family",
            "emoji": rows[0].emoji or "🧂",
            "isPantry": all(row.is_pantry for row in rows),
        })
    instructions = meal.get("instructions") or ""
    steps = [re.sub(r"^(?:step\s+\d+[.:)]?\s*|\d+[.)]\s+)", "", part.strip(), flags=re.I)
             for part in re.split(r"\r?\n+|(?<=[.!?])\s+(?=[A-Z])", instructions)]
    steps = [step for step in steps if step and not re.fullmatch(r"(?:step\s*)?\d+[.:)]?", step, re.I)]
    return {**meal, "imageUrl": meal.get("thumbUrl"), "emoji": "🍽️",
            "accent": "#d7a951", "category": meal.get("category") or "Meal",
            "requirements": list(requirements.values()), "ingredients": ingredients, "steps": steps,
            "unsupportedIngredients": unsupported}


def normalized_detail(db: Session, meal_id: str) -> dict:
    return normalize_meal(db, detail(meal_id))


def _discovery_queries(selected: list[object]) -> list[mealdb.DiscoveryQuery]:
    """Round-robin aliases while retaining the canonical ID behind each term."""
    pools: list[tuple[str, list[str]]] = []
    for row in selected:
        primary = ingredient_aliases(row)[0] if ingredient_aliases(row) else row.name.lower()
        pools.append((row.id, list(dict.fromkeys([primary, *REVERSE_SOURCE_NAMES.get(row.id, ())]))))

    chosen: dict[str, dict] = {}

    def add(name: str, ingredient_id: str) -> None:
        key = normalize_ingredient_name(name)
        if key in chosen:
            chosen[key]["ingredient_ids"].add(ingredient_id)
        elif len(chosen) < DISCOVERY_QUERY_LIMIT:
            chosen[key] = {"name": name, "ingredient_ids": {ingredient_id}}

    # Every selected ingredient gets its primary term before relaxed aliases.
    for ingredient_id, pool in pools:
        if pool:
            add(pool.pop(0), ingredient_id)
    while len(chosen) < DISCOVERY_QUERY_LIMIT and any(pool for _, pool in pools):
        for ingredient_id, pool in pools:
            if pool and len(chosen) < DISCOVERY_QUERY_LIMIT:
                add(pool.pop(0), ingredient_id)

    return [
        mealdb.DiscoveryQuery(entry["name"], frozenset(entry["ingredient_ids"]))
        for entry in chosen.values()
    ]


def _discovery_rank(
    recipe: dict,
    selected_ids: set[str],
    uses: dict[str, int],
    pantry: set[str],
    upstream_hits: frozenset[str],
) -> tuple:
    """Supported recipes first; then closeness to cooking and stable tie-breaks."""
    requirements = recipe["requirements"]
    required_ids = {item["ingredientId"] for item in requirements}
    automatic_ids = {item["ingredientId"] for item in requirements if item["automatic"]}
    selected_matches = required_ids & selected_ids
    covered = automatic_ids | selected_matches
    coverage = len(covered) / len(required_ids) if required_ids else 1.0
    inventory_missing = sum(
        item["ingredientId"] not in pantry
        and uses.get(item["ingredientId"], 0) < item["amount"]
        for item in requirements
        if not item["automatic"]
    )
    return (
        -coverage,
        -len(selected_matches),
        inventory_missing,
        -len(upstream_hits & selected_ids),
        recipe["id"],
    )


def discover(db: Session, user: User, ingredient_ids: list[str]) -> list[dict]:
    pantry_aliases = {"tomato-ketchup": "ketchup", "bicarbonate-of-soda": "baking-soda"}
    ids = list(dict.fromkeys(pantry_aliases.get(rid, rid) for rid in ingredient_ids))
    catalogue = IngredientRepository(db).by_ids(ids)
    uses, pantry = _inventory_cover(db, user.id)
    selected = [catalogue[rid] for rid in ids if rid in catalogue and
                (rid in pantry or uses.get(rid, 0) > 0)]
    if not selected:
        raise RuleValidation("Place available ingredients on your counter first.")
    selected.sort(key=lambda row: row.is_pantry)
    selected_ids = {row.id for row in selected}
    supported = []
    unsupported = []
    for candidate in mealdb.discover(_discovery_queries(selected)):
        # Tests and adapters may supply a plain hydrated meal; production uses
        # DiscoveryCandidate so distinct source-ID hits survive alias expansion.
        if isinstance(candidate, mealdb.DiscoveryCandidate):
            meal, upstream_hits = candidate.meal, candidate.hit_ingredient_ids
        else:
            meal, upstream_hits = candidate, frozenset()
        recipe = normalize_meal(db, meal)
        ranked = (_discovery_rank(recipe, selected_ids, uses, pantry, upstream_hits), recipe)
        (unsupported if recipe["unsupportedIngredients"] else supported).append(ranked)

    supported.sort(key=lambda item: item[0])
    unsupported.sort(key=lambda item: item[0])
    ordered = [recipe for _, recipe in supported]
    if len(ordered) < DISCOVERY_RESULT_LIMIT:
        ordered.extend(recipe for _, recipe in unsupported[:DISCOVERY_RESULT_LIMIT - len(ordered)])
    return ordered[:DISCOVERY_RESULT_LIMIT]


def search(query: str) -> list[dict]:
    return [
        {"id": m["id"], "name": m["name"], "thumbUrl": m["thumbUrl"]}
        for m in mealdb.search(query)
    ]


def detail(meal_id: str) -> dict:
    meal = mealdb.detail(meal_id)
    if meal is None:
        raise NotFound("recipe not found")
    return meal


def _inventory_cover(db: Session, user_id: int) -> tuple[dict[str, int], set[str]]:
    """(uses per catalogue id, pantry ids) — pantry ids are always covered."""
    repo = ShoppingRepository(db)
    uses = {row.ingredient_id: row.remaining_uses for row in repo.inventory_lines(user_id)}
    pantry = {row.id for row in IngredientRepository(db).all() if row.uses_per_unit is None}
    return uses, pantry


def matches(db: Session, user: User, query: str) -> dict:
    uses, pantry = _inventory_cover(db, user.id)
    recipes = []
    for meal in mealdb.search(query):
        normalized = normalize_meal(db, meal)
        resolved = _resolve(db, [i["name"] for i in meal["ingredients"]])
        missing = [
            row.id
            for row in resolved
            if row.id not in pantry and uses.get(row.id, 0) < 1
        ]
        recipes.append(
            {
                "id": meal["id"],
                "name": meal["name"],
                "thumbUrl": meal["thumbUrl"],
                "ingredientIds": missing,
                "unsupportedIngredients": normalized["unsupportedIngredients"],
            }
        )
    return match_tiers(recipes)


def match_tiers(recipes: list[dict]) -> dict:
    """Pure: bucket recipes into ready / almost / needShopping.

    Each recipe dict carries `ingredientIds` = the catalogue ids it is MISSING.
    """
    ready, almost, need = [], [], []
    for recipe in recipes:
        missing = len(recipe["ingredientIds"])
        entry = {
            "id": recipe["id"],
            "name": recipe["name"],
            "thumbUrl": recipe["thumbUrl"],
            "missingCount": missing,
        }
        if recipe.get("unsupportedIngredients"):
            entry["unsupportedIngredients"] = recipe["unsupportedIngredients"]
            need.append(entry)
        elif missing == 0:
            ready.append(entry)
        elif missing <= ALMOST_READY_MAX_MISSING:
            almost.append(entry)
        else:
            need.append(entry)
    return {"ready": ready, "almost": almost, "needShopping": need}


def cook(db: Session, user: User, meal_id: str, request_key: str | None = None) -> dict:
    repo = ShoppingRepository(db)
    repo.lock_user(user.id)
    if request_key:
        previous = repo.cooked_request(user.id, request_key)
        if previous:
            if previous.meal_id != meal_id:
                raise RuleValidation("This completion key belongs to another recipe.")
            return {**history_public(previous), "completedCount": len([e for e in repo.history(user.id) if e.id <= previous.id])}
    meal = mealdb.detail(meal_id)
    if meal is None:
        raise NotFound("recipe not found")
    unsupported = normalize_meal(db, meal)["unsupportedIngredients"]
    if unsupported:
        raise RuleValidation("This recipe needs ingredients outside the store and default pantry.",
                             details={"code": "UNSUPPORTED_INGREDIENTS", "ingredients": unsupported})
    resolved = _resolve(db, [i["name"] for i in meal["ingredients"]])
    stock = {
        row.id: repo.inventory_item(user.id, row.id)
        for row in resolved
        if row.uses_per_unit is not None  # pantry items are always usable
    }
    missing = [rid for rid, item in stock.items() if item is None or item.remaining_uses < 1]
    if missing:
        raise RuleValidation(
            "You are missing ingredients for this recipe.",
            details={"code": "MISSING_INGREDIENTS", "missing": missing},
        )
    for item in stock.values():
        item.remaining_uses -= 1

    entry = repo.add_history(user.id, meal_id=meal["id"], meal_name=meal["name"])
    if request_key:
        repo.record_cook_request(user.id, request_key, entry.id)
    db.flush()
    return {**history_public(entry), "completedCount": len(repo.history(user.id))}


def history_public(entry) -> dict:
    return {
        "id": entry.id,
        "recipeId": entry.meal_id,
        "name": entry.meal_name,
        "cookedAt": entry.cooked_at.isoformat(),
        "review": entry.review_text,
        "reviewImageUrl": (
            f"/api/v1/history/{entry.id}/image" if entry.review_image else None
        ),
    }
