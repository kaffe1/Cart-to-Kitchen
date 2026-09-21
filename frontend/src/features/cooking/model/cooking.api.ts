import type { CookingPlaceholder } from './cooking.types';

// TODO(BACKEND): Replace this placeholder with cooking-session endpoints.
export function getCookingPlaceholder(recipeId: string): CookingPlaceholder {
  return {
    recipeId: recipeId || 'sample-recipe',
    title: 'Cooking mode',
    sampleStep: 'Sample step: prepare the ingredients.',
  };
}
