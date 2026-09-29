"""Auth routes: thin HTTP layer over auth_service."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from ..config import Settings, get_settings
from ..schemas import LoginInput, RegisterInput
from ..services import auth_service
from .deps import get_current_user, get_db

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_session_cookie(response: Response, token: str, settings: Settings) -> None:
    response.set_cookie(
        key=settings.session_cookie,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=settings.session_hours * 3600,
        path="/",
    )


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterInput,
    response: Response,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    result = auth_service.register(
        db, settings,
        email=payload.email, password=payload.password,
        display_name=payload.display_name,
    )
    _set_session_cookie(response, result["accessToken"], settings)
    return result


@router.post("/login")
def login(
    payload: LoginInput,
    response: Response,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    result = auth_service.login(
        db, settings, email=payload.email, password=payload.password
    )
    _set_session_cookie(response, result["accessToken"], settings)
    return result


@router.post("/guest")
def guest(
    response: Response,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    result = auth_service.guest(db, settings)
    _set_session_cookie(response, result["accessToken"], settings)
    return result


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response, settings: Settings = Depends(get_settings)):
    response.delete_cookie(key=settings.session_cookie, path="/")


@router.get("/me")
def me(user=Depends(get_current_user), db: Session = Depends(get_db)):
    return auth_service.me(db, user.id)
