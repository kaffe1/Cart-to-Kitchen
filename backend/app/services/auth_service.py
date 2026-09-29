"""Auth flows: register, login, guest, session lookup."""

from __future__ import annotations

import secrets

from sqlalchemy.orm import Session

from ..config import Settings
from ..data.models import User
from ..data.repositories import UserRepository
from ..errors import InvalidCredentials
from ..security import create_session_token, hash_password, verify_password
from . import wallet_service


def user_public(row: User) -> dict:
    return {
        "id": str(row.id),
        "displayName": row.display_name,
        "email": row.email,
        "mode": row.mode,
        "createdAt": row.created_at.isoformat(),
    }


def issue_token(row: User, settings: Settings) -> str:
    return create_session_token(
        row.id,
        secret=settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
        hours=settings.session_hours,
    )


def register(db: Session, settings: Settings, *, email: str, password: str, display_name: str) -> dict:
    user = UserRepository(db).create(
        display_name=display_name,
        email=email,
        password_hash=hash_password(password),
        mode="account",
    )
    wallet_service.create_wallet(db, user)
    return {"user": user_public(user), "accessToken": issue_token(user, settings)}


def login(db: Session, settings: Settings, *, email: str, password: str) -> dict:
    user = UserRepository(db).by_email(email)
    if user is None or user.password_hash is None or not verify_password(
        password, user.password_hash
    ):
        raise InvalidCredentials("wrong email or password")
    return {"user": user_public(user), "accessToken": issue_token(user, settings)}


def guest(db: Session, settings: Settings) -> dict:
    """Anonymous account so the store demo works without sign-up, matching the
    frontend guest flow."""
    user = UserRepository(db).create(
        display_name=f"Guest cook {secrets.token_hex(2)}",
        email=None,
        password_hash=None,
        mode="guest",
    )
    wallet_service.create_wallet(db, user)
    return {"user": user_public(user), "accessToken": issue_token(user, settings)}


def me(db: Session, user_id: int) -> dict:
    return {"user": user_public(UserRepository(db).by_id(user_id))}
