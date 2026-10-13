// Explicitly opt in against a disposable local backend: CTK_TEST_API_URL=http://127.0.0.1:8000/api/v1
import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { createAppSession } from '../src/shared/api/appSession.ts';
import { requestJson } from '../src/shared/api/httpClient.ts';
import { findDemoDishes } from '../src/features/kitchen/model/kitchen.api.ts';
import { addIngredientToCounter, getKitchenDemoSnapshot, hydrateKitchenDemo } from '../src/features/kitchen/model/kitchen.demo.ts';

const apiUrl = process.env.CTK_TEST_API_URL;

test(
  'real backend: auth, cart, checkout, purchased inventory and local Kitchen matching',
  { skip: !apiUrl },
  async (t) => {
    const nativeFetch = globalThis.fetch;
    let cookie = '';
    t.after(() => {
      globalThis.fetch = nativeFetch;
    });
    // Node has no browser cookie jar. Supply one around the production HTTP client.
    globalThis.fetch = async (path, init = {}) => {
      const headers = new Headers(init.headers);
      if (cookie) headers.set('Cookie', cookie);
      const response = await nativeFetch(
        `${apiUrl}${String(path).replace(/^\/api\/v1/, '')}`,
        { ...init, headers },
      );
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) cookie = setCookie.split(';')[0];
      return response;
    };
    const preflight = await nativeFetch(`${apiUrl}/auth/login`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://127.0.0.1:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type',
      },
    });
    assert.equal(preflight.status, 200);
    assert.equal(
      preflight.headers.get('access-control-allow-origin'),
      'http://127.0.0.1:5173',
    );
    assert.equal(
      preflight.headers.get('access-control-allow-credentials'),
      'true',
    );
    const catalogue = await requestJson('/ingredients');
    assert.equal(catalogue.length, 80);
    const session = createAppSession();
    await session.ensureShoppingSession();
    const guestId = session.getSnapshot().user.id;
    const sessionId = session.getSnapshot().shopping.id;
    assert.equal(session.getSnapshot().user.mode, 'guest');
    assert.deepEqual(session.getSnapshot().shopping.inventory, []);
    await assert.rejects(session.checkout(), {
      code: 'EMPTY_CART',
      status: 422,
    });
    await Promise.all([
      session.updateCart('tomato', (n) => n + 1),
      session.updateCart('tomato', (n) => n + 1),
    ]);
    const reloaded = createAppSession();
    await reloaded.ensureShoppingSession();
    assert.equal(reloaded.getSnapshot().user.id, guestId);
    assert.equal(reloaded.getSnapshot().shopping.id, sessionId);
    assert.deepEqual(reloaded.getSnapshot().shopping.cart, [
      { ingredientId: 'tomato', quantity: 2 },
    ]);
    const balance = reloaded.getSnapshot().shopping.wallet.balanceSek;
    const receipt = await reloaded.checkout();
    assert.equal(receipt.spentSek, 36);
    assert.equal(
      reloaded.getSnapshot().shopping.wallet.balanceSek,
      balance - 36,
    );
    assert.equal(
      reloaded
        .getSnapshot()
        .shopping.inventory.find((i) => i.ingredientId === 'tomato')
        .remainingUses,
      6,
    );
    assert.deepEqual(reloaded.getSnapshot().shopping.cart, []);
    assert.notEqual(reloaded.getSnapshot().shopping.id, sessionId);
    await assert.rejects(
      requestJson(`/shopping-sessions/${sessionId}/items/tomato`, {
        method: 'PUT',
        body: JSON.stringify({ quantity: 1 }),
      }),
      { status: 404 },
    );

    // Kitchen combines real purchased stock with a frontend-only counter and
    // recipe matcher. No Kitchen or recipe endpoint is required by the backend.
    await reloaded.updateCart('bread', 1);
    await reloaded.checkout();
    const kitchenInventory = reloaded.getSnapshot().shopping.inventory;
    hydrateKitchenDemo(guestId);
    for (const ingredientId of ['bread', 'tomato', 'olive-oil', 'salt'])
      addIngredientToCounter(guestId, ingredientId, kitchenInventory);
    assert.ok(findDemoDishes(kitchenInventory, getKitchenDemoSnapshot()[guestId].counter)
      .readyNow.some((match) => match.recipe.id === 'tomato-toast'));

    const input = {
      email: `acceptance-${randomUUID()}@example.com`,
      password: 'acceptance-password-26',
      displayName: 'Integration acceptance',
    };
    await reloaded.register(input);
    const accountId = reloaded.getSnapshot().user.id;
    assert.notEqual(accountId, guestId);
    assert.deepEqual(reloaded.getSnapshot().shopping.inventory, []);
    await assert.rejects(
      requestJson('/auth/register', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
      { status: 409, code: 'conflict' },
    );
    await assert.rejects(
      requestJson('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ ...input, password: 'x' }),
      }),
      { status: 422 },
    );
    await reloaded.updateCart('egg', 1);
    const accountTrip = reloaded.getSnapshot().shopping.id;
    await reloaded.logout();
    assert.equal(reloaded.getSnapshot().shopping, null);
    await assert.rejects(requestJson('/auth/me'), { status: 401 });
    await assert.rejects(
      reloaded.login({ email: input.email, password: 'wrong-password' }),
      { status: 401, code: 'invalid_credentials' },
    );
    await reloaded.login(input);
    assert.equal(reloaded.getSnapshot().user.id, accountId);
    assert.equal(reloaded.getSnapshot().shopping.id, accountTrip);
    assert.deepEqual(reloaded.getSnapshot().shopping.cart, [
      { ingredientId: 'egg', quantity: 1 },
    ]);
    await reloaded.logout();
    await reloaded.guest();
    assert.notEqual(reloaded.getSnapshot().user.id, accountId);
    assert.deepEqual(reloaded.getSnapshot().shopping.cart, []);
    await assert.rejects(
      requestJson(`/shopping-sessions/${accountTrip}/items/egg`, {
        method: 'PUT',
        body: JSON.stringify({ quantity: 2 }),
      }),
      { status: 404 },
    );
    // An over-budget cart is valid; checkout is the authoritative budget check.
    for (const ingredient of catalogue.slice(0, 12))
      await reloaded.updateCart(ingredient.id, 9);
    const overBudget = structuredClone(reloaded.getSnapshot().shopping.cart);
    await assert.rejects(reloaded.checkout(), {
      code: 'BUDGET_EXCEEDED',
      status: 422,
    });
    assert.deepEqual(reloaded.getSnapshot().shopping.cart, overBudget);
    await reloaded.logout();
  },
);
