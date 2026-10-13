"""Recipe Radar candidate selection without the FastAPI/email dependency."""

from app.data.models import User
from app.db import bootstrap, make_engine, make_session_factory
from app.integrations import mealdb
from app.services import recipe_service


BASE_MEAL = {
    "id": "base",
    "name": "Base meal",
    "thumbUrl": "https://example.test/meal.jpg",
    "category": "Test",
    "area": "Test",
    "instructions": "Cook it.",
    "ingredients": [{"name": "Salt", "measure": "a pinch"}],
}


def test_supported_recipes_fill_all_slots_before_unavailable(monkeypatch):
    engine = make_engine("sqlite://")
    bootstrap(engine)
    with make_session_factory(engine)() as db:
        user = User(display_name="Chef", email=None, password_hash=None, mode="guest")
        db.add(user)
        db.flush()
        supported = [
            {**BASE_MEAL, "id": f"supported-{index:02}", "name": f"Supported {index:02}"}
            for index in range(18)
        ]
        unavailable = {
            **BASE_MEAL,
            "id": "unavailable-high-hit",
            "ingredients": [
                {"name": "Salt", "measure": "a pinch"},
                {"name": "Saffron", "measure": "a pinch"},
            ],
        }
        monkeypatch.setattr(mealdb, "discover", lambda _: [unavailable, *supported])

        recipes = recipe_service.discover(db, user, ["salt"])

    assert len(recipes) == 18
    assert all(recipe["unsupportedIngredients"] == [] for recipe in recipes)
    assert "unavailable-high-hit" not in {recipe["id"] for recipe in recipes}


def test_alias_queries_score_distinct_app_ingredients_once(monkeypatch):
    filters = {
        "chicken": [{"idMeal": "100"}],
        "chicken_thighs": [{"idMeal": "100"}],
        "rice": [{"idMeal": "100"}],
    }
    monkeypatch.setattr(mealdb, "_get", lambda _, params: {"meals": filters[params["i"]]})
    monkeypatch.setattr(mealdb, "detail", lambda meal_id: {**BASE_MEAL, "id": meal_id})

    candidates = mealdb.discover([
        mealdb.DiscoveryQuery("chicken", frozenset({"chicken-breast"})),
        mealdb.DiscoveryQuery("chicken thighs", frozenset({"chicken-breast"})),
        mealdb.DiscoveryQuery("rice", frozenset({"rice"})),
    ])

    assert candidates[0].hit_ingredient_ids == frozenset({"chicken-breast", "rice"})
