import { ApiError } from './apiError';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

/**
 * TODO(BACKEND): This client is ready for the Python API. Feature-level
 * `*.api.ts` files currently use demoBackend instead, so the UI remains fully
 * interactive while the backend is being built.
 */
export async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    throw new ApiError('The server could not complete the request.', 'API_ERROR', response.status);
  }

  return response.json() as Promise<T>;
}
