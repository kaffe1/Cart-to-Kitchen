import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { ChevronUp } from 'lucide-react';
import type { Ingredient } from '../../../store/model/store.types';

interface DefaultPantryDrawerProps {
  ingredients: Ingredient[];
  disabled?: boolean;
}

function PantryEmoji({ ingredient, disabled }: { ingredient: Ingredient; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `pantry:${ingredient.id}`,
    data: { source: 'pantry', ingredientId: ingredient.id, emoji: ingredient.emoji },
    disabled,
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={isDragging ? 'pantry-drawer-emoji dragging' : 'pantry-drawer-emoji'}
      disabled={disabled}
      title={ingredient.name}
      data-name={ingredient.name}
      {...listeners}
      {...attributes}
      aria-label={`Drag ${ingredient.name} to counter`}
    >
      {ingredient.emoji}
    </button>
  );
}

export function DefaultPantryDrawer({ ingredients, disabled = false }: DefaultPantryDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className={isOpen ? 'pantry-drawer open' : 'pantry-drawer'}>
        <div id="default-pantry-drawer" className="pantry-drawer-panel" aria-hidden={!isOpen} inert={!isOpen}>
          <div className="pantry-drawer-heading">
            <strong>Default pantry</strong>
            <span>Always available · drag to the counter</span>
          </div>
          <div className="pantry-drawer-grid">
            {ingredients.map((ingredient) => (
              <PantryEmoji key={ingredient.id} ingredient={ingredient} disabled={disabled || !isOpen} />
            ))}
          </div>
        </div>
      </div>
      <button
        type="button"
        className="pantry-drawer-handle"
        aria-expanded={isOpen}
        aria-controls="default-pantry-drawer"
        onClick={() => setIsOpen((open) => !open)}
      >
        <ChevronUp className={isOpen ? 'is-open' : undefined} size={17} aria-hidden="true" />
        <span>Default pantry</span>
      </button>
    </>
  );
}
