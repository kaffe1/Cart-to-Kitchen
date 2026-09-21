import { Plus } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import type { Ingredient } from '../../model/store.types';
import { formatSek } from '@/shared/utils/format';

interface IngredientCardProps {
  ingredient: Ingredient;
  onAdd: (ingredientId: string) => void;
  onSelect?: (ingredientId: string) => void;
  compact?: boolean;
}

export function IngredientCard({ ingredient, onAdd, onSelect, compact }: IngredientCardProps) {
  return (
    <article className={compact ? 'ingredient-card compact' : 'ingredient-card'}>
      <button
        type="button"
        className="ingredient-card-main"
        onClick={() => onSelect?.(ingredient.id)}
        aria-label={`View ${ingredient.name}`}
      >
        <span className="ingredient-emoji" style={{ backgroundColor: `${ingredient.color}22` }}>
          {ingredient.emoji}
        </span>
        <span className="ingredient-copy">
          <strong>{ingredient.name}</strong>
          <small>{ingredient.category}</small>
        </span>
      </button>
      <div className="ingredient-meta">
        <Badge variant="outline">{ingredient.usesPerUnit} uses</Badge>
        <strong>{formatSek(ingredient.priceSek)}</strong>
      </div>
      <Button size="sm" onClick={() => onAdd(ingredient.id)} aria-label={`Add ${ingredient.name} to cart`}>
        <Plus size={16} /> Add
      </Button>
    </article>
  );
}
