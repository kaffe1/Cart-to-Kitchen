import { BookOpen } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { useRecipePresenter } from '../presenter/useRecipePresenter';

export function RecipeDetailPage({ recipeId }: { recipeId: string }) {
  const { recipe } = useRecipePresenter(recipeId);

  return (
    <section className="page-shell placeholder-page">
      <BookOpen size={34} />
      <Badge variant="outline">Placeholder</Badge>
      <h1>{recipe.title}</h1>
      <p>{recipe.note}</p>
      <code>{recipe.id}</code>
    </section>
  );
}
