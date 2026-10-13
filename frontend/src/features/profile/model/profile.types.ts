export interface ProfilePlaceholder {
  displayName: string;
  email: string | null;
  mode: "account" | "guest";
  avatarUrl?: string | null;
  cookingHistory: CookedRecipe[];
}

 export type Profile = {
  displayName: string;
  email: string | null;
  mode: "account" | "guest";
  avatarUrl?: string | null;
  cookingHistory: CookedRecipe[];
} 


export type CookedRecipe = {
  recipeId: string;
  name: string;
  review?: string;
  reviewImageUrl?: string;
};
