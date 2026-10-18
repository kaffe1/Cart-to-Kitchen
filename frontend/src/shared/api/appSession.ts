import type {
  AppUser,
  AuthResult,
  LoginInput,
  RegisterInput,
} from '../../features/auth/model/auth.types';
import type {
  CartLine,
  CheckoutResult,
  ShoppingSessionSnapshot,
} from '../../features/store/model/store.types';
import { ApiError } from './apiError';
import { requestJson } from './httpClient';

export interface AppSessionState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  user: AppUser | null;
  shopping: ShoppingSessionSnapshot | null;
  error: string | null;
  pendingCartWrites: number;
  isCheckingOut: boolean;
  isAuthenticating: boolean;
  checkoutNotice: string | null;
}

type UserProfilePatch = Partial<Pick<AppUser, 'displayName' | 'email'>>;

const initialState: AppSessionState = {
  status: 'idle',
  user: null,
  shopping: null,
  error: null,
  pendingCartWrites: 0,
  isCheckingOut: false,
  isAuthenticating: false,
  checkoutNotice: null,
};

const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : 'The request failed.';
const staleError = () =>
  new ApiError('The session changed. Please try again.', 'SESSION_CHANGED', 0);

// All session operations share a queue. Identity changes invalidate old work immediately,
// then wait for in-flight writes before replacing the browser's session cookie.
export function createAppSession(request: typeof requestJson = requestJson) {
  let state = initialState;
  let generation = 0;
  let tail: Promise<unknown> = Promise.resolve();
  let identityFlight: Promise<void> | null = null;
  let refreshFlight: Promise<void> | null = null;
  let ensureFlight: Promise<void> | null = null;
  const listeners = new Set<() => void>();

  function publish(patch: Partial<AppSessionState>) {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  }

  function enqueue<T>(work: () => Promise<T>): Promise<T> {
    const result = tail.then(work);
    tail = result.catch(() => undefined);
    return result;
  }

  function assertCurrent(version: number) {
    if (generation !== version) throw staleError();
  }

  async function loadShopping(version: number) {
    const shopping = await request<ShoppingSessionSnapshot>(
      '/shopping-sessions/active',
    );
    assertCurrent(version);
    publish({ shopping, status: 'ready', error: null });
  }

  function identity(loadUser: () => Promise<AppUser | null>): Promise<void> {
    if (identityFlight)
      return Promise.reject(
        new ApiError('Please wait for sign-in to finish.', 'AUTH_PENDING', 0),
      );
    const version = ++generation;
    refreshFlight = null;
    publish({ ...initialState, status: 'loading', isAuthenticating: true });
    const operation = enqueue(async () => {
      try {
        const user = await loadUser();
        assertCurrent(version);
        publish({ user });
        if (user) await loadShopping(version);
        else publish({ status: 'ready' });
      } catch (error) {
        if (version === generation)
          publish({ status: 'error', error: messageOf(error) });
        throw error;
      } finally {
        if (version === generation) publish({ isAuthenticating: false });
      }
    });
    identityFlight = operation;
    void operation
      .finally(() => {
        if (identityFlight === operation) identityFlight = null;
      })
      .catch(() => undefined);
    return operation;
  }

  function initialize(): Promise<void> {
    if (identityFlight) return identityFlight;
    if (state.status === 'ready') return Promise.resolve();
    return identity(async () => {
      try {
        return (await request<{ user: AppUser }>('/auth/me')).user;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    });
  }

  function authenticate(
    path: string,
    input?: LoginInput | RegisterInput,
  ): Promise<void> {
    return identity(
      async () =>
        (
          await request<AuthResult>(path, {
            method: 'POST',
            ...(input ? { body: JSON.stringify(input) } : {}),
          })
        ).user,
    );
  }

  function ensureShoppingSession(): Promise<void> {
    if (ensureFlight) return ensureFlight;
    const operation = (async () => {
      await initialize();
      // Only a confirmed anonymous session gets a new guest. Network errors never do.
      if (!state.user) await authenticate('/auth/guest');
    })();
    ensureFlight = operation;
    void operation
      .finally(() => {
        if (ensureFlight === operation) ensureFlight = null;
      })
      .catch(() => undefined);
    return operation;
  }

  function refresh(): Promise<void> {
    if (identityFlight) return identityFlight;
    if (!state.user) return ensureShoppingSession();
    if (refreshFlight) return refreshFlight;
    const version = generation;
    const operation = enqueue(async () => {
      assertCurrent(version);
      publish({ status: 'loading', error: null });
      try {
        await loadShopping(version);
      } catch (error) {
        if (version === generation) {
          publish({
            status: 'error',
            shopping: null,
            error: messageOf(error),
            ...(error instanceof ApiError && error.status === 401
              ? { user: null }
              : {}),
          });
        }
        throw error;
      }
    });
    refreshFlight = operation;
    void operation
      .finally(() => {
        if (refreshFlight === operation) refreshFlight = null;
      })
      .catch(() => undefined);
    return operation;
  }

  function requireShopping() {
    if (state.status !== 'ready' || !state.shopping || state.isAuthenticating) {
      throw new ApiError(
        'Refresh your shopping session before continuing.',
        'SESSION_NOT_READY',
        0,
      );
    }
    return state.shopping;
  }

  function invalidateAfterWrite(error: unknown) {
    if (
      error instanceof ApiError &&
      error.status >= 400 &&
      error.status < 500 &&
      ![401, 404].includes(error.status)
    )
      return;
    publish({
      status: 'error',
      shopping: null,
      error:
        'The update could not be confirmed. Refresh your shopping session before continuing.',
      ...(error instanceof ApiError && error.status === 401
        ? { user: null }
        : {}),
    });
  }

  function updateCart(
    ingredientId: string,
    quantity: number | ((current: number) => number),
  ): Promise<CartLine[]> {
    try {
      requireShopping();
      if (state.isCheckingOut)
        throw new ApiError('Checkout is in progress.', 'CHECKOUT_PENDING', 0);
    } catch (error) {
      return Promise.reject(error);
    }
    const version = generation;
    publish({
      pendingCartWrites: state.pendingCartWrites + 1,
      checkoutNotice: null,
    });
    return enqueue(async () => {
      try {
        assertCurrent(version);
        const shopping = requireShopping();
        const current =
          shopping.cart.find((line) => line.ingredientId === ingredientId)
            ?.quantity ?? 0;
        const target =
          typeof quantity === 'function' ? quantity(current) : quantity;
        if (target > 9)
          throw new ApiError(
            'You can add up to 9 of each ingredient.',
            'QUANTITY_LIMIT',
            422,
          );
        const safeQuantity = Math.max(0, target);
        if (safeQuantity === current) return shopping.cart;
        const cart = await request<CartLine[]>(
          `/shopping-sessions/${shopping.id}/items/${encodeURIComponent(ingredientId)}`,
          {
            method: 'PUT',
            body: JSON.stringify({ quantity: safeQuantity }),
          },
        );
        assertCurrent(version);
        publish({ shopping: { ...shopping, cart } });
        return cart;
      } catch (error) {
        if (version === generation) invalidateAfterWrite(error);
        throw error;
      } finally {
        if (version === generation)
          publish({ pendingCartWrites: state.pendingCartWrites - 1 });
      }
    });
  }

  function checkout(): Promise<CheckoutResult> {
    try {
      requireShopping();
      if (state.isCheckingOut || state.pendingCartWrites > 0)
        throw new ApiError(
          'Wait for your cart to finish updating.',
          'CART_PENDING',
          0,
        );
    } catch (error) {
      return Promise.reject(error);
    }
    const version = generation;
    publish({ isCheckingOut: true, checkoutNotice: null });
    return enqueue(async () => {
      let result: CheckoutResult;
      try {
        assertCurrent(version);
        const shopping = requireShopping();
        result = await request<CheckoutResult>(
          `/shopping-sessions/${shopping.id}/checkout`,
          { method: 'POST' },
        );
        assertCurrent(version);
      } catch (error) {
        if (version === generation) {
          invalidateAfterWrite(error);
          publish({ isCheckingOut: false });
        }
        throw error;
      }
      // The purchase is already committed. Never allow a retry against the retired ID.
      publish({
        shopping: null,
        status: 'loading',
        checkoutNotice: `Purchase complete: ${result.purchasedUnits} item(s) added to your inventory.`,
      });
      try {
        await loadShopping(version);
      } catch (error) {
        if (version === generation)
          publish({
            status: 'error',
            error:
              'Your purchase succeeded, but the updated session could not be loaded. Refresh to continue.',
            ...(error instanceof ApiError && error.status === 401
              ? { user: null }
              : {}),
          });
      } finally {
        if (version === generation) publish({ isCheckingOut: false });
      }
      assertCurrent(version);
      return result;
    });
  }

  function clearCheckoutNotice() {
    if (state.checkoutNotice) publish({ checkoutNotice: null });
  }

  function patchUser(userId: string, patch: UserProfilePatch) {
    if (state.user?.id !== userId) return;
    publish({ user: { ...state.user, ...patch } });
  }

  return {
    getSnapshot: () => state,
    getServerSnapshot: () => initialState,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    initialize,
    ensureShoppingSession,
    refresh,
    updateCart,
    checkout,
    clearCheckoutNotice,
    patchUser,
    login: (input: LoginInput) => authenticate('/auth/login', input),
    register: (input: RegisterInput) => authenticate('/auth/register', input),
    guest: () => authenticate('/auth/guest'),
    logout: () =>
      identity(async () => {
        await request<void>('/auth/logout', { method: 'POST' });
        return null;
      }),
  };
}

export const appSession = createAppSession();
