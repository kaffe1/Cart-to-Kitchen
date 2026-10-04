import { useDraggable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import type { Ingredient } from '../../../store/model/store.types';

interface DraggableIngredientProps {
  ingredient: Ingredient;
  remainingUses: number | 'infinite';
  onAdd: (ingredientId: string) => void;
  disabled?: boolean;
}

export function DraggableIngredient({ ingredient, remainingUses, onAdd, disabled = false }: DraggableIngredientProps) {
  const unavailable = disabled || remainingUses === 0;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `owned:${ingredient.id}`,
    data: { source: 'owned', ingredientId: ingredient.id, emoji: ingredient.emoji },
    disabled: unavailable,
  });

  return (
    <article
      ref={setNodeRef}
      className={unavailable ? 'pantry-item unavailable' : isDragging ? 'pantry-item dragging' : 'pantry-item'}
      {...listeners}
      {...attributes}
      aria-label={`Drag ${ingredient.name} to counter`}
    >
      <span className="pantry-emoji" style={{ backgroundColor: `${ingredient.color}22` }}>{ingredient.emoji}</span>
      <div className="pantry-copy">
        <strong>{ingredient.name}</strong>
        <small>{remainingUses === 'infinite' ? 'Always available' : `${remainingUses} uses left`}</small>
      </div>
      <Button
        size="icon-sm"
        variant="ghost"
        disabled={unavailable}
        onPointerDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        onClick={() => onAdd(ingredient.id)}
        aria-label={`Add ${ingredient.name} to counter`}
      >
        <Plus size={15} />
      </Button>
    </article>
  );
}
