import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { appSession } from '../../../shared/api/appSession';
import { pantryIngredients } from '../../../shared/api/dummyData';
import type { Ingredient } from '../../store/model/store.types';
import { findDemoDishes, getKitchenIngredients } from '../model/kitchen.api';
import {
  addIngredientToCounter, addMissingToCounter, clearCounter,
  getKitchenDemoServerSnapshot, getKitchenDemoSnapshot, hydrateKitchenDemo,
  kitchenDemoForUser, moveCounterPlacement, removeCounterPlacement, subscribeKitchenDemo,
  toggleFavorite,
} from '../model/kitchen.demo';
import { aggregateCounter } from '../model/kitchen.rules';
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
  const [matchedUserId, setMatchedUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (userId) hydrateKitchenDemo(userId);
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
  const hasMatched = !!userId && matchedUserId === userId;
  const matches = useMemo(
    () => hasMatched ? findDemoDishes(inventory, counter) : emptyMatches,
    [hasMatched, inventory, counter],
  );

  function withDemoAction(action: () => void, fallback: string) {
    setError(null);
    setMessage(null);
    try { action(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : fallback); }
  }

  function addToCounter(ingredientId: string, position?: { x: number; y: number }) {
    if (!userId || session.status !== 'ready') return;
    withDemoAction(() => addIngredientToCounter(userId, ingredientId, inventory, position), 'Could not add ingredient.');
  }

  function removeFromCounter(placementId: string) {
    if (!userId) return;
    withDemoAction(() => removeCounterPlacement(userId, placementId), 'Could not remove ingredient.');
  }

  function moveOnCounter(placementId: string, position: { x: number; y: number }) {
    if (!userId) return;
    withDemoAction(() => moveCounterPlacement(userId, placementId, position), 'Could not move ingredient.');
  }

  function clearAll() {
    if (!userId) return;
    clearCounter(userId);
    setMatchedUserId(null);
    setMessage(null);
  }

  function refreshMatches() {
    if (userId && session.shopping && session.status === 'ready') {
      setError(null);
      setMatchedUserId(userId);
      return true;
    }
    return false;
  }

  function completeCounter(ingredientIds: string[]) {
    if (!userId) return;
    withDemoAction(() => addMissingToCounter(userId, ingredientIds, inventory), 'Could not complete the counter.');
    setMessage('Available ingredients were added to the counter.');
  }

  function toggleRecipeFavorite(recipeId: string) {
    if (userId) toggleFavorite(userId, recipeId);
  }

  return {
    ingredients, inventory, counter, favorites: demo.favorites,
    search, matches, hasMatched,
    isMatching: false, isWriting: false,
    canFindDishes: !!userId && !!session.shopping && session.status === 'ready' && demo.counter.length > 0,
    isLoading: session.status === 'idle' || session.status === 'loading',
    error: error ?? session.error, message,
    ownedIngredients, defaultPantryIngredients, counterItems,
    setSearch, retry: () => {
      setError(null);
      if (session.status === 'error') void appSession.refresh().catch(() => undefined);
    },
    addToCounter, removeFromCounter, moveOnCounter, clearAll, refreshMatches,
    completeCounter, toggleFavorite: toggleRecipeFavorite,
  };
}
