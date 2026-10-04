import { allIngredients, dummyRecipes } from '../../../shared/api/dummyData';
import type { CounterItem, InventoryItem } from './kitchen.types';
import { matchRecipes } from './kitchen.rules';

// The existing appSession GET /shopping-sessions/active supplies purchased
// inventory. Display metadata remains in the frontend fixture for this phase.
export const getKitchenIngredients = () => allIngredients;

// TODO(BACKEND): Replace this local matcher with a recipe-match endpoint when
// recipe data and selection become server-owned. No HTTP request is made now.
export function findDemoDishes(inventory: InventoryItem[], counter: CounterItem[]) {
  return matchRecipes(dummyRecipes, inventory, counter);
}
