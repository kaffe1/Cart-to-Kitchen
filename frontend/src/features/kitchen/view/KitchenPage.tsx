import { useEffect, useRef, useState } from "react";
import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor,
  pointerWithin, rectIntersection, useSensor, useSensors, type DragEndEvent, type DragStartEvent, type Modifier,
} from "@dnd-kit/core";
import { ChefHat, Search } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { FeedbackBanner, FeedbackToast } from "@/shared/components/ui/FeedbackBanner";
import { Input } from "@/shared/components/ui/input";
import { useKitchenPresenter } from "../presenter/useKitchenPresenter";
import { RecipeMatchBoard } from "./components/RecipeMatchBoard";
import { CounterDropZone } from "./dnd/CounterDropZone";
import { DefaultPantryDrawer } from "./dnd/DefaultPantryDrawer";
import { DraggableIngredient } from "./dnd/DraggableIngredient";
import { centerFromGrab, type GrabOffset } from "./dnd/dragGeometry";

function dropPoint(event: DragEndEvent, grabOffset: GrabOffset | null, pointerPosition: { x: number; y: number } | null) {
  if (pointerPosition) return grabOffset?.id === String(event.active.id)
    ? centerFromGrab(pointerPosition, grabOffset) : pointerPosition;
  const activator = event.activatorEvent;
  if ("clientX" in activator && "clientY" in activator
    && typeof activator.clientX === "number" && typeof activator.clientY === "number") {
    const pointer = { x: activator.clientX + event.delta.x, y: activator.clientY + event.delta.y };
    if (grabOffset?.id === String(event.active.id)) return centerFromGrab(pointer, grabOffset);
    return pointer;
  }
  const translated = event.active.rect.current.translated;
  return translated
    ? { x: translated.left + translated.width / 2, y: translated.top + translated.height / 2 }
    : null;
}

function counterDropPosition(event: DragEndEvent, grabOffset: GrabOffset | null, pointerPosition: { x: number; y: number } | null) {
  const zone = document.getElementById("kitchen-counter")?.getBoundingClientRect();
  const rect = document.getElementById("kitchen-counter-stage")?.getBoundingClientRect();
  const point = dropPoint(event, grabOffset, pointerPosition);
  const hit = pointerPosition ?? point;
  if (!zone || !rect || !point || !hit || hit.x < zone.left || hit.x > zone.right || hit.y < zone.top || hit.y > zone.bottom)
    return null;
  return {
    x: Math.min(1, Math.max(0, (point.x - rect.left) / rect.width)),
    y: Math.min(1, Math.max(0, (point.y - rect.top) / rect.height)),
  };
}

// Overlay has a fixed 54px footprint, independent of the source card's size.
// Counter drags retain the original grab offset; shelf drags center on the pointer.
const positionDragIcon: Modifier = ({ transform, activeNodeRect: rect, activatorEvent, active }) => {
  if (!rect) return transform;
  const pointer = activatorEvent && 'clientX' in activatorEvent
    ? activatorEvent as PointerEvent : null;
  const fromCounter = active?.data.current?.source === 'counter';
  // dnd-kit measures counter nodes without their CSS translate(-50%, -50%).
  let x = transform.x + (fromCounter ? -27 : pointer ? pointer.clientX - rect.left - 27 : 0);
  let y = transform.y + (fromCounter ? -27 : pointer ? pointer.clientY - rect.top - 27 : 0);
  const zone = document.getElementById('kitchen-counter')?.getBoundingClientRect();
  const stage = document.getElementById('kitchen-counter-stage')?.getBoundingClientRect();
  const center = { x: rect.left + x + 27, y: rect.top + y + 27 };
  if (zone && stage && center.x >= zone.left && center.x <= zone.right && center.y >= zone.top && center.y <= zone.bottom) {
    x += Math.min(stage.right, Math.max(stage.left, center.x)) - center.x;
    y += Math.min(stage.bottom, Math.max(stage.top, center.y)) - center.y;
  }
  return { ...transform, x, y, scaleX: 1, scaleY: 1 };
};

export function KitchenPage() {
  const presenter = useKitchenPresenter();
  const resultsRef = useRef<HTMLDivElement>(null);
  const grabOffsetRef = useRef<GrabOffset | null>(null);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const [activeDrag, setActiveDrag] = useState<{ emoji: string; source: string } | null>(null);
  const [scrollRequest, setScrollRequest] = useState(0);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  useEffect(() => {
    // Capture the actual release position before dnd-kit's document listeners.
    // Its delta can also include ancestor scrolling and is not a pointer position.
    const record = (event: PointerEvent) => {
      if (pointerIdRef.current === event.pointerId) pointerRef.current = { x: event.clientX, y: event.clientY };
    };
    window.addEventListener('pointermove', record, true);
    window.addEventListener('pointerup', record, true);
    return () => {
      window.removeEventListener('pointermove', record, true);
      window.removeEventListener('pointerup', record, true);
    };
  }, []);

  useEffect(() => {
    if (!scrollRequest || !presenter.hasMatched) return;
    const frame = requestAnimationFrame(() => {
      const target = resultsRef.current;
      if (!target) return;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({
        top: Math.max(0, window.scrollY + target.getBoundingClientRect().top - 90),
        behavior: reducedMotion ? "auto" : "smooth",
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [scrollRequest, presenter.hasMatched]);

  function handleDragStart(event: DragStartEvent) {
    const source = String(event.active.data.current?.source ?? "");
    const initial = document.getElementById(`drag-${event.active.id}`)?.getBoundingClientRect() ?? event.active.rect.current.initial;
    const activator = event.activatorEvent;
    const pointer = "clientX" in activator && "clientY" in activator
      && typeof activator.clientX === "number" && typeof activator.clientY === "number"
      ? { x: activator.clientX, y: activator.clientY } : null;
    const grab = initial && pointer ? {
      id: String(event.active.id),
      x: pointer.x - initial.left,
      y: pointer.y - initial.top,
      width: initial.width,
      height: initial.height,
    } : null;
    grabOffsetRef.current = source === "counter" ? grab : null;
    pointerRef.current = pointer;
    pointerIdRef.current = 'pointerId' in activator ? Number(activator.pointerId) : null;
    setActiveDrag({
      emoji: String(event.active.data.current?.emoji ?? ""),
      source,
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDrag(null);
    const data = event.active.data.current;
    const position = counterDropPosition(event, grabOffsetRef.current, pointerRef.current);
    grabOffsetRef.current = null;
    pointerRef.current = null;
    pointerIdRef.current = null;
    if (data?.source === "counter") {
      if (position) presenter.moveOnCounter(String(data.placementId), position);
      else presenter.removeFromCounter(String(data.placementId));
    } else if (position && (data?.source === "owned" || data?.source === "pantry")) {
      presenter.addToCounter(String(data.ingredientId), position);
    }
  }

  async function handleFindDishes() {
    if (!await presenter.refreshMatches()) return;
    setScrollRequest((request) => request + 1);
  }

  return (
    <div className="page-shell kitchen-page">
      {presenter.message && (
        <FeedbackToast message={presenter.message} onDismiss={presenter.clearMessage} />
      )}
      {presenter.error && (
        <FeedbackBanner tone="error">{presenter.error}</FeedbackBanner>
      )}
      {presenter.error && (
        <Button variant="outline" onClick={presenter.retry}>
          Retry loading
        </Button>
      )}
      {presenter.isLoading && <output>Loading your kitchen…</output>}

      <DndContext sensors={sensors} autoScroll={false} collisionDetection={(args) => args.pointerCoordinates ? pointerWithin(args) : rectIntersection(args)} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => { setActiveDrag(null); grabOffsetRef.current = null; pointerRef.current = null; pointerIdRef.current = null; }}>
        <div className="kitchen-workspace">
          <aside className="pantry-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Your ingredients</span>
                <h2>Pantry & fridge</h2>
              </div>
              <Badge variant="outline">
                {presenter.inventory.length} owned
              </Badge>
            </div>
            <div className="search-field kitchen-search">
              <Search size={16} />
              <Input
                value={presenter.search}
                onChange={(event) => presenter.setSearch(event.target.value)}
                placeholder="Find an ingredient"
              />
            </div>
            <div className="pantry-list">
              {presenter.ownedIngredients.map((entry) => (
                <DraggableIngredient
                  key={entry.ingredient.id}
                  ingredient={entry.ingredient}
                  remainingUses={entry.remainingUses}
                  onAdd={presenter.addToCounter}
                  disabled={presenter.isWriting || presenter.isLoading}
                />
              ))}
            </div>
          </aside>

          <section className="kitchen-main">
            <div className="kitchen-scene">
              <div className="kitchen-wall">
                <div className="window-frame">
                  <div className="window-sky">☁️</div>
                </div>
                <div className="hanging-tools">
                  <span>🥄</span>
                  <span>🍴</span>
                  <span>🥢</span>
                </div>
              </div>
              <CounterDropZone
                items={presenter.counterItems}
                onClear={presenter.clearAll}
                disabled={presenter.isWriting || presenter.isLoading}
              />
              <DefaultPantryDrawer
                ingredients={presenter.defaultPantryIngredients}
                disabled={presenter.isWriting || presenter.isLoading}
              />
            </div>
            <div className="cook-command">
              <div>
                <strong>
                  {presenter.counter.length
                    ? `${presenter.counter.length} ingredient ${presenter.counter.length === 1 ? 'type' : 'types'} selected`
                    : "Counter is empty"}
                </strong>
              </div>
              <Button
                size="lg"
                onClick={() => void handleFindDishes()}
                disabled={
                  !presenter.canFindDishes ||
                  presenter.isMatching ||
                  presenter.isWriting ||
                  presenter.isLoading
                }
              >
                <ChefHat size={18} />{" "}
                {presenter.isMatching ? "Scanning recipes…" : "Find dishes"}
              </Button>
            </div>
          </section>
        </div>
        <DragOverlay dropAnimation={null} adjustScale={false} modifiers={[positionDragIcon]} style={{ width: 54, height: 54 }}>
          {activeDrag ? <span
            className={activeDrag.source === "counter" ? "kitchen-drag-emoji from-counter" : "kitchen-drag-emoji"}
            aria-hidden="true"
          >{activeDrag.emoji}</span> : null}
        </DragOverlay>
      </DndContext>

      {presenter.hasMatched && (
        <div ref={resultsRef} className="kitchen-results">
          <RecipeMatchBoard
            matches={presenter.matches}
            ingredients={presenter.ingredients}
            disabled={presenter.isWriting || presenter.isMatching}
            onCompleteCounter={presenter.completeCounter}
          />
        </div>
      )}
    </div>
  );
}
