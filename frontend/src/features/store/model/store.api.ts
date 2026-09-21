import { ApiError } from '../../../shared/api/apiError';
import { demoDelay, getDemoState, subscribeDemoState, updateDemoState } from '../../../shared/api/demoBackend';
import { storeIngredients } from '../../../shared/api/dummyData';
import { getCartTotal } from './store.rules';
import type { CartLine, CheckoutResult, Ingredient } from './store.types';

// TODO(BACKEND): Replace with GET /api/v1/ingredients.
export async function fetchIngredients(): Promise<Ingredient[]> {
  await demoDelay(180);
  return storeIngredients;
}

// TODO(BACKEND): Replace with GET /api/v1/shopping-sessions/active.
export function getStoreSnapshot() {
  return getDemoState();
}

export const subscribeStore = subscribeDemoState;

// TODO(BACKEND): Replace with PUT /shopping-sessions/{id}/items/{ingredientId}.
export async function setCartQuantity(ingredientId: string, quantity: number): Promise<CartLine[]> {
  await demoDelay(90);
  const safeQuantity = Math.max(0, Math.min(quantity, 9));
  const next = updateDemoState((current) => {
    const otherLines = current.cart.filter((line) => line.ingredientId !== ingredientId);
    const cart = safeQuantity > 0 ? [...otherLines, { ingredientId, quantity: safeQuantity }] : otherLines;
    return { ...current, cart };
  });
  return next.cart;
}

// TODO(BACKEND): Replace with POST /shopping-sessions/{id}/checkout using an idempotency key.
export async function checkout(): Promise<CheckoutResult> {
  await demoDelay(420);
  const current = getDemoState();
  const total = getCartTotal(current.cart, storeIngredients);
  if (current.cart.length === 0) throw new ApiError('Your cart is empty.', 'EMPTY_CART', 422);
  if (total > current.wallet.balanceSek) {
    throw new ApiError('There is not enough money in your wallet.', 'BUDGET_EXCEEDED', 422);
  }

  const purchasedUnits = current.cart.reduce((sum, line) => sum + line.quantity, 0);
  const next = updateDemoState((snapshot) => {
    const inventory = [...snapshot.inventory];
    for (const line of snapshot.cart) {
      const ingredient = storeIngredients.find((item) => item.id === line.ingredientId);
      if (!ingredient || ingredient.usesPerUnit === 'infinite') continue;
      const existing = inventory.find((item) => item.ingredientId === line.ingredientId);
      const extraUses = ingredient.usesPerUnit * line.quantity;
      if (existing && existing.remainingUses !== 'infinite') existing.remainingUses += extraUses;
      else inventory.push({ ingredientId: line.ingredientId, remainingUses: extraUses });
    }
    return {
      ...snapshot,
      cart: [],
      inventory,
      shoppingList: snapshot.shoppingList.filter(
        (entry) => !snapshot.cart.some((line) => line.ingredientId === entry.ingredientId),
      ),
      wallet: { ...snapshot.wallet, balanceSek: snapshot.wallet.balanceSek - total },
    };
  });

  return { purchasedUnits, spentSek: total, remainingBalanceSek: next.wallet.balanceSek };
}
