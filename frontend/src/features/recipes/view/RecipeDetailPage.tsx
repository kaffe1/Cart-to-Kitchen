import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { appRoutes } from '@/app/routes';
import { Badge } from '@/shared/components/ui/badge';
import { Button, buttonVariants } from '@/shared/components/ui/button';
import { FeedbackBanner } from '@/shared/components/ui/FeedbackBanner';
import { useRecipePresenter } from '../presenter/useRecipePresenter';

export function RecipeDetailPage({ recipeId }: { recipeId: string }) {
  const { recipe, error, retry } = useRecipePresenter(recipeId);
  return (
    <section className="page-shell recipe-detail-page">
      <BookOpen size={34} />
      {error && <FeedbackBanner tone="error">{error}</FeedbackBanner>}
      {error && <Button onClick={retry}>Retry recipe</Button>}
      {!error && !recipe && <output>Loading recipe…</output>}
      {recipe && <>
        <Badge variant="outline">{recipe.category}</Badge>
        <h1>{recipe.emoji} {recipe.name}</h1>
        <p>Place these ingredients on your kitchen counter before cooking:</p>
        {!!recipe.unsupportedIngredients?.length && <FeedbackBanner tone="error">Not available in this kitchen: {recipe.unsupportedIngredients.join(', ')}</FeedbackBanner>}
        <ul>{recipe.ingredients?.map((item, index) => <li key={`${item.ingredientId}:${index}`}>
          {item.emoji} {item.name} · {item.measure || 'to taste'}{item.isPantry ? ' · always available' : ''}
          {item.substitution && item.resolvedIngredientNames?.length
            ? ` · using ${item.resolvedIngredientNames.join(' + ')} (family substitute)`
            : ''}
        </li>)}</ul>
        <div className="recipe-detail-actions">
          <Link className={buttonVariants({ variant: 'outline' })} to={appRoutes.kitchen}>Back to kitchen</Link>
          {recipe.unsupportedIngredients?.length ? <Button disabled>Unavailable ingredients</Button> : <Link className={buttonVariants()} to={appRoutes.cook(recipe.id)}>Cook this dish</Link>}
        </div>
      </>}
    </section>
  );
}
