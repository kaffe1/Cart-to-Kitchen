import type { RecipePlaceholder } from './recipes.types';

// TODO(BACKEND): Replace this placeholder with the recipe detail endpoint.
export function getRecipePlaceholder(recipeId: string): RecipePlaceholder {
  return {
    id: recipeId || 'sample-recipe',
    title: 'Recipe details',
    note: 'Recipe content will be implemented in a later development phase.',
  };
}
