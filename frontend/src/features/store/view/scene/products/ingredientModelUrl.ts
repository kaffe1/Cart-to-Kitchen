import type {
  Ingredient,
  IngredientCategory,
} from '../../../model/store.types';
import modelAssets from './ingredientModelAssets.json';

const MODEL_FOLDERS: Partial<Record<IngredientCategory, string>> =
  modelAssets.categories;

export function getIngredientModelUrl(ingredient: Ingredient) {
  const folder = MODEL_FOLDERS[ingredient.category];
  if (!folder)
    throw new Error(`No GLB folder configured for ${ingredient.category}.`);
  return `${import.meta.env.BASE_URL}models/ingredients/model_web/${folder}/${encodeURIComponent(ingredient.id)}.glb`;
}
