"""Store flows: catalogue, active session snapshot, cart updates, checkout.

Checkout runs as one transaction: budget check → deduct wallet → add inventory
→ clear cart → retire the session → open the next one.
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from ..data.models import CartItem, Ingredient, InventoryItem, User
from ..data.repositories import (
    IngredientRepository,
    ShoppingRepository,
    ingredient_aliases,
)
from ..errors import RuleValidation
from . import wallet_service
from .wallet_service import CAP_SEK, HOURLY_GRANT_SEK, next_grant_at, utcnow_naive

MAX_QUANTITY_PER_ITEM = 9


def ingredient_public(row: Ingredient) -> dict:
    return {
        "id": row.id,
        "name": row.name,
        "emoji": row.emoji,
        "category": row.category,
        "usesPerUnit": "infinite" if row.uses_per_unit is None else row.uses_per_unit,
        "priceSek": row.price_sek,
        "aliases": ingredient_aliases(row),
        "isPantry": row.is_pantry,
        "color": row.color,
    }


def ingredients(db: Session) -> list[dict]:
    return [ingredient_public(row) for row in IngredientRepository(db).all()]


def _wallet_public(wallet) -> dict:
    upcoming = next_grant_at(utcnow_naive())
    return {
        "balanceSek": wallet.balance_sek,
        "capSek": CAP_SEK,
        "nextGrantAt": upcoming.isoformat() if upcoming else None,
        "hourlyGrantSek": HOURLY_GRANT_SEK,
    }


def inventory_public(db: Session, user_id: int) -> list[dict]:
    repo = ShoppingRepository(db)
    stock_rows = repo.inventory_lines(user_id)
    catalogue = IngredientRepository(db).by_ids(
        [row.ingredient_id for row in stock_rows]
    )
    return [
        {
            "ingredientId": row.ingredient_id,
            # Pantry ingredients (null uses_per_unit) have unlimited uses.
            "remainingUses": (
                "infinite"
                if catalogue.get(row.ingredient_id) is not None
                and catalogue[row.ingredient_id].uses_per_unit is None
                else row.remaining_uses
            ),
        }
        for row in stock_rows
    ]


def active_session(db: Session, user: User) -> dict:
    # Wallet grants accrue on every read of the shopping snapshot.
    wallet = wallet_service.apply_grants(db, user.id)
    repo = ShoppingRepository(db)
    trip = repo.active_session(user.id) or repo.create_session(user.id)
    return {
        "id": trip.id,
        "status": trip.status,
        "createdAt": trip.created_at.isoformat(),
        "wallet": _wallet_public(wallet),
        "cart": [
            {"ingredientId": line.ingredient_id, "quantity": line.quantity}
            for line in repo.cart_lines(trip.id)
        ],
        "inventory": inventory_public(db, user.id),
    }


def set_cart_quantity(
    db: Session, user: User, session_id: int, ingredient_id: str, quantity: int
) -> list[dict]:
    repo = ShoppingRepository(db)
    trip = repo.owned_active_session(session_id, user.id)
    ingredient = IngredientRepository(db).by_id(ingredient_id)  # 404 on unknown slug
    if ingredient.is_pantry:
        raise RuleValidation(
            "Pantry ingredients are always in your kitchen.",
            details={"code": "NOT_FOR_SALE"},
        )
    quantity = max(0, min(quantity, MAX_QUANTITY_PER_ITEM))
    line = repo.cart_item(trip.id, ingredient_id)
    if quantity == 0:
        if line is not None:
            db.delete(line)
    elif line is None:
        db.add(CartItem(session_id=trip.id, ingredient_id=ingredient_id, quantity=quantity))
    else:
        line.quantity = quantity
    db.flush()
    return [
        {"ingredientId": line.ingredient_id, "quantity": line.quantity}
        for line in repo.cart_lines(trip.id)
    ]


def checkout(db: Session, user: User, session_id: int) -> dict:
    repo = ShoppingRepository(db)
    trip = repo.owned_active_session(session_id, user.id)
    lines = repo.cart_lines(trip.id)
    if not lines:
        raise RuleValidation("Your cart is empty.", details={"code": "EMPTY_CART"})

    catalogue = IngredientRepository(db).by_ids([line.ingredient_id for line in lines])
    total = sum(catalogue[line.ingredient_id].price_sek * line.quantity for line in lines)

    wallet = wallet_service.apply_grants(db, user.id)
    if total > wallet.balance_sek:
        raise RuleValidation(
            "There is not enough money in your wallet.",
            details={"code": "BUDGET_EXCEEDED"},
        )

    purchased_units = sum(line.quantity for line in lines)
    wallet.balance_sek -= total
    for line in lines:
        ingredient = catalogue[line.ingredient_id]
        if ingredient.uses_per_unit is None:
            continue  # pantry items have unlimited uses, nothing to track
        stock = repo.inventory_item(user.id, line.ingredient_id)
        extra = ingredient.uses_per_unit * line.quantity
        if stock is None:
            db.add(
                InventoryItem(
                    user_id=user.id,
                    ingredient_id=line.ingredient_id,
                    remaining_uses=extra,
                )
            )
        else:
            stock.remaining_uses += extra
        db.delete(line)
    trip.status = "checked_out"
    repo.create_session(user.id)
    db.flush()
    return {
        "purchasedUnits": purchased_units,
        "spentSek": total,
        "remainingBalanceSek": wallet.balance_sek,
    }


def kitchen_inventory(db: Session, user: User) -> list[dict]:
    """The kitchen's view of what is in stock."""
    return inventory_public(db, user.id)
