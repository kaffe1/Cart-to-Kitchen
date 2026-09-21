export interface CookingHistoryEntry {
  id: string;
  recipeId: string;
  recipeName: string;
  recipeEmoji: string;
  completedAt: string;
  consumedIngredientIds: string[];
}

export interface CookingPlaceholder {
  recipeId: string;
  title: string;
  sampleStep: string;
}
