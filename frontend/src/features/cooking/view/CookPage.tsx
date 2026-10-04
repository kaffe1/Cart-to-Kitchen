import { Link } from 'react-router-dom';
import { CookingPot } from 'lucide-react';
import { appRoutes } from '@/app/routes';
import { Badge } from '@/shared/components/ui/badge';
import { Button, buttonVariants } from '@/shared/components/ui/button';
import { FeedbackBanner } from '@/shared/components/ui/FeedbackBanner';
import { useCookingPresenter } from '../presenter/useCookingPresenter';

export function CookPage({ recipeId }: { recipeId: string }) {
  const presenter = useCookingPresenter(recipeId);
  const { recipe } = presenter;
  return (
    <section className="page-shell recipe-detail-page cooking-page">
      <CookingPot size={34} />
      {presenter.error && <FeedbackBanner tone="error">{presenter.error}</FeedbackBanner>}
      {presenter.isLoading && <output>Loading your kitchen…</output>}
      {recipe && <>
        <Badge variant="outline">Demo cooking</Badge>
        <h1>{recipe.emoji} {recipe.name}</h1>
        {!presenter.ready && !presenter.completed && !presenter.isLoading && !presenter.error && <>
          <FeedbackBanner tone="error">Place all required ingredients on your kitchen counter first.</FeedbackBanner>
          <Link className={buttonVariants()} to={appRoutes.kitchen}>Back to kitchen</Link>
        </>}
        {presenter.completed && <>
          <FeedbackBanner tone="success">Cooking walkthrough complete. Purchased inventory was not changed.</FeedbackBanner>
          <Link className={buttonVariants()} to={appRoutes.kitchen}>Back to kitchen</Link>
        </>}
        {presenter.ready && !presenter.completed && <>
          <p>Follow the sample instructions, one step at a time.</p>
          <div className="cooking-step-card">
            <span className="eyebrow">Step {presenter.stepIndex + 1} of {recipe.steps.length}</span>
            <p>{recipe.steps[presenter.stepIndex]}</p>
          </div>
          <ol className="cooking-step-list">
            {recipe.steps.map((step, index) => <li key={step} className={index === presenter.stepIndex ? 'active' : ''}>{index + 1}. {step}</li>)}
          </ol>
          <div className="recipe-detail-actions">
            <Button variant="outline" onClick={presenter.previous} disabled={presenter.stepIndex === 0}>Previous</Button>
            <Button onClick={presenter.next}>{presenter.stepIndex === recipe.steps.length - 1 ? 'Finish demo' : 'Next step'}</Button>
          </div>
        </>}
      </>}
    </section>
  );
}
