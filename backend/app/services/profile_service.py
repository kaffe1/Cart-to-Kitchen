"""Profile flows: account settings, cooking history with reviews, avatar."""

from __future__ import annotations

from sqlalchemy.orm import Session

from ..data.models import User
from ..data.repositories import ShoppingRepository, UserRepository
from ..errors import InvalidCredentials, RuleValidation
from ..security import hash_password, verify_password
from .recipe_service import history_public


def me_full(db: Session, user: User) -> dict:
    return {
        "id": str(user.id),
        "displayName": user.display_name,
        "email": user.email,
        "mode": user.mode,
        "createdAt": user.created_at.isoformat(),
        "avatarUrl": (
            "/api/v1/me/avatar" if ShoppingRepository(db).avatar(user.id) else None
        ),
    }


def update_me(
    db: Session,
    user: User,
    *,
    display_name: str | None,
    email: str | None,
    new_password: str | None,
    current_password: str | None,
) -> dict:
    if email is not None and email != user.email:
        if UserRepository(db).by_email(email) is not None:
            raise RuleValidation("This email is already in use.")
        user.email = email
    if new_password is not None:
        if user.password_hash is None:  # guests have no password to verify
            raise InvalidCredentials("Guest accounts cannot set a password.")
        if current_password is None or not verify_password(
            current_password, user.password_hash
        ):
            raise InvalidCredentials("current password is wrong")
        user.password_hash = hash_password(new_password)
    if display_name is not None:
        user.display_name = display_name
    db.flush()
    return me_full(db, user)


def history(db: Session, user: User) -> list[dict]:
    return [history_public(entry) for entry in ShoppingRepository(db).history(user.id)]


def set_review(
    db: Session,
    user: User,
    entry_id: int,
    text: str,
    image: tuple[bytes, str] | None,
) -> dict:
    entry = ShoppingRepository(db).history_entry(user.id, entry_id)
    entry.review_text = text
    if image is not None:
        entry.review_image, entry.review_image_type = image
    db.flush()
    return history_public(entry)


def review_image(db: Session, user: User, entry_id: int) -> tuple[bytes, str]:
    entry = ShoppingRepository(db).history_entry(user.id, entry_id)
    if entry.review_image is None:
        raise RuleValidation("This review has no image.")
    return entry.review_image, entry.review_image_type


def set_avatar(db: Session, user: User, image: tuple[bytes, str]) -> dict:
    ShoppingRepository(db).set_avatar(user.id, media_type=image[1], image_data=image[0])
    db.flush()
    return me_full(db, user)


def avatar_image(db: Session, user: User) -> tuple[bytes, str]:
    row = ShoppingRepository(db).avatar(user.id)
    if row is None:
        raise RuleValidation("No avatar uploaded yet.")
    return row.image_data, row.media_type
