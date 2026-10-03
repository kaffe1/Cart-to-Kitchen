import type { Ingredient } from '../../../model/store.types';

export type FixtureKind =
  | 'produce'
  | 'grocery'
  | 'chiller'
  | 'meat'
  | 'freezer';
export type Position3 = [number, number, number];

export interface StoreSection {
  id: string;
  title: string;
  subtitle: string;
  kind: FixtureKind;
  position: readonly [number, number];
  rotation: number;
  accent: string;
  width: number;
  depth: number;
  columns: number;
  levels: readonly number[];
  ingredientIds: readonly string[];
}

export const INTERACTION_LAYER = 1;
export const PLAYER_RADIUS = 0.28;
export const STORE_BOUNDS = {
  minX: -7.6,
  maxX: 7.6,
  minZ: -8.6,
  maxZ: 8.6,
} as const;
export const STORE_ENTRANCE: Position3 = [0, 1.7, 7.4];
export const PRICE_LABEL_HEIGHT = 0.075;

export function getPriceLabelWidth(name: string, slotWidth: number) {
  return Math.min(
    slotWidth - 0.08,
    0.45,
    0.28 + Math.max(0, name.length - 6) * 0.011,
  );
}

function produce(
  id: string,
  title: string,
  position: [number, number],
  ingredientIds: string[],
): StoreSection {
  return {
    id,
    title,
    subtitle: 'PICK SOMETHING GOOD',
    kind: 'produce',
    position,
    rotation: 0,
    accent: '#496a48',
    width: 3,
    depth: 1.55,
    columns: 3,
    levels: [0.78, 1.02],
    ingredientIds,
  };
}

function grocery(
  id: string,
  title: string,
  position: [number, number],
  ingredientIds: string[],
): StoreSection {
  return {
    id,
    title,
    subtitle: 'THE EVERYDAY ESSENTIALS',
    kind: 'grocery',
    position,
    rotation: 0,
    accent: '#b76b40',
    width: 3,
    depth: 1.05,
    columns: 3,
    levels: [0.38, 0.96, 1.54],
    ingredientIds,
  };
}

// Physical merchandising is independent of the catalog's recipe categories.
// Fixed slots keep existing models the same size when the catalog changes.
export const STORE_SECTIONS: readonly StoreSection[] = [
  produce(
    'fruit',
    'Fruit & colour',
    [-4.8, 3.5],
    ['apple', 'banana', 'lemon', 'lime', 'avocado', 'tomato'],
  ),
  produce(
    'everyday-veg',
    'Garden favourites',
    [4.8, 3.5],
    ['onion', 'garlic', 'bell-pepper', 'cucumber', 'zucchini', 'eggplant'],
  ),
  produce(
    'greens',
    'Leafy & green',
    [0, 0.8],
    ['broccoli', 'spinach', 'cabbage', 'lettuce', 'cauliflower', 'peas'],
  ),
  produce(
    'roots',
    'Roots & earthy things',
    [-4.8, 0],
    ['potatoes', 'sweet-potatoes', 'carrots', 'mushrooms', 'ginger', 'chilli'],
  ),
  produce(
    'garden',
    'From the garden',
    [4.8, 0],
    ['spring-onion', 'green-beans', 'celery', 'leek', 'sweetcorn'],
  ),
  {
    ...grocery(
      'staples',
      'Pantry staples',
      [-3.8, -3.8],
      [
        'rice',
        'flour',
        'sugar',
        'lentils',
        'chickpeas',
        'oats',
        'kidney-beans',
        'yeast',
        'breadcrumbs',
      ],
    ),
    rotation: Math.PI / 2,
  },
  grocery(
    'pasta',
    'Pasta, bread & tins',
    [0, -4],
    [
      'spaghetti',
      'noodles',
      'rice-noodles',
      'tortillas',
      'bread',
      'canned-tomatoes',
      'tomato-puree',
      'coconut-milk',
    ],
  ),
  {
    ...grocery(
      'treats',
      'A little something extra',
      [3.8, -3.8],
      [
        'honey',
        'maple-syrup',
        'peanut-butter',
        'jam',
        'almonds',
        'walnuts',
        'raisins',
        'chocolate',
      ],
    ),
    rotation: -Math.PI / 2,
  },
  {
    id: 'butcher',
    title: 'Meat & seafood',
    subtitle: 'THE CHILLED COUNTER',
    kind: 'meat',
    position: [-7, -4.7],
    rotation: Math.PI / 2,
    accent: '#a95b4e',
    width: 5.8,
    depth: 1.6,
    columns: 6,
    levels: [0.78, 1.06],
    ingredientIds: [
      'chicken-breast',
      'beef',
      'minced-beef',
      'bacon',
      'ham',
      'lamb',
      'pork',
      'prawns',
      'salmon',
      'tuna',
      'cod',
      'sausages',
    ],
  },
  {
    id: 'dairy',
    title: 'Dairy & chilled',
    subtitle: 'KEEPING THINGS COOL',
    kind: 'chiller',
    position: [7.15, -4.7],
    rotation: -Math.PI / 2,
    accent: '#537b83',
    width: 4.6,
    depth: 1.2,
    columns: 4,
    levels: [0.42, 1, 1.58],
    ingredientIds: [
      'milk',
      'cream',
      'yogurt',
      'cream-cheese',
      'cheese',
      'mozzarella',
      'feta',
      'parmesan',
      'butter',
      'egg',
      'tofu',
      'orange-juice',
    ],
  },
  {
    id: 'frozen',
    title: 'Frozen favourites',
    subtitle: 'SAVE SOME FOR LATER',
    kind: 'freezer',
    // Back wall's inside face is z=-8.9: leave a 0.15m service gap.
    position: [0, -8.05],
    rotation: 0,
    accent: '#537b83',
    width: 3.4,
    depth: 1.4,
    columns: 2,
    levels: [0.8],
    ingredientIds: ['ice-cream', 'puff-pastry'],
  },
];

export const STORE_FURNITURE = {
  checkout: {
    position: [-5.1, 6.7] as const,
    width: 3.2,
    depth: 1.15,
    rotation: 0,
  },
  baskets: {
    position: [3.2, 7.1] as const,
    width: 0.9,
    depth: 0.8,
    rotation: 0,
  },
};

export interface ProductSlot {
  position: Position3;
  labelPosition: Position3;
  labelTilt: number;
  width: number;
  depth: number;
}

export function getProductSlot(
  section: StoreSection,
  index: number,
): ProductSlot {
  if (index < 0 || index >= section.columns * section.levels.length)
    throw new Error(`No display slot ${index} in ${section.id}`);
  const tier = Math.floor(index / section.columns);
  const column = index % section.columns;
  const spacing = (section.width - 0.18) / section.columns;
  const x = (column - (section.columns - 1) / 2) * spacing;
  const y = section.levels[tier];
  const stepped = section.kind === 'produce' || section.kind === 'meat';
  const z = stepped ? (tier === 0 ? 0.36 : -0.32) : 0.04;
  return {
    position: [x, y, z],
    labelPosition: [
      x,
      stepped ? y + 0.065 : y - 0.015,
      section.kind === 'meat' && tier === 0
        ? section.depth / 2 + 0.045
        : stepped
          ? z + 0.36
          : section.depth / 2 + 0.04,
    ],
    labelTilt: stepped ? -0.3 : 0,
    width: spacing - 0.1,
    depth: stepped ? 0.59 : 0.7,
  };
}

export function getSectionProducts(
  section: StoreSection,
  ingredients: Ingredient[],
) {
  const byId = new Map(ingredients.map((item) => [item.id, item]));
  return section.ingredientIds
    .map((id, index) => ({ ingredient: byId.get(id), index }))
    .filter(
      (entry): entry is { ingredient: Ingredient; index: number } =>
        entry.ingredient !== undefined,
    );
}

export interface StoreObstacle {
  position: readonly [number, number];
  width: number;
  depth: number;
  rotation: number;
}

export const STORE_OBSTACLES: readonly StoreObstacle[] = [
  ...STORE_SECTIONS,
  ...Object.values(STORE_FURNITURE),
];

export function canWalkTo(x: number, z: number): boolean {
  if (
    !Number.isFinite(x) ||
    !Number.isFinite(z) ||
    x < STORE_BOUNDS.minX ||
    x > STORE_BOUNDS.maxX ||
    z < STORE_BOUNDS.minZ ||
    z > STORE_BOUNDS.maxZ
  )
    return false;
  return STORE_OBSTACLES.every((obstacle) => {
    const dx = x - obstacle.position[0];
    const dz = z - obstacle.position[1];
    const cos = Math.cos(obstacle.rotation);
    const sin = Math.sin(obstacle.rotation);
    const localX = cos * dx - sin * dz;
    const localZ = sin * dx + cos * dz;
    const outsideX = Math.max(Math.abs(localX) - obstacle.width / 2, 0);
    const outsideZ = Math.max(Math.abs(localZ) - obstacle.depth / 2, 0);
    return outsideX ** 2 + outsideZ ** 2 > PLAYER_RADIUS ** 2;
  });
}
