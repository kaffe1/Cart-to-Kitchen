import type { IngredientCategory } from '../../model/store.types';

export interface StoreSection {
  category: IngredientCategory;
  position: readonly [number, number];
  accent: string;
  width: number;
}

export const STORE_BOUNDS = {
  minX: -7.65,
  maxX: 7.65,
  minZ: -8.65,
  maxZ: 8.65,
} as const;

export const STANDARD_SHELF_WIDTH = 4.2;
export const PRODUCE_SHELF_WIDTH = 12.6;
export const SHELF_DEPTH = 1.1;
export const SHELF_LEVELS = [0.65, 1.75, 2.85] as const;
const PLAYER_RADIUS = 0.3;

// From the entrance, meat and dairy are on the left, grains and other goods
// on the right, and the longer produce shelf anchors the back center.
export const STORE_SECTIONS: readonly StoreSection[] = [
  {
    category: 'Meat & Seafood',
    position: [-4.5, 2.6],
    accent: '#c76b60',
    width: STANDARD_SHELF_WIDTH,
  },
  {
    category: 'Dairy & Eggs',
    position: [-4.5, -2.1],
    accent: '#709ca9',
    width: STANDARD_SHELF_WIDTH,
  },
  {
    category: 'Grains & Staples',
    position: [4.5, 2.6],
    accent: '#c49a4c',
    width: STANDARD_SHELF_WIDTH,
  },
  {
    category: 'Other Ingredients',
    position: [4.5, -2.1],
    accent: '#8a79a8',
    width: STANDARD_SHELF_WIDTH,
  },
  {
    category: 'Vegetables & Fruits',
    position: [0, -6.65],
    accent: '#6b9c59',
    width: PRODUCE_SHELF_WIDTH,
  },
];

export function twoTierShelfPosition(
  index: number,
  count: number,
  shelfWidth: number,
): [number, number, number] {
  const perTier = Math.ceil(count / 2);
  const tier = index < perTier ? 0 : 1;
  const tierIndex = index - tier * perTier;
  const tierCount = Math.min(perTier, count - tier * perTier);
  const usableWidth = shelfWidth - 1.1;
  const x =
    tierCount <= 1
      ? 0
      : -usableWidth / 2 + (tierIndex * usableWidth) / (tierCount - 1);
  return [x, SHELF_LEVELS[tier] + 0.06, 0.12];
}

export function shelfProductDimensions(count: number, shelfWidth: number) {
  const perTier = Math.ceil(count / 2);
  const spacing =
    perTier <= 1 ? shelfWidth - 1.1 : (shelfWidth - 1.1) / (perTier - 1);
  // Leave space between neighboring models even during focus/purchase pulses.
  return {
    maxWidth: Math.min(0.58, (spacing - 0.06) / 1.2),
    hitboxWidth: Math.min(0.66, spacing * 0.9),
  };
}

export function canWalkTo(x: number, z: number): boolean {
  if (
    x < STORE_BOUNDS.minX ||
    x > STORE_BOUNDS.maxX ||
    z < STORE_BOUNDS.minZ ||
    z > STORE_BOUNDS.maxZ
  )
    return false;

  return STORE_SECTIONS.every(
    ({ position: [shelfX, shelfZ], width }) =>
      Math.abs(x - shelfX) > width / 2 + PLAYER_RADIUS ||
      Math.abs(z - shelfZ) > SHELF_DEPTH / 2 + PLAYER_RADIUS,
  );
}
