import { ChefHat } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { useKitchenPresenter } from '../presenter/useKitchenPresenter';

export function KitchenPage() {
  const { kitchen } = useKitchenPresenter();

  return (
    <section className="page-shell placeholder-page">
      <ChefHat size={34} />
      <Badge variant="outline">Placeholder</Badge>
      <h1>{kitchen.title}</h1>
      <p>{kitchen.status}</p>
      <div className="placeholder-data" aria-label="Sample kitchen data">
        {kitchen.sampleItems.map((item) => <span key={item}>{item}</span>)}
      </div>
    </section>
  );
}
