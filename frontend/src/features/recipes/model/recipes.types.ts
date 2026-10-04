export type RecipeAvailability = 'ready_now' | 'almost_ready' | 'need_shopping';

export interface Recipe {
  id: string;
  name: string;
  // TODO(BACKEND): Map the recipe API's image field here; emoji is only the fallback.
  imageUrl?: string | null;
  emoji: string;
  category: string;
  accent: string;
  requirements: { ingredientId: string; amount: number }[];
  steps: string[];
}
