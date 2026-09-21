import type { AppUser } from '../../features/auth/model/auth.types';
import type { CookingHistoryEntry } from '../../features/cooking/model/cooking.types';
import type { CounterItem, InventoryItem } from '../../features/kitchen/model/kitchen.types';
import type { CartLine, ShoppingListItem, Wallet } from '../../features/store/model/store.types';

export interface DemoState {
  user: AppUser;
  wallet: Wallet;
  cart: CartLine[];
  inventory: InventoryItem[];
  counter: CounterItem[];
  favorites: string[];
  history: CookingHistoryEntry[];
  shoppingList: ShoppingListItem[];
}

const now = new Date();
const accountStart = new Date(now);
accountStart.setHours(9, 0, 0, 0);

function stockholmHour(date: Date): number {
  const hour = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Stockholm',
    hour: '2-digit',
    hour12: false,
  }).format(date);
  return Number(hour) % 24;
}

function earnedToday(): number {
  // Keep SSR and the browser on the same business clock. Without an explicit
  // zone, Node may use UTC while the browser uses the user's local zone.
  const hour = stockholmHour(now);
  if (hour < 10) return 0;
  return Math.min(Math.max(hour - 9, 0), 8) * 100;
}

function nextGrantTime(): string | null {
  const current = new Date();
  const hour = stockholmHour(current);
  if (hour < 9) {
    current.setHours(9, 0, 0, 0);
    return current.toISOString();
  }
  if (hour >= 17) return null;
  current.setHours(hour + 1, 0, 0, 0);
  return current.toISOString();
}

const initialState: DemoState = {
  user: {
    id: 'guest-session',
    displayName: 'Guest cook',
    email: null,
    mode: 'guest',
    createdAt: accountStart.toISOString(),
  },
  wallet: {
    balanceSek: Math.min(500 + earnedToday(), 3000),
    capSek: 3000,
    nextGrantAt: nextGrantTime(),
    hourlyGrantSek: 100,
  },
  cart: [],
  inventory: [
    { ingredientId: 'tomato', remainingUses: 2 },
    { ingredientId: 'egg', remainingUses: 2 },
    { ingredientId: 'bread', remainingUses: 2 },
    { ingredientId: 'milk', remainingUses: 3 },
    { ingredientId: 'butter', remainingUses: 2 },
    { ingredientId: 'cheese', remainingUses: 2 },
    { ingredientId: 'spaghetti', remainingUses: 1 },
    { ingredientId: 'canned-tomatoes', remainingUses: 1 },
  ],
  counter: [],
  favorites: ['spaghetti-arrabbiata'],
  history: [],
  shoppingList: [],
};

let state = initialState;
const listeners = new Set<() => void>();

export function getDemoState(): DemoState {
  return state;
}

export function getDemoServerState(): DemoState {
  return initialState;
}

export function subscribeDemoState(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function updateDemoState(
  updater: (current: DemoState) => DemoState,
): DemoState {
  state = updater(state);
  listeners.forEach((listener) => listener());
  return state;
}

export async function demoDelay(milliseconds = 260): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function resetDemoState(): void {
  state = {
    ...initialState,
    cart: [],
    counter: [],
    favorites: [...initialState.favorites],
    history: [],
    inventory: initialState.inventory.map((item) => ({ ...item })),
    shoppingList: [],
  };
  listeners.forEach((listener) => listener());
}
