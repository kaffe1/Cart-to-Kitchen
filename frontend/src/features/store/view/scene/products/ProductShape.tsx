import { Html } from '@react-three/drei';
import { Suspense, useMemo } from 'react';
import { formatSek } from '@/shared/utils/format';
import type { Ingredient } from '../../../model/store.types';
import { StoreBoxes, type StoreBox } from '../fixtures/StoreBoxes';
import {
  INTERACTION_LAYER,
  type ProductSlot,
  type StoreSection,
} from '../layout/storeLayout';
import { PRODUCT_MAX_SCALE } from '../layout/storeAppearance';
import { IngredientGlbModel } from './IngredientGlbModel';
import { getProductDisplay } from './productDisplay';

interface ProductShapeProps {
  ingredient: Ingredient;
  section: StoreSection;
  slot: ProductSlot;
  focused: boolean;
  feedbackSequence: number;
}

// ingredient model
export function ProductShape({
  ingredient,
  section,
  slot,
  focused,
  feedbackSequence,
}: ProductShapeProps) {
  const display = useMemo(
    () => getProductDisplay(ingredient.id, section.kind),
    [ingredient.id, section.kind],
  );
  const interactionHeight = display.size[1] * PRODUCT_MAX_SCALE + 0.02;
  const trayBoxes = useMemo<StoreBox[]>(
    () =>
      section.kind !== 'meat'
        ? []
        : display.copies.flatMap((copy) => [
            {
              position: [copy.position[0], 0.008, 0],
              size: [0.35, 0.016, 0.47],
              color: '#35423c',
            },
            {
              position: [copy.position[0], 0.025, 0.23],
              size: [0.35, 0.045, 0.012],
              color: '#46534d',
            },
            {
              position: [copy.position[0], 0.025, -0.23],
              size: [0.35, 0.045, 0.012],
              color: '#46534d',
            },
          ]),
    [section.kind, display],
  );

  return (
    <group position={slot.position} userData={{ ingredientId: ingredient.id }}>
      {trayBoxes.length > 0 && <StoreBoxes boxes={trayBoxes} />}
      <Suspense fallback={null}>
        <IngredientGlbModel
          ingredient={ingredient}
          focused={focused}
          display={display}
          feedbackSequence={feedbackSequence}
        />
      </Suspense>
      <mesh
        position={[0, interactionHeight / 2 + 0.015, 0]}
        layers-mask={1 << INTERACTION_LAYER}
      >
        <boxGeometry
          args={[slot.width - 0.015, interactionHeight, slot.depth]}
        />
        <meshBasicMaterial
          transparent
          opacity={0}
          depthWrite={false}
          colorWrite={false}
        />
      </mesh>
      {focused && (
        <>
          <Html
            center
            position={[0, display.size[1] * PRODUCT_MAX_SCALE + 0.07, 0.04]}
            style={{ pointerEvents: 'none' }}
          >
            <div className="store-product-popover-anchor">
              <div className="store-product-popover">
                <span>{ingredient.emoji}</span>
                <div>
                  <strong>{ingredient.name}</strong>
                  <small>
                    {formatSek(ingredient.priceSek)} ·{' '}
                    {ingredient.usesPerUnit === 'infinite'
                      ? '∞ uses'
                      : `${ingredient.usesPerUnit} uses`}
                  </small>
                  <em>Click to add</em>
                </div>
              </div>
            </div>
          </Html>
        </>
      )}
    </group>
  );
}
