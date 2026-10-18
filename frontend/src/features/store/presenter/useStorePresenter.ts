import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { appSession } from '../../../shared/api/appSession';
import type {
  Ingredient,
  IngredientCategory,
} from '../model/store.types';
import {
  checkout,
  fetchIngredients,
  getStoreSnapshot,
  setCartQuantity,
  subscribeStore,
} from '../model/store.api';
import { getCartTotal } from '../model/store.rules';

export function useStorePresenter() {
  const snapshot = useSyncExternalStore(
    subscribeStore,
    getStoreSnapshot,
    appSession.getServerSnapshot,
  );
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogAttempt, setCatalogAttempt] = useState(0);
  const [category, setCategory] = useState<IngredientCategory | 'All'>('All');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'3d' | 'grid'>('3d');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetchIngredients(controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) setIngredients(items);
      })
      .catch((caught) => {
        if (!controller.signal.aborted)
          setCatalogError(
            caught instanceof Error
              ? caught.message
              : 'Could not load the catalogue.',
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setCatalogLoading(false);
      });
    return () => controller.abort();
  }, [catalogAttempt]);

  const [feedbackUserId, setFeedbackUserId] = useState(snapshot.user?.id);
  if (feedbackUserId !== snapshot.user?.id) {
    setFeedbackUserId(snapshot.user?.id);
    setError(null);
    setMessage(null);
  }

  const filteredIngredients = useMemo(() => {
    const query = search.trim().toLowerCase();
    return ingredients.filter(
      (item) =>
        (category === 'All' || item.category === category) &&
        (!query || item.name.toLowerCase().includes(query)),
    );
  }, [category, ingredients, search]);

  async function addToCart(ingredientId: string) {
    setError(null);
    setMessage(null);
    const userId = getStoreSnapshot().user?.id;
    try {
      // Resolve the increment when the queued write runs, never from a stale render.
      await setCartQuantity(ingredientId, (current) => current + 1);
      if (getStoreSnapshot().user?.id !== userId) return false;
      setMessage(
        `${ingredients.find((item) => item.id === ingredientId)?.name ?? 'Item'} added to your cart.`,
      );
      return true;
    } catch (caught) {
      if (getStoreSnapshot().user?.id === userId)
        setError(
          caught instanceof Error ? caught.message : 'Could not add the item.',
        );
      return false;
    }
  }

  async function changeQuantity(ingredientId: string, delta: number) {
    setError(null);
    const userId = getStoreSnapshot().user?.id;
    try {
      await setCartQuantity(ingredientId, (current) => current + delta);
    } catch (caught) {
      if (getStoreSnapshot().user?.id === userId)
        setError(
          caught instanceof Error
            ? caught.message
            : 'Could not update the cart.',
        );
    }
  }

  async function completeCheckout() {
    setError(null);
    setMessage(null);
    const userId = getStoreSnapshot().user?.id;
    try {
      await checkout();
    } catch (caught) {
      if (getStoreSnapshot().user?.id === userId)
        setError(caught instanceof Error ? caught.message : 'Checkout failed.');
    }
  }

  return {
    ingredients,
    filteredIngredients,
    cart: snapshot.shopping?.cart ?? [],
    wallet: snapshot.shopping?.wallet ?? null,
    category,
    search,
    viewMode,
    isLoading:
      catalogLoading ||
      snapshot.status === 'idle' ||
      snapshot.status === 'loading',
    isReady:
      snapshot.status === 'ready' &&
      !!snapshot.shopping &&
      !catalogLoading &&
      !catalogError,
    isCheckingOut: snapshot.isCheckingOut,
    isUpdatingCart: snapshot.pendingCartWrites > 0,
    catalogError,
    retryCatalogue: () => {
      setCatalogLoading(true);
      setCatalogError(null);
      setCatalogAttempt((attempt) => attempt + 1);
    },
    cartTotal: getCartTotal(snapshot.shopping?.cart ?? [], ingredients),
    message,
    messageKind: message ? 'cart-add' : null,
    error,
    clearFeedback: () => {
      setMessage(null);
      setError(null);
    },
    setCategory,
    setSearch,
    setViewMode,
    addToCart,
    changeQuantity,
    completeCheckout,
  };
}
