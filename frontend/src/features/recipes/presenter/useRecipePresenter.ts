import { getDemoRecipe } from '../model/recipes.api';

export function useRecipePresenter(recipeId: string) {
  const recipe = getDemoRecipe(recipeId);
  return { recipe, error: recipe ? null : 'Recipe not found in the demo catalogue.' };
}
