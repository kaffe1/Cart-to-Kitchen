import { useEffect, useState, useSyncExternalStore } from 'react';
import { appSession } from '../../../shared/api/appSession';
import {
  clearCounter, getKitchenDemoServerSnapshot, getKitchenDemoSnapshot, hydrateKitchenDemo,
  kitchenDemoForUser, subscribeKitchenDemo,
} from '../../kitchen/model/kitchen.demo';
import { aggregateCounter, matchRecipes } from '../../kitchen/model/kitchen.rules';
import { getDemoCookingRecipe } from '../model/cooking.api';

export function useCookingPresenter(recipeId: string) {
  const session = useSyncExternalStore(appSession.subscribe, appSession.getSnapshot, appSession.getServerSnapshot);
  useSyncExternalStore(subscribeKitchenDemo, getKitchenDemoSnapshot, getKitchenDemoServerSnapshot);
  const recipe = getDemoCookingRecipe(recipeId);
  const userId = session.user?.id;
  useEffect(() => {
    if (userId) hydrateKitchenDemo(userId);
  }, [userId]);
  const counter = aggregateCounter(kitchenDemoForUser(userId).counter);
  const inventory = session.shopping?.inventory ?? [];
  const [stepIndex, setStepIndex] = useState(0);
  const [completedFor, setCompletedFor] = useState<string | null>(null);
  const completed = completedFor === `${userId}:${recipeId}`;
  const ready = !!recipe && !!userId && session.status === 'ready'
    && matchRecipes([recipe], inventory, counter).readyNow.length > 0;

  function previous() {
    setStepIndex((index) => Math.max(0, index - 1));
  }

  function next() {
    if (!recipe || !ready || completed || !userId) return;
    if (stepIndex < recipe.steps.length - 1) {
      setStepIndex((index) => index + 1);
      return;
    }
    // TODO(BACKEND): Submit cooking completion and consume required stock here.
    // The local walkthrough only clears the simulated counter.
    clearCounter(userId);
    setCompletedFor(`${userId}:${recipeId}`);
  }

  return {
    recipe, ready, completed, stepIndex, previous, next,
    isLoading: session.status === 'idle' || session.status === 'loading',
    error: !recipe ? 'Recipe not found in the demo catalogue.' : session.status === 'error' ? session.error : null,
  };
}
