import { CircleUserRound } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { useProfilePresenter } from '../presenter/useProfilePresenter';

export function ProfilePage() {
  const { profile } = useProfilePresenter();

  return (
    <section className="page-shell placeholder-page">
      <CircleUserRound size={34} />
      <Badge variant="outline">{profile.mode}</Badge>
      <h1>{profile.displayName}</h1>
      <p>{profile.note}</p>
    </section>
  );
}
