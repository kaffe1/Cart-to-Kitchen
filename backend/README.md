# Cart to Kitchen Backend

Python (FastAPI) backend for Cart to Kitchen: a minimal first version covering
authentication, the ingredient catalogue and the shopping flow (cart + checkout
with the wallet economy), persisting to PostgreSQL and deployable with Docker.

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

The app creates its tables and seeds the ingredient catalogue on startup.

## Testing

```bash
pip install -e ".[dev]"
pytest
```

Tests run against an in-memory SQLite database (the schema stays portable on
purpose), so they need no running services. They cover the auth flows (cookie
and Bearer), the catalogue shape, cart rules, ownership isolation, the wallet
grant math and the full checkout transaction. A Postman collection with
scheduled runs — as the proposal promises — lands in week 2.

## Architecture

Layered architecture (Controller → Service → Repository/Model):

```
app/
├── api/            # routers + dependencies: HTTP in/out only
├── services/       # business rules: auth flows, wallet grants, checkout
├── data/           # SQLAlchemy models, repositories (all SQL), seed catalogue
├── schemas.py      # request/response DTOs (camelCase, mirrors frontend types)
├── security.py     # bcrypt password hashing, JWT session tokens
├── errors.py       # business exceptions → uniform {"error": {code, message}}
├── db.py           # engine, session factory, bootstrap
└── main.py         # app factory: CORS, error mapping, routers
```

## API overview

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/v1/auth/register` | Create an account (email + password + display name) |
| POST | `/api/v1/auth/login` | Sign in |
| POST | `/api/v1/auth/guest` | Anonymous session for the guest mode |
| POST | `/api/v1/auth/logout` | Clear the session cookie |
| GET | `/api/v1/auth/me` | Current user |
| GET | `/api/v1/ingredients` | Ingredient catalogue (seeded from the frontend dummy data) |
| GET | `/api/v1/shopping-sessions/active` | Wallet + cart + kitchen inventory snapshot |
| PUT | `/api/v1/shopping-sessions/{id}/items/{ingredientId}` | Set cart quantity (0 removes) |
| POST | `/api/v1/shopping-sessions/{id}/checkout` | Purchase the cart |

Sessions are JWTs signed and verified server-side, delivered as an HttpOnly
cookie (also returned as `accessToken` in the auth responses). Business
failures return structured error codes, e.g.:

```json
{ "error": { "code": "rule_validation", "message": "There is not enough money in your wallet.", "details": { "code": "BUDGET_EXCEEDED" } } }
```

## Wallet rules

Starting balance 500 SEK; +100 SEK per full hour between 09:00 and 17:00
(Stockholm time); capped at 3000 SEK. Grants accrue lazily whenever the
shopping snapshot is read. Checkout refuses an empty cart (`EMPTY_CART`) and
overspending (`BUDGET_EXCEEDED`) with 422.

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `CTK_DATABASE_URL` | local PostgreSQL URL | SQLAlchemy connection string |
| `CTK_JWT_SECRET` | dev value | HMAC secret for session tokens |
| `CTK_ALLOWED_ORIGINS` | Vite dev origins | CORS allow-list |
| `CTK_SESSION_HOURS` | `168` | Session token lifetime |
