import { PointerLockControls } from '@react-three/drei';
import type { ComponentRef, RefObject } from 'react';
import { formatSek } from '@/shared/utils/format';
import type { Ingredient } from '../../model/store.types';
import { FirstPersonController } from './controls/FirstPersonController';
import { ProductInteractionController } from './controls/ProductInteractionController';
import { MarketShell } from './environment/MarketShell';
import { Shelf } from './fixtures/Shelf';
import { StoreSign } from './fixtures/StoreSign';
import {
  PRICE_LABEL_HEIGHT,
  STORE_SECTIONS,
  getPriceLabelWidth,
  getProductSlot,
  getSectionProducts,
} from './layout/storeLayout';
import { ProductShape } from './products/ProductShape';

export type LockControls = ComponentRef<typeof PointerLockControls>;
interface MarketSceneProps {
  ingredients: Ingredient[];
  onAdd: (ingredientId: string) => void;
  isExploring: boolean;
  focusedId: string | null;
  addFeedback: { ingredientId: string | null; sequence: number };
  onFocusChange: (ingredientId: string | null) => void;
  onExplorationStart: () => void;
  onExplorationEnd: () => void;
  controlsRef: RefObject<LockControls | null>;
}

export function MarketScene({
  ingredients,
  onAdd,
  isExploring,
  focusedId,
  addFeedback,
  onFocusChange,
  onExplorationStart,
  onExplorationEnd,
  controlsRef,
}: MarketSceneProps) {
  return (
    <>
      <MarketShell />
      {STORE_SECTIONS.map((section) => {
        const products = getSectionProducts(section, ingredients);
        return (
          <Shelf key={section.id} section={section}>
            {products.map(({ ingredient: item, index }) => {
              const slot = getProductSlot(section, index);
              return (
                <group key={item.id}>
                  <ProductShape
                    ingredient={item}
                    section={section}
                    slot={slot}
                    focused={focusedId === item.id}
                    feedbackSequence={
                      addFeedback.ingredientId === item.id
                        ? addFeedback.sequence
                        : 0
                    }
                  />
                  <StoreSign
                    title={item.name}
                    price={formatSek(item.priceSek)}
                    position={slot.labelPosition}
                    rotation={[slot.labelTilt, 0, 0]}
                    width={getPriceLabelWidth(item.name, slot.width)}
                    height={PRICE_LABEL_HEIGHT}
                    accent={section.accent}
                  />
                </group>
              );
            })}
          </Shelf>
        );
      })}
      <FirstPersonController enabled={isExploring} />
      <ProductInteractionController
        enabled={isExploring}
        focusedId={focusedId}
        onFocusChange={onFocusChange}
        onAdd={onAdd}
      />
      <PointerLockControls
        ref={controlsRef}
        makeDefault
        // Locking is owned by the entry/resume actions, never by cart clicks.
        selector="[data-store-manual-lock-only]"
        minPolarAngle={0.35}
        maxPolarAngle={2.6}
        onLock={onExplorationStart}
        onUnlock={onExplorationEnd}
      />
    </>
  );
}
