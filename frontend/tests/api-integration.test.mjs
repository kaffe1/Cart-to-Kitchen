import assert from 'node:assert/strict';
import test from 'node:test';
import { createAppSession } from '../src/shared/api/appSession.ts';
import { ApiError } from '../src/shared/api/apiError.ts';
import { requestJson } from '../src/shared/api/httpClient.ts';

const user = (id = '1', mode = 'guest') => ({
  id,
  mode,
  displayName: `Cook ${id}`,
  email: mode === 'guest' ? null : `${id}@example.com`,
  createdAt: '2026-10-04T10:00:00',
});
const shopping = (id = 1) => ({
  id,
  status: 'active',
  createdAt: '2026-10-04T10:00:00',
  wallet: {
    balanceSek: 500,
    capSek: 3000,
    hourlyGrantSek: 100,
    nextGrantAt: null,
  },
  cart: [],
  inventory: [],
});
const deferred = () => {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

function backend(overrides = {}) {
  const data = { user: null, shopping: shopping(), calls: [], ...overrides };
  const request = async (path, init = {}) => {
    data.calls.push({ path, ...init });
    if (data.before) await data.before(path, init);
    if (path === '/auth/me') {
      if (!data.user)
        throw new ApiError('sign in to continue', 'auth_required', 401);
      return { user: structuredClone(data.user) };
    }
    if (['/auth/guest', '/auth/login', '/auth/register'].includes(path)) {
      data.user = user(
        path === '/auth/guest' ? '1' : '2',
        path === '/auth/guest' ? 'guest' : 'account',
      );
      data.shopping = shopping(path === '/auth/guest' ? 1 : 2);
      return { user: structuredClone(data.user), accessToken: 'server-token' };
    }
    if (path === '/auth/logout') {
      data.user = null;
      return undefined;
    }
    if (path === '/shopping-sessions/active')
      return structuredClone(data.shopping);
    if (init.method === 'PUT') {
      const quantity = JSON.parse(init.body).quantity;
      const ingredientId = path.split('/').at(-1);
      data.shopping.cart = data.shopping.cart.filter(
        (line) => line.ingredientId !== ingredientId,
      );
      if (quantity) data.shopping.cart.push({ ingredientId, quantity });
      return structuredClone(data.shopping.cart);
    }
    if (path.endsWith('/checkout')) {
      if (!data.shopping.cart.length)
        throw new ApiError('Your cart is empty.', 'EMPTY_CART', 422);
      data.shopping = {
        ...shopping(data.shopping.id + 1),
        wallet: { ...data.shopping.wallet, balanceSek: 464 },
        inventory: [{ ingredientId: 'tomato', remainingUses: 6 }],
      };
      return { purchasedUnits: 2, spentSek: 36, remainingBalanceSek: 464 };
    }
    throw new Error(`Unexpected request ${path}`);
  };
  return { data, request, session: createAppSession(request) };
}

test('StrictMode initialization and guest creation are deduplicated; no dummy inventory', async () => {
  const { session, data } = backend();
  await Promise.all([
    session.initialize(),
    session.initialize(),
    session.ensureShoppingSession(),
    session.ensureShoppingSession(),
  ]);
  assert.equal(data.calls.filter((c) => c.path === '/auth/me').length, 1);
  assert.equal(data.calls.filter((c) => c.path === '/auth/guest').length, 1);
  assert.deepEqual(session.getSnapshot().shopping.inventory, []);
  await session.ensureShoppingSession();
  assert.equal(data.calls.filter((c) => c.path === '/auth/guest').length, 1);
});

test('existing account restores without creating a guest', async () => {
  const { session, data } = backend({ user: user('account', 'account') });
  await session.ensureShoppingSession();
  assert.equal(session.getSnapshot().user.id, 'account');
  assert.equal(
    data.calls.some((c) => c.path === '/auth/guest'),
    false,
  );
});

test('restore network failure never creates a guest', async () => {
  const { session, data } = backend({
    before: () => {
      throw new ApiError('offline', 'NETWORK_ERROR', 0);
    },
  });
  await assert.rejects(session.ensureShoppingSession(), /offline/);
  assert.equal(session.getSnapshot().status, 'error');
  assert.equal(data.calls.length, 1);
  assert.equal(session.getSnapshot().shopping, null);
});

test('rapid increments serialize against latest full cart, including different ingredients', async () => {
  const { session, data } = backend();
  await session.ensureShoppingSession();
  await Promise.all([
    session.updateCart('tomato', (n) => n + 1),
    session.updateCart('egg', (n) => n + 1),
    session.updateCart('tomato', (n) => n + 1),
  ]);
  assert.deepEqual(session.getSnapshot().shopping.cart, [
    { ingredientId: 'egg', quantity: 1 },
    { ingredientId: 'tomato', quantity: 2 },
  ]);
  assert.equal(session.getSnapshot().pendingCartWrites, 0);
  assert.deepEqual(
    data.calls
      .filter((c) => c.method === 'PUT')
      .map((c) => JSON.parse(c.body).quantity),
    [1, 1, 2],
  );
  await session.updateCart('egg', 0);
  assert.deepEqual(session.getSnapshot().shopping.cart, [
    { ingredientId: 'tomato', quantity: 2 },
  ]);
});

test('quantity cap fails instead of triggering a false add animation', async () => {
  const { session, data } = backend();
  await session.ensureShoppingSession();
  await session.updateCart('tomato', 9);
  await assert.rejects(
    session.updateCart('tomato', (n) => n + 1),
    { code: 'QUANTITY_LIMIT' },
  );
  assert.equal(data.calls.filter((c) => c.method === 'PUT').length, 1);
  assert.equal(session.getSnapshot().status, 'ready');
});

test('checkout refuses pending writes, duplicate checkout and additions during checkout', async () => {
  const { session, data } = backend();
  await session.ensureShoppingSession();
  const gate = deferred();
  data.before = async (_, init) => {
    if (init.method === 'PUT') await gate.promise;
  };
  const writing = session.updateCart('tomato', 2);
  await assert.rejects(session.checkout(), { code: 'CART_PENDING' });
  gate.resolve();
  await writing;
  const checkoutGate = deferred();
  data.before = async (path) => {
    if (path.endsWith('/checkout')) await checkoutGate.promise;
  };
  const result = session.checkout();
  await assert.rejects(session.checkout(), { code: 'CART_PENDING' });
  await assert.rejects(session.updateCart('egg', 1), {
    code: 'CHECKOUT_PENDING',
  });
  checkoutGate.resolve();
  await result;
  assert.equal(
    data.calls.filter((c) => c.path.endsWith('/checkout')).length,
    1,
  );
});

test('checkout rotates ID and replaces wallet, cart and inventory from server', async () => {
  const { session, data } = backend();
  await session.ensureShoppingSession();
  await session.updateCart('tomato', 2);
  const oldId = session.getSnapshot().shopping.id;
  await session.checkout();
  const next = session.getSnapshot().shopping;
  assert.notEqual(next.id, oldId);
  assert.equal(next.wallet.balanceSek, 464);
  assert.deepEqual(next.cart, []);
  assert.deepEqual(next.inventory, [
    { ingredientId: 'tomato', remainingUses: 6 },
  ]);
  await session.updateCart('egg', 1);
  assert.equal(
    data.calls.at(-1).path,
    `/shopping-sessions/${next.id}/items/egg`,
  );
});

test('empty-cart and budget errors preserve current session and cart', async () => {
  const { session, data } = backend();
  await session.ensureShoppingSession();
  await assert.rejects(session.checkout(), { code: 'EMPTY_CART' });
  await session.updateCart('tomato', 2);
  data.before = (path) => {
    if (path.endsWith('/checkout'))
      throw new ApiError('Not enough money.', 'BUDGET_EXCEEDED', 422);
  };
  await assert.rejects(session.checkout(), { code: 'BUDGET_EXCEEDED' });
  assert.equal(session.getSnapshot().status, 'ready');
  assert.equal(session.getSnapshot().shopping.cart[0].quantity, 2);
  assert.equal(session.getSnapshot().isCheckingOut, false);
});

test('committed purchase with refresh failure blocks payment retry and recovers using GET only', async () => {
  const { session, data } = backend();
  await session.ensureShoppingSession();
  await session.updateCart('tomato', 2);
  data.before = (path) => {
    if (path === '/shopping-sessions/active')
      throw new ApiError('offline', 'NETWORK_ERROR', 0);
  };
  assert.equal((await session.checkout()).spentSek, 36);
  assert.match(session.getSnapshot().checkoutNotice, /Purchase complete/);
  assert.match(session.getSnapshot().error, /purchase succeeded/);
  assert.equal(session.getSnapshot().shopping, null);
  await assert.rejects(session.checkout(), { code: 'SESSION_NOT_READY' });
  data.before = undefined;
  await session.refresh();
  assert.equal(session.getSnapshot().status, 'ready');
  assert.equal(session.getSnapshot().shopping.id, 2);
  assert.equal(
    data.calls.filter((c) => c.path.endsWith('/checkout')).length,
    1,
  );
});

test('uncertain checkout response blocks resubmission until refresh', async () => {
  const { session, data } = backend();
  await session.ensureShoppingSession();
  await session.updateCart('tomato', 2);
  data.before = (path) => {
    if (path.endsWith('/checkout'))
      throw new ApiError('offline', 'NETWORK_ERROR', 0);
  };
  await assert.rejects(session.checkout(), { code: 'NETWORK_ERROR' });
  assert.equal(session.getSnapshot().shopping, null);
  assert.equal(session.getSnapshot().checkoutNotice, null);
  await assert.rejects(session.checkout(), { code: 'SESSION_NOT_READY' });
  data.before = undefined;
  await session.refresh();
  assert.equal(session.getSnapshot().shopping.cart[0].quantity, 2);
});

test('identity switch invalidates in-flight and queued old-user writes', async () => {
  const { session, data } = backend();
  await session.ensureShoppingSession();
  const started = deferred();
  const release = deferred();
  data.before = async (_, init) => {
    if (init.method === 'PUT') {
      started.resolve();
      await release.promise;
    }
  };
  const oldWrite = session.updateCart('tomato', 2);
  await started.promise;
  const queued = session.updateCart('egg', 1);
  const oldRejection = assert.rejects(oldWrite, { code: 'SESSION_CHANGED' });
  const queuedRejection = assert.rejects(queued, { code: 'SESSION_CHANGED' });
  const login = session.login({ email: '2@example.com', password: 'secret' });
  assert.equal(session.getSnapshot().shopping, null);
  assert.equal(session.getSnapshot().user, null);
  release.resolve();
  await Promise.all([oldRejection, queuedRejection, login]);
  assert.equal(session.getSnapshot().user.id, '2');
  assert.deepEqual(session.getSnapshot().shopping.cart, []);
  assert.equal(data.calls.filter((c) => c.method === 'PUT').length, 1);
});

test('logout clears user data and accepts empty response', async () => {
  const { session } = backend();
  await session.ensureShoppingSession();
  await session.updateCart('tomato', 2);
  await session.logout();
  assert.equal(session.getSnapshot().user, null);
  assert.equal(session.getSnapshot().shopping, null);
  assert.equal(session.getSnapshot().status, 'ready');
});

test('expired/retired session blocks writes pending recovery', async () => {
  for (const status of [401, 404]) {
    const { session, data } = backend();
    await session.ensureShoppingSession();
    data.before = (_, init) => {
      if (init.method === 'PUT')
        throw new ApiError('session unavailable', 'not_found', status);
    };
    await assert.rejects(session.updateCart('tomato', 1));
    assert.equal(session.getSnapshot().shopping, null);
    assert.equal(session.getSnapshot().status, 'error');
    if (status === 401) assert.equal(session.getSnapshot().user, null);
  }
});

test('HTTP cookies, 204, business/validation errors, HTML errors and offline handling', async (t) => {
  const original = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = original;
  });
  globalThis.fetch = async (url, init) => {
    assert.equal(url, '/api/v1/auth/logout');
    assert.equal(init.credentials, 'include');
    return new Response(null, { status: 204 });
  };
  assert.equal(
    await requestJson('/auth/logout', { method: 'POST' }),
    undefined,
  );
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        error: {
          code: 'rule_validation',
          message: 'Insufficient funds',
          details: { code: 'BUDGET_EXCEEDED' },
        },
      }),
      { status: 422 },
    );
  await assert.rejects(requestJson('/checkout'), {
    message: 'Insufficient funds',
    code: 'BUDGET_EXCEEDED',
    status: 422,
  });
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        detail: [{ loc: ['body', 'password'], msg: 'Too short' }],
      }),
      { status: 422 },
    );
  await assert.rejects(requestJson('/auth/register'), /password: Too short/);
  globalThis.fetch = async () =>
    new Response('<html>Bad Gateway</html>', { status: 502 });
  await assert.rejects(requestJson('/auth/me'), { status: 502 });
  globalThis.fetch = async () => {
    throw new TypeError('fetch failed');
  };
  await assert.rejects(requestJson('/auth/me'), {
    code: 'NETWORK_ERROR',
    status: 0,
  });
});

test('refresh waits for pending cart writes and deduplicates repeated reads', async () => {
  const { session, data } = backend();
  await session.ensureShoppingSession();
  const gate = deferred();
  data.before = async (_, init) => {
    if (init.method === 'PUT') await gate.promise;
  };
  const writing = session.updateCart('tomato', 2);
  const refreshing = session.refresh();
  assert.equal(session.refresh(), refreshing);
  gate.resolve();
  await Promise.all([writing, refreshing]);
  assert.equal(session.getSnapshot().shopping.cart[0].quantity, 2);
  assert.equal(
    data.calls.filter((c) => c.path === '/shopping-sessions/active').length,
    2,
  );
});

test('successful registration with snapshot failure retains identity and refresh does not register again', async () => {
  const { session, data } = backend();
  data.before = (path) => {
    if (path === '/shopping-sessions/active')
      throw new ApiError('offline', 'NETWORK_ERROR', 0);
  };
  await assert.rejects(
    session.register({
      email: '2@example.com',
      password: 'secret',
      displayName: 'Cook',
    }),
  );
  assert.equal(session.getSnapshot().user.id, '2');
  assert.equal(session.getSnapshot().shopping, null);
  data.before = undefined;
  await session.refresh();
  assert.equal(session.getSnapshot().status, 'ready');
  assert.equal(data.calls.filter((c) => c.path === '/auth/register').length, 1);
});

test('late shopping read cannot overwrite a new account', async () => {
  const { session, data } = backend();
  await session.ensureShoppingSession();
  const entered = deferred();
  const release = deferred();
  let firstRead = true;
  data.before = async (path) => {
    if (path === '/shopping-sessions/active' && firstRead) {
      firstRead = false;
      entered.resolve();
      await release.promise;
    }
  };
  const read = session.refresh();
  await entered.promise;
  const rejected = assert.rejects(read, { code: 'SESSION_CHANGED' });
  const login = session.login({ email: '2@example.com', password: 'secret' });
  release.resolve();
  await Promise.all([rejected, login]);
  assert.equal(session.getSnapshot().user.id, '2');
  assert.equal(session.getSnapshot().shopping.id, 2);
});
