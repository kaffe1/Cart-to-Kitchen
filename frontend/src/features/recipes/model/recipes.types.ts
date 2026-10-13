export type RecipeAvailability = 'ready_now' | 'almost_ready' | 'need_shopping';

export interface Recipe {
  id: string;
  name: string;
  // Normalized from TheMealDB thumbUrl by the backend; emoji is an image-error fallback.
  imageUrl?: string | null;
  emoji: string;
  category: string;
  accent: string;
  requirements: { ingredientId: string; amount: number; automatic?: boolean }[];
  ingredients?: {
    ingredientId: string;
    resolvedIngredientIds?: string[];
    resolvedIngredientNames?: string[];
    resolution?: 'exact' | 'alias' | 'family' | 'unsupported';
    substitution?: boolean;
    name: string;
    measure: string;
    emoji: string;
    isPantry: boolean;
  }[];
  steps: string[];
  unsupportedIngredients?: string[];
}
