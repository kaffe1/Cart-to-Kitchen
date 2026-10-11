export interface ProfilePlaceholder {
  username: string;
  email: string;
  mode: string;
  note: string;
  avatarUrl?: string | null;
  cookingHistory: CookedRecipe[];
}

/* export type Profile = {
  username: string;
  email: string;
  avatar: Avatar;
  cookingHistory: CookedRecipe[];
} 
*/

export type CookedRecipe = {
  recipeId: string;
  name: string;
  review?: string;
  reviewImageUrl?: string;
};
