"""Shared FastAPI dependencies."""

from __future__ import annotations

from fastapi import Depends, Request

from ..config import Settings, get_settings
from ..data.models import User
from ..data.repositories import UserRepository
from ..errors import AuthRequired, InvalidSession
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


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> User:
    # Browsers send the HttpOnly cookie; API clients (Postman, tests) may send
    # `Authorization: Bearer <token>` instead. Either way the token is verified
    # server-side.
    token = request.cookies.get(settings.session_cookie)
    if not token:
        header = request.headers.get("Authorization", "")
        if header.startswith("Bearer "):
            token = header[len("Bearer ") :]
    if not token:
        raise AuthRequired("sign in to continue")
    user_id = read_session_token(
        token, secret=settings.jwt_secret, algorithm=settings.jwt_algorithm
    )
    return UserRepository(db).by_id(user_id)
