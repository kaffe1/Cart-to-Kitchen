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

**pytest — pure-function tests only** (wallet grant math, match tier
boundaries, the review profanity regex): edge cases that cannot be reached
through live HTTP because the clock or inventory state is not controllable.

```bash
pip install -e ".[dev]" && pytest
```

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
| GET | `/api/v1/ingredients` | Catalogue: 80 sellable items + the full TheMealDB pantry (~900, unlimited use, not for sale) |
| GET | `/api/v1/shopping-sessions/active` | Wallet + cart + inventory snapshot |
| PUT | `/api/v1/shopping-sessions/{id}/items/{ingredientId}` | Set cart quantity (0 removes) |
| POST | `/api/v1/shopping-sessions/{id}/checkout` | Purchase the cart |
| GET | `/api/v1/kitchen/inventory` | Kitchen stock |
| GET | `/api/v1/recipes?search=` | TheMealDB search |
| GET | `/api/v1/recipes/{id}` | Recipe detail (instructions + ingredients) |
| GET | `/api/v1/recipes/matches?search=` | Three-tier match: ready / almost / needShopping |
| POST | `/api/v1/recipes/{id}/cook` | Consume ingredients, record history |
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
- Match: all ingredients in stock → *ready*; ≤ 2 missing → *almost ready*; else *need shopping* (ingredients the store does not sell count as available)
- Cooking: every sellable recipe ingredient must be in stock; each use deducts one and appends to history
- Reviews: regex profanity filter rejects listed words; images limited to PNG/JPEG/WebP ≤ 2 MB (avatar and review photos share this guard)

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `CTK_DATABASE_URL` | local PostgreSQL URL | SQLAlchemy connection string |
| `CTK_JWT_SECRET` | dev-only value | Session token signing key |
| `CTK_ALLOWED_ORIGINS` | Vite dev origins | CORS allow-list |
| `CTK_SESSION_HOURS` | `168` | Session token lifetime |
