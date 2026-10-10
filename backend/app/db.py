"""Engine, session factory and startup bootstrap (create tables, seed store)."""

from __future__ import annotations

import json
from pathlib import Path

from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from .config import get_settings
from .data.models import Base, Ingredient
from .data.seed import INGREDIENTS

PANTRY_NAMES_FILE = Path(__file__).parent / "data" / "mealdb_pantry.txt"


def make_engine(url: str | None = None):
    url = url or get_settings().database_url
    if url.startswith("sqlite"):
        # A single shared connection keeps the in-memory test database alive.
        return create_engine(url, poolclass=StaticPool, connect_args={"check_same_thread": False})
    return create_engine(url, pool_pre_ping=True)


def make_session_factory(engine) -> sessionmaker:
    return sessionmaker(bind=engine, expire_on_commit=False)


def _slug(name: str) -> str:
    return "".join(c if c.isalnum() else "-" for c in name.lower()).strip("-")


def _pantry_rows() -> list[Ingredient]:
    """Every TheMealDB ingredient we do not sell is kitchen pantry stock:
    unlimited uses, never purchasable, kept for accurate recipe resolution."""
    rows, seen = [], set()
    for name in PANTRY_NAMES_FILE.read_text(encoding="utf-8").splitlines():
        name = name.strip()
        slug = _slug(name)
        if not name or slug in seen:
            continue
        seen.add(slug)
        rows.append(
            Ingredient(
                id=slug,
                name=name,
                emoji="",
                category="Pantry",
                uses_per_unit=None,
                price_sek=0,
                aliases_json=json.dumps([name.lower()]),
                is_pantry=True,
                color="#cccccc",
            )
        )
    return rows


def seed_ingredients(session) -> int:
    """Insert catalogue rows whose id is not present yet (idempotent)."""
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
    known = set(session.scalars(select(Ingredient.id)))
    fresh = [row for row in catalogue if row.id not in known]
    session.add_all(fresh)
    session.commit()
    return len(known) + len(fresh)


def bootstrap(engine) -> None:
    """Create tables and seed the catalogue (idempotent, dev-friendly)."""
    Base.metadata.create_all(engine)
    with make_session_factory(engine)() as session:
        seed_ingredients(session)
