import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import {
  Float,
  Html,
  PointerLockControls,
  RoundedBox,
} from '@react-three/drei';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { MathUtils, type Group } from 'three';
import { Button } from '@/shared/components/ui/button';
import { formatSek } from '@/shared/utils/format';
import type { Ingredient } from '../../model/store.types';
import { FirstPersonController } from './FirstPersonController';
import { ProductInteractionController } from './ProductInteractionController';

const ENTER_STORE_SELECTOR = '#store-enter-button';

interface ProductShapeProps {
  ingredient: Ingredient;
  position: [number, number, number];
  focused: boolean;
  feedbackSequence: number;
  onAdd: (ingredientId: string) => void;
}

function ProductShape({
  ingredient,
  position,
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
    const pulseScale = Math.sin(pulseProgress.current * Math.PI) * 0.28;
    const targetScale = (focused ? 1.18 : 1) + pulseScale;
    const scale = MathUtils.damp(group.current.scale.x, targetScale, 18, delta);
    group.current.scale.setScalar(scale);
  });

  const click = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (!focused) return;
    onAdd(ingredient.id);
  };

  return (
    <Float speed={1.5} rotationIntensity={0.12} floatIntensity={0.18}>
      <group
        ref={group}
        position={position}
        userData={{ ingredientId: ingredient.id }}
      >
        <mesh castShadow onClick={click}>
          <sphereGeometry args={[0.32, 24, 24]} />
          <meshStandardMaterial
            color={ingredient.color}
            emissive={focused ? '#f7b928' : '#000000'}
            emissiveIntensity={focused ? 0.48 : 0}
            roughness={0.72}
          />
        </mesh>
        <mesh position={[0, -0.38, 0]} castShadow onClick={click}>
          <cylinderGeometry args={[0.23, 0.28, 0.25, 20]} />
          <meshStandardMaterial color="#f5d990" roughness={0.9} />
        </mesh>
        {focused && (
          <>
            <mesh position={[0, -0.54, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.32, 0.45, 32]} />
              <meshBasicMaterial color="#f7b928" />
            </mesh>
            <Html
              center
              position={[0, 0.78, 0]}
              distanceFactor={7}
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
    </Float>
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
  const positions: [number, number, number][] = [
    [-2.5, 1.1, -0.1],
    [-1.7, 1.1, -0.1],
    [-0.9, 1.1, -0.1],
    [0.9, 1.1, -0.1],
    [1.7, 1.1, -0.1],
    [2.5, 1.1, -0.1],
    [-2.5, 0.15, 0.15],
    [-1.7, 0.15, 0.15],
    [-0.9, 0.15, 0.15],
    [0.9, 0.15, 0.15],
    [1.7, 0.15, 0.15],
    [2.5, 0.15, 0.15],
  ];

  return (
    <>
      <color attach="background" args={['#eef3e8']} />
      <fog attach="fog" args={['#eef3e8', 8, 16]} />
      <ambientLight intensity={1.25} />
      <directionalLight position={[4, 7, 5]} intensity={2.4} castShadow />
      <RoundedBox
        args={[7, 0.22, 1.45]}
        radius={0.08}
        position={[0, -0.58, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#234f43" roughness={0.88} />
      </RoundedBox>
      <RoundedBox
        args={[7.3, 0.32, 1.8]}
        radius={0.08}
        position={[0, -1.12, 0.15]}
        receiveShadow
      >
        <meshStandardMaterial color="#d8a24b" roughness={0.9} />
      </RoundedBox>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.29, 0]}
        receiveShadow
      >
        <planeGeometry args={[18, 18]} />
        <meshStandardMaterial color="#f5e8cf" roughness={1} />
      </mesh>
      {ingredients.slice(0, 12).map((item, index) => (
        <ProductShape
          key={item.id}
          ingredient={item}
          position={positions[index]}
          focused={focusedId === item.id}
          feedbackSequence={
            addFeedback.ingredientId === item.id ? addFeedback.sequence : 0
          }
          onAdd={onAdd}
        />
      ))}
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
    <div className="store-canvas" aria-label="Interactive 3D grocery shelf">
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
            disabled={isExploring}
            tabIndex={isExploring ? -1 : 0}
          >
            Enter Store
          </Button>
        </div>
      </div>
      {isExploring && <div className="store-crosshair" aria-hidden="true" />}
      <div className="canvas-help">
        {isExploring
          ? 'WASD move · E add · B basket · ESC exit'
          : 'Enter first-person mode to explore'}
      </div>
    </div>
  );
}
