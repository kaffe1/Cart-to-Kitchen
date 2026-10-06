export interface ProfilePlaceholder {
  username: string;
  mode: string;
  note: string;
  cookingHistory: CookedRecipe[];
}

/* export type Profile = {
  displayName: string;
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
