"""SQLAlchemy ORM models. Ingredient ids are the same slugs the frontend uses
(e.g. "tomato"), so URLs and seed data line up with the UI out of the box."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def utcnow() -> datetime:
    # Naive UTC keeps Postgres TIMESTAMP columns predictable; timezone-aware
    # values are produced at the API boundary only.
    return datetime.now(UTC).replace(tzinfo=None)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    display_name: Mapped[str] = mapped_column(Text)
    email: Mapped[str | None] = mapped_column(Text, unique=True, index=True)
    password_hash: Mapped[str | None] = mapped_column(Text)  # null => guest account
    mode: Mapped[str] = mapped_column(Text, default="account")  # account | guest
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Ingredient(Base):
    __tablename__ = "ingredients"

    id: Mapped[str] = mapped_column(Text, primary_key=True)  # frontend slug
    name: Mapped[str] = mapped_column(Text)
    emoji: Mapped[str] = mapped_column(Text, default="")
    category: Mapped[str] = mapped_column(Text, index=True)
    uses_per_unit: Mapped[int | None] = mapped_column(Integer)  # null => infinite (pantry)
    price_sek: Mapped[int] = mapped_column(Integer)
    aliases_json: Mapped[str] = mapped_column(Text, default="[]")
    is_pantry: Mapped[bool] = mapped_column(Boolean, default=False)
    color: Mapped[str] = mapped_column(Text, default="#cccccc")


class ShoppingSession(Base):
    """One shopping trip: filled, checked out, replaced by the next one."""

    __tablename__ = "shopping_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    status: Mapped[str] = mapped_column(Text, default="active")  # active | checked_out
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class CartItem(Base):
    __tablename__ = "cart_items"
    __table_args__ = (UniqueConstraint("session_id", "ingredient_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("shopping_sessions.id"), index=True)
    ingredient_id: Mapped[str] = mapped_column(ForeignKey("ingredients.id"))
    quantity: Mapped[int] = mapped_column(Integer)


class InventoryItem(Base):
    """Kitchen stock: remaining uses per ingredient owned by a user."""

    __tablename__ = "inventory_items"
    __table_args__ = (UniqueConstraint("user_id", "ingredient_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    ingredient_id: Mapped[str] = mapped_column(ForeignKey("ingredients.id"))
    remaining_uses: Mapped[int] = mapped_column(Integer)


class Wallet(Base):
    """One wallet per user. Grants accrue lazily when the wallet is read."""

    __tablename__ = "wallets"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    balance_sek: Mapped[int] = mapped_column(Integer)
    last_accrued_at: Mapped[datetime] = mapped_column(DateTime)
