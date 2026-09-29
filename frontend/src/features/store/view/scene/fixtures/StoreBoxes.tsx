import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Euler, Matrix4, Quaternion, Vector3, type InstancedMesh } from 'three';
import { INTERACTION_LAYER } from '../layout/storeLayout';
import { createStoreBoxGeometry, type StoreBox } from './storeGeometry';
export type { StoreBox } from './storeGeometry';

function BoxBatch({ boxes }: { boxes: StoreBox[] }) {
  const ref = useRef<InstancedMesh>(null);
  const geometry = useMemo(
    () => createStoreBoxGeometry(boxes[0].size, boxes[0].radius),
    [boxes],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    boxes.forEach((box, index) => {
      mesh.setMatrixAt(
        index,
        new Matrix4().compose(
          new Vector3(...box.position),
          new Quaternion().setFromEuler(
            new Euler(...(box.rotation ?? [0, 0, 0])),
          ),
          new Vector3(1, 1, 1),
        ),
      );
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingBox();
    mesh.computeBoundingSphere();
    mesh.layers.set(0);
    if (boxes[0].blocking !== false) mesh.layers.enable(INTERACTION_LAYER);
  }, [boxes]);
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, undefined, boxes.length]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        color={boxes[0].color}
        metalness={boxes[0].metalness ?? 0}
        roughness={boxes[0].roughness ?? 0.75}
      />
    </instancedMesh>
  );
}

// Batch architecture by material, keeping solid occluders on the picking layer.
export function StoreBoxes({ boxes }: { boxes: StoreBox[] }) {
  const batches = useMemo(() => {
    const groups = new Map<string, StoreBox[]>();
    boxes.forEach((box) => {
      // Actual-size geometry keeps bevels physically uniform on long, thin boxes.
      const key = `${box.color}:${box.metalness ?? 0}:${box.roughness ?? 0.75}:${box.blocking !== false}:${box.size.join(',')}:${box.radius ?? 0.012}`;
      const group = groups.get(key) ?? [];
      group.push(box);
      groups.set(key, group);
    });
    return [...groups.entries()];
  }, [boxes]);
  return (
    <>
      {batches.map(([key, batch]) => (
        <BoxBatch key={key} boxes={batch} />
      ))}
    </>
  );
}
