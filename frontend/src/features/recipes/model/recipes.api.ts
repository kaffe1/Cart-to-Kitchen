import { dummyRecipes } from '../../../shared/api/dummyData';

// TODO(BACKEND): Read recipe detail from a recipe endpoint when one exists.
export function getDemoRecipe(recipeId: string) {
  return dummyRecipes.find((recipe) => recipe.id === recipeId) ?? null;
}
