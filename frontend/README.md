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
each model's bottom to the shelf surface. Models occupy only tiers one and two.
Their width and interaction boxes adapt to category counts without lengthening
the four standard shelves. Produce retains its preferred 0.3 scale where it fits;
other categories fit their slot bounds. Focus highlighting uses cloned materials.

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
