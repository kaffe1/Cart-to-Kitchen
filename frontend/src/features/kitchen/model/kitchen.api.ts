import { allIngredients, dummyRecipes } from '../../../shared/api/dummyData';
import type { CounterItem, InventoryItem } from './kitchen.types';
import { matchRecipes } from './kitchen.rules';
import { requestJson } from '../../../shared/api/httpClient';
import type { Recipe } from '../../recipes/model/recipes.types';

// Route navigation unmounts KitchenPage. Keep the last discovery result scoped
// to its user so returning from Details restores Recipe Radar without a refetch.
const discoveryCache = new Map<string, Recipe[]>();
// This non-reactive navigation cache intentionally uses Map mutation. Cached
// arrays are replaced as values and the cache never escapes this module.

export function getCachedDiscovery(userId: string): Recipe[] | null {
  return discoveryCache.has(userId) ? discoveryCache.get(userId)! : null;
}

export function rememberDiscovery(userId: string, recipes: Recipe[]) {
  discoveryCache.set(userId, recipes);
}

export function clearDiscovery(userId: string) {
  discoveryCache.delete(userId);
}

export function discoverRecipes(counter: CounterItem[], signal?: AbortSignal) {
  return requestJson<Recipe[]>('/recipes/discover', {
    method: 'POST', signal,
    body: JSON.stringify({ ingredientIds: counter.map((item) => item.ingredientId) }),
  });
}
export { rememberRecipes } from '../../recipes/model/recipes.api';

// The existing appSession GET /shopping-sessions/active supplies purchased
// inventory. Display metadata remains in the frontend fixture for this phase.
export const getKitchenIngredients = () => allIngredients;

// Legacy fixture helper for deterministic model tests; runtime discovery uses the API above.
export function findDemoDishes(inventory: InventoryItem[], counter: CounterItem[]) {
  return matchRecipes(dummyRecipes, inventory, counter);
}
