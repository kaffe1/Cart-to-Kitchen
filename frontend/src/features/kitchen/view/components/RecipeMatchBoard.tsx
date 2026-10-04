/* oxlint-disable next/no-img-element -- Vite renders API recipe images with a native img and an onError emoji fallback. */
import { useState } from 'react';
import { Check, Heart, ListPlus, ShoppingCart, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { appRoutes } from '@/app/routes';
import type { Ingredient } from '@/features/store/model/store.types';
import type { Recipe } from '@/features/recipes/model/recipes.types';
import { Badge } from '@/shared/components/ui/badge';
import { Button, buttonVariants } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import type { RecipeMatch, RecipeMatchGroups } from '../../model/kitchen.types';
import { firstAvailableMatchTab } from '../../model/kitchen.rules';

interface RecipeMatchBoardProps {
  matches: RecipeMatchGroups;
  favorites: string[];
  ingredients: Ingredient[];
  disabled: boolean;
  onCompleteCounter: (ingredientIds: string[]) => void;
  onToggleFavorite: (recipeId: string) => void;
}

function ingredientNames(ids: string[], ingredients: Ingredient[]) {
  return ids.map((id) => ingredients.find((item) => item.id === id)?.name ?? id).join(', ');
}

function RecipeArtwork({ recipe }: { recipe: Recipe }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const imageUrl = recipe.imageUrl?.trim();
  const showImage = !!imageUrl && failedUrl !== imageUrl;

  return (
    <div className="recipe-art" aria-hidden="true">
      {showImage ? (
        <img src={imageUrl} alt="" loading="lazy" onError={() => setFailedUrl(imageUrl)} />
      ) : (
        <span>{recipe.emoji}</span>
      )}
    </div>
  );
}

function MatchCard({
  match,
  favorite,
  ingredients,
  disabled,
  onCompleteCounter,
  onToggleFavorite,
}: {
  match: RecipeMatch;
  favorite: boolean;
  ingredients: Ingredient[];
  disabled: boolean;
  onCompleteCounter: (ids: string[]) => void;
  onToggleFavorite: (recipeId: string) => void;
}) {
  const ready = match.availability === 'ready_now';
  const almost = match.availability === 'almost_ready';
  return (
    <article className="recipe-match-card" style={{ '--recipe-accent': match.recipe.accent } as React.CSSProperties}>
      <RecipeArtwork recipe={match.recipe} />
      <div className="recipe-card-body">
        <div className="recipe-card-title">
          <h3>{match.recipe.name}</h3>
          <button type="button" disabled={disabled} className={favorite ? 'favorite-button active' : 'favorite-button'} onClick={() => onToggleFavorite(match.recipe.id)} aria-label={`${favorite ? 'Remove' : 'Add'} ${match.recipe.name} ${favorite ? 'from' : 'to'} favorites`}>
            <Heart size={17} fill={favorite ? 'currentColor' : 'none'} />
          </button>
        </div>
        <p>{match.matchedCount}/{match.requiredCount} ingredients on the counter</p>
        {almost && <small><Sparkles size={14} /> In kitchen: {ingredientNames(match.missingFromCounter, ingredients)}</small>}
        {!ready && !almost && <small><ShoppingCart size={14} /> Need: {ingredientNames(match.missingFromInventory, ingredients)}</small>}
        <div className="recipe-card-actions">
          {ready ? (
            <Link className={buttonVariants({ size: 'sm' })} to={appRoutes.cook(match.recipe.id)}><Check size={15} /> Cook now</Link>
          ) : almost ? (
            <Button size="sm" disabled={disabled} onClick={() => onCompleteCounter(match.missingFromCounter)}><ListPlus size={15} /> Add all</Button>
          ) : (
            <Link className={buttonVariants({ size: 'sm', variant: 'secondary' })} to={appRoutes.store}><ShoppingCart size={15} /> Go shopping</Link>
          )}
        </div>
      </div>
    </article>
  );
}

function MatchList({
  items,
  emptyCopy,
  ...props
}: {
  items: RecipeMatch[];
  emptyCopy: string;
  favorites: string[];
  ingredients: Ingredient[];
  disabled: boolean;
  onCompleteCounter: (ingredientIds: string[]) => void;
  onToggleFavorite: (recipeId: string) => void;
}) {
  if (!items.length) return <div className="match-empty">{emptyCopy}</div>;
  return <div className="recipe-match-grid">{items.map((match) => <MatchCard key={match.recipe.id} match={match} favorite={props.favorites.includes(match.recipe.id)} {...props} />)}</div>;
}

export function RecipeMatchBoard(props: RecipeMatchBoardProps) {
  const { matches } = props;
  const initialTab = firstAvailableMatchTab(matches);
  return (
    <section className="match-board">
      <div className="match-board-heading">
        <div><span className="eyebrow">Recipe radar</span><h2>What can you make?</h2></div>
        <Badge>{matches.readyNow.length + matches.almostReady.length + matches.needShopping.length} ideas</Badge>
      </div>
      <Tabs key={initialTab} defaultValue={initialTab}>
        <TabsList className="match-tabs">
          <TabsTrigger value="ready">Ready now <Badge>{matches.readyNow.length}</Badge></TabsTrigger>
          <TabsTrigger value="almost">Almost ready <Badge>{matches.almostReady.length}</Badge></TabsTrigger>
          <TabsTrigger value="shopping">Need shopping <Badge>{matches.needShopping.length}</Badge></TabsTrigger>
        </TabsList>
        <TabsContent value="ready"><MatchList items={matches.readyNow} emptyCopy="Add the full ingredient set to your counter to unlock a ready recipe." {...props} /></TabsContent>
        <TabsContent value="almost"><MatchList items={matches.almostReady} emptyCopy="No near matches yet. Try another ingredient." {...props} /></TabsContent>
        <TabsContent value="shopping"><MatchList items={matches.needShopping} emptyCopy="Your kitchen already covers every recipe shown." {...props} /></TabsContent>
      </Tabs>
    </section>
  );
}
