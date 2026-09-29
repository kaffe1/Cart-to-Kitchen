"""Test setup: the app runs on an in-memory SQLite database.

CTK_DATABASE_URL must be set before `app.main` is imported, because the app
factory creates the engine at import time.
"""

from __future__ import annotations

import os
import uuid

os.environ["CTK_DATABASE_URL"] = "sqlite://"

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture()
def client() -> TestClient:
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def account(client: TestClient) -> dict:
    """A registered, signed-in account (unique email — the shared in-memory
    database persists across tests in one run)."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": f"cook-{uuid.uuid4().hex[:8]}@example.com",
            "password": "kitchen-5",
            "displayName": "Test Cook",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


@pytest.fixture()
def guest(client: TestClient) -> dict:
    response = client.post("/api/v1/auth/guest")
    assert response.status_code == 200, response.text
    return response.json()


def set_wallet_balance(test_client: TestClient, user_id: str, balance_sek: int) -> None:
    """Poke the wallet directly for deterministic budget tests."""
    from app.data.models import Wallet

    session = test_client.app.state.session_factory()
    wallet = session.get(Wallet, int(user_id))
    wallet.balance_sek = balance_sek
    session.commit()
    session.close()
