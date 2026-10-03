"""Engine, session factory and startup bootstrap (create tables, seed store)."""

from __future__ import annotations

import json
from sqlalchemy import create_engine, select
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker

from .config import get_settings
from .data.models import Base, Ingredient
from .data.seed import INGREDIENTS


def make_engine(url: str | None = None):
    url = url or get_settings().database_url
    if url.startswith("sqlite"):
        # A single shared connection keeps the in-memory test database alive.
        return create_engine(url, poolclass=StaticPool, connect_args={"check_same_thread": False})
    return create_engine(url, pool_pre_ping=True)


def make_session_factory(engine) -> sessionmaker[Session]:
    return sessionmaker(bind=engine, expire_on_commit=False)


def seed_ingredients(session: Session) -> int:
    """Insert the catalogue if empty. Returns the number of rows present."""
    existing = session.scalar(select(Ingredient).limit(1))
    if existing is not None:
        return session.query(Ingredient).count()
    for row in INGREDIENTS:
        session.add(
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
        )
    session.commit()
    return len(INGREDIENTS)


def bootstrap(engine) -> None:
    """Create tables and seed the catalogue (idempotent, dev-friendly)."""
    Base.metadata.create_all(engine)
    with make_session_factory(engine)() as session:
        seed_ingredients(session)
