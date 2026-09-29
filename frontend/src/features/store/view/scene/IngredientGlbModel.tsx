import { useGLTF } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import type { Ingredient, IngredientCategory } from '../../model/store.types';
import modelAssets from './ingredientModelAssets.json';
import {
  prepareIngredientModel,
  setIngredientModelFocus,
} from './ingredientModel';

const MODEL_FOLDERS: Partial<Record<IngredientCategory, string>> =
  modelAssets.categories;

interface IngredientGlbModelProps {
  ingredient: Ingredient;
  focused: boolean;
  maxWidth: number;
}

export function IngredientGlbModel({
  ingredient,
  focused,
  maxWidth,
}: IngredientGlbModelProps) {
  const folder = MODEL_FOLDERS[ingredient.category];
  if (!folder)
    throw new Error(`No GLB folder configured for ${ingredient.category}.`);
  const url = `${import.meta.env.BASE_URL}models/ingredients/model_web/${folder}/${encodeURIComponent(ingredient.id)}.glb`;
  const { scene } = useGLTF(url, false, false);
  const preferredScale =
    ingredient.category === 'Vegetables & Fruits' ? 0.3 : Infinity;
  const model = useMemo(
    () => prepareIngredientModel(scene, maxWidth, preferredScale),
    [scene, maxWidth, preferredScale],
  );

  useEffect(() => {
    setIngredientModelFocus(model, focused);
  }, [model, focused]);

  useEffect(
    () => () => {
      // Geometry and textures belong to useGLTF's cache; only dispose our copies.
      model.materials.forEach((material) => material.dispose());
    },
    [model],
  );

  return (
    // scale group for model
    <group scale={model.scale} dispose={null}>
      {/* align group */}
      <group position={model.offset}>
        {/* this is how R3F use glb model */}
        <primitive object={model.object} dispose={null} />
      </group>
    </group>
  );
}
