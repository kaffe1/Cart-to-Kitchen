"""HTTP contract tests with an isolated database and deterministic MealDB fixture."""
import pytest
from fastapi.testclient import TestClient
from app.config import get_settings
from app.integrations import mealdb
from app.main import create_app


MEAL = {
    "id": "52771", "name": "Spicy Arrabiata Penne", "thumbUrl": "https://www.themealdb.com/images/media/meals/ustsqw1468250014.jpg",
    "category": "Vegetarian", "area": "Italian",
    "instructions": "STEP 1\r\nChop the garlic.\r\n2. Simmer the sauce. Serve warm.",
    "ingredients": [{"name": "Garlic", "measure": "1 clove"}, {"name": "Garlic Clove", "measure": "1"},
                    {"name": "Olive Oil", "measure": "1 tbsp"}, {"name": "Parsley", "measure": "a pinch"}],
}


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("CTK_DATABASE_URL", "sqlite://")
    get_settings.cache_clear()
    monkeypatch.setattr(mealdb, "detail", lambda mid: MEAL if mid == MEAL["id"] else None)
    monkeypatch.setattr(mealdb, "discover", lambda names: [MEAL])
    with TestClient(create_app()) as client:
        yield client
    get_settings.cache_clear()


def buy_garlic(client):
    assert client.post("/api/v1/auth/guest").status_code == 200
    trip = client.get("/api/v1/shopping-sessions/active").json()["id"]
    assert client.put(f"/api/v1/shopping-sessions/{trip}/items/garlic", json={"quantity": 1}).status_code == 200
    assert client.post(f"/api/v1/shopping-sessions/{trip}/checkout").status_code == 200


def buy(client, ingredient_ids):
    assert client.post("/api/v1/auth/guest").status_code == 200
    trip = client.get("/api/v1/shopping-sessions/active").json()["id"]
    for ingredient_id in ingredient_ids:
        assert client.put(
            f"/api/v1/shopping-sessions/{trip}/items/{ingredient_id}", json={"quantity": 1}
        ).status_code == 200
    assert client.post(f"/api/v1/shopping-sessions/{trip}/checkout").status_code == 200


def test_discovery_auth_stock_normalization_and_detail(client):
    assert client.post("/api/v1/recipes/discover", json={"ingredientIds": ["garlic"]}).status_code == 401
    buy_garlic(client)
    response = client.post("/api/v1/recipes/discover", json={"ingredientIds": ["garlic"]})
    assert response.status_code == 200
    recipe = response.json()[0]
    assert recipe["imageUrl"] == MEAL["thumbUrl"]
    assert recipe["steps"] == ["Chop the garlic.", "Simmer the sauce.", "Serve warm."]
    assert recipe["requirements"] == [
        {"ingredientId": "garlic", "amount": 1, "automatic": False},
        {"ingredientId": "olive-oil", "amount": 1, "automatic": True},
        {"ingredientId": "parsley", "amount": 1, "automatic": True},
    ]
    assert client.get("/api/v1/recipes/52771").json() == recipe
    assert client.post("/api/v1/recipes/discover", json={"ingredientIds": []}).status_code == 422
    assert client.post("/api/v1/recipes/discover", json={"ingredientIds": ["beef"]}).status_code == 422
    assert client.post("/api/v1/recipes/discover", json={"ingredientIds": ["ketchup", "baking-soda"]}).status_code == 200
    assert client.get("/api/v1/recipes/nonexistent").status_code == 404


def test_cook_is_atomic_counted_and_idempotent_per_user(client):
    buy_garlic(client)
    headers = {"Idempotency-Key": "cooking-attempt-one"}
    first = client.post("/api/v1/recipes/52771/cook", headers=headers)
    assert first.status_code == 200
    assert first.json()["completedCount"] == 1
    repeat = client.post("/api/v1/recipes/52771/cook", headers=headers)
    assert repeat.json() == first.json()
    assert client.get("/api/v1/kitchen/inventory").json() == [{"ingredientId": "garlic", "remainingUses": 2}]
    assert len(client.get("/api/v1/history").json()) == 1
    assert client.post("/api/v1/recipes/different/cook", headers=headers).status_code == 422
    assert client.post("/api/v1/recipes/52771/cook", headers={"Idempotency-Key": "two"}).json()["completedCount"] == 2
    assert client.post("/api/v1/recipes/52771/cook", headers={"Idempotency-Key": "three"}).json()["completedCount"] == 3
    missing = client.post("/api/v1/recipes/52771/cook", headers={"Idempotency-Key": "four"})
    assert missing.status_code == 422
    assert missing.json()["error"]["details"]["code"] == "MISSING_INGREDIENTS"
    assert len(client.get("/api/v1/history").json()) == 3
    client.post("/api/v1/auth/guest")
    assert client.get("/api/v1/history").json() == []
    assert client.post("/api/v1/recipes/52771/cook", headers=headers).status_code == 422


def test_discovery_upstream_error_surfaces_and_pantry_alias_does_not_hide_eggs(client, monkeypatch):
    from app.errors import ExternalApi
    from app.services.recipe_service import normalize_meal
    from app.db import make_engine, make_session_factory, bootstrap
    engine = make_engine("sqlite://")
    bootstrap(engine)
    with make_session_factory(engine)() as db:
        recipe = normalize_meal(db, {**MEAL, "ingredients": [{"name": "Eggs", "measure": "2"}]})
        assert recipe["requirements"] == [{"ingredientId": "egg", "amount": 1, "automatic": False}]
    buy_garlic(client)
    def unavailable(names):
        raise ExternalApi("recipe service is unavailable")
    monkeypatch.setattr(mealdb, "discover", unavailable)
    assert client.post("/api/v1/recipes/discover", json={"ingredientIds": ["garlic"]}).status_code == 502


def test_second_tier_whitelist_is_used_by_detail_discovery_and_cooking(client, monkeypatch):
    family_meal = {
        **MEAL,
        "id": "family-meal",
        "name": "Chicken thigh with basmati rice",
        "ingredients": [
            {"name": "Chicken Thighs", "measure": "4"},
            {"name": "Basmati Rice", "measure": "200g"},
            {"name": "Sea Salt", "measure": "a pinch"},
        ],
    }
    monkeypatch.setattr(mealdb, "detail", lambda mid: family_meal if mid == "family-meal" else None)
    captured_names = []

    def discover(queries):
        captured_names.extend(query.name for query in queries)
        return [family_meal]

    monkeypatch.setattr(mealdb, "discover", discover)
    buy(client, ["chicken-breast", "rice"])

    recipe = client.get("/api/v1/recipes/family-meal").json()
    assert recipe["unsupportedIngredients"] == []
    assert recipe["requirements"] == [
        {"ingredientId": "chicken-breast", "amount": 1, "automatic": False},
        {"ingredientId": "rice", "amount": 1, "automatic": False},
        {"ingredientId": "salt", "amount": 1, "automatic": True},
    ]
    assert [item["resolution"] for item in recipe["ingredients"]] == ["family", "family", "family"]
    assert recipe["ingredients"][0]["resolvedIngredientNames"] == ["Chicken"]
    assert all(item["substitution"] for item in recipe["ingredients"])

    response = client.post(
        "/api/v1/recipes/discover", json={"ingredientIds": ["chicken-breast", "rice"]}
    )
    assert response.status_code == 200
    assert "chicken" in captured_names
    assert "chicken thighs" in captured_names
    assert "basmati rice" in captured_names

    cooked = client.post("/api/v1/recipes/family-meal/cook")
    assert cooked.status_code == 200
    inventory = {item["ingredientId"]: item["remainingUses"] for item in client.get("/api/v1/kitchen/inventory").json()}
    assert inventory == {"chicken-breast": 0, "rice": 2}


def test_discovery_supported_recipes_cannot_be_displaced_by_unavailable_hits(client, monkeypatch):
    buy_garlic(client)
    supported = [
        {
            **MEAL,
            "id": f"supported-{index:02}",
            "name": f"Supported {index:02}",
            "ingredients": [{"name": "Garlic", "measure": "1 clove"}],
        }
        for index in range(18)
    ]
    unavailable = {
        **MEAL,
        "id": "unavailable-high-hit",
        "name": "Unavailable high hit",
        "ingredients": [
            {"name": "Garlic", "measure": "1 clove"},
            {"name": "Saffron", "measure": "a pinch"},
        ],
    }
    monkeypatch.setattr(mealdb, "discover", lambda _: [unavailable, *supported])

    response = client.post("/api/v1/recipes/discover", json={"ingredientIds": ["garlic"]})
    assert response.status_code == 200
    recipes = response.json()
    assert len(recipes) == 18
    assert all(recipe["unsupportedIngredients"] == [] for recipe in recipes)
    assert "unavailable-high-hit" not in {recipe["id"] for recipe in recipes}


def test_mealdb_alias_queries_score_distinct_app_ingredients_once(monkeypatch):
    filters = {
        "chicken": [{"idMeal": "100"}],
        "chicken_thighs": [{"idMeal": "100"}],
        "rice": [{"idMeal": "100"}],
    }
    monkeypatch.setattr(mealdb, "_get", lambda _, params: {"meals": filters[params["i"]]})
    monkeypatch.setattr(mealdb, "detail", lambda meal_id: {**MEAL, "id": meal_id})

    candidates = mealdb.discover([
        mealdb.DiscoveryQuery("chicken", frozenset({"chicken-breast"})),
        mealdb.DiscoveryQuery("chicken thighs", frozenset({"chicken-breast"})),
        mealdb.DiscoveryQuery("rice", frozenset({"rice"})),
    ])
    assert candidates[0].hit_ingredient_ids == frozenset({"chicken-breast", "rice"})


def test_only_30_pantry_and_80_store_items_are_supported(client, monkeypatch):
    import re
    from pathlib import Path
    from app.data.pantry import PANTRY_IDS, STORE_IDS
    catalogue = client.get("/api/v1/ingredients").json()
    assert len(catalogue) == 110
    assert {r["id"] for r in catalogue if r["isPantry"]} == PANTRY_IDS
    assert {r["id"] for r in catalogue if not r["isPantry"]} == STORE_IDS
    frontend = Path(__file__).parents[2] / "frontend/src/shared/api/dummyData.ts"
    assert set(re.findall(r"pantryIngredient\('([^']+)'", frontend.read_text())) == PANTRY_IDS
    assert sum(r["usesPerUnit"] == "infinite" for r in catalogue) == 30
    buy_garlic(client)
    bad = {**MEAL, "ingredients": [*MEAL["ingredients"], {"name": "Saffron", "measure": "a pinch"}, {"name": "Unlisted Spice", "measure": "1 tsp"}, {"name": "Fish Sauce", "measure": "1 tsp"}]}
    monkeypatch.setattr(mealdb, "detail", lambda _: bad)
    monkeypatch.setattr(mealdb, "discover", lambda _: [bad])
    monkeypatch.setattr(mealdb, "search", lambda _: [bad])
    recipe = client.get("/api/v1/recipes/52771").json()
    assert recipe["unsupportedIngredients"] == ["Saffron", "Unlisted Spice", "Fish Sauce"]
    assert not any(r["automatic"] for r in recipe["requirements"] if r["ingredientId"] in {"saffron", "unlisted-spice"})
    tiers = client.get("/api/v1/recipes/matches?search=test").json()
    assert not tiers["ready"] and not tiers["almost"]
    assert tiers["needShopping"][0]["unsupportedIngredients"] == ["Saffron", "Unlisted Spice", "Fish Sauce"]
    result = client.post("/api/v1/recipes/52771/cook")
    assert result.status_code == 422
    assert result.json()["error"]["details"]["code"] == "UNSUPPORTED_INGREDIENTS"
    assert client.get("/api/v1/kitchen/inventory").json()[0]["remainingUses"] == 3
    assert client.get("/api/v1/history").json() == []
    assert client.post("/api/v1/recipes/discover", json={"ingredientIds": ["saffron"]}).status_code == 422
    trip = client.get("/api/v1/shopping-sessions/active").json()["id"]
    assert client.put(f"/api/v1/shopping-sessions/{trip}/items/saffron", json={"quantity": 1}).status_code == 404


def test_bootstrap_retires_old_unlimited_rows_without_deleting_user_data():
    from app.db import make_engine, make_session_factory, bootstrap
    from app.data.models import Ingredient
    from app.data.repositories import IngredientRepository
    engine = make_engine("sqlite://")
    bootstrap(engine)
    with make_session_factory(engine)() as db:
        db.add(Ingredient(id="saffron", name="Saffron", emoji="", category="Pantry", uses_per_unit=None,
                          price_sek=0, aliases_json='["saffron"]', is_pantry=True, color="#cccccc"))
        db.commit()
    bootstrap(engine)
    bootstrap(engine)
    with make_session_factory(engine)() as db:
        old = db.get(Ingredient, "saffron")
        assert old is not None and not old.is_pantry and old.uses_per_unit == 0
        assert len(IngredientRepository(db).all()) == 110
        assert not IngredientRepository(db).by_ids(["saffron"])
