import { getRecipePlaceholder } from '../model/recipes.api';

export function useRecipePresenter(recipeId: string) {
  return { recipe: getRecipePlaceholder(recipeId) };
}
