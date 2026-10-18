# Cart to Kitchen

Cart to Kitchen is a full-stack cooking planner that connects grocery shopping,
inventory management, recipe discovery, guided cooking, and cooking history in
one application. Users can register or continue as a guest, shop in a 2D or 3D
store, place owned ingredients on a kitchen counter, discover real recipes from
TheMealDB, complete a dish, and save a formatted review with an optional image.

This repository is the DH2643 Group 5 project.

## Project status

- The frontend and backend run locally as an integrated application.
- PostgreSQL and the FastAPI server run locally with Docker Compose.
- The frontend runs with Vite and proxies `/api/v1` to the local API.
- No public frontend or backend deployment URL is currently documented.

## Main features

- Account registration, login, logout, guest sessions, and HttpOnly cookie authentication.
- A persistent wallet, cart, inventory, cooking history, profile, avatar, and reviews stored through the server in PostgreSQL.
- An interactive 3D grocery store with 80 sellable ingredients, a 2D fallback catalogue, cart management, wallet validation, and checkout.
- A drag-and-drop kitchen counter with 30 unlimited pantry ingredients.
- Server-backed recipe search and discovery using TheMealDB, with local classification into ready, almost ready, and shopping-required groups.
- Guided cooking, retry-safe completion through an idempotency key, and history-based finished-dish pages.
- Profile editing, image upload, and a TipTap review editor with bold, italic, and underline controls. Reviews are limited to 1,500 visible characters.
- Loading, error, retry, disabled, toast, and success states for asynchronous actions.

## Architecture

```text
React + TypeScript frontend
        |
        | REST / JSON + multipart uploads
        v
FastAPI application
  Controller/routes -> Services -> Repositories/models
        |                         |
        |                         v
        |                    PostgreSQL
        v
TheMealDB API
```

The frontend uses a feature-based Model-View-Presenter structure. Views render
state and forward user actions, presenter hooks coordinate screen behaviour,
and model modules own API access, types, stores, and business rules.

The backend separates HTTP routes, business services, repositories, SQLAlchemy
models, and external integrations. Database access is performed through the
backend; the browser never connects directly to PostgreSQL.

See [frontend/README.md](frontend/README.md),
[backend/README.md](backend/README.md), and
[backend/docs/ARCHITECTURE.md](backend/docs/ARCHITECTURE.md) for details.

## Repository structure

```text
.
├── frontend/              React, TypeScript, Vite, Cypress, and 3D assets
├── backend/               FastAPI, SQLAlchemy, PostgreSQL, pytest, and Postman
│   ├── app/
│   ├── docs/
│   ├── postman/
│   └── tests/
├── docs/                  Course and refactoring documentation
└── helper/                Implementation and integration reports
```

## Prerequisites

- Docker Desktop or another Docker installation with Compose support.
- Node.js 22.13 or newer and npm.
- Python 3.11 or newer only when running the backend outside Docker.

## Quick start

### 1. Start PostgreSQL and the backend

From the repository root:

```bash
docker compose -f backend/compose.yaml up --build
```

Wait until both services are healthy. Then verify the API:

```bash
curl http://127.0.0.1:8000/healthz
```

The API documentation is available at <http://127.0.0.1:8000/docs>.

### 2. Start the frontend

In a second terminal:

```bash
cd frontend
npm ci
npm run dev
```

Open <http://localhost:5173>. The default Vite configuration proxies
`/api/v1` to `http://127.0.0.1:8000`, so no frontend environment file is needed
for this setup.

### 3. Stop the local stack

```bash
docker compose -f backend/compose.yaml down
```

To also remove the local PostgreSQL volume and all local application data:

```bash
docker compose -f backend/compose.yaml down -v
```

## Configuration

The backend reads `CTK_` environment variables. Docker Compose supplies safe
local defaults; production deployments must replace the JWT secret and database
password.

| Variable | Default or example | Purpose |
| --- | --- | --- |
| `CTK_DATABASE_URL` | Local PostgreSQL URL | SQLAlchemy database connection |
| `CTK_JWT_SECRET` | Development-only value | JWT signing secret |
| `CTK_ALLOWED_ORIGINS` | Local Vite origins | Credentialed CORS allow-list |
| `CTK_SESSION_HOURS` | `168` | Session lifetime |
| `CTK_PG_PASSWORD` | `ctk-local-only` in Compose | Local PostgreSQL password |
| `VITE_API_BASE_URL` | `/api/v1` through the Vite proxy | Optional direct API base URL |

When `VITE_API_BASE_URL` is used, keep the frontend and backend hostnames
consistent and add the exact frontend origin to `CTK_ALLOWED_ORIGINS`.

## Core user journey

1. Register, sign in, or continue as a guest.
2. Browse the 3D store or switch to the 2D catalogue.
3. Add ingredients to the cart and complete checkout within the wallet balance.
4. Drag purchased or pantry ingredients onto the kitchen counter.
5. Find dishes, inspect recipe details, and add owned missing ingredients.
6. Follow the cooking steps and finish the recipe once.
7. Open the profile to review cooking history, update account information, and save formatted reviews and images.

## Testing and quality checks

Run frontend commands from `frontend/`:

```bash
npm run lint
npm run build
npm run test:components
npm run test:store
npm run test:kitchen
npm run test:api
```

The current Cypress component suite contains seven specs and 26 tests covering
the kitchen/cooking journey, responsive layouts, drag-and-drop behaviour,
profile dialogs and retry behaviour, StepLyrics, and the store ingredient card.

The real HTTP integration test creates accounts, carts, and purchases. Run it
only against a disposable local database:

```bash
CTK_TEST_API_URL=http://127.0.0.1:8000/api/v1 npm run test:backend
```

Run backend commands from `backend/` after installing the development extras:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
pytest
```

Run the Postman collection against a running local stack:

```bash
npx newman run postman/cart-to-kitchen.postman_collection.json \
  -e postman/local.postman_environment.json
```

