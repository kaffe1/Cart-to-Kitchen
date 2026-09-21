import { CookingPot } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { useCookingPresenter } from '../presenter/useCookingPresenter';

export function CookPage({ recipeId }: { recipeId: string }) {
  const { cooking } = useCookingPresenter(recipeId);

  return (
    <section className="page-shell placeholder-page">
      <CookingPot size={34} />
      <Badge variant="outline">Placeholder</Badge>
      <h1>{cooking.title}</h1>
      <p>{cooking.sampleStep}</p>
      <code>{cooking.recipeId}</code>
    </section>
  );
}
