# Cart to Kitchen Backend

The Cart to Kitchen backend is a FastAPI application responsible for
authentication, the ingredient catalogue, wallet and shopping rules, inventory,
TheMealDB recipe integration, cooking, profiles, avatars, history, and reviews.
It persists application data in PostgreSQL and provides structured REST errors.

## Technology

- Python 3.11+
- FastAPI and Uvicorn
- SQLAlchemy 2
- PostgreSQL 17
- Pydantic Settings
- JWT authentication and bcrypt password hashing
- pytest
- Docker and Docker Compose
- Postman/Newman

## Quick start with Docker

From the repository root:

```bash
docker compose -f backend/compose.yaml up --build
```

Alternatively, from `backend/`:

```bash
docker compose up --build
```

Docker Compose starts PostgreSQL and the API, waits for the database health
check, and exposes the API only on `127.0.0.1:8000`.

- Health check: <http://127.0.0.1:8000/healthz>
- OpenAPI UI: <http://127.0.0.1:8000/docs>
- OpenAPI JSON: <http://127.0.0.1:8000/openapi.json>

Stop the stack with:

```bash
docker compose -f backend/compose.yaml down
```

To remove the PostgreSQL volume and all local application data:

```bash
docker compose -f backend/compose.yaml down -v
```

## Local development without Docker

Create an environment and install all runtime and test dependencies:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

Provide a reachable PostgreSQL database and start the server:

```bash
export CTK_DATABASE_URL=postgresql+psycopg://ctk:ctk-local-only@localhost:5432/ctk
uvicorn app.main:app --reload
```

Tables and the ingredient catalogue are created or reconciled at application
startup.

## Environment variables

The application reads variables with the `CTK_` prefix and also supports a
local `.env` file.

| Variable | Default | Purpose |
| --- | --- | --- |
| `CTK_APP_ENV` | `development` | Application environment label |
| `CTK_DATABASE_URL` | Local PostgreSQL URL | SQLAlchemy database connection |
| `CTK_JWT_SECRET` | Development-only value | JWT signing secret |
| `CTK_JWT_ALGORITHM` | `HS256` | JWT algorithm |
| `CTK_SESSION_HOURS` | `168` | Session lifetime |
| `CTK_SESSION_COOKIE` | `ctk_session` | Session cookie name |
| `CTK_ALLOWED_ORIGINS` | Local Vite origins | Credentialed CORS allow-list |
| `CTK_PG_PASSWORD` | Compose-only local default | PostgreSQL container password |

Production deployments must provide a strong `CTK_JWT_SECRET`, a secure
database password, and the exact HTTPS frontend origin.

## Architecture

The backend uses a layered structure:

```text
HTTP request
    v
app/api/             Controllers, validation dependencies, and HTTP responses
    v
app/services/        Authentication, store, wallet, recipe, and profile rules
    v
app/data/            SQLAlchemy models, repositories, and catalogue seeding
    v
PostgreSQL

app/integrations/    TheMealDB client used by recipe services
```

Routes do not contain SQL queries, repositories do not handle HTTP requests,
and service errors are translated into a uniform HTTP response by the app
factory. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for diagrams and
checkout/cooking data flows.

## API overview

All application routes are prefixed with `/api/v1`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/healthz` | Check the database-backed API health |
| POST | `/api/v1/auth/register` | Create an account |
| POST | `/api/v1/auth/login` | Sign in |
| POST | `/api/v1/auth/guest` | Create an anonymous guest session |
| POST | `/api/v1/auth/logout` | Clear the session cookie |
| GET | `/api/v1/auth/me` | Return the current user, or `{ "user": null }` when signed out |
| GET | `/api/v1/ingredients` | Return 80 sellable and 30 pantry ingredients |
| GET | `/api/v1/shopping-sessions/active` | Return wallet, cart, and inventory state |
| PUT | `/api/v1/shopping-sessions/{id}/items/{ingredientId}` | Set a cart quantity; zero removes it |
| POST | `/api/v1/shopping-sessions/{id}/checkout` | Purchase the cart |
| GET | `/api/v1/kitchen/inventory` | Return kitchen inventory |
| GET | `/api/v1/recipes?search=` | Search TheMealDB |
| POST | `/api/v1/recipes/discover` | Discover recipes from counter ingredient IDs |
| GET | `/api/v1/recipes/{id}` | Return normalized recipe details |
| GET | `/api/v1/recipes/matches?search=` | Return compatibility match groups |
| POST | `/api/v1/recipes/{id}/cook` | Consume stock and create an idempotent history entry |
| PATCH | `/api/v1/me` | Update display name, email, or password |
| PUT | `/api/v1/me/avatar` | Upload an avatar |
| GET | `/api/v1/me/avatar` | Download the current avatar |
| GET | `/api/v1/history` | Return cooking history and reviews |
| PUT | `/api/v1/history/{id}/review` | Save review HTML and an optional image |
| GET | `/api/v1/history/{id}/image` | Download a review image |

## Authentication and errors

The server signs and verifies JWTs. Browser sessions use an HttpOnly cookie;
API clients may also use `Authorization: Bearer <token>`. Credentialed CORS is
restricted to `CTK_ALLOWED_ORIGINS`.

Business failures use this shape:

```json
{
  "error": {
    "code": "rule_validation",
    "message": "Your cart is empty.",
    "details": {
      "code": "EMPTY_CART"
    }
  }
}
```

The application distinguishes authentication errors (`401`), missing resources
(`404`), conflicts (`409`), rule validation (`422`), upstream API failures
(`502`), and unexpected server failures (`500`).

## Business rules

- Wallets start at 500 SEK, gain 100 SEK per full working hour from 09:00 to 17:00 Europe/Stockholm time, and are capped at 3,000 SEK.
- Cart quantity is capped at nine per ingredient. Empty or over-budget checkout is rejected without clearing the cart.
- The catalogue contains 80 sellable ingredients and 30 explicit unlimited pantry ingredients.
- Recipe discovery uses a bounded TheMealDB candidate pool and prioritizes catalogue-supported recipes before unsupported fallback recipes.
- Cooking validates server inventory, consumes sellable ingredients, appends history, and supports a user-scoped `Idempotency-Key`.
- Avatar and review images accept PNG, JPEG, or WebP up to 2 MB.
- Review HTML may contain at most 1,500 visible-text characters and 10,000 raw HTML characters. Empty or regex-filtered reviews are rejected.

## Testing

### pytest

Install the development extras before running tests. This is required for all
schema and HTTP-test dependencies:

```bash
pip install -e ".[dev]"
pytest
```

The deterministic suite covers wallet calculations, match boundaries, review
validation, ingredient mapping, recipe ranking, cooking inventory, history
counts, user isolation, and idempotent completion. HTTP tests use an isolated
SQLite database and deterministic MealDB fixtures; they do not modify the local
PostgreSQL development database.

Run the opt-in real TheMealDB integration separately:

```bash
CTK_LIVE_MEALDB=1 pytest -q tests/test_mealdb_live.py -s
```

### Postman/Newman

With the Docker stack running, execute the collection from `backend/`:

```bash
npx newman run postman/cart-to-kitchen.postman_collection.json \
  -e postman/local.postman_environment.json
```

The collection currently contains a representative authenticated journey and
negative cases across authentication, shopping, recipes, cooking, profile,
avatar, and review behaviour. It is not yet a complete happy-path-plus-error
matrix for every implemented route and method.

### Recipe coverage audits

```bash
python -m scripts.mealdb_coverage
python -m scripts.relaxed_coverage --summary
```

The first command audits current store/pantry aliases against TheMealDB. The
second measures the production Tier 1/Tier 2 whitelist and audit-only Tier 3
adaptations. See the reports in `../helper/`.

## Docker and deployment

`compose.yaml` builds the API image and runs PostgreSQL 17 with health checks and
a named volume. This satisfies local container execution and an additional
database service. The published API port is intentionally bound to loopback for
development.

The same API and PostgreSQL Compose stack is deployed on a public host. The
deployed health check is <http://159.195.240.39:8000/healthz>, and the Vercel
frontend at <https://cart-to-kitchen.vercel.app/> reaches the API through its
same-origin `/api/v1` proxy.

For production hardening:

- Publish the API behind HTTPS and a reverse proxy.
- Remove the loopback-only port binding when appropriate for the host.
- Use managed secrets rather than Compose defaults.
- Persist and back up PostgreSQL data.
- Set the exact HTTPS frontend origin in `CTK_ALLOWED_ORIGINS`.
- Keep `/healthz` available to the platform health checker.

