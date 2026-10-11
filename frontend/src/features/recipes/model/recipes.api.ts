import { dummyRecipes } from '../../../shared/api/dummyData';
import { requestJson } from '../../../shared/api/httpClient';
import type { Recipe } from './recipes.types';
const recipeCache = new Map<string, Recipe>();
export function rememberRecipes(recipes: Recipe[]) {
  for (const recipe of recipes) recipeCache.set(recipe.id, recipe);
}

export function getCachedRecipe(recipeId: string) { return recipeCache.get(recipeId) ?? null; }
export async function fetchRecipe(recipeId: string, signal?: AbortSignal) {
  const recipe = await requestJson<Recipe>(`/recipes/${encodeURIComponent(recipeId)}`, { signal });
  recipeCache.set(recipe.id, recipe);
  return recipe;
}

// Legacy fixture helper for model tests. Pages use fetchRecipe.
export function getDemoRecipe(recipeId: string) {
  return dummyRecipes.find((recipe) => recipe.id === recipeId) ?? null;
}
