import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { appRoutes } from '@/app/routes';
import { Badge } from '@/shared/components/ui/badge';
import { buttonVariants } from '@/shared/components/ui/button';
import { FeedbackBanner } from '@/shared/components/ui/FeedbackBanner';
import { useRecipePresenter } from '../presenter/useRecipePresenter';

export function RecipeDetailPage({ recipeId }: { recipeId: string }) {
  const { recipe, error } = useRecipePresenter(recipeId);
  return (
    <section className="page-shell recipe-detail-page">
      <BookOpen size={34} />
      {error && <FeedbackBanner tone="error">{error}</FeedbackBanner>}
      {!error && !recipe && <output>Loading recipe…</output>}
      {recipe && <>
        <Badge variant="outline">{recipe.category}</Badge>
        <h1>{recipe.emoji} {recipe.name}</h1>
        <p>Place these ingredients on your kitchen counter before cooking:</p>
        <ul>{recipe.requirements.map((item) => <li key={item.ingredientId}>{item.ingredientId.replaceAll('-', ' ')} × {item.amount}</li>)}</ul>
        <div className="recipe-detail-actions">
          <Link className={buttonVariants({ variant: 'outline' })} to={appRoutes.kitchen}>Back to kitchen</Link>
          <Link className={buttonVariants()} to={appRoutes.cook(recipe.id)}>Cook this dish</Link>
        </div>
      </>}
    </section>
  );
}
