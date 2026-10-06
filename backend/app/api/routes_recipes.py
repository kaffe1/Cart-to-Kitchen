"""Recipe routes: TheMealDB search/detail, the three-tier match, cooking."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..services import recipe_service
from .deps import get_current_user, get_db

router = APIRouter(prefix="/recipes", tags=["recipes"])


@router.get("")
def search(search: str = Query(min_length=1), db: Session = Depends(get_db)):
    return recipe_service.search(search)


@router.get("/matches")  # declared before /{meal_id} so it is not captured
def matches(
    search: str = Query(min_length=1),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return recipe_service.matches(db, user, search)


@router.get("/{meal_id}")
def detail(meal_id: str):
    return recipe_service.detail(meal_id)


@router.post("/{meal_id}/cook")
def cook(
    meal_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return recipe_service.cook(db, user, meal_id)
