import { appSession } from '../../../shared/api/appSession';
import { requestJson } from '../../../shared/api/httpClient';
import type { Ingredient } from './store.types';

export function fetchIngredients(signal?: AbortSignal): Promise<Ingredient[]> {
  return requestJson<Ingredient[]>('/ingredients', { signal });
}

export const getStoreSnapshot = appSession.getSnapshot;
export const subscribeStore = appSession.subscribe;
export const setCartQuantity = appSession.updateCart;
export const checkout = appSession.checkout;
export const refreshStore = appSession.refresh;
