export type Profile = {
  displayName: string;
  email: string | null;
  mode: "account" | "guest";
  avatarUrl?: string | null;
  cookingHistory: CookedRecipe[];
};

export type CookedRecipe = {
  entryId: string;
  recipeId: string;
  name: string;
  cookedAt: string;
  review: string | null;
  reviewImageUrl: string | null;
};
