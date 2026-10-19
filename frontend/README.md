# Cart to Kitchen Frontend

The Cart to Kitchen frontend is a React and TypeScript application built with
Vite. It provides account access, a 2D/3D grocery store, cart and checkout,
drag-and-drop kitchen planning, server-backed recipe discovery, guided cooking,
and profile/history management.

All runtime account, wallet, cart, inventory, cooking history, and profile data
comes from the FastAPI backend. Counter placement and recipe favourites are
user-scoped browser state. Recipe data and photos come from TheMealDB through
the backend.

## Technology

- React 19 and TypeScript
- Vite 8
- React Router
- Tailwind CSS
- React Three Fiber, Drei, and Three.js
- dnd-kit
- TipTap
- Cypress component testing
- Oxlint and Oxfmt

## Prerequisites

- Node.js 22.13 or newer.
- npm.
- The backend running at `http://127.0.0.1:8000` for the default development configuration.

## Quick start

Start the backend from the repository root:

```bash
docker compose -f backend/compose.yaml up --build
```

Then start the frontend:

```bash
cd frontend
npm ci
npm run dev
```

Open <http://localhost:5173>.

The Vite development server proxies `/api/v1` to
`http://127.0.0.1:8000`. A frontend `.env` file is not required for the default
local setup.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and create the production bundle |
| `npm run preview` | Preview the production bundle locally |
| `npm run lint` | Run Oxlint and reject `let`/`var` declarations |
| `npm run format` | Format the project with Oxfmt |
| `npm run test:components` | Run all Cypress component specs |
| `npm run test:kitchen:ui` | Run the KitchenFlow and StepLyrics Cypress specs |
| `npm run test:store` | Run deterministic 3D store and asset tests |
| `npm run test:kitchen` | Run kitchen model/state tests |
| `npm run test:api` | Run deterministic frontend API/session integration tests |
| `npm run test:backend` | Run the opt-in real HTTP integration test |

The HTTP integration test changes server data and is skipped unless a target is
provided. Use only a disposable local database:

```bash
CTK_TEST_API_URL=http://127.0.0.1:8000/api/v1 npm run test:backend
```

## Environment and production builds

To bypass the Vite proxy, copy `.env.example` to `.env` and set:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Requests include the backend HttpOnly session cookie. Use the same hostname on
both sides and include the exact frontend origin in `CTK_ALLOWED_ORIGINS`.

Create a production build with:

```bash
npm run build
```

The generated static site is written to `dist/`. Production hosting must either
proxy `/api/v1` to the backend or set `VITE_API_BASE_URL` at build time. The Vite
development proxy is not included in the production bundle.

The public frontend is deployed at <https://cart-to-kitchen.vercel.app/>. Its
same-origin `/api/v1` route proxies requests to the deployed FastAPI service, so
authenticated requests and cookies do not depend on mixed-content browser calls.

## Application routes

| Route | Purpose |
| --- | --- |
| `/login` | Sign in to an account |
| `/register` | Create an account |
| `/store` | Browse the 3D or 2D store, manage the cart, and check out |
| `/kitchen` | Arrange inventory and pantry items and discover recipes |
| `/recipes/:recipeId` | View normalized recipe details |
| `/cook/:recipeId` | Follow the cooking steps and finish a dish |
| `/cooking-finished/:historyId` | View a completed dish without cooking again |
| `/me` | Edit the profile and review cooking history |

## Architecture

The frontend follows a feature-based Model-View-Presenter structure:

```text
src/
├── app/                    Router, providers, routes, and global styles
├── features/
│   ├── auth/
│   ├── store/
│   ├── kitchen/
│   ├── recipes/
│   ├── cooking/
│   └── profile/
│       ├── model/          Types, API access, and domain rules
│       ├── presenter/      View-ready state and user actions
│       └── view/           Pages and components
└── shared/
    ├── api/                HTTP client and application/session stores
    ├── components/         Reusable layout and UI components
    └── utils/              Application-wide utilities
```

The intended dependency direction is:

```text
View -> Presenter -> Model/API -> FastAPI backend
```

- Views render data and forward user events.
- Presenter hooks coordinate asynchronous screen behaviour and expose view-ready state and actions.
- Model modules own types, API calls, external stores, caches, and pure business rules.
- Shared modules contain only application-wide infrastructure and reusable UI.

`shared/api/appSession.ts` owns the subscribable server snapshot used across
features. It restores `/auth/me`, creates one guest session when required,
serializes cart writes, invalidates stale responses after identity changes, and
refreshes shopping state after checkout and cooking.

## Feature behaviour

### Store

- Displays 80 sellable ingredients in an interactive 3D market or a searchable and filterable 2D catalogue.
- Keeps cart writes ordered and displays wallet, quantity, total, loading, checkout, success, and error feedback.
- Uses a pointer-lock shopping mode with keyboard escape controls and collision geometry.

### Kitchen and recipes

- Displays purchased inventory and 30 unlimited pantry ingredients.
- Supports click and drag placement, repositioning, removal, and clearing.
- Calls `POST /recipes/discover` and classifies results against the current inventory and counter.
- Restores the last discovery after a route-only detour to recipe details.
- Ranks supported recipes before recipes containing unavailable ingredients.

### Default Pantry

These ingredients are always available in unlimited quantities in the kitchen.

| Pantry Ingredient | Category | TheMealDB aliases | Uses |
| --- | --- | --- | ---: |
| 🧂 Salt | Essential Seasonings & Oils | Salt | ∞ |
| 🌶️ Black Pepper | Essential Seasonings & Oils | Black Pepper / Pepper | ∞ |
| 🫒 Olive Oil | Essential Seasonings & Oils | Olive Oil / Extra Virgin Olive Oil | ∞ |
| 🛢️ Vegetable Oil | Essential Seasonings & Oils | Vegetable Oil / Oil | ∞ |
| 💧 Water | Essential Seasonings & Oils | Water | ∞ |
| 🍶 Vinegar | Essential Seasonings & Oils | Vinegar | ∞ |
| 🍶 Soy Sauce | Essential Seasonings & Oils | Soy Sauce | ∞ |
| 🌭 Mustard | Essential Seasonings & Oils | Mustard | ∞ |
| 🍅 Ketchup | Essential Seasonings & Oils | Ketchup | ∞ |
| 🌶️ Chilli Sauce | Essential Seasonings & Oils | Chilli Sauce | ∞ |
| 🌿 Basil | Herbs & Spices | Basil / Basil Leaves | ∞ |
| 🌱 Parsley | Herbs & Spices | Parsley | ∞ |
| ☘️ Oregano | Herbs & Spices | Oregano | ∞ |
| 🌿 Thyme | Herbs & Spices | Thyme | ∞ |
| 🥮 Cinnamon | Herbs & Spices | Cinnamon | ∞ |
| 🟤 Cumin | Herbs & Spices | Cumin | ∞ |
| 🌶️ Paprika | Herbs & Spices | Paprika | ∞ |
| 🌶️ Chilli Flakes | Herbs & Spices | Chilli Flakes / Red Pepper Flakes | ∞ |
| 🍛 Curry Powder | Herbs & Spices | Curry Powder | ∞ |
| 🟡 Turmeric | Herbs & Spices | Turmeric | ∞ |
| 🌿 Ground Coriander | Herbs & Spices | Ground Coriander | ∞ |
| 🍃 Bay Leaves | Herbs & Spices | Bay Leaf / Bay Leaves | ∞ |
| 🧄 Garlic Granules | Herbs & Spices | Garlic Granules | ∞ |
| 🌿 Italian Seasoning | Herbs & Spices | Italian Seasoning | ∞ |
| 🧁 Baking Powder | Baking & Cooking Essentials | Baking Powder | ∞ |
| 🥄 Baking Soda | Baking & Cooking Essentials | Baking Soda | ∞ |
| 🌼 Vanilla Extract | Baking & Cooking Essentials | Vanilla Extract | ∞ |
| 🌽 Cornstarch | Baking & Cooking Essentials | Cornstarch / Cornflour | ∞ |
| 🐔 Chicken Stock | Baking & Cooking Essentials | Chicken Stock | ∞ |
| 🥬 Vegetable Stock Cube | Baking & Cooking Essentials | Vegetable Stock Cube | ∞ |

### Cooking

- Plays normalized instructions at two-second intervals and yields control while the user scrolls.
- Sends an `Idempotency-Key` when finishing a dish, so a retry cannot create a duplicate completion.
- Refreshes inventory and opens the history-backed finished page after success.

### Profile

- Updates display name, email, password, and avatar.
- Displays cooking history and supports one expanded review card at a time.
- Uses TipTap for formatted review HTML and renders saved HTML as styled text.
- Enforces a 1,500-visible-character review limit and validates PNG, JPEG, and WebP images up to 2 MB.

## User and system feedback

Async screens provide loading states, disabled controls, actionable error
messages, and retry buttons. Add-to-cart and checkout actions provide visual
feedback; cooking completion displays an explicit finished state; authentication
and profile forms keep invalid submissions from being sent.

The shared `Button`, `Dialog`, `Input`, `FeedbackBanner`, `FeedbackToast`,
`Skeleton`, `Tabs`, and `Avatar` components keep interaction states consistent.

## Testing

The Cypress configuration currently uses component testing. The seven specs and
26 tests cover:

- The Kitchen -> Recipe -> Cooking -> Finished component journey.
- Remote recipe success and failure behaviour.
- Drag geometry, all catalogue ingredients, counter edges, and four viewports.
- Retry-safe cooking completion and history restoration.
- StepLyrics timing and user-scroll behaviour.
- Profile loading retry and display-name, email, and password dialogs.
- The store ingredient card's Add action.

These tests use `cy.mount`, `MemoryRouter`, and network interception. They are
valuable component/integration tests but are not a browser E2E suite running the
complete deployed application.

Grading-related test gaps remain for Auth, Store, AppShell, integrated Profile
updates, some Recipe presenter branches, and real E2E flows for registration,
login, checkout, and profile update.

Routes are currently imported eagerly. `npm run build` succeeds but reports a
large-chunk warning, so the grading criterion for lazy loading/code splitting is
not yet satisfied.

## 3D assets

Ingredient GLB assets are stored by stable ingredient ID:

```text
public/models/ingredients/
├── model_origin/            Supplied source files
└── model_web/               Optimized files loaded by the application
```

Regenerate optimized web copies after replacing a source model:

```bash
python3 scripts/prepare-ingredient-models.py
python3 scripts/prepare-ingredient-models.py --category meat-seafood
```

The script validates filenames against the ingredient catalogue and reduces
texture sizes while preserving geometry and materials. The store scene separates
layout, environment, fixtures, products, and controls under
`src/features/store/view/scene/`.

`npm run test:store` verifies catalogue/model coverage, display bounds,
collision paths, fixture geometry, price-card placement, and asset normalization.

