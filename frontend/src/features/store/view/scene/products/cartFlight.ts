import type { Ingredient } from '../../../model/store.types';
import type { FixtureKind } from '../layout/storeLayout';

export interface CartFlight {
  token: number;
  ingredient: Ingredient;
  kind: FixtureKind;
  target: readonly [number, number];
}

export const CART_FLIGHT_DURATION = 0.85;

// Coordinates are normalized device coordinates, so the arc stays stable while
// the player moves or turns the camera during the animation.
export function getCartFlightFrame(
  progress: number,
  target: readonly [number, number],
) {
  const time = Math.max(0, Math.min(progress, 1));
  const travel = time * time * (3 - 2 * time);
  return {
    x: target[0] * travel,
    y: target[1] * travel + Math.sin(Math.PI * time) * 0.26,
    scale: 1 - 0.88 * time ** 1.5,
  };
}
