export interface CookingHistoryEntry {
  id: string;
  recipeId: string;
  recipeName: string;
  recipeEmoji: string;
  completedAt: string;
  consumedIngredientIds: string[];
}
