import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Vector3 } from 'three';
import { isTypingTarget } from './keyboard';
import { canWalkTo } from '../layout/storeLayout';

const EYE_HEIGHT = 1.7;
const MOVEMENT_SPEED = 2.8;
const MAX_FRAME_DELTA = 0.1;

type MovementDirection = 'forward' | 'backward' | 'left' | 'right';
type MovementState = Record<MovementDirection, boolean>;

const keyDirections: Partial<Record<KeyboardEvent['code'], MovementDirection>> =
  {
    KeyW: 'forward',
    ArrowUp: 'forward',
    KeyS: 'backward',
    ArrowDown: 'backward',
    KeyA: 'left',
    ArrowLeft: 'left',
    KeyD: 'right',
    ArrowRight: 'right',
  };

function createMovementState(): MovementState {
  return { forward: false, backward: false, left: false, right: false };
}

interface FirstPersonControllerProps {
  enabled: boolean;
}

export function FirstPersonController({ enabled }: FirstPersonControllerProps) {
  const movement = useRef<MovementState>(createMovementState());
  const forward = useRef(new Vector3());
  const right = useRef(new Vector3());
  const travel = useRef(new Vector3());

  useEffect(() => {
    movement.current = createMovementState();
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      const direction = keyDirections[event.code];
      if (!direction) return;
      event.preventDefault();
      movement.current[direction] = true;
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const direction = keyDirections[event.code];
      if (!direction) return;
      movement.current[direction] = false;
    };

    const resetMovement = () => {
      movement.current = createMovementState();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', resetMovement);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', resetMovement);
      resetMovement();
    };
  }, [enabled]);

  useFrame(({ camera }, delta) => {
    camera.position.y = EYE_HEIGHT;
    if (!enabled) return;

    camera.getWorldDirection(forward.current);
    forward.current.y = 0;
    if (forward.current.lengthSq() === 0) forward.current.set(0, 0, -1);
    else forward.current.normalize();

    right.current.crossVectors(forward.current, camera.up).normalize();

    const forwardInput =
      Number(movement.current.forward) - Number(movement.current.backward);
    const rightInput =
      Number(movement.current.right) - Number(movement.current.left);

    travel.current
      .copy(forward.current)
      .multiplyScalar(forwardInput)
      .addScaledVector(right.current, rightInput);

    if (travel.current.lengthSq() > 0) {
      const distance = MOVEMENT_SPEED * Math.min(delta, MAX_FRAME_DELTA);
      travel.current.normalize().multiplyScalar(distance);
      const nextX = camera.position.x + travel.current.x;
      if (canWalkTo(nextX, camera.position.z)) camera.position.x = nextX;

      const nextZ = camera.position.z + travel.current.z;
      if (canWalkTo(camera.position.x, nextZ)) camera.position.z = nextZ;
    }
  });

  return null;
}
