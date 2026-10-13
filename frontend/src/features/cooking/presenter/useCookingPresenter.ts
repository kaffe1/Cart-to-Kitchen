import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import { appSession } from '../../../shared/api/appSession';
import {
  clearCounter, getKitchenDemoServerSnapshot, getKitchenDemoSnapshot, hydrateKitchenDemo,
  kitchenDemoForUser, subscribeKitchenDemo,
} from '../../kitchen/model/kitchen.demo';
import { clearDiscovery } from '../../kitchen/model/kitchen.api';
import { aggregateCounter, matchRecipes } from '../../kitchen/model/kitchen.rules';
import { clearCompletionKey, completionKey, finishCooking } from '../model/cooking.api';
import { useRecipePresenter } from '../../recipes/presenter/useRecipePresenter';
import { appRoutes } from '../../../app/routes';
import { ApiError } from '../../../shared/api/apiError';

export function useCookingPresenter(recipeId: string) {
  const session = useSyncExternalStore(appSession.subscribe, appSession.getSnapshot, appSession.getServerSnapshot);
  useSyncExternalStore(subscribeKitchenDemo, getKitchenDemoSnapshot, getKitchenDemoServerSnapshot);
  const detail = useRecipePresenter(recipeId);
  const recipe = detail.recipe;
  const navigate = useNavigate();
  const busy = useRef(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [canRetryCompletion, setCanRetryCompletion] = useState(false);
  const userId = session.user?.id;
  const [stateUserId, setStateUserId] = useState(userId);
  if (stateUserId !== userId) {
    setStateUserId(userId);
    setFinishError(null);
    setCanRetryCompletion(false);
  }
  useEffect(() => {
    if (userId) hydrateKitchenDemo(userId);
  }, [userId]);
  const counter = aggregateCounter(kitchenDemoForUser(userId).counter);
  const inventory = session.shopping?.inventory ?? [];
  const ready = !!recipe && !!userId && session.status === 'ready'
    && matchRecipes([recipe], inventory, counter).readyNow.length > 0;

  async function finish() {
    if (!recipe || !userId || (!ready && !canRetryCompletion) || busy.current) return;
    busy.current = true;
    setIsFinishing(true);
    setFinishError(null);
    try {
      const receipt = await finishCooking(recipe.id, completionKey(userId, recipe.id));
      if (appSession.getSnapshot().user?.id !== userId) return;
      clearCounter(userId);
      clearDiscovery(userId);
      clearCompletionKey(userId, recipe.id);
      await appSession.refresh().catch(() => undefined);
      if (appSession.getSnapshot().user?.id !== userId) return;
      void navigate(appRoutes.cookingFinished(String(receipt.id)), { replace: true });
    } catch (caught) {
      if (appSession.getSnapshot().user?.id === userId) {
        setCanRetryCompletion(caught instanceof ApiError && (caught.status === 0 || caught.status >= 500));
        setFinishError(caught instanceof Error ? caught.message : 'Could not save your meal. Please retry.');
      }
    } finally {
      busy.current = false;
      setIsFinishing(false);
    }
  }

  return {
    recipe, ready, finish, isFinishing, canRetryCompletion,
    isLoading: detail.isLoading || session.status === 'idle' || session.status === 'loading',
    error: finishError ?? detail.error ?? session.error,
    retry: detail.retry,
  };
}
