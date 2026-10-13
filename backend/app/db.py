"""Engine, session factory and startup bootstrap (create tables, seed store)."""

from __future__ import annotations

import json

from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from .config import get_settings
from .data.models import Base, Ingredient
from .data.seed import INGREDIENTS
from .data.pantry import PANTRY, SUPPORTED_IDS


def make_engine(url: str | None = None):
    url = url or get_settings().database_url
    if url.startswith("sqlite"):
        # A single shared connection keeps the in-memory test database alive.
        return create_engine(url, poolclass=StaticPool, connect_args={"check_same_thread": False})
    return create_engine(url, pool_pre_ping=True)


def make_session_factory(engine) -> sessionmaker:
    return sessionmaker(bind=engine, expire_on_commit=False)


def _pantry_rows() -> list[Ingredient]:
    """Only the explicit default pantry is unlimited, not all of MealDB."""
    return [
            Ingredient(
                id=ingredient_id,
                name=name,
                emoji=emoji,
                category="Pantry",
                uses_per_unit=None,
                price_sek=0,
                aliases_json=json.dumps([name.lower(), *aliases]),
                is_pantry=True,
                color="#88a77b",
            )
        for ingredient_id, name, emoji, aliases in PANTRY
    ]


def seed_ingredients(session) -> int:
    """Reconcile the active 110 items; retire legacy pantry without deleting data."""
    catalogue = [
        Ingredient(
            id=row["id"],
            name=row["name"],
            emoji=row["emoji"],
            category=row["category"],
            uses_per_unit=row["uses_per_unit"],
            price_sek=row["price_sek"],
            aliases_json=json.dumps(row["aliases"]),
            is_pantry=False,
            color=row["color"],
        )
        for row in INGREDIENTS
    ] + _pantry_rows()
    known = {row.id: row for row in session.scalars(select(Ingredient))}
    for row in catalogue:
        existing = known.get(row.id)
        if existing is None:
            session.add(row)
        else:
            for field in ("name", "emoji", "category", "uses_per_unit", "price_sek", "aliases_json", "is_pantry", "color"):
                setattr(existing, field, getattr(row, field))
    for row in known.values():
        if row.id not in SUPPORTED_IDS:
            # Preserve foreign-key references and old history; never grant infinite uses.
            row.is_pantry = False
            row.uses_per_unit = 0
    session.commit()
    return len(catalogue)


def bootstrap(engine) -> None:
    """Create tables and seed the catalogue (idempotent, dev-friendly)."""
    Base.metadata.create_all(engine)
    with make_session_factory(engine)() as session:
        seed_ingredients(session)
