"""Profile routes: account settings, avatar, cooking history with reviews."""

from __future__ import annotations

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    Response,
    UploadFile,
)
from sqlalchemy.orm import Session

from ..images import read_image
from ..profanity import check_review
from ..schemas import UpdateMeInput
from ..services import profile_service
from .deps import get_current_user, get_db

router = APIRouter(tags=["profile"])


@router.patch("/me")
def update_me(
    payload: UpdateMeInput,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return profile_service.update_me(
        db, user,
        display_name=payload.display_name,
        email=payload.email,
        new_password=payload.new_password,
        current_password=payload.current_password,
    )


@router.put("/me/avatar")
async def set_avatar(
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return profile_service.set_avatar(db, user, await read_image(image))


@router.get("/me/avatar")
def get_avatar(db: Session = Depends(get_db), user=Depends(get_current_user)):
    data, media_type = profile_service.avatar_image(db, user)
    return Response(content=data, media_type=media_type)


@router.get("/history")
def history(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return profile_service.history(db, user)


@router.put("/history/{entry_id}/review")
async def set_review(
    entry_id: int,
    text: str = Form(min_length=1, max_length=2000),
    image: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    check_review(text)
    stored_image = await read_image(image) if image is not None else None
    return profile_service.set_review(db, user, entry_id, text, stored_image)


@router.get("/history/{entry_id}/image")
def review_image(
    entry_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    data, media_type = profile_service.review_image(db, user, entry_id)
    return Response(content=data, media_type=media_type)
