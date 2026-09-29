import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { getDemoServerState } from "../../../shared/api/demoBackend";
import type { IngredientCategory } from "../model/store.types";
import {
  checkout,
  fetchIngredients,
  getStoreSnapshot,
  setCartQuantity,
  subscribeStore,
} from "../model/store.api";
import { canAfford, getCartTotal } from "../model/store.rules";
import type { Ingredient } from "../model/store.types";

export function useStorePresenter() {
  const snapshot = useSyncExternalStore(
    subscribeStore,
    getStoreSnapshot,
    getDemoServerState,
  );
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [selectedIngredientId, setSelectedIngredientId] = useState<
    string | null
  >("tomato");
  const [category, setCategory] = useState<IngredientCategory | "All">("All");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"3d" | "grid">("3d");
  const [message, setMessage] = useState<string | null>(null);
  const [messageKind, setMessageKind] = useState<"cart-add" | "checkout" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetchIngredients().then((items) => {
      if (!active) return;
      setIngredients(items);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const filteredIngredients = useMemo(() => {
    const query = search.trim().toLowerCase();
    return ingredients.filter((item) => {
      const matchesCategory = category === "All" || item.category === category;
      const matchesSearch = !query || item.name.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [category, ingredients, search]);

  const selectedIngredient =
    ingredients.find((item) => item.id === selectedIngredientId) ?? null;
  const cartTotal = getCartTotal(snapshot.cart, ingredients);

  async function addToCart(ingredientId: string) {
    setError(null);
    setMessage(null);
    setMessageKind(null);
    if (
      !canAfford(
        snapshot.cart,
        ingredients,
        snapshot.wallet.balanceSek,
        ingredientId,
      )
    ) {
      setError("That item would take you over your available balance.");
      return false;
    }
    const current =
      snapshot.cart.find((line) => line.ingredientId === ingredientId)
        ?.quantity ?? 0;
    await setCartQuantity(ingredientId, current + 1);
    const item = ingredients.find((candidate) => candidate.id === ingredientId);
    setMessage(`${item?.name ?? "Item"} added to your cart.`);
    setMessageKind("cart-add");
    return true;
  }

  async function changeQuantity(ingredientId: string, quantity: number) {
    setError(null);
    if (quantity > 0) {
      const current =
        snapshot.cart.find((line) => line.ingredientId === ingredientId)
          ?.quantity ?? 0;
      const extraUnits = Math.max(quantity - current, 0);
      const item = ingredients.find(
        (candidate) => candidate.id === ingredientId,
      );
      if (
        item &&
        cartTotal + item.priceSek * extraUnits > snapshot.wallet.balanceSek
      ) {
        setError("Reduce another item before adding more.");
        return;
      }
    }
    await setCartQuantity(ingredientId, quantity);
  }

  async function completeCheckout() {
    setIsCheckingOut(true);
    setError(null);
    setMessage(null);
    setMessageKind(null);
    try {
      const result = await checkout();
      setMessage(
        `Purchase complete: ${result.purchasedUnits} item(s) moved to your kitchen.`,
      );
      setMessageKind("checkout");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Checkout failed.");
    } finally {
      setIsCheckingOut(false);
    }
  }

  return {
    ...snapshot,
    ingredients,
    filteredIngredients,
    selectedIngredient,
    selectedIngredientId,
    category,
    search,
    viewMode,
    isLoading,
    isCheckingOut,
    cartTotal,
    message,
    messageKind,
    error,
    setSelectedIngredientId,
    setCategory,
    setSearch,
    setViewMode,
    addToCart,
    changeQuantity,
    completeCheckout,
  };
}
