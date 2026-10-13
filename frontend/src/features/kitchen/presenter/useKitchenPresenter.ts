import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { appSession } from '../../../shared/api/appSession';
import { pantryIngredients } from '../../../shared/api/dummyData';
import type { Ingredient } from '../../store/model/store.types';
import {
  clearDiscovery, discoverRecipes, getCachedDiscovery, getKitchenIngredients,
  rememberDiscovery, rememberRecipes,
} from '../model/kitchen.api';
import type { Recipe } from '../../recipes/model/recipes.types';
import {
  addIngredientToCounter, addMissingToCounter, clearCounter,
  getKitchenDemoServerSnapshot, getKitchenDemoSnapshot, hydrateKitchenDemo,
  kitchenDemoForUser, moveCounterPlacement, removeCounterPlacement, subscribeKitchenDemo,
  toggleFavorite,
} from '../model/kitchen.demo';
import { aggregateCounter, matchRecipes } from '../model/kitchen.rules';
import type { InventoryItem, RecipeMatchGroups } from '../model/kitchen.types';

const emptyMatches: RecipeMatchGroups = { readyNow: [], almostReady: [], needShopping: [] };
const emptyInventory: InventoryItem[] = [];
const ingredients = getKitchenIngredients();
const catalogMap = new Map(ingredients.map((item) => [item.id, item]));

export function useKitchenPresenter() {
  const session = useSyncExternalStore(appSession.subscribe, appSession.getSnapshot, appSession.getServerSnapshot);
  useSyncExternalStore(subscribeKitchenDemo, getKitchenDemoSnapshot, getKitchenDemoServerSnapshot);
  const userId = session.user?.id;
  const demo = kitchenDemoForUser(userId);
  const inventory = session.shopping?.inventory ?? emptyInventory;
  const [search, setSearch] = useState('');
  const initialDiscovery = userId ? getCachedDiscovery(userId) : null;
  const [matchedUserId, setMatchedUserId] = useState<string | null>(
    initialDiscovery !== null ? userId ?? null : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>(initialDiscovery ?? []);
  const [isMatching, setIsMatching] = useState(false);
  const requestRef = useRef<AbortController | null>(null);
  const [stateUserId, setStateUserId] = useState(userId);
  if (stateUserId !== userId) {
    const cached = userId ? getCachedDiscovery(userId) : null;
    setStateUserId(userId);
    setMatchedUserId(cached !== null ? userId ?? null : null);
    setRecipes(cached ?? []);
    setError(null);
    setIsMatching(false);
  }

  useEffect(() => {
    if (userId) hydrateKitchenDemo(userId);
    return () => requestRef.current?.abort();
  }, [userId]);

  const query = search.trim().toLowerCase();
  const counter = useMemo(() => aggregateCounter(demo.counter), [demo.counter]);
  const ownedIngredients = inventory
    .map((item) => ({
      ingredient: catalogMap.get(item.ingredientId),
      remainingUses: item.remainingUses === 'infinite' ? 'infinite' as const
        : Math.max(0, item.remainingUses - (counter.find((entry) => entry.ingredientId === item.ingredientId)?.selectedUses ?? 0)),
    }))
    .filter((entry): entry is { ingredient: Ingredient; remainingUses: typeof entry.remainingUses } =>
      !!entry.ingredient && (!query || entry.ingredient.name.toLowerCase().includes(query)));
  const defaultPantryIngredients = pantryIngredients;
  const counterItems = demo.counter.map((item) => ({ ...item, ingredient: catalogMap.get(item.ingredientId) }));
  // A discovery belongs to the current counter session. Route-only detours
  // (Details, Store or Discard) preserve it, but an empty counter ends it.
  const hasMatched = !!userId && matchedUserId === userId && counter.length > 0;
  const matches = useMemo(
    () => hasMatched ? matchRecipes(recipes, inventory, counter) : emptyMatches,
    [hasMatched, recipes, inventory, counter],
  );

  function resetDiscoveryContext() {
    if (!userId) return;
    clearDiscovery(userId);
    setMatchedUserId(null);
    setRecipes([]);
    requestRef.current?.abort();
    setIsMatching(false);
  }

  function withDemoAction(action: () => void, fallback: string) {
    setError(null);
    setMessage(null);
    try {
      action();
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : fallback);
      return false;
    }
  }

  function addToCounter(ingredientId: string, position?: { x: number; y: number }) {
    if (!userId || session.status !== 'ready') return;
    withDemoAction(() => addIngredientToCounter(userId, ingredientId, inventory, position), 'Could not add ingredient.');
  }

  function removeFromCounter(placementId: string) {
    if (!userId) return;
    const removed = withDemoAction(() => removeCounterPlacement(userId, placementId), 'Could not remove ingredient.');
    if (removed && kitchenDemoForUser(userId).counter.length === 0)
      resetDiscoveryContext();
  }

  function moveOnCounter(placementId: string, position: { x: number; y: number }) {
    if (!userId) return;
    withDemoAction(() => moveCounterPlacement(userId, placementId, position), 'Could not move ingredient.');
  }

  function clearAll() {
    if (!userId) return;
    clearCounter(userId);
    resetDiscoveryContext();
    setMessage(null);
  }

  async function refreshMatches() {
    if (userId && session.shopping && session.status === 'ready') {
      requestRef.current?.abort();
      const controller = new AbortController();
      requestRef.current = controller;
      setError(null);
      setIsMatching(true);
      try {
        const result = await discoverRecipes(counter, controller.signal);
        if (controller.signal.aborted || appSession.getSnapshot().user?.id !== userId) return false;
        rememberRecipes(result);
        rememberDiscovery(userId, result);
        setRecipes(result);
        setMatchedUserId(userId);
        return true;
      } catch (caught) {
        if (!controller.signal.aborted && appSession.getSnapshot().user?.id === userId)
          setError(caught instanceof Error ? caught.message : 'Recipes could not be loaded. Please try again.');
      } finally {
        if (requestRef.current === controller) setIsMatching(false);
      }
    }
    return false;
  }

  function completeCounter(ingredientIds: string[]) {
    if (!userId) return;
    if (withDemoAction(() => addMissingToCounter(userId, ingredientIds, inventory), 'Could not complete the counter.'))
      setMessage('Available ingredients were added to the counter.');
  }

  function toggleRecipeFavorite(recipeId: string) {
    if (userId) toggleFavorite(userId, recipeId);
  }

  return {
    ingredients, inventory, counter, favorites: demo.favorites,
    search, matches, hasMatched,
    isMatching, isWriting: false,
    canFindDishes: !!userId && !!session.shopping && session.status === 'ready' && demo.counter.length > 0,
    isLoading: session.status === 'idle' || session.status === 'loading',
    error: error ?? session.error, message,
    clearMessage: () => setMessage(null),
    ownedIngredients, defaultPantryIngredients, counterItems,
    setSearch, retry: () => {
      setError(null);
      if (session.status === 'error') void appSession.refresh().catch(() => undefined);
      else void refreshMatches();
    },
    addToCounter, removeFromCounter, moveOnCounter, clearAll, refreshMatches,
    completeCounter, toggleFavorite: toggleRecipeFavorite,
  };
}
