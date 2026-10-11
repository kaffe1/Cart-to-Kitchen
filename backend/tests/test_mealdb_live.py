"""Opt-in live MealDB smoke test. All application writes use an isolated SQLite DB.
Run CTK_LIVE_MEALDB=1 pytest tests/test_mealdb_live.py -q -s.
"""
import os
import pytest
from fastapi.testclient import TestClient
from app.config import get_settings
from app.main import create_app


@pytest.mark.skipif(os.getenv("CTK_LIVE_MEALDB") != "1", reason="Live upstream opt-in required")
def test_live_mealdb_discovery_detail_and_cooking(monkeypatch):
    monkeypatch.setenv("CTK_DATABASE_URL", "sqlite://")
    get_settings.cache_clear()
    try:
        with TestClient(create_app()) as client:
            client.post("/api/v1/auth/guest").raise_for_status()
            trip = client.get("/api/v1/shopping-sessions/active").json()["id"]
            for ingredient in ["tomato", "garlic", "egg"]:
                client.put(f"/api/v1/shopping-sessions/{trip}/items/{ingredient}", json={"quantity": 1}).raise_for_status()
            client.post(f"/api/v1/shopping-sessions/{trip}/checkout").raise_for_status()
            response = client.post("/api/v1/recipes/discover", json={"ingredientIds": ["tomato", "garlic", "egg"]})
            response.raise_for_status()
            recipes = response.json()
            assert recipes and all(r["imageUrl"] and r["steps"] for r in recipes)
            print(f"Live MealDB: {len(recipes)} normalized recipes, first: {recipes[0]['name']}")
            owned = {"tomato", "garlic", "egg"}
            catalogue = {item["id"]: item for item in client.get("/api/v1/ingredients").json()}
            supported = [r for r in recipes if not r["unsupportedIngredients"]]
            assert supported, "No fully supported recipes in this bounded live sample"
            affordable = sorted(supported, key=lambda r: sum(catalogue[i["ingredientId"]]["priceSek"] for i in r["requirements"] if not i["automatic"] and i["ingredientId"] not in owned))
            recipe = affordable[0]
            trip = client.get("/api/v1/shopping-sessions/active").json()["id"]
            needed = [i["ingredientId"] for i in recipe["requirements"] if not i["automatic"] and i["ingredientId"] not in owned]
            for ingredient in needed:
                client.put(f"/api/v1/shopping-sessions/{trip}/items/{ingredient}", json={"quantity": 1}).raise_for_status()
            if needed:
                client.post(f"/api/v1/shopping-sessions/{trip}/checkout").raise_for_status()
            detail = client.get(f"/api/v1/recipes/{recipe['id']}")
            detail.raise_for_status()
            assert detail.json()["steps"] == recipe["steps"]
            cooked = client.post(f"/api/v1/recipes/{recipe['id']}/cook", headers={"Idempotency-Key": "live-test"})
            cooked.raise_for_status()
            assert cooked.json()["completedCount"] == 1
            assert len(client.get("/api/v1/history").json()) == 1
            print(f"Cooked and recorded: {recipe['name']}, ingredients deducted, dish #1")
    finally:
        get_settings.cache_clear()
