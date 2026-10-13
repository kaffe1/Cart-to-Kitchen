# Cart to Kitchen Backend

Python (FastAPI) backend for Cart to Kitchen: authentication, the ingredient
catalogue, the shopping flow with the wallet economy, recipes via TheMealDB
with the three-tier match, cooking, and the profile page (settings, avatar,
history with reviews). PostgreSQL persistence, one-command Docker start.

## Quick start (Docker)

```bash
docker compose up --build
```

This starts PostgreSQL and the API. The API listens on
`http://localhost:8000` — exactly the base URL the frontend `.env.example`
expects (`VITE_API_BASE_URL=http://localhost:8000/api/v1`). Interactive docs:
`http://localhost:8000/docs`.

To reset all data: `docker compose down -v`.

## Local development without Docker

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload   # needs a PostgreSQL at CTK_DATABASE_URL
```

Tables and the ingredient catalogue are created/seeded on startup.

## Testing

**Postman — the HTTP test suite** (ordered journeys: auth → store/checkout →
recipes/match/cook → kitchen → profile/avatar/review). Run headless from
`backend/` against a running stack:

```bash
docker compose up -d
npx newman run postman/cart-to-kitchen.postman_collection.json \
  -e postman/local.postman_environment.json
```

For scheduled runs with failure notifications, create a **Postman Monitor** on
the collection (e.g. every 10 minutes).

**pytest — unit and isolated HTTP contract tests**: wallet grant math, match
tiers, review filtering, recipe discovery/normalization, cooking inventory,
history counts, user isolation and idempotent completion. HTTP tests use SQLite
and deterministic MealDB fixtures; they do not change the development database.

```bash
pip install -e ".[dev]" && pytest
```

Optional real TheMealDB integration (network required, isolated SQLite database):

```bash
CTK_LIVE_MEALDB=1 pytest -q tests/test_mealdb_live.py -s
```

Read-only MealDB coverage audit against the current store/pantry aliases:

```bash
python -m scripts.mealdb_coverage
```

This cross-checks first-letter searches with all public category lists and uses
an isolated in-memory catalogue. See [the coverage snapshot](../MEALDB_COVERAGE.md)
for the measured count, assumptions and fully supported dishes.

To measure the production Tier 1/Tier 2 whitelist and the audit-only Tier 3
game adaptations:

```bash
python -m scripts.relaxed_coverage --summary
```

Tier 1 and Tier 2 are used by recipe detail, discovery, matching and cooking.
Tier 3 remains audit-only. The assumptions and their limits are documented in
[the relaxed coverage report](../MEALDB_RELAXED_COVERAGE.md).

## Architecture

Layered (Controller → Service → Repository/Model) — full documentation with
diagrams in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Summary:

```
app/
├── api/            # routers + dependencies: HTTP in/out only
├── services/       # business rules: auth, store/checkout, wallet, recipes, profile
├── data/           # SQLAlchemy models, repositories (all SQL), seed catalogue
├── integrations/   # external APIs (TheMealDB client)
├── schemas.py      # request validation (responses are contract-shaped dicts)
├── security.py     # bcrypt password hashing, JWT session tokens
├── errors.py       # business exceptions → uniform {"error": {code, message}}
├── images.py       # shared upload guard (type whitelist + size cap)
├── profanity.py    # regex filter for review text
├── db.py           # engine, session factory, bootstrap
└── main.py         # app factory: CORS, error mapping, routers
```

## API overview

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/v1/auth/register` | Create an account |
| POST | `/api/v1/auth/login` | Sign in |
| POST | `/api/v1/auth/guest` | Anonymous session for the guest mode |
| POST | `/api/v1/auth/logout` | Clear the session cookie |
| GET | `/api/v1/auth/me` | Current user |
| GET | `/api/v1/ingredients` | Strict catalogue: 80 sellable items + exactly 30 unlimited default pantry items |
| GET | `/api/v1/shopping-sessions/active` | Wallet + cart + inventory snapshot |
| PUT | `/api/v1/shopping-sessions/{id}/items/{ingredientId}` | Set cart quantity (0 removes) |
| POST | `/api/v1/shopping-sessions/{id}/checkout` | Purchase the cart |
| GET | `/api/v1/kitchen/inventory` | Kitchen stock |
| GET | `/api/v1/recipes?search=` | TheMealDB search |
| POST | `/api/v1/recipes/discover` | Discover real meals from counter `ingredientIds`; normalized images, steps and requirements |
| GET | `/api/v1/recipes/{id}` | Recipe detail including normalized steps, imageUrl, ingredients and requirements |
| GET | `/api/v1/recipes/matches?search=` | Three-tier match: ready / almost / needShopping |
| POST | `/api/v1/recipes/{id}/cook` | Consume ingredients, record history/count; optional `Idempotency-Key` prevents duplicate completion |
| PATCH | `/api/v1/me` | Change displayName / email / password |
| PUT/GET | `/api/v1/me/avatar` | Upload / fetch the avatar image |
| GET | `/api/v1/history` | Cooking history with reviews |
| PUT | `/api/v1/history/{id}/review` | Write a review (text + optional photo) |
| GET | `/api/v1/history/{id}/image` | Fetch a review photo |

Sessions are JWTs signed and verified server-side (HttpOnly cookie, or
`Authorization: Bearer` for API clients). Business failures return structured
error codes, e.g. `EMPTY_CART`, `BUDGET_EXCEEDED`, `MISSING_INGREDIENTS`,
`PROFANITY_REJECTED`.

## Rules in force

- Wallet: 500 SEK start, +100 per full hour 09:00–17:00 (Stockholm), cap 3000
- Cart: max 9 per ingredient; checkout refuses empty carts and overspending (422, cart kept)
- Match: all ingredients in stock → *ready*; ≤ 2 missing → *almost ready*; else *need shopping*. Only the 30 explicit pantry items are automatic; unsupported ingredients always prevent ready/almost status.
- Cooking: every sellable recipe ingredient must be in stock; each use deducts one and appends to history. Any ingredient outside the 80 + 30 whitelist returns `UNSUPPORTED_INGREDIENTS` (422), without stock changes.
- Reviews: regex profanity filter rejects listed words; images limited to PNG/JPEG/WebP ≤ 2 MB (avatar and review photos share this guard)

The Kitchen UI uses `POST /recipes/discover`, then groups the returned recipes
against inventory **and counter placements**. The older `/recipes/matches`
endpoint retains its inventory-only tier rules for compatibility.

Discovery uses at most 12 MealDB filter terms and counts hits by distinct App
ingredient ID, so aliases of one ingredient cannot multiply its score. It
hydrates a bounded pool of up to 72 candidates before the final 18-item cut.
Recipes fully covered by the 80 store + 30 pantry catalogue are selected first,
ranked by counter coverage, matched ingredient count, inventory gap and upstream
hits. Unsupported recipes only fill remaining slots when fewer than 18 supported
recipes exist in that inspected pool.

Cooking receipts are recorded in the new `cook_requests` table, automatically
created at startup without resetting existing data. A key is scoped to a user;
repeating it returns the same history entry without consuming ingredients again.
Cooking and checkout both lock the user row on PostgreSQL to serialize stock
changes. See the [Kitchen implementation report](../KITCHEN_IMPLEMENTATION.md)
for the frontend/backend flow and test coverage.

`app/data/pantry.py` defines the 30-item whitelist. Startup reconciles these rows
and retires legacy extra MealDB pantry rows (`is_pantry=false`, `uses_per_unit=0`).
Retired rows remain for reference safety but are excluded from catalogue,
inventory, recipe resolution and purchases. No user inventory or history is deleted.

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `CTK_DATABASE_URL` | local PostgreSQL URL | SQLAlchemy connection string |
| `CTK_JWT_SECRET` | dev-only value | Session token signing key |
| `CTK_ALLOWED_ORIGINS` | Vite dev origins | CORS allow-list |
| `CTK_SESSION_HOURS` | `168` | Session token lifetime |
