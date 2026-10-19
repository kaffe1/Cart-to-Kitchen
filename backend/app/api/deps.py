"""Shared FastAPI dependencies."""

from __future__ import annotations

from fastapi import Depends, Request

from ..config import Settings, get_settings
from ..data.models import User
from ..data.repositories import UserRepository
from ..errors import AuthRequired, InvalidSession, NotFound
from ..security import read_session_token
from sqlalchemy.orm import Session


def get_db(request: Request) -> Session:
    db = request.app.state.session_factory()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def _session_token(request: Request, settings: Settings) -> str | None:
    # Browsers send the HttpOnly cookie; API clients (Postman, tests) may send
    # `Authorization: Bearer <token>` instead. Either way the token is verified
    # server-side.
    token = request.cookies.get(settings.session_cookie)
    if not token:
        header = request.headers.get("Authorization", "")
        if header.startswith("Bearer "):
            token = header[len("Bearer ") :]
    return token or None


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> User:
    token = _session_token(request, settings)
    if not token:
        raise AuthRequired("sign in to continue")
    user_id = read_session_token(
        token, secret=settings.jwt_secret, algorithm=settings.jwt_algorithm
    )
    return UserRepository(db).by_id(user_id)


def get_optional_user(
    request: Request,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> User | None:
    """Like get_current_user, but a missing, expired or orphaned session means
    "signed out" instead of an error. Used by the session probe so anonymous
    visitors do not trigger a 401 on every page load."""
    try:
        return get_current_user(request, db, settings)
    except (AuthRequired, InvalidSession, NotFound):
        return None
