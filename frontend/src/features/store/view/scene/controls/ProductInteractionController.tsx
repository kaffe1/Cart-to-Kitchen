import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Object3D, Raycaster, Vector2, type Intersection } from 'three';
import { INTERACTION_LAYER } from '../layout/storeLayout';

const SCREEN_CENTER = new Vector2(0, 0);
const INTERACTION_DISTANCE = 3.2;

function findIngredientId(object: Object3D | null): string | null {
  let candidate = object;
  while (candidate) {
    const ingredientId = candidate.userData.ingredientId;
    if (typeof ingredientId === 'string') return ingredientId;
    candidate = candidate.parent;
  }
  return null;
}

interface ProductInteractionControllerProps {
  enabled: boolean;
  focusedId: string | null;
  onFocusChange: (ingredientId: string | null) => void;
  onAdd: (ingredientId: string) => void;
}

export function ProductInteractionController({
  enabled,
  focusedId,
  onFocusChange,
  onAdd,
}: ProductInteractionControllerProps) {
  const raycaster = useRef(new Raycaster());
  const lastFocusedId = useRef<string | null>(null);
  const intersections = useRef<Intersection[]>([]);
  const elapsed = useRef(0);

  useEffect(() => {
    if (enabled) return;
    lastFocusedId.current = null;
    onFocusChange(null);
  }, [enabled, onFocusChange]);

  useEffect(() => {
    if (!enabled) return;

    const handleClick = (event: MouseEvent) => {
      if (event.button !== 0 || !document.pointerLockElement || !focusedId)
        return;
      onAdd(focusedId);
    };
    // Buying is only enabled during pointer-locked shopping.
    window.addEventListener('mousedown', handleClick);
    return () => {
      window.removeEventListener('mousedown', handleClick);
    };
  }, [enabled, focusedId, onAdd]);

  useFrame(({ camera, scene }, delta) => {
    if (!enabled) return;
    elapsed.current += delta;
    if (elapsed.current < 1 / 30) return;
    elapsed.current = 0;

    raycaster.current.far = INTERACTION_DISTANCE;
    raycaster.current.layers.set(INTERACTION_LAYER);
    raycaster.current.setFromCamera(SCREEN_CENTER, camera);
    intersections.current.length = 0;
    const [nearestIntersection] = raycaster.current.intersectObjects(
      scene.children,
      true,
      intersections.current,
    );
    const nextFocusedId = findIngredientId(nearestIntersection?.object ?? null);

    if (nextFocusedId !== lastFocusedId.current) {
      lastFocusedId.current = nextFocusedId;
      onFocusChange(nextFocusedId);
    }
  });

  return null;
}
