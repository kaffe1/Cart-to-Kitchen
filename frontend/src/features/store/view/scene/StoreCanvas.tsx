import { Canvas } from '@react-three/fiber';
import { useProgress } from '@react-three/drei';
import {
  Suspense,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from 'react';
import { Button } from '@/shared/components/ui/button';
import type { Ingredient } from '../../model/store.types';
import type { ShoppingMode } from './controls/shoppingSession';
import { STORE_CAMERA_FOV } from './layout/storeAppearance';
import { STORE_ENTRANCE, STORE_SECTIONS } from './layout/storeLayout';
import { MarketScene, type LockControls } from './MarketScene';
import type { CartFlight } from './products/cartFlight';

interface StoreCanvasProps {
  ref?: Ref<StoreCanvasHandle>;
  mode: ShoppingMode;
  ingredients: Ingredient[];
  onAdd: (ingredientId: string) => Promise<boolean>;
  onExplorationChange?: (active: boolean) => void;
  onResume: () => void;
  onFlightLanded?: () => void;
}

export interface StoreCanvasHandle {
  resumeShopping: () => void;
  pauseShopping: () => void;
}

export function StoreCanvas({
  ref,
  mode,
  ingredients,
  onAdd,
  onExplorationChange,
  onResume,
  onFlightLanded,
}: StoreCanvasProps) {
  const { active: isLoadingModels, progress } = useProgress();
  const isExploring = mode === 'shopping';
  const controlsRef = useRef<LockControls>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const flightSequence = useRef(0);
  const [flights, setFlights] = useState<CartFlight[]>([]);
  useImperativeHandle(
    ref,
    () => ({
      resumeShopping: () => controlsRef.current?.lock(),
      pauseShopping: () => controlsRef.current?.unlock(),
    }),
    [],
  );
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [addFeedback, setAddFeedback] = useState({
    ingredientId: null as string | null,
    sequence: 0,
  });
  const addFocusedProduct = useCallback(
    async (ingredientId: string) => {
      const added = await onAdd(ingredientId);
      if (!added) return;
      const section = STORE_SECTIONS.find((candidate) =>
        candidate.ingredientIds.includes(ingredientId),
      );
      const ingredient = ingredients.find((item) => item.id === ingredientId);
      if (section && ingredient && canvasRef.current) {
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const basketRect = document
          .getElementById('store-3d-basket-target')
          ?.getBoundingClientRect();
        const target: readonly [number, number] = basketRect
          ? [
              ((basketRect.left + basketRect.width / 2 - canvasRect.left) /
                canvasRect.width) *
                2 -
                1,
              1 -
                ((basketRect.top + basketRect.height / 2 - canvasRect.top) /
                  canvasRect.height) *
                  2,
            ]
          : [0.9, 0.88];
        setFlights((current) => [
          ...current,
          {
            token: ++flightSequence.current,
            ingredient,
            kind: section.kind,
            target,
          },
        ]);
      }
      setAddFeedback((current) => ({
        ingredientId,
        sequence: current.sequence + 1,
      }));
    },
    [onAdd, ingredients],
  );
  const finishFlight = useCallback(
    (token: number) => {
      setFlights((current) =>
        current.filter((flight) => flight.token !== token),
      );
      onFlightLanded?.();
    },
    [onFlightLanded],
  );
  const startExploring = useCallback(() => {
    onExplorationChange?.(true);
  }, [onExplorationChange]);
  const stopExploring = useCallback(() => {
    setFocusedId(null);
    onExplorationChange?.(false);
  }, [onExplorationChange]);

  return (
    <div
      ref={canvasRef}
      className="store-canvas"
      aria-label="Interactive 3D grocery store"
    >
      <Suspense
        fallback={<div className="canvas-loading">Stocking the shelves…</div>}
      >
        <Canvas
          frameloop={isExploring || flights.length > 0 ? 'always' : 'demand'}
          shadows="percentage"
          dpr={[1, 1.5]}
          camera={{
            position: STORE_ENTRANCE,
            fov: STORE_CAMERA_FOV,
            near: 0.06,
            far: 45,
          }}
          onCreated={({ camera }) => camera.lookAt(0, 1.3, -2)}
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
            controlsRef={controlsRef}
            flights={flights}
            onFlightComplete={finishFlight}
          />
        </Canvas>
      </Suspense>
      <div
        className={
          mode === 'entry'
            ? 'store-entry-overlay'
            : 'store-entry-overlay hidden'
        }
        aria-hidden={mode !== 'entry'}
        inert={mode !== 'entry'}
      >
        <div className="store-entry-prompt">
          <small>YOUR NEIGHBOURHOOD MARKET</small>
          <strong>Good food starts here.</strong>
          <span>Pick your ingredients. Find your next good meal.</span>
          <Button
            id="store-enter-button"
            onClick={onResume}
            size="lg"
            disabled={isExploring || isLoadingModels}
            tabIndex={isExploring ? -1 : 0}
          >
            Enter Store
          </Button>
          <span className="store-entry-controls">
            WASD walk · Mouse look · Click to add · B / Esc basket
          </span>
        </div>
      </div>
      {mode === 'paused' && (
        <button
          type="button"
          className="store-pause-overlay"
          onClick={onResume}
          aria-label="Resume shopping"
        >
          <span>
            Shopping paused<small>Press B or click here to continue</small>
          </span>
        </button>
      )}
      {isLoadingModels && (
        <output className="store-model-loading" aria-live="polite">
          Loading the shelves… {Math.round(progress)}%
        </output>
      )}
      {isExploring && <div className="store-crosshair" aria-hidden="true" />}
      <div className="canvas-help">
        {isExploring
          ? 'WASD move · Click add · B / ESC basket'
          : mode === 'paused'
            ? 'B or click the store to continue'
            : 'Enter first-person mode to explore'}
      </div>
    </div>
  );
}
