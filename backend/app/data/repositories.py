"""Repositories: the only place that talks SQL. Services decide what the rows
mean; routers never see an ORM object."""

from __future__ import annotations

import json

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..errors import Conflict, NotFound
from .models import (
    CartItem,
    Ingredient,
    InventoryItem,
    ShoppingSession,
    User,
    Wallet,
)


class UserRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def by_id(self, user_id: int) -> User:
        user = self.session.get(User, user_id)
        if user is None:
            raise NotFound("user no longer exists")
        return user

    def by_email(self, email: str) -> User | None:
        return self.session.scalar(select(User).where(User.email == email))

    def create(
        self, *, display_name: str, email: str | None, password_hash: str | None, mode: str
    ) -> User:
        if email is not None and self.by_email(email) is not None:
            raise Conflict("an account with this email already exists")
        user = User(
            display_name=display_name, email=email, password_hash=password_hash, mode=mode
        )
        self.session.add(user)
        self.session.flush()
        return user


class IngredientRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def all(self) -> list[Ingredient]:
        return list(self.session.scalars(select(Ingredient).order_by(Ingredient.name)))

    def by_id(self, ingredient_id: str) -> Ingredient:
        row = self.session.get(Ingredient, ingredient_id)
        if row is None:
            raise NotFound(f"unknown ingredient: {ingredient_id}")
        return row

    def by_ids(self, ingredient_ids: list[str]) -> dict[str, Ingredient]:
        rows = self.session.scalars(
            select(Ingredient).where(Ingredient.id.in_(ingredient_ids))
        )
        return {row.id: row for row in rows}


class ShoppingRepository:
    """Cart, sessions, inventory and wallets — everything a shopping trip touches."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def active_session(self, user_id: int) -> ShoppingSession | None:
        return self.session.scalar(
            select(ShoppingSession).where(
                ShoppingSession.user_id == user_id,
                ShoppingSession.status == "active",
            )
        )

    def create_session(self, user_id: int) -> ShoppingSession:
        trip = ShoppingSession(user_id=user_id)
        self.session.add(trip)
        self.session.flush()
        return trip

    def owned_active_session(self, session_id: int, user_id: int) -> ShoppingSession:
        trip = self.session.get(ShoppingSession, session_id)
        # Foreign or retired sessions read as 404 so ids do not leak.
        if trip is None or trip.user_id != user_id or trip.status != "active":
            raise NotFound("shopping session not found")
        return trip

    def cart_lines(self, session_id: int) -> list[CartItem]:
        return list(
            self.session.scalars(
                select(CartItem)
                .where(CartItem.session_id == session_id)
                .order_by(CartItem.ingredient_id)
            )
        )

    def cart_item(self, session_id: int, ingredient_id: str) -> CartItem | None:
        return self.session.scalar(
            select(CartItem).where(
                CartItem.session_id == session_id,
                CartItem.ingredient_id == ingredient_id,
            )
        )

    def inventory_lines(self, user_id: int) -> list[InventoryItem]:
        return list(
            self.session.scalars(
                select(InventoryItem)
                .where(InventoryItem.user_id == user_id)
                .order_by(InventoryItem.ingredient_id)
            )
        )

    def inventory_item(self, user_id: int, ingredient_id: str) -> InventoryItem | None:
        return self.session.scalar(
            select(InventoryItem).where(
                InventoryItem.user_id == user_id,
                InventoryItem.ingredient_id == ingredient_id,
            )
        )

    def wallet(self, user_id: int) -> Wallet:
        wallet = self.session.get(Wallet, user_id)
        if wallet is None:
            raise NotFound("wallet missing for user")
        return wallet

    def create_wallet(self, user_id: int, *, balance_sek: int, last_accrued_at) -> Wallet:
        wallet = Wallet(
            user_id=user_id, balance_sek=balance_sek, last_accrued_at=last_accrued_at
        )
        self.session.add(wallet)
        self.session.flush()
        return wallet


def ingredient_aliases(row: Ingredient) -> list[str]:
    return json.loads(row.aliases_json)
