export type IngredientCategory =
  | 'Vegetables & Fruits'
  | 'Meat & Seafood'
  | 'Dairy & Eggs'
  | 'Grains & Staples'
  | 'Other Ingredients'
  | 'Essential Seasonings & Oils'
  | 'Herbs & Spices'
  | 'Baking & Cooking Essentials';

export interface Ingredient {
  id: string;
  name: string;
  emoji: string;
  category: IngredientCategory;
  usesPerUnit: number | 'infinite';
  priceSek: number;
  aliases: string[];
  isPantry: boolean;
  color: string;
}

export interface CartLine {
  ingredientId: string;
  quantity: number;
}

export interface Wallet {
  balanceSek: number;
  capSek: number;
  nextGrantAt: string | null;
  hourlyGrantSek: number;
}

export interface ShoppingListItem {
  ingredientId: string;
  sourceRecipeId: string | null;
}

export interface CheckoutResult {
  purchasedUnits: number;
  spentSek: number;
  remainingBalanceSek: number;
}
