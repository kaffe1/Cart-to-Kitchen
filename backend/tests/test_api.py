"""API tests: auth, catalogue, cart, checkout, and the wallet grant math."""

from datetime import UTC, datetime
from zoneinfo import ZoneInfo

from fastapi.testclient import TestClient

from app.services.wallet_service import grants_between, next_grant_at

from .conftest import set_wallet_balance

STOCKHOLM = ZoneInfo("Europe/Stockholm")


def _active(client: TestClient) -> dict:
    response = client.get("/api/v1/shopping-sessions/active")
    assert response.status_code == 200, response.text
    return response.json()


def _put_item(client: TestClient, session_id: int, ingredient_id: str, quantity: int):
    return client.put(
        f"/api/v1/shopping-sessions/{session_id}/items/{ingredient_id}",
        json={"quantity": quantity},
    )


# --- auth ---------------------------------------------------------------------


def test_register_login_and_session_cookie(client: TestClient):
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "chef@example.com", "password": "brunch-7", "displayName": "Chef"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["user"]["displayName"] == "Chef"
    assert body["user"]["mode"] == "account"
    assert body["accessToken"]
    assert "ctk_session=" in response.headers["set-cookie"]
    assert "HttpOnly" in response.headers["set-cookie"]

    assert client.post("/api/v1/auth/logout").status_code == 204
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "chef@example.com", "password": "brunch-7"},
    )
    assert response.status_code == 200
    assert client.get("/api/v1/auth/me").json()["user"]["id"] == body["user"]["id"]


def test_register_rejects_bad_input_and_duplicates(client: TestClient, account: dict):
    short = client.post(
        "/api/v1/auth/register",
        json={"email": "x@example.com", "password": "123", "displayName": "X"},
    )
    assert short.status_code == 422
    duplicate = client.post(
        "/api/v1/auth/register",
        json={
            "email": account["user"]["email"],
            "password": "another-9",
            "displayName": "Copy",
        },
    )
    assert duplicate.status_code == 409
    assert duplicate.json()["error"]["code"] == "conflict"


def test_login_wrong_password_and_guest_flow(client: TestClient, account: dict):
    wrong = client.post(
        "/api/v1/auth/login",
        json={"email": account["user"]["email"], "password": "wrong-pass"},
    )
    assert wrong.status_code == 401
    assert wrong.json()["error"]["code"] == "invalid_credentials"

    guest = client.post("/api/v1/auth/guest").json()
    assert guest["user"]["mode"] == "guest"
    assert guest["user"]["email"] is None
    assert guest["user"]["displayName"].startswith("Guest cook")


def test_auth_required_tampered_and_bearer(client: TestClient, account: dict):
    client.cookies.set("ctk_session", "not-a-real-token")
    assert client.get("/api/v1/auth/me").status_code == 401
    client.cookies.delete("ctk_session")
    client.post("/api/v1/auth/logout")
    # API clients without a cookie jar authenticate via Authorization header.
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {account['accessToken']}"},
    )
    assert response.status_code == 200
    assert response.json()["user"]["id"] == account["user"]["id"]


# --- store --------------------------------------------------------------------


def test_catalogue_seeded_and_matches_frontend_shape(client: TestClient):
    catalogue = client.get("/api/v1/ingredients").json()
    assert len(catalogue) == 80
    tomato = next(item for item in catalogue if item["id"] == "tomato")
    assert tomato["priceSek"] == 18
    assert tomato["usesPerUnit"] == 3
    assert tomato["category"] == "Vegetables & Fruits"
    assert tomato["aliases"] == ["tomato", "tomatoes"]
    assert tomato["isPantry"] is False
    assert set(tomato) == {
        "id", "name", "emoji", "category", "usesPerUnit",
        "priceSek", "aliases", "isPantry", "color",
    }


def test_active_session_requires_auth(client: TestClient):
    assert client.get("/api/v1/shopping-sessions/active").status_code == 401


def test_active_session_created_lazily(client: TestClient, guest: dict):
    snapshot = _active(client)
    assert snapshot["status"] == "active"
    assert snapshot["cart"] == []
    assert snapshot["wallet"]["balanceSek"] >= 500
    assert snapshot["wallet"]["capSek"] == 3000
    assert snapshot["wallet"]["hourlyGrantSek"] == 100


def test_cart_add_update_remove_and_clamp(client: TestClient, guest: dict):
    session_id = _active(client)["id"]
    assert _put_item(client, session_id, "tomato", 3).json() == [
        {"ingredientId": "tomato", "quantity": 3}
    ]
    assert _put_item(client, session_id, "egg", 99).json() == [
        {"ingredientId": "egg", "quantity": 9},
        {"ingredientId": "tomato", "quantity": 3},
    ]
    assert _put_item(client, session_id, "tomato", 0).json() == [
        {"ingredientId": "egg", "quantity": 9}
    ]
    assert _active(client)["cart"] == [{"ingredientId": "egg", "quantity": 9}]
    # Unknown ingredient and foreign/retired sessions read as 404.
    assert _put_item(client, session_id, "dragon-fruit", 1).status_code == 404
    client.post("/api/v1/auth/guest")
    assert _put_item(client, session_id, "tomato", 1).status_code == 404


def test_checkout_rejections(client: TestClient, guest: dict):
    session_id = _active(client)["id"]
    empty = client.post(f"/api/v1/shopping-sessions/{session_id}/checkout")
    assert empty.status_code == 422
    assert empty.json()["error"]["details"]["code"] == "EMPTY_CART"

    set_wallet_balance(client, guest["user"]["id"], 10)
    _put_item(client, session_id, "tomato", 2)  # 36 SEK > 10 SEK
    broke = client.post(f"/api/v1/shopping-sessions/{session_id}/checkout")
    assert broke.status_code == 422
    assert broke.json()["error"]["details"]["code"] == "BUDGET_EXCEEDED"
    # The cart survives a failed checkout.
    assert _active(client)["cart"] == [{"ingredientId": "tomato", "quantity": 2}]


def test_checkout_success_rotates_session_and_stocks_inventory(
    client: TestClient, guest: dict
):
    session_id = _active(client)["id"]
    set_wallet_balance(client, guest["user"]["id"], 1000)
    _put_item(client, session_id, "tomato", 2)  # 18 * 2 = 36 SEK, 3 uses each
    _put_item(client, session_id, "egg", 1)  # 24 SEK, 3 uses

    response = client.post(f"/api/v1/shopping-sessions/{session_id}/checkout")
    assert response.status_code == 200
    assert response.json() == {
        "purchasedUnits": 3,
        "spentSek": 60,
        "remainingBalanceSek": 940,
    }

    snapshot = _active(client)
    assert snapshot["id"] != session_id  # fresh session opened
    assert snapshot["cart"] == []
    assert snapshot["wallet"]["balanceSek"] == 940
    inventory = {row["ingredientId"]: row for row in snapshot["inventory"]}
    assert inventory["tomato"]["remainingUses"] == 6
    assert inventory["egg"]["remainingUses"] == 3
    assert _put_item(client, session_id, "tomato", 1).status_code == 404


# --- wallet grant math (pure functions, fixed instants) ------------------------


def _naive_stockholm(y, m, d, h, minute=0):
    return datetime(y, m, d, h, minute, tzinfo=STOCKHOLM).astimezone(UTC).replace(tzinfo=None)


def test_grants_accrue_for_full_working_hours_only():
    assert grants_between(
        _naive_stockholm(2026, 9, 29, 9), _naive_stockholm(2026, 9, 29, 12)
    ) == 3
    assert grants_between(
        _naive_stockholm(2026, 9, 29, 9, 30), _naive_stockholm(2026, 9, 29, 11, 30)
    ) == 2  # partial hours do not count
    assert grants_between(
        _naive_stockholm(2026, 9, 29, 7), _naive_stockholm(2026, 9, 29, 9)
    ) == 0  # before 09:00
    assert grants_between(
        _naive_stockholm(2026, 9, 29, 18), _naive_stockholm(2026, 9, 29, 20)
    ) == 0  # after 17:00
    assert grants_between(
        _naive_stockholm(2026, 9, 28, 16), _naive_stockholm(2026, 9, 29, 10)
    ) == 2  # across days: Mon 16→17 plus Tue 9→10


def test_next_grant_boundaries():
    assert next_grant_at(_naive_stockholm(2026, 9, 29, 8, 30)) == datetime(
        2026, 9, 29, 9, 0, tzinfo=STOCKHOLM
    )
    assert next_grant_at(_naive_stockholm(2026, 9, 29, 12, 10)) == datetime(
        2026, 9, 29, 13, 0, tzinfo=STOCKHOLM
    )
    assert next_grant_at(_naive_stockholm(2026, 9, 29, 17, 30)) is None
