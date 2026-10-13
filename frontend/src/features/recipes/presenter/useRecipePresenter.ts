import { useEffect, useState } from 'react';
import { fetchRecipe, getCachedRecipe } from '../model/recipes.api';

export function useRecipePresenter(recipeId: string) {
  const [recipe, setRecipe] = useState(() => getCachedRecipe(recipeId));
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadKey, setLoadKey] = useState(`${recipeId}:${attempt}`);
  if (loadKey !== `${recipeId}:${attempt}`) {
    setLoadKey(`${recipeId}:${attempt}`);
    setRecipe(getCachedRecipe(recipeId));
    setError(null);
    setIsLoading(true);
  }
  useEffect(() => {
    const controller = new AbortController();
    void fetchRecipe(recipeId, controller.signal).then((result) => {
      if (!controller.signal.aborted) setRecipe(result);
    }).catch((caught) => {
      if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : 'Could not load recipe.');
    }).finally(() => { if (!controller.signal.aborted) setIsLoading(false); });
    return () => controller.abort();
  }, [recipeId, attempt]);
  return { recipe: recipe?.id === recipeId ? recipe : null, error, isLoading, retry: () => setAttempt((n) => n + 1) };
}
