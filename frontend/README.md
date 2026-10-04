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

Auth and Store use the FastAPI backend in `../backend`. User sessions, wallet balances, carts and purchased inventory are restored from the server. Kitchen reads purchased inventory from the same shopping session; its pantry, counter, recipe matches, favorites, and cooking walkthrough are frontend demo features. Profile remains a placeholder.

## Commands

```bash
npm install
npm run dev
npm run lint
npm run test:store
npm run test:api
npm run test:kitchen
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
View -> Presenter -> Model -> Backend API or frontend demo data
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

`dummyData.ts` contains the 80-item store fixture, the 30 default pantry items
listed below, and sample recipes with steps. `demoBackend.ts` is not used by
runtime features. Kitchen demo counter selections and favorites are kept per
user in browser storage. Recipe cards link directly to Store when ingredients
are missing, and display a recipe image when `imageUrl` is supplied (falling
back to emoji otherwise). Only purchased inventory comes from the server.
Kitchen shows purchased uses minus the emojis currently on the counter; dragging
an emoji off the counter or pressing Clear restores those local uses. The 30
unlimited default pantry ingredients live in the pull-up drawer above the
counter. Dragging from either source places a movable emoji on the fixed-size
counter; Find dishes scrolls to the results after they render.
Completing a demo recipe does not consume server inventory. The wallet is not
polled: the backend currently loses partial accrual intervals on reads (see the
phase-one report).

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
| `/kitchen`           | Real purchased inventory, 30-item pantry, local counter and recipe radar |
| `/recipes/:recipeId` | Frontend demo recipe details                                          |
| `/cook/:recipeId`    | Frontend step-by-step cooking walkthrough                             |
| `/me`                | Minimal Profile placeholder                                          |
| `/login`             | Sign in with the backend session cookie                          |
| `/register`          | Register a persisted account                |
| `/design-system`     | Development-only reference for global tokens and shared components   |

Kitchen uses `GET /shopping-sessions/active` through `appSession` for purchased
stock and frontend fixtures for its display names. Recipe matching, favorites,
counter selections and cooking steps are local demo behavior.
`TODO(BACKEND)` comments mark the boundaries for later integration. Profile
remains a placeholder.

## ingredients

### Store Ingredients

| Store Ingredient | 中文 | 使用次数 | TheMealDB 对接 |
|---|---|---:|---|
| 🍅 Tomato | 番茄 | 3 | Tomato / Tomatoes |
| 🧅 Onion | 洋葱 | 3 | Onion / Onions |
| 🧄 Garlic | 大蒜 | 3 | Garlic / Garlic Clove |
| 🫑 Bell Pepper | 彩椒 | 3 | Red Pepper / Green Pepper |
| 🌱 Spring Onion | 小葱 | 3 | Spring Onions |
| 🥦 Broccoli | 西兰花 | 3 | Broccoli |
| 🥒 Cucumber | 黄瓜 | 3 | Cucumber |
| 🌽 Sweetcorn | 甜玉米 | 3 | Sweetcorn |
| 🥬 Spinach | 菠菜 | 3 | Spinach |
| 🥬 Cabbage | 卷心菜 | 3 | Cabbage |
| 🥬 Lettuce | 生菜 | 3 | Lettuce |
| 🥒 Zucchini | 西葫芦 | 3 | Zucchini / Courgette |
| 🟢 Peas | 豌豆 | 3 | Peas |
| 🫛 Green Beans | 四季豆 | 3 | Green Beans |
| 🥬 Celery | 芹菜 | 3 | Celery |
| 🧅 Leek | 韭葱 | 3 | Leek |
| 🥦 Cauliflower | 花椰菜 | 3 | Cauliflower |
| 🌶️ Chilli | 辣椒 | 3 | Chilli / Chillies |
| 🍆 Eggplant | 茄子 | 3 | Aubergine / Eggplant |
| 🥔 Potatoes | 土豆 | 3 | Potatoes |
| 🍠 Sweet Potatoes | 红薯 | 3 | Sweet Potatoes |
| 🥕 Carrots | 胡萝卜 | 3 | Carrots |
| 🍄 Mushrooms | 蘑菇 | 3 | Mushrooms |
| 🍎 Apple | 苹果 | 3 | Apple / Apples |
| 🍌 Banana | 香蕉 | 3 | Banana / Bananas |
| 🍋 Lemon | 柠檬 | 3 | Lemon |
| 🍋 Lime | 青柠 | 3 | Lime |
| 🥑 Avocado | 牛油果 | 3 | Avocado |
| 🥫 Canned Tomatoes | 罐装番茄 | 3 | Canned Tomatoes |
| 🥫 Tomato Puree | 番茄泥/浓缩番茄原料 | 3 | Tomato Puree |
| 🍗 Chicken Breast | 鸡胸肉 | 1 | Chicken Breast |
| 🥩 Beef | 牛肉 | 1 | Beef |
| 🥩 Minced Beef | 牛肉末 | 1 | Minced Beef / Ground Beef |
| 🥓 Bacon | 培根 | 3 | Bacon |
| 🍖 Ham | 火腿 | 3 | Ham |
| 🐑 Lamb | 羊肉 | 1 | Lamb |
| 🐖 Pork | 猪肉 | 1 | Pork |
| 🦐 Prawns | 虾 | 1 | Prawns / Shrimp |
| 🐟 Salmon | 三文鱼 | 1 | Salmon |
| 🐠 Tuna | 金枪鱼 | 3 | Tuna |
| 🐟 Cod | 鳕鱼 | 1 | Cod |
| 🌭 Sausages | 香肠 | 3 | Sausages / Sausage |
| 🥚 Egg | 鸡蛋 | 3 | Egg / Eggs |
| 🧀 Cheese | 普通奶酪 | 3 | Cheese |
| 🧀 Mozzarella | 马苏里拉 | 3 | Mozzarella |
| 🧀 Feta | 菲达奶酪 | 3 | Feta / Feta Cheese |
| 🧀 Parmesan | 帕尔马干酪 | 3 | Parmesan |
| 🥛 Milk | 牛奶 | 5 | Milk |
| 🧈 Butter | 黄油 | 3 | Butter |
| 🥛 Cream | 奶油 | 3 | Cream |
| 🥣 Yogurt | 酸奶 | 3 | Yogurt / Yoghurt |
| 🧀 Cream Cheese | 奶油奶酪 | 3 | Cream Cheese |
| 🍞 Bread | 面包 | 3 | Bread |
| 🍚 Rice | 大米 | 3 | Rice |
| 🍝 Spaghetti | 意大利长面 | 3 | Spaghetti |
| 🍜 Noodles | 面条 | 3 | Noodles |
| 🌾 Flour | 面粉 | 3 | Flour / Plain Flour |
| 🍬 Sugar | 白糖 | 3 | Sugar |
| 🟤 Lentils | 扁豆 | 3 | Lentils |
| 🫘 Chickpeas | 鹰嘴豆 | 3 | Chickpeas |
| 🥣 Oats | 燕麦 | 3 | Oats |
| 🌮 Tortillas | 墨西哥薄饼 | 3 | Tortillas |
| 🍞 Breadcrumbs | 面包糠 | 3 | Breadcrumbs |
| ⬜ Tofu | 豆腐 | 3 | Tofu |
| 🫘 Kidney Beans | 红腰豆 | 3 | Kidney Beans |
| 🥐 Puff Pastry | 酥皮 | 3 | Puff Pastry |
| 🍜 Rice Noodles | 米粉/米面 | 3 | Rice Noodles |
| 🍞 Yeast | 酵母 | 3 | Yeast |
| 🥥 Coconut Milk | 椰奶 | 3 | Coconut Milk |
| 🍯 Honey | 蜂蜜 | 3 | Honey |
| 🍁 Maple Syrup | 枫糖浆 | 3 | Maple Syrup |
| 🥜 Peanut Butter | 花生酱 | 3 | Peanut Butter |
| 🍓 Jam | 果酱 | 3 | Jam |
| 🌰 Almonds | 杏仁 | 3 | Almonds |
| 🌰 Walnuts | 核桃 | 3 | Walnuts |
| 🍇 Raisins | 葡萄干 | 3 | Raisins |
| 🍨 Ice Cream | 冰淇淋 | 3 | Ice Cream |
| 🧃 Orange Juice | 橙汁 | 3 | Orange Juice |
| 🍫 Chocolate | 巧克力 | 3 | Chocolate |
| 🫚 Ginger | 生姜 | 3 | Ginger |


### Default Pantry

| Pantry Ingredient | Category | 中文 | 使用次数 | TheMealDB 对接 |
|---|---|---|---|---|
| 🧂 Salt | Essential Seasonings & Oils | 盐 | ∞ | Salt |
| 🌶️ Black Pepper | Essential Seasonings & Oils | 黑胡椒 | ∞ | Black Pepper / Pepper |
| 🫒 Olive Oil | Essential Seasonings & Oils | 橄榄油 | ∞ | Olive Oil |
| 🛢️ Vegetable Oil | Essential Seasonings & Oils | 植物油 | ∞ | Vegetable Oil / Oil |
| 💧 Water | Essential Seasonings & Oils | 水 | ∞ | Water |
| 🍶 Vinegar | Essential Seasonings & Oils | 醋 | ∞ | Vinegar |
| 🍶 Soy Sauce | Essential Seasonings & Oils | 酱油 | ∞ | Soy Sauce |
| 🌭 Mustard | Essential Seasonings & Oils | 芥末酱 | ∞ | Mustard |
| 🍅 Ketchup | Essential Seasonings & Oils | 番茄沙司 | ∞ | Ketchup |
| 🌶️ Chilli Sauce | Essential Seasonings & Oils | 辣椒酱 | ∞ | Chilli Sauce |
| 🌿 Basil | Herbs & Spices | 罗勒 | ∞ | Basil / Basil Leaves |
| 🌱 Parsley | Herbs & Spices | 欧芹 | ∞ | Parsley |
| ☘️ Oregano | Herbs & Spices | 牛至 | ∞ | Oregano |
| 🌿 Thyme | Herbs & Spices | 百里香 | ∞ | Thyme |
| 🥮 Cinnamon | Herbs & Spices | 肉桂 | ∞ | Cinnamon |
| 🟤 Cumin | Herbs & Spices | 孜然 | ∞ | Cumin |
| 🌶️ Paprika | Herbs & Spices | 红甜椒粉 | ∞ | Paprika |
| 🌶️ Chilli Flakes | Herbs & Spices | 辣椒碎 | ∞ | Chilli Flakes / Red Pepper Flakes |
| 🍛 Curry Powder | Herbs & Spices | 咖喱粉 | ∞ | Curry Powder |
| 🟡 Turmeric | Herbs & Spices | 姜黄粉 | ∞ | Turmeric |
| 🌿 Ground Coriander | Herbs & Spices | 芫荽籽粉 | ∞ | Ground Coriander |
| 🍃 Bay Leaves | Herbs & Spices | 月桂叶 | ∞ | Bay Leaf / Bay Leaves |
| 🧄 Garlic Granules | Herbs & Spices | 大蒜颗粒 | ∞ | Garlic Granules |
| 🌿 Italian Seasoning | Herbs & Spices | 意大利综合香料 | ∞ | Italian Seasoning |
| 🧁 Baking Powder | Baking & Cooking Essentials | 泡打粉 | ∞ | Baking Powder |
| 🥄 Baking Soda | Baking & Cooking Essentials | 小苏打 | ∞ | Baking Soda |
| 🌼 Vanilla Extract | Baking & Cooking Essentials | 香草精 | ∞ | Vanilla Extract |
| 🌽 Cornstarch | Baking & Cooking Essentials | 玉米淀粉 | ∞ | Cornstarch / Cornflour（按地区语义） |
| 🐔 Chicken Stock | Baking & Cooking Essentials | 鸡汤底料 | ∞ | Chicken Stock |
| 🥬 Vegetable Stock Cube | Baking & Cooking Essentials | 蔬菜汤块 | ∞ | Vegetable Stock Cube |
