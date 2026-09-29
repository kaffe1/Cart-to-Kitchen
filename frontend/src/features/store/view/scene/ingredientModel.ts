import {
  Box3,
  Color,
  Material,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Vector3,
} from 'three';

export const INGREDIENT_MODEL_SIZE = new Vector3(0.58, 0.66, 0.44);

//scale and assign material to model
export function prepareIngredientModel(
  source: Object3D,
  maxWidth = INGREDIENT_MODEL_SIZE.x,
  preferredScale = Infinity,
) {
  const object = source.clone(true);
  const materialCopies = new Map<Material, Material>();
  object.traverse((node) => {
    if (!(node instanceof Mesh)) return;
    node.castShadow = true;
    node.receiveShadow = true;
    const copyMaterial = (material: Material) => {
      let copy = materialCopies.get(material);
      if (!copy) {
        copy = material.clone();
        materialCopies.set(material, copy);
      }
      return copy;
    };
    node.material = Array.isArray(node.material)
      ? node.material.map(copyMaterial)
      : copyMaterial(node.material);
  });

  object.updateMatrixWorld(true);
  const bounds = new Box3().setFromObject(object, true);
  const size = bounds.getSize(new Vector3());
  if (
    bounds.isEmpty() ||
    ![size.x, size.y, size.z].every(
      (value) => Number.isFinite(value) && value > 0,
    )
  ) {
    throw new Error('Ingredient model has invalid bounds.');
  }
  const center = bounds.getCenter(new Vector3());
  const scale = Math.min(
    preferredScale,
    Math.min(maxWidth, INGREDIENT_MODEL_SIZE.x) / size.x,
    INGREDIENT_MODEL_SIZE.y / size.y,
    INGREDIENT_MODEL_SIZE.z / size.z,
  );
  const offset = new Vector3(-center.x, -bounds.min.y, -center.z);
  const materials = [...materialCopies.values()];
  const appearance = materials
    .filter(
      (material): material is MeshStandardMaterial =>
        material instanceof MeshStandardMaterial,
    )
    .map((material) => ({
      material,
      color: material.color.clone(),
      emissive: material.emissive.clone(),
      emissiveIntensity: material.emissiveIntensity,
    }));
  return { object, scale, offset, materials, appearance };
}

const FOCUS_TINT = new Color('#d6ed9e');

export function setIngredientModelFocus(
  model: ReturnType<typeof prepareIngredientModel>,
  focused: boolean,
) {
  for (const {
    material,
    color,
    emissive,
    emissiveIntensity,
  } of model.appearance) {
    material.color.copy(color);
    material.emissive.copy(emissive);
    material.emissiveIntensity = emissiveIntensity;
    if (focused) {
      material.color.lerp(FOCUS_TINT, 0.3);
      material.emissive.lerp(FOCUS_TINT, 0.08);
      material.emissiveIntensity = Math.max(emissiveIntensity, 0.35);
    }
  }
}
