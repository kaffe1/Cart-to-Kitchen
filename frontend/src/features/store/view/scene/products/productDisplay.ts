import type { FixtureKind, Position3 } from '../layout/storeLayout';

export interface DisplayCopy {
  position: Position3;
  rotationY: number;
  scale: number;
}
export interface ProductDisplay {
  size: Position3;
  copies: readonly DisplayCopy[];
}

const PRODUCE_SIZES: Record<string, Position3> = {
  apple: [0.18, 0.18, 0.18],
  tomato: [0.17, 0.17, 0.17],
  onion: [0.19, 0.2, 0.19],
  garlic: [0.14, 0.16, 0.14],
  lemon: [0.19, 0.16, 0.16],
  lime: [0.16, 0.15, 0.15],
  avocado: [0.19, 0.23, 0.18],
  banana: [0.34, 0.22, 0.23],
  chilli: [0.27, 0.18, 0.18],
  broccoli: [0.3, 0.3, 0.27],
  cauliflower: [0.3, 0.29, 0.27],
  cabbage: [0.29, 0.29, 0.27],
  lettuce: [0.29, 0.3, 0.25],
  cucumber: [0.36, 0.22, 0.2],
  zucchini: [0.36, 0.23, 0.2],
  eggplant: [0.29, 0.3, 0.24],
  carrots: [0.34, 0.23, 0.23],
  celery: [0.36, 0.3, 0.23],
  leek: [0.36, 0.32, 0.23],
  'spring-onion': [0.35, 0.3, 0.23],
};

const PACKAGED_SIZES: Record<string, Position3> = {
  milk: [0.2, 0.4, 0.2],
  cream: [0.19, 0.3, 0.19],
  yogurt: [0.23, 0.27, 0.23],
  'cream-cheese': [0.24, 0.23, 0.22],
  butter: [0.26, 0.2, 0.19],
  egg: [0.26, 0.23, 0.2],
  cheese: [0.27, 0.27, 0.2],
  mozzarella: [0.24, 0.26, 0.23],
  feta: [0.24, 0.25, 0.22],
  parmesan: [0.25, 0.27, 0.22],
  tofu: [0.25, 0.26, 0.22],
  'orange-juice': [0.22, 0.4, 0.2],
  rice: [0.25, 0.4, 0.22],
  flour: [0.26, 0.4, 0.22],
  sugar: [0.24, 0.37, 0.22],
  spaghetti: [0.22, 0.44, 0.2],
  noodles: [0.26, 0.37, 0.23],
  'rice-noodles': [0.25, 0.38, 0.22],
  bread: [0.3, 0.3, 0.22],
  tortillas: [0.29, 0.3, 0.22],
  chocolate: [0.26, 0.3, 0.18],
  'canned-tomatoes': [0.2, 0.29, 0.2],
  'tomato-puree': [0.18, 0.27, 0.18],
};

const PRODUCE_COPIES: readonly DisplayCopy[] = [
  { position: [-0.155, 0, 0.08], rotationY: -0.13, scale: 1 },
  { position: [0.155, 0, 0.08], rotationY: 0.17, scale: 0.94 },
  { position: [-0.15, 0, -0.08], rotationY: 0.09, scale: 0.96 },
  { position: [0.15, 0, -0.08], rotationY: -0.19, scale: 1 },
];
const PACKAGED_COPIES: readonly DisplayCopy[] = [
  { position: [-0.2, 0, 0.15], rotationY: 0, scale: 1 },
  { position: [0.2, 0, 0.15], rotationY: 0, scale: 1 },
  { position: [-0.2, 0, -0.15], rotationY: 0, scale: 1 },
  { position: [0.2, 0, -0.15], rotationY: 0, scale: 1 },
];
const TRAY_COPIES: readonly DisplayCopy[] = [
  { position: [-0.185, 0.025, 0], rotationY: -0.04, scale: 1 },
  { position: [0.185, 0.025, 0], rotationY: 0.05, scale: 0.97 },
];

export function getProductDisplay(
  id: string,
  kind: FixtureKind,
): ProductDisplay {
  if (kind === 'produce')
    return {
      size: PRODUCE_SIZES[id] ?? [0.3, 0.28, 0.24],
      copies: PRODUCE_COPIES,
    };
  if (kind === 'meat') return { size: [0.36, 0.22, 0.36], copies: TRAY_COPIES };
  if (kind === 'freezer')
    return { size: [0.36, 0.3, 0.3], copies: PACKAGED_COPIES };
  return {
    size: PACKAGED_SIZES[id] ?? [0.26, 0.34, 0.22],
    copies: PACKAGED_COPIES,
  };
}
