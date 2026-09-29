import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html, PointerLockControls, useProgress } from '@react-three/drei';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { MathUtils, type Group } from 'three';
import { Button } from '@/shared/components/ui/button';
import { formatSek } from '@/shared/utils/format';
import type { Ingredient } from '../../model/store.types';
import { FirstPersonController } from './FirstPersonController';
import { MarketShell } from './MarketShell';
import { IngredientGlbModel } from './IngredientGlbModel';
import { ProductInteractionController } from './ProductInteractionController';
import { Shelf } from './Shelf';
import {
  STORE_SECTIONS,
  shelfProductDimensions,
  twoTierShelfPosition,
} from './storeLayout';

const ENTER_STORE_SELECTOR = '#store-enter-button';
interface ProductShapeProps {
  ingredient: Ingredient;
  position: [number, number, number];
  maxWidth: number;
  hitboxWidth: number;
  focused: boolean;
  feedbackSequence: number;
  onAdd: (ingredientId: string) => void;
}

// ingredient model
function ProductShape({
  ingredient,
  position,
  maxWidth,
  hitboxWidth,
  focused,
  feedbackSequence,
  onAdd,
}: ProductShapeProps) {
  const group = useRef<Group>(null);
  const pulseProgress = useRef(0);

  useEffect(() => {
    if (feedbackSequence > 0) pulseProgress.current = 1;
  }, [feedbackSequence]);

  useFrame((_, delta) => {
    if (!group.current) return;
    pulseProgress.current = Math.max(0, pulseProgress.current - delta * 2.8);
    const pulseScale = Math.sin(pulseProgress.current * Math.PI) * 0.06;
    const targetScale = (focused ? 1.14 : 1) + pulseScale;
    const scale = MathUtils.damp(group.current.scale.x, targetScale, 18, delta);
    group.current.scale.setScalar(scale);
  });

  const click = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (!focused) return;
    onAdd(ingredient.id);
  };

  return (
    <group
      position={position}
      userData={{ ingredientId: ingredient.id }}
      onClick={click}
    >
      {/* Animation group : scale when focus */}
      <group ref={group}>
        <Suspense fallback={null}>
          <IngredientGlbModel
            ingredient={ingredient}
            focused={focused}
            maxWidth={maxWidth}
          />
        </Suspense>
      </group>
      <mesh position={[0, 0.34, 0]}>
        <boxGeometry args={[hitboxWidth, 0.68, 0.52]} />
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
            position={[0, 0.82, 0]}
            style={{ pointerEvents: 'none' }}
          >
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
                <em>Press E or click to add</em>
              </div>
            </div>
          </Html>
        </>
      )}
    </group>
  );
}

interface MarketSceneProps {
  ingredients: Ingredient[];
  onAdd: (ingredientId: string) => void;
  isExploring: boolean;
  focusedId: string | null;
  addFeedback: { ingredientId: string | null; sequence: number };
  onFocusChange: (ingredientId: string | null) => void;
  onExplorationStart: () => void;
  onExplorationEnd: () => void;
}

// wrap ingredients inside market scene
function MarketScene({
  ingredients,
  onAdd,
  isExploring,
  focusedId,
  addFeedback,
  onFocusChange,
  onExplorationStart,
  onExplorationEnd,
}: MarketSceneProps) {
  return (
    <>
      <MarketShell />
      {STORE_SECTIONS.map((section) => {
        const products = ingredients.filter(
          (ingredient) => ingredient.category === section.category,
        );
        const dimensions = shelfProductDimensions(
          products.length,
          section.width,
        );
        return (
          <Shelf key={section.category} section={section}>
            {products.map((item, index) => (
              <ProductShape
                key={item.id}
                ingredient={item}
                position={twoTierShelfPosition(
                  index,
                  products.length,
                  section.width,
                )}
                maxWidth={dimensions.maxWidth}
                hitboxWidth={dimensions.hitboxWidth}
                focused={focusedId === item.id}
                feedbackSequence={
                  addFeedback.ingredientId === item.id
                    ? addFeedback.sequence
                    : 0
                }
                onAdd={onAdd}
              />
            ))}
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
        makeDefault
        selector={ENTER_STORE_SELECTOR}
        onLock={onExplorationStart}
        onUnlock={onExplorationEnd}
      />
    </>
  );
}

interface StoreCanvasProps {
  ingredients: Ingredient[];
  onAdd: (ingredientId: string) => Promise<boolean>;
  onExplorationChange?: (active: boolean) => void;
}

export function StoreCanvas({
  ingredients,
  onAdd,
  onExplorationChange,
}: StoreCanvasProps) {
  const { active: isLoadingModels, progress } = useProgress();
  const [isExploring, setIsExploring] = useState(false);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [addFeedback, setAddFeedback] = useState({
    ingredientId: null as string | null,
    sequence: 0,
  });
  const addFocusedProduct = useCallback(
    async (ingredientId: string) => {
      const added = await onAdd(ingredientId);
      if (!added) return;
      setAddFeedback((current) => ({
        ingredientId,
        sequence: current.sequence + 1,
      }));
    },
    [onAdd],
  );
  const startExploring = useCallback(() => {
    setIsExploring(true);
    onExplorationChange?.(true);
  }, [onExplorationChange]);
  const stopExploring = useCallback(() => {
    setIsExploring(false);
    setFocusedId(null);
    onExplorationChange?.(false);
  }, [onExplorationChange]);

  return (
    <div className="store-canvas" aria-label="Interactive 3D grocery store">
      <Suspense
        fallback={<div className="canvas-loading">Stocking the shelves…</div>}
      >
        <Canvas
          shadows
          dpr={[1, 1.5]}
          camera={{ position: [0, 1.7, 6], fov: 46 }}
        >
          <MarketScene
            ingredients={ingredients}
            onAdd={addFocusedProduct}
            isExploring={isExploring}
            focusedId={focusedId}
            addFeedback={addFeedback}
            onFocusChange={setFocusedId}
            onExplorationStart={startExploring}
            onExplorationEnd={stopExploring}
          />
        </Canvas>
      </Suspense>
      <div
        className={
          isExploring ? 'store-entry-overlay hidden' : 'store-entry-overlay'
        }
        aria-hidden={isExploring}
      >
        <div className="store-entry-prompt">
          <strong>Explore the market</strong>
          <span>Use your mouse to look, WASD to walk, and E to shop.</span>
          <Button
            id="store-enter-button"
            size="lg"
            disabled={isExploring || isLoadingModels}
            tabIndex={isExploring ? -1 : 0}
          >
            Enter Store
          </Button>
        </div>
      </div>
      {isLoadingModels && (
        <output className="store-model-loading" aria-live="polite">
          Loading the shelves… {Math.round(progress)}%
        </output>
      )}
      {isExploring && <div className="store-crosshair" aria-hidden="true" />}
      <div className="canvas-help">
        {isExploring
          ? 'WASD move · E add · B basket · ESC exit'
          : 'Enter first-person mode to explore'}
      </div>
    </div>
  );
}
