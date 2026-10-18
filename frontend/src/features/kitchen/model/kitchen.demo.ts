import { ApiError } from '../../../shared/api/apiError';
import { allIngredients, dummyRecipes } from '../../../shared/api/dummyData';
import type { CounterItem, CounterPlacement, InventoryItem } from './kitchen.types';
import { aggregateCounter, canPlaceOnCounter } from './kitchen.rules';

export interface KitchenDemoState {
  counter: CounterPlacement[];
  favorites: string[];
}

const emptyState: KitchenDemoState = { counter: [], favorites: [] };
const initialSnapshot: Record<string, KitchenDemoState> = {};
// The Set implements useSyncExternalStore subscription/unsubscription and does
// not hold mutable domain state.
const listeners = new Set<() => void>();
const knownIds = new Set(allIngredients.map((item) => item.id));
const recipeIds = new Set(dummyRecipes.map((recipe) => recipe.id));
const validRecipeId = (id: unknown): id is string => typeof id === 'string' && (recipeIds.has(id) || /^\d+$/.test(id));
// This object is the isolated mutable core required by useSyncExternalStore.
// Published KitchenDemoState snapshots are always replaced, never modified.
const runtime = {
  snapshot: initialSnapshot,
  placementSequence: 0,
};

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

function defaultPosition(existing: CounterPlacement[], attempt = 0): { x: number; y: number } {
  const position = { x: 0.09 + Math.random() * 0.82, y: 0.16 + Math.random() * 0.68 };
  const hasSpace = existing.every(
    (item) => Math.hypot((item.x - position.x) * 2.5, item.y - position.y) > 0.24,
  );
  return hasSpace || attempt >= 39
    ? position
    : defaultPosition(existing, attempt + 1);
}

function newPlacement(
  ingredientId: string, existing: CounterPlacement[], position = defaultPosition(existing),
): CounterPlacement {
  const id = globalThis.crypto?.randomUUID?.()
    ?? nextFallbackPlacementId();
  return { id, ingredientId, x: clamp(position.x), y: clamp(position.y) };
}

function nextFallbackPlacementId() {
  // Incrementing this private counter is required to keep fallback IDs unique
  // in runtimes without crypto.randomUUID.
  runtime.placementSequence += 1;
  return `counter-${Date.now().toString(36)}-${runtime.placementSequence}`;
}

function restoreCounter(value: unknown): CounterPlacement[] {
  if (!Array.isArray(value)) return [];
  const entries = value as Array<Partial<CounterPlacement & CounterItem>>;
  return entries.flatMap((item) => {
    if (!knownIds.has(item?.ingredientId ?? '')) return [];
    const ingredientId = item.ingredientId!;
    if (typeof item.id === 'string' && Number.isFinite(item.x) && Number.isFinite(item.y))
      return [{ id: item.id, ingredientId, x: clamp(item.x!), y: clamp(item.y!) }];
    // Keep counters saved before individual emoji positions were introduced.
    if (Number.isSafeInteger(item.selectedUses) && item.selectedUses! > 0)
      return Array.from({ length: Math.min(item.selectedUses!, 50) }, () =>
        newPlacement(ingredientId, []));
    return [];
  });
}

export const getKitchenDemoSnapshot = () => runtime.snapshot;
export const getKitchenDemoServerSnapshot = () => initialSnapshot;
export function subscribeKitchenDemo(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function kitchenDemoForUser(userId: string | undefined): KitchenDemoState {
  return userId ? runtime.snapshot[userId] ?? emptyState : emptyState;
}

function publish(userId: string, next: KitchenDemoState) {
  runtime.snapshot = { ...runtime.snapshot, [userId]: next };
  try {
    localStorage.setItem(`ctk-kitchen-demo:${userId}`, JSON.stringify(next));
  } catch {
    // In-memory interaction still works when browser storage is unavailable.
  }
  listeners.forEach((listener) => listener());
}

// TODO(BACKEND): Replace local persistence with user-scoped counter and favorites
// endpoints. Purchased inventory must remain server-owned.
export function hydrateKitchenDemo(userId: string) {
  if (runtime.snapshot[userId]) return;
  const saved = readSavedKitchen(userId);
  const next: KitchenDemoState = {
    counter: restoreCounter(saved.counter),
    favorites: Array.isArray(saved.favorites)
      ? saved.favorites.filter(validRecipeId)
      : [],
  };
  publish(userId, next);
}

function readSavedKitchen(userId: string): Partial<KitchenDemoState> {
  try {
    return JSON.parse(localStorage.getItem(`ctk-kitchen-demo:${userId}`) ?? '{}') ?? {};
  } catch {
    // A malformed or unavailable cache starts empty.
    return {};
  }
}

function update(userId: string, transform: (current: KitchenDemoState) => KitchenDemoState) {
  hydrateKitchenDemo(userId);
  publish(userId, transform(kitchenDemoForUser(userId)));
}

export function addIngredientToCounter(
  userId: string, ingredientId: string, inventory: InventoryItem[], position?: { x: number; y: number },
) {
  if (!knownIds.has(ingredientId)) throw new ApiError('Unknown ingredient.', 'NOT_FOUND', 404);
  update(userId, (current) => {
    if (!canPlaceOnCounter(inventory, aggregateCounter(current.counter), ingredientId))
      throw new ApiError('No more uses are available for this ingredient.', 'INSUFFICIENT_INVENTORY', 409);
    return {
      ...current,
      counter: [...current.counter, newPlacement(ingredientId, current.counter, position)],
    };
  });
}

export function removeCounterPlacement(userId: string, placementId: string) {
  update(userId, (current) => ({
    ...current,
    counter: current.counter.filter((item) => item.id !== placementId),
  }));
}

export function moveCounterPlacement(userId: string, placementId: string, position: { x: number; y: number }) {
  update(userId, (current) => ({
    ...current,
    counter: current.counter.map((item) => item.id === placementId
      ? { ...item, x: clamp(position.x), y: clamp(position.y) } : item),
  }));
}

export function clearCounter(userId: string) {
  update(userId, (current) => ({ ...current, counter: [] }));
}

export function addMissingToCounter(userId: string, ingredientIds: string[], inventory: InventoryItem[]) {
  update(userId, (current) => {
    const counter = ingredientIds.reduce<CounterPlacement[]>((placed, ingredientId) =>
      canPlaceOnCounter(inventory, aggregateCounter(placed), ingredientId)
        ? [...placed, newPlacement(ingredientId, placed)]
        : placed, current.counter);
    return { ...current, counter };
  });
}

export function toggleFavorite(userId: string, recipeId: string) {
  if (!validRecipeId(recipeId)) return;
  update(userId, (current) => ({
    ...current,
    favorites: current.favorites.includes(recipeId)
      ? current.favorites.filter((id) => id !== recipeId)
      : [...current.favorites, recipeId],
  }));
}
