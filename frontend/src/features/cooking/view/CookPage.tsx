import { Link } from 'react-router-dom';
import { appRoutes } from '@/app/routes';
import { Button, buttonVariants } from '@/shared/components/ui/button';
import { FeedbackBanner } from '@/shared/components/ui/FeedbackBanner';
import { useCookingPresenter } from '../presenter/useCookingPresenter';
import { CookingAtmosphere, CookingIllustration } from './components/CookingAtmosphere';
import { StepLyrics } from './components/StepLyrics';

export function CookPage({ recipeId }: { recipeId: string }) {
  const presenter = useCookingPresenter(recipeId);
  const { recipe } = presenter;
  return (
    <section className="cooking-studio">
      <CookingAtmosphere />
      <div className="cooking-content">
      <CookingIllustration />
      <h1>{recipe?.name ?? 'Your kitchen is warming up'}</h1>
      {presenter.error && <FeedbackBanner tone="error">{presenter.error}</FeedbackBanner>}
      {presenter.isLoading && <output>Loading your kitchen…</output>}
      {!recipe && presenter.error && <Button onClick={presenter.retry}>Retry recipe</Button>}
      {recipe && <>
        {!presenter.ready && !presenter.isFinishing && !presenter.canRetryCompletion && !presenter.isLoading && <>
          <FeedbackBanner tone="error">Place all required ingredients on your kitchen counter first.</FeedbackBanner>
        </>}
        {recipe.steps.length ? <StepLyrics key={recipe.id} steps={recipe.steps} /> : <p>No instructions are available for this recipe.</p>}
      </>}
      <div className="cooking-actions">
        {presenter.isFinishing ? <Button variant="outline" disabled>Discard</Button> : <Link className={buttonVariants({ variant: 'outline', size: 'lg' })} to={appRoutes.kitchen}>Discard</Link>}
        <Button size="lg" onClick={() => void presenter.finish()} disabled={(!presenter.ready && !presenter.canRetryCompletion) || presenter.isFinishing || presenter.isLoading}>
          {presenter.isFinishing ? 'Saving your dish…' : presenter.canRetryCompletion ? 'Retry finish cooking' : 'Finish cooking'}
        </Button>
      </div>
      <p className="recipe-source">Recipe by <a href="https://www.themealdb.com" target="_blank" rel="noreferrer">TheMealDB</a></p>
      </div>
    </section>
  );
}
