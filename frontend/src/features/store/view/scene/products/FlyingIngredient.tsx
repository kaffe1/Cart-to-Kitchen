import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { Group, MathUtils, Mesh, PerspectiveCamera, Vector3 } from 'three';
import type { Ingredient } from '../../../model/store.types';
import { prepareIngredientModel } from './ingredientModel';
import { getIngredientModelUrl } from './ingredientModelUrl';
import { getProductDisplay } from './productDisplay';
import { CART_FLIGHT_DURATION, getCartFlightFrame } from './cartFlight';
import type { FixtureKind } from '../layout/storeLayout';

interface FlyingIngredientProps {
  ingredient: Ingredient;
  kind: FixtureKind;
  target: readonly [number, number];
  onComplete: () => void;
}

export function FlyingIngredient({
  ingredient,
  kind,
  target,
  onComplete,
}: FlyingIngredientProps) {
  const display = useMemo(
    () => getProductDisplay(ingredient.id, kind),
    [ingredient.id, kind],
  );
  const { scene } = useGLTF(getIngredientModelUrl(ingredient), false, false);
  const model = useMemo(() => {
    const prepared = prepareIngredientModel(scene, display.size);
    for (const material of prepared.materials) {
      material.depthTest = false;
      material.depthWrite = false;
    }
    return prepared;
  }, [scene, display.size]);
  const flyingGroup = useMemo(() => {
    const group = new Group();
    for (const part of model.parts) {
      const mesh = new Mesh(part.geometry, part.material);
      mesh.matrix.copy(part.matrix);
      mesh.matrixAutoUpdate = false;
      mesh.frustumCulled = false;
      mesh.renderOrder = 1000;
      group.add(mesh);
    }
    return group;
  }, [model]);
  useEffect(
    () => () => model.materials.forEach((material) => material.dispose()),
    [model],
  );
  const elapsed = useRef(0);
  const completed = useRef(false);
  const direction = useMemo(() => new Vector3(), []);

  useFrame(({ camera, size }, delta) => {
    elapsed.current += delta;
    const time = Math.min(elapsed.current / CART_FLIGHT_DURATION, 1);
    const frame = getCartFlightFrame(time, target);
    const depth = 2.2;
    direction
      .set(frame.x, frame.y, 0.5)
      .unproject(camera)
      .sub(camera.position)
      .normalize();
    flyingGroup.position
      .copy(camera.position)
      .addScaledVector(direction, depth);
    flyingGroup.quaternion.copy(camera.quaternion);
    flyingGroup.rotateY(time * Math.PI * 1.4);
    const visibleHeight =
      camera instanceof PerspectiveCamera
        ? 2 * Math.tan(MathUtils.degToRad(camera.fov) / 2) * depth
        : 2;
    const initialScale = (84 / size.height) * (visibleHeight / display.size[1]);
    flyingGroup.scale.setScalar(initialScale * frame.scale);
    if (time === 1 && !completed.current) {
      completed.current = true;
      onComplete();
    }
  });

  return <primitive object={flyingGroup} dispose={null} />;
}
