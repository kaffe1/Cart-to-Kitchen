"""The only 30 unlimited ingredients. Keep IDs aligned with the Kitchen drawer."""
from .seed import INGREDIENTS

PANTRY = [
    ("salt", "Salt", "🧂", []),
    ("black-pepper", "Black Pepper", "🌶️", ["pepper"]),
    ("olive-oil", "Olive Oil", "🫒", ["extra virgin olive oil"]),
    ("vegetable-oil", "Vegetable Oil", "🛢️", ["oil"]),
    ("water", "Water", "💧", []),
    ("vinegar", "Vinegar", "🍶", []),
    ("soy-sauce", "Soy Sauce", "🍶", []),
    ("mustard", "Mustard", "🌭", []),
    ("ketchup", "Ketchup", "🍅", ["tomato ketchup", "tomato-ketchup"]),
    ("chilli-sauce", "Chilli Sauce", "🌶️", []),
    ("basil", "Basil", "🌿", ["basil leaves"]),
    ("parsley", "Parsley", "🌱", []),
    ("oregano", "Oregano", "☘️", []),
    ("thyme", "Thyme", "🌿", []),
    ("cinnamon", "Cinnamon", "🥮", []),
    ("cumin", "Cumin", "🟤", []),
    ("paprika", "Paprika", "🌶️", []),
    ("chilli-flakes", "Chilli Flakes", "🌶️", ["red pepper flakes"]),
    ("curry-powder", "Curry Powder", "🍛", []),
    ("turmeric", "Turmeric", "🟡", []),
    ("ground-coriander", "Ground Coriander", "🌿", []),
    ("bay-leaves", "Bay Leaves", "🍃", ["bay leaf"]),
    ("garlic-granules", "Garlic Granules", "🧄", []),
    ("italian-seasoning", "Italian Seasoning", "🌿", []),
    ("baking-powder", "Baking Powder", "🧁", []),
    ("baking-soda", "Baking Soda", "🥄", ["bicarbonate of soda", "bicarbonate-of-soda"]),
    ("vanilla-extract", "Vanilla Extract", "🌼", []),
    ("cornstarch", "Cornstarch", "🌽", ["cornflour"]),
    ("chicken-stock", "Chicken Stock", "🐔", []),
    ("vegetable-stock-cube", "Vegetable Stock Cube", "🥬", []),
]
PANTRY_IDS = frozenset(row[0] for row in PANTRY)
STORE_IDS = frozenset(row["id"] for row in INGREDIENTS)
SUPPORTED_IDS = PANTRY_IDS | STORE_IDS
