import { pantryIngredients } from '../../../shared/api/dummyData';
import type { Recipe } from '../../recipes/model/recipes.types';
import type { CounterItem, CounterPlacement, InventoryItem, RecipeMatch, RecipeMatchGroups } from './kitchen.types';

const pantryIds = new Set(pantryIngredients.map((item) => item.id));

export function aggregateCounter(placements: CounterPlacement[]): CounterItem[] {
  const counts = placements.reduce<Record<string, number>>(
    (current, { ingredientId }) => ({
      ...current,
      [ingredientId]: (current[ingredientId] ?? 0) + 1,
    }),
    {},
  );
  return Object.entries(counts).map(([ingredientId, selectedUses]) => ({
    ingredientId,
    selectedUses,
  }));
}

export function availableUses(inventory: InventoryItem[], ingredientId: string): number {
  if (pantryIds.has(ingredientId)) return Number.POSITIVE_INFINITY;
  const item = inventory.find((entry) => entry.ingredientId === ingredientId);
  return item?.remainingUses === 'infinite' ? Number.POSITIVE_INFINITY : item?.remainingUses ?? 0;
}

export function selectedUses(counter: CounterItem[], ingredientId: string): number {
  return counter.find((entry) => entry.ingredientId === ingredientId)?.selectedUses ?? 0;
}

export function canPlaceOnCounter(
  inventory: InventoryItem[], counter: CounterItem[], ingredientId: string,
): boolean {
  return availableUses(inventory, ingredientId) > selectedUses(counter, ingredientId);
}

export function matchRecipes(
  recipes: Recipe[], inventory: InventoryItem[], counter: CounterItem[],
): RecipeMatchGroups {
  const results = recipes.map<RecipeMatch>((recipe) => {
    const missingFromInventory = recipe.requirements
      .filter(({ ingredientId, amount, automatic }) => !automatic && availableUses(inventory, ingredientId) < amount)
      .map(({ ingredientId }) => ingredientId);
    const missingFromCounter = recipe.requirements
      .filter(({ ingredientId, amount, automatic }) => !automatic && selectedUses(counter, ingredientId) < amount)
      .map(({ ingredientId }) => ingredientId);
    const availability = recipe.unsupportedIngredients?.length || missingFromInventory.length > 0
      ? 'need_shopping'
      : missingFromCounter.length > 0 ? 'almost_ready' : 'ready_now';
    return {
      recipe, availability,
      matchedCount: recipe.requirements.length - missingFromCounter.length,
      requiredCount: recipe.requirements.length,
      missingFromCounter, missingFromInventory,
    };
  });
  const sortMatches = (a: RecipeMatch, b: RecipeMatch) =>
    Number(Boolean(a.recipe.unsupportedIngredients?.length))
      - Number(Boolean(b.recipe.unsupportedIngredients?.length))
    || (b.requiredCount ? b.matchedCount / b.requiredCount : 1)
      - (a.requiredCount ? a.matchedCount / a.requiredCount : 1)
    || b.matchedCount - a.matchedCount
    || a.missingFromInventory.length - b.missingFromInventory.length
    || a.recipe.name.localeCompare(b.recipe.name);
  const sorted = (availability: RecipeMatch['availability']) =>
    results
      .filter((item) => item.availability === availability)
      .reduce<RecipeMatch[]>((ordered, item) => {
        const index = ordered.findIndex(
          (candidate) => sortMatches(item, candidate) < 0,
        );
        return index < 0
          ? [...ordered, item]
          : [...ordered.slice(0, index), item, ...ordered.slice(index)];
      }, []);
  return {
    readyNow: sorted('ready_now'),
    almostReady: sorted('almost_ready'),
    needShopping: sorted('need_shopping'),
  };
}

export function firstAvailableMatchTab(groups: RecipeMatchGroups): 'ready' | 'almost' | 'shopping' {
  if (groups.readyNow.length > 0) return 'ready';
  if (groups.almostReady.length > 0) return 'almost';
  return 'shopping';
}
