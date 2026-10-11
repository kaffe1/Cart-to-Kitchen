/* oxlint-disable next/no-img-element -- Recipe photos are provided by TheMealDB. */
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import { appRoutes } from '@/app/routes';
import { appSession } from '@/shared/api/appSession';
import { Button, buttonVariants } from '@/shared/components/ui/button';
import { FeedbackBanner } from '@/shared/components/ui/FeedbackBanner';
import { fetchRecipe } from '../../recipes/model/recipes.api';
import type { Recipe } from '../../recipes/model/recipes.types';
import { fetchCookingHistory } from '../model/cooking.api';

export function CookingFinishedPage({ historyId }: { historyId: string }) {
  const { user } = useSyncExternalStore(appSession.subscribe, appSession.getSnapshot, appSession.getServerSnapshot);
  const [result, setResult] = useState<{ recipe: Recipe; count: number; userId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [failedImage, setFailedImage] = useState(false);
  const userId = user?.id;
  const [loadKey, setLoadKey] = useState(`${userId}:${historyId}:${attempt}`);
  if (loadKey !== `${userId}:${historyId}:${attempt}`) {
    setLoadKey(`${userId}:${historyId}:${attempt}`);
    setResult(null); setError(null); setFailedImage(false);
  }
  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    void fetchCookingHistory(controller.signal).then(async (history) => {
      const entry = history.find((item) => String(item.id) === historyId);
      if (!entry) throw new Error('This completed dish is not in your cooking history.');
      const recipe = await fetchRecipe(entry.recipeId, controller.signal);
      if (!controller.signal.aborted) setResult({ recipe, count: history.filter((item) => item.id <= entry.id).length, userId });
    }).catch((caught) => { if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : 'Could not load your completed dish.'); });
    return () => controller.abort();
  }, [historyId, userId, attempt]);
  const visible = result?.userId === user?.id ? result : null;
  return <section className="cooking-studio cooking-finished">
    <div className="cooking-content">
      {error && <><FeedbackBanner tone="error">{error}</FeedbackBanner><Button onClick={() => setAttempt((n) => n + 1)}>Retry</Button></>}
      {!visible && !error && <output>Plating your finished dish…</output>}
      {visible && <div className="finished-layout">
        <div className="finished-photo-frame">
          {visible.recipe.imageUrl && !failedImage ? <img className="finished-photo" src={visible.recipe.imageUrl} alt={visible.recipe.name} onError={() => setFailedImage(true)} /> : <span className="finished-photo-fallback">🍽️</span>}
          <span className="finished-stamp">Made by you ✨</span>
        </div>
        <div className="finished-copy">
        <h1>You made {visible.recipe.name}!</h1>
        <p className="finished-congratulations">A little chopping, a little stirring, and something worth celebrating.</p>
        <p className="finished-count">Dish <strong>#{visible.count}</strong> in your cooking journey. Bon appétit! 🎉</p>
        <div className="finished-ingredients" aria-label="Ingredients used">{visible.recipe.ingredients?.map((item, index) => <span key={`${item.ingredientId}:${index}`}><b aria-hidden="true">{item.emoji}</b>{item.name}{item.substitution && item.resolvedIngredientNames?.length ? ` → ${item.resolvedIngredientNames.join(' + ')}` : ''}</span>)}</div>
        <p className="recipe-source">Recipe & photo from <a href="https://www.themealdb.com" target="_blank" rel="noreferrer">TheMealDB</a></p>
        </div>
      </div>}
      <div className="cooking-actions"><Link className={buttonVariants({ variant: 'outline', size: 'lg' })} to={appRoutes.kitchen}>Back to kitchen</Link><Link className={buttonVariants({ variant: 'outline', size: 'lg' })} to={appRoutes.profile}>My profile</Link></div>
    </div>
  </section>;
}
