import { getCookingPlaceholder } from '../model/cooking.api';

export function useCookingPresenter(recipeId: string) {
  return { cooking: getCookingPlaceholder(recipeId) };
}
