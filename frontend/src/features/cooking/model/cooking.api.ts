import { getDemoRecipe } from '../../recipes/model/recipes.api';
import { requestJson } from '../../../shared/api/httpClient';

export interface CookReceipt {
  id: number;
  recipeId: string;
  name: string;
  cookedAt: string;
  completedCount?: number;
}

export const fetchCookingHistory = (signal?: AbortSignal) => requestJson<CookReceipt[]>('/history', { signal });
export const finishCooking = (recipeId: string, key: string) => requestJson<CookReceipt>(`/recipes/${encodeURIComponent(recipeId)}/cook`, {
  method: 'POST', headers: { 'Idempotency-Key': key },
});

const pendingKeys = new Map<string, string>();
export function completionKey(userId: string, recipeId: string) {
  const storageKey = `ctk-cook:${userId}:${recipeId}`;
  let key = pendingKeys.get(storageKey);
  try { key ??= sessionStorage.getItem(storageKey) ?? undefined; } catch { /* memory fallback */ }
  key ??= crypto.randomUUID();
  pendingKeys.set(storageKey, key);
  try { sessionStorage.setItem(storageKey, key); } catch { /* memory fallback */ }
  return key;
}
export function clearCompletionKey(userId: string, recipeId: string) {
  const storageKey = `ctk-cook:${userId}:${recipeId}`;
  pendingKeys.delete(storageKey);
  try { sessionStorage.removeItem(storageKey); } catch { /* memory fallback */ }
}

// Legacy helper for fixture tests; the cooking page uses fetchRecipe / finishCooking.
export function getDemoCookingRecipe(recipeId: string) {
  return getDemoRecipe(recipeId);
}
