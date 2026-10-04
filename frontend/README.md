# Cart to Kitchen Frontend

This directory contains the React frontend for Cart to Kitchen. It is a standalone Vite application written in TypeScript and organized with a feature-based Model–View–Presenter architecture.

## Technology

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- React Three Fiber
- dnd-kit

Auth and Store use the FastAPI backend in `../backend`. User sessions, wallet balances, carts and purchased inventory are restored from the server. Kitchen, Recipes, Cooking and Profile remain placeholders.

## Commands

```bash
npm install
npm run dev
npm run lint
npm run test:store
npm run test:api
npm run build
npm run preview
```

The development server normally starts at `http://localhost:5173`.

## Architecture

```text
src/
├── app/
│   ├── App.tsx
│   ├── providers.tsx
│   ├── router.tsx
│   ├── routes.ts
│   └── globals.css
├── shared/
│   ├── api/
│   ├── components/
│   │   ├── layout/
│   │   └── ui/
│   └── utils/
├── features/
│   ├── auth/
│   ├── store/
│   ├── kitchen/
│   ├── recipes/
│   ├── cooking/
│   └── profile/
│       ├── model/
│       ├── presenter/
│       └── view/
└── main.tsx
```

The dependency direction is:

```text
View -> Presenter -> Model -> Backend API
```

- Model files contain domain types, API boundaries, and pure business rules.
- Presenter hooks coordinate asynchronous work and expose view-ready state and actions.
- View components render the interface and forward user actions to presenters.
- Shared code contains only application-wide infrastructure and reusable UI.

## Store GLB models

All 80 ingredients have models named by Ingredient ID. Assets are organized as:

```text
public/models/ingredients/
├── model_origin/               # Supplied originals, unchanged file contents
│   ├── vegetables-fruits/      # 30
│   ├── meat-seafood/            # 12
│   ├── dairy-eggs/              # 10
│   ├── grains-staples/          # 16
│   └── other-ingredients/       # 12
└── model_web/                  # Matching category folders; loaded by the scene
```

Web copies preserve geometry and material settings, cap base-color textures at
1024px and other textures at 512px, and retain embedded images. The shared
`ingredientModelAssets.json` maps categories to folders and records the avocado's
30-degree X rotation, so regeneration preserves its display orientation.

After replacing source GLBs, regenerate the web copies with Python and Pillow:

```sh
python3 scripts/prepare-ingredient-models.py
# Prepare one category only:
python3 scripts/prepare-ingredient-models.py --category meat-seafood
```

The script validates filenames against the Ingredient catalog before processing.
`prepare-produce-models.py` remains an alias for the new command.

`IngredientGlbModel.tsx` loads `model_web/<category>/<ingredient-id>.glb` and aligns
each model's bottom to the display surface. `productDisplay.ts` gives products
stable display dimensions and repeated facings. Each SKU's mesh parts use
instanced rendering, sharing geometry, textures, and its cloned focus materials.
The 80 ingredients occupy 296 display copies without duplicating GLB downloads.

`storeLayout.ts` defines physical placements separately from recipe categories:
five stepped produce tables, three modular grocery shelves, a meat/seafood
counter, a dairy chiller, and a freezer. Canned tomatoes are in the pantry, tofu
and juice are chilled, and ice cream and puff pastry are in the freezer. Price
labels use the catalog prices. The existing basket remains the checkout flow;
the physical checkout counter is scenery with a basket shortcut sign.

Fixture structures use small rounded corners and are batched by material,
dimensions, and corner radius. Cabinet panels have inset edges and separated
flat faces to avoid depth flicker. The meat counter's lowered glass guard and
single-line price labels keep products readable at close range. The basket
stand holds open mesh baskets with bottoms, rims, and raised handles.

`src/features/store/view/scene/layout/storeAppearance.ts` contains the visual controls:
`STORE_CAMERA_FOV = 48` is the vertical field of view in degrees (lower values
give a narrower view); `PRODUCT_FOCUS_SCALE = 1.16` and
`PRODUCT_FOCUS_RESPONSE = 28` control focus enlargement and animation speed.
Each product copy enlarges around its own display position. The product popover
uses a dark background at 64% opacity, white text, and 20px backdrop blur in
`src/app/globals.css` under `.store-product-popover`.
The popover is scaled to 4/3 of its base size, anchored just above the product,
and highlighted by a clockwise border glow (disabled for reduced motion).

Shopping starts from the centered entry prompt. Click a focused product to add
it; B or Esc pauses the scene, releases the mouse, and opens the cart. Press B
again or click the store viewport to resume. The cart keeps its checkout button
at the bottom while only its item list scrolls. `shoppingSession.ts` coordinates
this state with the browser's actual pointer-lock events in `scene/controls/`.
After a successful 3D pick, `FlyingIngredient.tsx` reuses that ingredient's GLB
for a shrinking arc from the crosshair to the enlarged basket icon. A red badge
shows the cart's total unit count, and the 3D pick does not show the old success
toast; checkout results and errors still use the toast.
The frozen cabinet
is placed near the back wall with a 15cm service gap. Warm fill lighting and
lighter sage/ivory fixtures retain the app's grocery-market palette.

The 3D implementation is grouped by responsibility under `src/features/store/view/scene/`:
`layout/` owns fixture positions and visual constants; `environment/` owns the room
and checkout scenery; `fixtures/` owns shelf geometry and signs; `products/` owns
GLB loading, normalization, display facings, and `ProductShape`; `controls/` owns
movement, picking, keyboard guards, and the shopping session. `MarketScene.tsx`
assembles those parts, while `StoreCanvas.tsx` owns the camera, renderer, and
entry/pause overlays.

Product picking uses a separate
layer containing SKU hitboxes and solid occluders; transparent counter glass
does not block shopping. Rotated fixture footprints, the checkout counter, and
the basket stand participate in player collision. Generated signs, tiled floor,
and the small reflection environment require no external fonts, HDRs, or images.

`npm run test:store` checks catalog/model coverage, animated display bounds,
price-card clearance, counter sightlines, coplanar fixture faces, rounded-box
dimensions, basket cavities, focus response, rotated collisions, paths from
the entrance to every display front, and model/material normalization.
It uses Node's built-in test runner and TypeScript stripping
(available in the project's minimum Node 22.13 version).

## Backend integration

Start the backend from the repository root:

```sh
docker compose -f backend/compose.yaml up --build
```

The Vite development server proxies `/api/v1` to `http://127.0.0.1:8000`, so no
frontend `.env` is needed for the default local setup. Restart Vite after changing
its configuration. To call the backend directly, copy `.env.example` to `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Use the same hostname on both sides (`localhost` on both, or `127.0.0.1` on both),
and include the frontend origin in `CTK_ALLOWED_ORIGINS`. Requests include the
backend's HttpOnly session cookie. Production hosting must either proxy `/api/v1`
to the backend or provide `VITE_API_BASE_URL` at build time; the Vite dev proxy is
not part of the production bundle.

`shared/api/appSession.ts` owns a synchronous, subscribable cache of server data.
Startup restores `/auth/me`; entering the application without a session creates
one guest, including under React StrictMode. Cart writes are serialized, and
checkout reloads the active shopping session to obtain the new ID and inventory.
Identity changes clear prior user data and discard stale request results. Network
failures show retry controls rather than falling back to mock data.

`dummyData.ts` remains a fixture for the 3D asset tests. `demoBackend.ts` is no
longer imported by runtime features. Shopping notes remain empty because the
backend has no endpoint for them. The wallet is not polled: the backend currently
loses partial accrual intervals on reads (see the phase-one report).

Run deterministic request/state tests with `npm run test:api`. To run the real
HTTP integration test, explicitly target a **disposable local database**; this
test creates accounts, carts and purchases:

```sh
CTK_TEST_API_URL=http://127.0.0.1:8000/api/v1 npm run test:backend
```

Without `CTK_TEST_API_URL`, that test is skipped. Tests use the existing TypeScript
compiler and Node test runner; no new npm dependency is required.

The detailed implementation and acceptance report is in
[`../INTEGRATION_REPORT_PHASE1.md`](../INTEGRATION_REPORT_PHASE1.md).

## Routes

| Route                | Purpose                                                              |
| -------------------- | -------------------------------------------------------------------- |
| `/store`             | Browse ingredients, use the 3D shelf, manage the cart, and check out |
| `/kitchen`           | Minimal Kitchen placeholder with sample data                         |
| `/recipes/:recipeId` | Minimal Recipe placeholder with a sample ID                          |
| `/cook/:recipeId`    | Minimal Cooking placeholder with a sample step                       |
| `/me`                | Minimal Profile placeholder                                          |
| `/login`             | Sign in with the backend session cookie                          |
| `/register`          | Register a persisted account                |
| `/design-system`     | Development-only reference for global tokens and shared components   |

Store and Auth are the active feature implementations. Kitchen, Recipes, Cooking, and Profile intentionally contain only small MVP placeholders for later development.
