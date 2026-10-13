import { ApiError } from './apiError';

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL ?? '/api/v1').replace(
  /\/$/,
  '',
);
export async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);
  const isForm = init?.body instanceof FormData;
  if (init?.body && !isForm && !headers.has('Content-Type'))
    headers.set('Content-Type', 'application/json');
  let response: Response;
  let body: string;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers,
    });
    body = await response.text();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new ApiError(
      'Unable to reach the server. Check your connection and try again.',
      'NETWORK_ERROR',
      0,
    );
  }

  let payload;
  try {
    payload = body ? JSON.parse(body) : undefined;
  } catch {
    /* A proxy may return HTML. */
  }

  if (!response.ok) {
    const validation = Array.isArray(payload?.detail)
      ? payload.detail
          .map(
            (item: { loc?: string[]; msg?: string }) =>
              `${item.loc?.slice(1).join('.') || 'Input'}: ${item.msg || 'Invalid value'}`,
          )
          .join('; ')
      : undefined;
    throw new ApiError(
      payload?.error?.message ||
        validation ||
        'The server could not complete the request.',
      payload?.error?.details?.code || payload?.error?.code || 'API_ERROR',
      response.status,
    );
  }

  if (body && payload === undefined)
    throw new ApiError(
      'The server returned an invalid response.',
      'INVALID_RESPONSE',
      response.status,
    );
  return payload as T;
}
