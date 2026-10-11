"""Engine, session factory and startup bootstrap (create tables, seed store)."""

from __future__ import annotations

import json

from sqlalchemy import create_engine, delete, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from .config import get_settings
from .data.models import Base, Ingredient
from .data.seed import INGREDIENTS, PANTRY


def make_engine(url: str | None = None):
    url = url or get_settings().database_url
    if url.startswith("sqlite"):
        # A single shared connection keeps the in-memory test database alive.
        return create_engine(url, poolclass=StaticPool, connect_args={"check_same_thread": False})
    return create_engine(url, pool_pre_ping=True)


def make_session_factory(engine) -> sessionmaker:
    return sessionmaker(bind=engine, expire_on_commit=False)


def seed_ingredients(session) -> int:
    """Sync the catalogue to the curated 110 items (idempotent)."""
    sellable = [
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
    ]
    pantry = [
        Ingredient(
            id=row["id"],
            name=row["name"],
            emoji=row["emoji"],
            category="Pantry",
            uses_per_unit=None,
            price_sek=0,
            aliases_json=json.dumps(row["aliases"]),
            is_pantry=True,
            color="#cccccc",
        )
        for row in PANTRY
    ]
    # Drop pantry rows that are no longer curated (e.g. the full-TheMealDB
    # experiment) — sellable rows are never touched.
    keep = {row.id for row in sellable + pantry}
    session.execute(
        delete(Ingredient).where(Ingredient.is_pantry.is_(True), Ingredient.id.not_in(keep))
    )
    known = set(session.scalars(select(Ingredient.id)))
    session.add_all(row for row in sellable + pantry if row.id not in known)
    session.commit()
    return session.query(Ingredient).count()


def bootstrap(engine) -> None:
    """Create tables and seed the catalogue (idempotent, dev-friendly)."""
    Base.metadata.create_all(engine)
    with make_session_factory(engine)() as session:
        seed_ingredients(session)
