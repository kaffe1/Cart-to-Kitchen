import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Object3D, Raycaster, Vector2 } from 'three';
import { isTypingTarget } from './keyboard';

const SCREEN_CENTER = new Vector2(0, 0);
const INTERACTION_DISTANCE = 4.5;

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

  useEffect(() => {
    if (enabled) return;
    lastFocusedId.current = null;
    onFocusChange(null);
  }, [enabled, onFocusChange]);

  useEffect(() => {
    if (!enabled) return;

    const handleInteraction = (event: KeyboardEvent) => {
      if (
        event.code !== 'KeyE' ||
        event.repeat ||
        isTypingTarget(event.target) ||
        !focusedId
      )
        return;
      event.preventDefault();
      onAdd(focusedId);
    };

    window.addEventListener('keydown', handleInteraction);
    return () => window.removeEventListener('keydown', handleInteraction);
  }, [enabled, focusedId, onAdd]);

  useFrame(({ camera, scene }) => {
    if (!enabled) return;

    raycaster.current.far = INTERACTION_DISTANCE;
    raycaster.current.setFromCamera(SCREEN_CENTER, camera);
    const [nearestIntersection] = raycaster.current.intersectObjects(
      scene.children,
      true,
    );
    const nextFocusedId = findIngredientId(nearestIntersection?.object ?? null);

    if (nextFocusedId !== lastFocusedId.current) {
      lastFocusedId.current = nextFocusedId;
      onFocusChange(nextFocusedId);
    }
  });

  return null;
}
