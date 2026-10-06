"""Recipe flows: catalogue proxying, the three-tier match, and cooking.

The match is a pure function over (inventory, resolved recipe ingredients) so
its tier boundaries can be tested with fixed inputs. TheMealDB ingredient
names resolve to store items through each ingredient's alias list (seeded from
the frontend data); names the store does not sell are treated as always
available — you cannot shop for them in this game.
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from ..data.models import User
from ..data.repositories import (
    IngredientRepository,
    ShoppingRepository,
    ingredient_aliases,
)
from ..errors import NotFound, RuleValidation
from ..integrations import mealdb

# "Almost ready" = at most this many distinct ingredients missing.
ALMOST_READY_MAX_MISSING = 2


def _name_index(db: Session) -> dict[str, object]:
    """Lower-cased names/aliases → catalogue row."""
    index: dict[str, object] = {}
    for row in IngredientRepository(db).all():
        keys = {row.name.lower(), row.id, *(a.lower() for a in ingredient_aliases(row))}
        for key in keys:
            index[key] = row
    return index


def _resolve(db: Session, ingredient_names: list[str]) -> list[object]:
    index = _name_index(db)
    return [index[name.lower()] for name in ingredient_names if name.lower() in index]


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
        if missing == 0:
            ready.append(entry)
        elif missing <= ALMOST_READY_MAX_MISSING:
            almost.append(entry)
        else:
            need.append(entry)
    return {"ready": ready, "almost": almost, "needShopping": need}


def cook(db: Session, user: User, meal_id: str) -> dict:
    meal = mealdb.detail(meal_id)
    if meal is None:
        raise NotFound("recipe not found")
    repo = ShoppingRepository(db)
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
    db.flush()
    return history_public(entry)


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
