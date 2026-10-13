import { useDraggable, useDroppable } from '@dnd-kit/core';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import type { CounterPlacement } from '../../model/kitchen.types';
import type { Ingredient } from '../../../store/model/store.types';

interface CounterEntry extends CounterPlacement {
  ingredient?: Ingredient;
}

interface CounterDropZoneProps {
  items: CounterEntry[];
  onClear: () => void;
  disabled?: boolean;
}

function CounterEmoji({ item, disabled }: { item: CounterEntry; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `counter:${item.id}`,
    data: { source: 'counter', placementId: item.id, ingredientId: item.ingredientId, emoji: item.ingredient?.emoji },
    disabled,
  });
  const name = item.ingredient?.name ?? item.ingredientId;

  return (
    <button
      ref={setNodeRef}
      id={`drag-counter:${item.id}`}
      type="button"
      className={isDragging ? 'counter-emoji dragging' : 'counter-emoji'}
      style={{ left: `${item.x * 100}%`, top: `${item.y * 100}%` }}
      disabled={disabled}
      title={name}
      data-name={name}
      {...listeners}
      {...attributes}
      aria-label={`Move ${name} on the counter, or drag it away to return it`}
    >
      {item.ingredient?.emoji}
    </button>
  );
}

export function CounterDropZone({ items, onClear, disabled = false }: CounterDropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({ id: 'kitchen-counter', disabled });

  return (
    <>
      <div className="counter-topline">
        <div>
          <h2>Kitchen counter</h2>
        </div>
        {items.length > 0 && (
          <Button variant="ghost" size="sm" disabled={disabled} onClick={onClear}><RotateCcw size={15} /> Clear</Button>
        )}
      </div>

    <section id="kitchen-counter" ref={setNodeRef} className={isOver ? 'counter-zone is-over' : 'counter-zone'} aria-label="Ingredient work surface">
      <div id="kitchen-counter-stage" className={items.length === 0 ? 'counter-stage is-empty' : 'counter-stage'}>
        {items.length === 0 && (
          <div className="counter-empty">
            <span>🥣</span>
            <strong>Drop ingredients here</strong>
          </div>
        )}
        {items.map((item) => <CounterEmoji key={item.id} item={item} disabled={disabled} />)}
      </div>
    </section>
    </>
  );
}
