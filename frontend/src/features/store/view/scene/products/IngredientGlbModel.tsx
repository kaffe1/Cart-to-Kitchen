import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type RefObject,
} from 'react';
import {
  Euler,
  MathUtils,
  Matrix4,
  Quaternion,
  Vector3,
  type InstancedMesh,
} from 'three';
import type {
  Ingredient,
  IngredientCategory,
} from '../../../model/store.types';
import modelAssets from './ingredientModelAssets.json';
import {
  prepareIngredientModel,
  setIngredientModelFocus,
} from './ingredientModel';
import type { DisplayCopy, ProductDisplay } from './productDisplay';
import {
  PRODUCT_FOCUS_SCALE,
  PRODUCT_FOCUS_RESPONSE,
  PRODUCT_PURCHASE_PULSE,
  PRODUCT_MAX_SCALE,
} from '../layout/storeAppearance';

const MODEL_FOLDERS: Partial<Record<IngredientCategory, string>> =
  modelAssets.categories;
type ModelPart = ReturnType<typeof prepareIngredientModel>['parts'][number];

function ModelInstances({
  part,
  copies,
  animatedScale,
}: {
  part: ModelPart;
  copies: readonly DisplayCopy[];
  animatedScale: RefObject<number>;
}) {
  const ref = useRef<InstancedMesh>(null);
  const lastScale = useRef(1);
  const placements = useMemo(
    () =>
      copies.map((copy) => ({
        position: new Vector3(...copy.position),
        rotation: new Quaternion().setFromEuler(
          new Euler(0, copy.rotationY, 0),
        ),
        scale: copy.scale,
      })),
    [copies],
  );
  const scratch = useMemo(
    () => ({ matrix: new Matrix4(), scale: new Vector3() }),
    [],
  );
  const updateMatrices = useCallback(
    (mesh: InstancedMesh, scale: number) => {
      placements.forEach((placement, index) => {
        scratch.matrix.compose(
          placement.position,
          placement.rotation,
          scratch.scale.setScalar(placement.scale * scale),
        );
        mesh.setMatrixAt(index, scratch.matrix.multiply(part.matrix));
      });
      mesh.instanceMatrix.needsUpdate = true;
    },
    [placements, scratch, part],
  );
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    // Cache a culling volume that includes the entire focus/purchase animation.
    updateMatrices(mesh, PRODUCT_MAX_SCALE);
    mesh.computeBoundingBox();
    mesh.computeBoundingSphere();
    updateMatrices(mesh, animatedScale.current);
    lastScale.current = animatedScale.current;
  }, [updateMatrices, animatedScale]);
  useFrame(() => {
    if (
      !ref.current ||
      Math.abs(lastScale.current - animatedScale.current) < 0.0001
    )
      return;
    updateMatrices(ref.current, animatedScale.current);
    lastScale.current = animatedScale.current;
  });
  return (
    <instancedMesh
      ref={ref}
      args={[part.geometry, part.material, copies.length]}
      castShadow
      receiveShadow
      dispose={null}
    />
  );
}

export function IngredientGlbModel({
  ingredient,
  focused,
  display,
  feedbackSequence,
}: {
  ingredient: Ingredient;
  focused: boolean;
  display: ProductDisplay;
  feedbackSequence: number;
}) {
  const folder = MODEL_FOLDERS[ingredient.category];
  if (!folder)
    throw new Error(`No GLB folder configured for ${ingredient.category}.`);
  const url = `${import.meta.env.BASE_URL}models/ingredients/model_web/${folder}/${encodeURIComponent(ingredient.id)}.glb`;
  const { scene } = useGLTF(url, false, false);
  const model = useMemo(
    () => prepareIngredientModel(scene, display.size),
    [scene, display.size],
  );
  const animatedScale = useRef(1);
  const pulseProgress = useRef(0);
  useEffect(() => {
    if (feedbackSequence > 0) pulseProgress.current = 1;
  }, [feedbackSequence]);
  useFrame((_, delta) => {
    pulseProgress.current = Math.max(0, pulseProgress.current - delta * 4.5);
    const pulse =
      Math.sin(pulseProgress.current * Math.PI) * PRODUCT_PURCHASE_PULSE;
    animatedScale.current = MathUtils.damp(
      animatedScale.current,
      (focused ? PRODUCT_FOCUS_SCALE : 1) + pulse,
      PRODUCT_FOCUS_RESPONSE,
      delta,
    );
  }, -1);
  useEffect(() => {
    setIngredientModelFocus(model, focused);
  }, [model, focused]);
  useEffect(
    () => () => {
      // Geometry and textures belong to the GLTF cache, only our materials are owned here.
      model.materials.forEach((material) => material.dispose());
    },
    [model],
  );
  return (
    <>
      {model.parts.map((part, index) => (
        <ModelInstances
          key={index}
          part={part}
          copies={display.copies}
          animatedScale={animatedScale}
        />
      ))}
    </>
  );
}
