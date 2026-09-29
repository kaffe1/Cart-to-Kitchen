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

The backend is intentionally not implemented here. Temporary in-memory data keeps the frontend usable while the Python API is being developed.

## Commands

```bash
npm install
npm run dev
npm run lint
npm run test:store
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

Copy `.env.example` to `.env` and set the Python API base URL when a backend is available:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

All pending integration points are marked with `TODO(BACKEND)` in feature-level `model/*.api.ts` files. The shared request helper is `src/shared/api/httpClient.ts`.

The current dummy state is held in memory. Refreshing the page resets guest progress. Financial, inventory, authentication, favorite, and cooking-history data must use the backend as the source of truth after integration.

## Routes

| Route                | Purpose                                                              |
| -------------------- | -------------------------------------------------------------------- |
| `/store`             | Browse ingredients, use the 3D shelf, manage the cart, and check out |
| `/kitchen`           | Minimal Kitchen placeholder with sample data                         |
| `/recipes/:recipeId` | Minimal Recipe placeholder with a sample ID                          |
| `/cook/:recipeId`    | Minimal Cooking placeholder with a sample step                       |
| `/me`                | Minimal Profile placeholder                                          |
| `/login`             | Sign in through the temporary frontend flow                          |
| `/register`          | Create an account through the temporary frontend flow                |
| `/design-system`     | Development-only reference for global tokens and shared components   |

Store and Auth are the active feature implementations. Kitchen, Recipes, Cooking, and Profile intentionally contain only small MVP placeholders for later development.
