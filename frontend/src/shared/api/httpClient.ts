import { ApiError } from './apiError';

interface ErrorPayload {
  detail?: { loc?: string[]; msg?: string }[];
  error?: {
    code?: string;
    message?: string;
    details?: { code?: string };
  };
}

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL ?? '/api/v1').replace(
  /\/$/,
  '',
);
export async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const isForm = init?.body instanceof FormData;
  const suppliedHeaders = new Headers(init?.headers);
  const headers = new Headers([
    ...suppliedHeaders.entries(),
    ...(init?.body && !isForm && !suppliedHeaders.has('Content-Type')
      ? ([['Content-Type', 'application/json']] as [string, string][])
      : []),
  ]);
  const { response, body } = await fetchResponse(path, init, headers);
  const payload = parsePayload(body);

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

async function fetchResponse(
  path: string,
  init: RequestInit | undefined,
  headers: Headers,
) {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers,
    });
    return { response, body: await response.text() };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new ApiError(
      'Unable to reach the server. Check your connection and try again.',
      'NETWORK_ERROR',
      0,
    );
  }
}

function parsePayload(body: string): ErrorPayload | undefined {
  if (!body) return undefined;
  try {
    return JSON.parse(body) as ErrorPayload;
  } catch {
    // A proxy may return HTML instead of the API's JSON response.
    return undefined;
  }
}
