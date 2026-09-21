import type { CartLine, Ingredient } from './store.types';

export function getCartTotal(cart: CartLine[], ingredients: Ingredient[]): number {
  return cart.reduce((total, line) => {
    const item = ingredients.find((ingredient) => ingredient.id === line.ingredientId);
    return total + (item?.priceSek ?? 0) * line.quantity;
  }, 0);
}

export function getCartUnits(cart: CartLine[]): number {
  return cart.reduce((total, line) => total + line.quantity, 0);
}

export function canAfford(
  currentCart: CartLine[],
  ingredients: Ingredient[],
  balanceSek: number,
  ingredientId: string,
): boolean {
  const item = ingredients.find((ingredient) => ingredient.id === ingredientId);
  return Boolean(item && getCartTotal(currentCart, ingredients) + item.priceSek <= balanceSek);
}
