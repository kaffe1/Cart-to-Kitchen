import type { Recipe, RecipeAvailability } from '../../recipes/model/recipes.types';

export interface InventoryItem {
  ingredientId: string;
  remainingUses: number | 'infinite';
}

export interface CounterItem {
  ingredientId: string;
  selectedUses: number;
}

export interface CounterPlacement {
  id: string;
  ingredientId: string;
  x: number;
  y: number;
}

export interface RecipeMatch {
  recipe: Recipe;
  availability: RecipeAvailability;
  matchedCount: number;
  requiredCount: number;
  missingFromCounter: string[];
  missingFromInventory: string[];
}

export interface RecipeMatchGroups {
  readyNow: RecipeMatch[];
  almostReady: RecipeMatch[];
  needShopping: RecipeMatch[];
}
