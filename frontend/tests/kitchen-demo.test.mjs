import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { allIngredients, dummyRecipes, pantryIngredients } from '../src/shared/api/dummyData.ts';
import { findDemoDishes } from '../src/features/kitchen/model/kitchen.api.ts';
import { aggregateCounter, firstAvailableMatchTab } from '../src/features/kitchen/model/kitchen.rules.ts';
import {
  addIngredientToCounter, clearCounter, getKitchenDemoSnapshot,
  hydrateKitchenDemo, moveCounterPlacement, removeCounterPlacement, toggleFavorite,
} from '../src/features/kitchen/model/kitchen.demo.ts';
import { getDemoCookingRecipe } from '../src/features/cooking/model/cooking.api.ts';
import { centerFromGrab } from '../src/features/kitchen/view/dnd/dragGeometry.ts';

test('dragging a counter emoji preserves the original off-center grab point', () => {
  const grab = { id: 'placed-tomato', x: 11, y: 38, width: 54, height: 54 };
  const pointer = { x: 310, y: 220 };
  const center = centerFromGrab(pointer, grab);
  assert.deepEqual(center, { x: 326, y: 209 });
  assert.deepEqual({ x: center.x - 27 + grab.x, y: center.y - 27 + grab.y }, pointer);
});

test('default pantry matches all 30 README ingredients and recipes reference valid IDs', () => {
  const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
  const rows = readme.split('### Default Pantry')[1]
    .split('\n').filter((line) => /^\| \S+ .+ \| .* \| .* \| ∞ \|/.test(line));
  const names = rows.map((line) => line.split('|')[1].trim().replace(/^\S+\s+/u, ''));
  assert.equal(pantryIngredients.length, 30);
  assert.deepEqual(pantryIngredients.map((item) => item.name), names);
  assert.ok(pantryIngredients.every((item) => item.isPantry && item.usesPerUnit === 'infinite'));
  const ingredientIds = new Set(allIngredients.map((item) => item.id));
  assert.equal(ingredientIds.size, allIngredients.length);
  for (const recipe of dummyRecipes) {
    assert.ok(recipe.steps.length >= 3, recipe.id);
    assert.ok(recipe.requirements.every((item) => ingredientIds.has(item.ingredientId)), recipe.id);
    assert.deepEqual(getDemoCookingRecipe(recipe.id), recipe);
  }
});

test('matching is local and changes from shopping to almost to ready using real-shaped inventory', () => {
  const inventory = [{ ingredientId: 'bread', remainingUses: 3 }, { ingredientId: 'tomato', remainingUses: 3 }];
  const recipe = (groups) => Object.values(groups).flat().find((item) => item.recipe.id === 'tomato-toast');
  assert.equal(recipe(findDemoDishes([], [])).availability, 'need_shopping');
  assert.equal(recipe(findDemoDishes(inventory, [{ ingredientId: 'bread', selectedUses: 1 }])).availability, 'almost_ready');
  const fullCounter = ['bread', 'tomato', 'olive-oil', 'salt'].map((ingredientId) => ({ ingredientId, selectedUses: 1 }));
  assert.equal(recipe(findDemoDishes(inventory, fullCounter)).availability, 'ready_now');
  assert.equal(recipe(findDemoDishes(inventory, fullCounter)).matchedCount, 4);
  assert.equal(firstAvailableMatchTab(findDemoDishes([], [{ ingredientId: 'water', selectedUses: 1 }])), 'almost');
  assert.equal(firstAvailableMatchTab({ readyNow: [], almostReady: [], needShopping: [{}] }), 'shopping');
  assert.equal(firstAvailableMatchTab(findDemoDishes(inventory, fullCounter)), 'ready');
});

test('counter placements restore purchased uses, move independently and keep pantry unlimited', () => {
  const userA = 'kitchen-test-a';
  const userB = 'kitchen-test-b';
  hydrateKitchenDemo(userA);
  hydrateKitchenDemo(userB);
  clearCounter(userA);
  clearCounter(userB);
  addIngredientToCounter(userA, 'salt', []);
  addIngredientToCounter(userA, 'salt', []);
  assert.throws(() => addIngredientToCounter(userA, 'tomato', []), { code: 'INSUFFICIENT_INVENTORY' });
  const inventory = [{ ingredientId: 'tomato', remainingUses: 1 }];
  addIngredientToCounter(userA, 'tomato', inventory, { x: 0.3, y: 0.6 });
  assert.throws(() => addIngredientToCounter(userA, 'tomato', inventory), { code: 'INSUFFICIENT_INVENTORY' });
  toggleFavorite(userA, 'tomato-toast');
  assert.deepEqual(getKitchenDemoSnapshot()[userB].counter, []);
  assert.deepEqual(getKitchenDemoSnapshot()[userB].favorites, []);
  assert.equal(getKitchenDemoSnapshot()[userA].counter.length, 3);
  assert.deepEqual(
    aggregateCounter(getKitchenDemoSnapshot()[userA].counter).find((item) => item.ingredientId === 'salt'),
    { ingredientId: 'salt', selectedUses: 2 },
  );
  const tomato = getKitchenDemoSnapshot()[userA].counter.find((item) => item.ingredientId === 'tomato');
  assert.deepEqual([tomato.x, tomato.y], [0.3, 0.6]);
  moveCounterPlacement(userA, tomato.id, { x: 0.8, y: 0.2 });
  assert.deepEqual(
    [getKitchenDemoSnapshot()[userA].counter.find((item) => item.id === tomato.id).x,
      getKitchenDemoSnapshot()[userA].counter.find((item) => item.id === tomato.id).y],
    [0.8, 0.2],
  );
  removeCounterPlacement(userA, tomato.id);
  assert.equal(aggregateCounter(getKitchenDemoSnapshot()[userA].counter).find((item) => item.ingredientId === 'tomato'), undefined);
  addIngredientToCounter(userA, 'tomato', inventory);
  assert.equal(inventory[0].remainingUses, 1);
  clearCounter(userA);
  assert.deepEqual(getKitchenDemoSnapshot()[userA].counter, []);
  assert.deepEqual(aggregateCounter(getKitchenDemoSnapshot()[userA].counter), []);
});
