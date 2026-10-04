import { getDemoRecipe } from '../../recipes/model/recipes.api';

// TODO(BACKEND): Replace the frontend instructions with recipe/cooking-session
// endpoints. This demo never calls an API or consumes purchased inventory.
export function getDemoCookingRecipe(recipeId: string) {
  return getDemoRecipe(recipeId);
}
