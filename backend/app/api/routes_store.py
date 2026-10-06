"""Store routes: catalogue + shopping session lifecycle."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..schemas import QuantityInput
from ..services import store_service
from .deps import get_current_user, get_db

router = APIRouter(tags=["store"])


@router.get("/ingredients")
def list_ingredients(db: Session = Depends(get_db)):
    return store_service.ingredients(db)


@router.get("/shopping-sessions/active")
def active_session(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return store_service.active_session(db, user)


@router.put("/shopping-sessions/{session_id}/items/{ingredient_id}")
def set_cart_quantity(
    session_id: int,
    ingredient_id: str,
    payload: QuantityInput,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return store_service.set_cart_quantity(
        db, user, session_id, ingredient_id, payload.quantity
    )


@router.get("/kitchen/inventory")
def kitchen_inventory(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return store_service.kitchen_inventory(db, user)


@router.post("/shopping-sessions/{session_id}/checkout")
def checkout(
    session_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return store_service.checkout(db, user, session_id)
