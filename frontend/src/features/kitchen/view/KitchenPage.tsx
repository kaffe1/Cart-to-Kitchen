import { useEffect, useRef, useState } from "react";
import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { ChefHat, Search } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { FeedbackBanner } from "@/shared/components/ui/FeedbackBanner";
import { Input } from "@/shared/components/ui/input";
import { useKitchenPresenter } from "../presenter/useKitchenPresenter";
import { RecipeMatchBoard } from "./components/RecipeMatchBoard";
import { CounterDropZone } from "./dnd/CounterDropZone";
import { DefaultPantryDrawer } from "./dnd/DefaultPantryDrawer";
import { DraggableIngredient } from "./dnd/DraggableIngredient";
import { centerFromGrab, type GrabOffset } from "./dnd/dragGeometry";

function dropPoint(event: DragEndEvent, grabOffset: GrabOffset | null) {
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

function counterDropPosition(event: DragEndEvent, grabOffset: GrabOffset | null) {
  const zone = document.getElementById("kitchen-counter")?.getBoundingClientRect();
  const rect = document.getElementById("kitchen-counter-stage")?.getBoundingClientRect();
  const point = dropPoint(event, grabOffset);
  if (!zone || !rect || !point || point.x < zone.left || point.x > zone.right || point.y < zone.top || point.y > zone.bottom)
    return null;
  const insetX = Math.min(0.5, 26 / rect.width);
  const insetY = Math.min(0.5, 26 / rect.height);
  return {
    x: Math.min(1 - insetX, Math.max(insetX, (point.x - rect.left) / rect.width)),
    y: Math.min(1 - insetY, Math.max(insetY, (point.y - rect.top) / rect.height)),
  };
}

export function KitchenPage() {
  const presenter = useKitchenPresenter();
  const resultsRef = useRef<HTMLDivElement>(null);
  const grabOffsetRef = useRef<GrabOffset | null>(null);
  const [activeDrag, setActiveDrag] = useState<{ emoji: string; source: string; offsetX: number; offsetY: number } | null>(null);
  const [scrollRequest, setScrollRequest] = useState(0);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

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
    const initial = event.active.rect.current.initial;
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
    setActiveDrag({
      emoji: String(event.active.data.current?.emoji ?? ""),
      source,
      offsetX: source === "counter" || !grab ? 0 : grab.x - 29,
      offsetY: source === "counter" || !grab ? 0 : grab.y - 29,
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDrag(null);
    const data = event.active.data.current;
    const position = counterDropPosition(event, grabOffsetRef.current);
    grabOffsetRef.current = null;
    if (data?.source === "counter") {
      if (position) presenter.moveOnCounter(String(data.placementId), position);
      else presenter.removeFromCounter(String(data.placementId));
    } else if (position && (data?.source === "owned" || data?.source === "pantry")) {
      presenter.addToCounter(String(data.ingredientId), position);
    }
  }

  function handleFindDishes() {
    if (!presenter.refreshMatches()) return;
    setScrollRequest((request) => request + 1);
  }

  return (
    <div className="page-shell kitchen-page">
      {presenter.message && (
        <FeedbackBanner tone="success">{presenter.message}</FeedbackBanner>
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

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => { setActiveDrag(null); grabOffsetRef.current = null; }}>
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
                    ? `${presenter.counter.length} ingredient types selected`
                    : "Counter is empty"}
                </strong>
              </div>
              <Button
                size="lg"
                onClick={handleFindDishes}
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
        <DragOverlay dropAnimation={null}>
          {activeDrag ? <span
            className={activeDrag.source === "counter" ? "kitchen-drag-emoji from-counter" : "kitchen-drag-emoji"}
            style={{ translate: `${activeDrag.offsetX}px ${activeDrag.offsetY}px` }}
            aria-hidden="true"
          >{activeDrag.emoji}</span> : null}
        </DragOverlay>
      </DndContext>

      {presenter.hasMatched && (
        <div ref={resultsRef} className="kitchen-results">
          <RecipeMatchBoard
            matches={presenter.matches}
            favorites={presenter.favorites}
            ingredients={presenter.ingredients}
            disabled={presenter.isWriting || presenter.isMatching}
            onCompleteCounter={presenter.completeCounter}
            onToggleFavorite={presenter.toggleFavorite}
          />
        </div>
      )}
    </div>
  );
}
