import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync } from 'node:fs';
import {
  Box3,
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Vector3,
} from 'three';
import { storeIngredients } from '../src/shared/api/dummyData.ts';
import {
  STORE_SECTIONS,
  STORE_ENTRANCE,
  STORE_OBSTACLES,
  STORE_FURNITURE,
  canWalkTo,
  getProductSlot,
  getSectionProducts,
  PRICE_LABEL_HEIGHT,
  getPriceLabelWidth,
} from '../src/features/store/view/scene/layout/storeLayout.ts';
import { getProductDisplay } from '../src/features/store/view/scene/products/productDisplay.ts';
import {
  prepareIngredientModel,
  setIngredientModelFocus,
} from '../src/features/store/view/scene/products/ingredientModel.ts';
import {
  PRODUCT_MAX_SCALE,
  PRODUCT_FOCUS_SCALE,
  PRODUCT_FOCUS_RESPONSE,
} from '../src/features/store/view/scene/layout/storeAppearance.ts';
import {
  createStoreBoxGeometry,
  getFixtureBoxes,
  getCounterGuard,
  getBasketStandBoxes,
} from '../src/features/store/view/scene/fixtures/storeGeometry.ts';
import {
  getShoppingShortcut,
  shoppingSessionReducer,
} from '../src/features/store/view/scene/controls/shoppingSession.ts';
import { getCartFlightFrame } from '../src/features/store/view/scene/products/cartFlight.ts';

test('a picked ingredient follows an upward arc to the basket while shrinking', () => {
  const target = [0.88, 0.91];
  const start = getCartFlightFrame(0, target);
  const middle = getCartFlightFrame(0.5, target);
  const end = getCartFlightFrame(1, target);
  assert.deepEqual(start, { x: 0, y: 0, scale: 1 });
  assert.ok(middle.x > 0 && middle.x < target[0]);
  assert.ok(middle.y > target[1] * 0.5);
  assert.ok(middle.scale < start.scale && middle.scale > end.scale);
  assert.ok(Math.abs(end.x - target[0]) < 1e-9);
  assert.ok(Math.abs(end.y - target[1]) < 1e-9);
  assert.ok(end.scale <= 0.12 + 1e-9);
});

test('shopping pause survives repeated unlock events, and resumes only after pointer lock succeeds', () => {
  let mode = 'entry';
  assert.equal(shoppingSessionReducer(mode, 'unlock'), 'entry');
  mode = shoppingSessionReducer(mode, 'lock');
  for (const code of ['KeyB', 'Escape']) {
    assert.equal(getShoppingShortcut(mode, code), 'pause');
    mode = shoppingSessionReducer(mode, 'pause');
    mode = shoppingSessionReducer(mode, 'unlock');
    mode = shoppingSessionReducer(mode, 'unlock');
    assert.equal(mode, 'paused');
    assert.equal(getShoppingShortcut(mode, 'KeyB'), 'resume');
    // A blocked resume request produces no lock event and keeps the cart open.
    assert.equal(getShoppingShortcut(mode, 'Escape'), null);
    mode = shoppingSessionReducer(mode, 'lock');
    assert.equal(mode, 'shopping');
  }
  assert.equal(
    shoppingSessionReducer('shopping', 'unlock'),
    'paused',
    'browser-native Esc opens the cart',
  );
  for (const state of ['entry', 'shopping', 'paused'])
    assert.equal(getShoppingShortcut(state, 'KeyE'), null);
  assert.equal(getShoppingShortcut('entry', 'KeyB'), null);
});

test('the frozen cabinet leaves a small rear wall gap while its shopping front stays inside the store', () => {
  const freezer = STORE_SECTIONS.find((section) => section.id === 'frozen');
  const gap = freezer.position[1] - freezer.depth / 2 - -8.9;
  assert.ok(gap >= 0.1 && gap <= 0.2, `wall gap: ${gap}`);
  assert.ok(canWalkTo(0, freezer.position[1] + freezer.depth / 2 + 0.6));
});

test('every catalog ingredient has exactly one physical slot and an existing web model', () => {
  const assigned = STORE_SECTIONS.flatMap((section) => section.ingredientIds);
  assert.equal(assigned.length, 80);
  assert.equal(new Set(assigned).size, 80);
  assert.deepEqual(
    [...assigned].sort(),
    storeIngredients.map((item) => item.id).sort(),
  );
  const folders = {
    'Vegetables & Fruits': 'vegetables-fruits',
    'Meat & Seafood': 'meat-seafood',
    'Dairy & Eggs': 'dairy-eggs',
    'Grains & Staples': 'grains-staples',
    'Other Ingredients': 'other-ingredients',
  };
  for (const item of storeIngredients)
    assert.ok(
      existsSync(
        new URL(
          `../public/models/ingredients/model_web/${folders[item.category]}/${item.id}.glb`,
          import.meta.url,
        ),
      ),
      item.id,
    );
  for (const section of STORE_SECTIONS) {
    assert.ok(
      section.ingredientIds.length <= section.columns * section.levels.length,
      section.id,
    );
    assert.equal(
      getSectionProducts(section, storeIngredients).length,
      section.ingredientIds.length,
    );
  }
});

test('physical placement does not change catalog categories or reorder partially loaded slots', () => {
  const frozen = STORE_SECTIONS.find((section) => section.id === 'frozen');
  const partial = getSectionProducts(
    frozen,
    storeIngredients.filter((item) => item.id === 'puff-pastry'),
  );
  assert.equal(partial[0].index, 1);
  assert.equal(
    storeIngredients.find((item) => item.id === 'tofu').category,
    'Grains & Staples',
  );
  assert.ok(
    STORE_SECTIONS.find(
      (section) => section.id === 'dairy',
    ).ingredientIds.includes('tofu'),
  );
});

test('display copies fit their slots without crossing crate sides or adjacent shelf levels', () => {
  for (const section of STORE_SECTIONS)
    for (const { ingredient, index } of getSectionProducts(
      section,
      storeIngredients,
    )) {
      const slot = getProductSlot(section, index);
      const display = getProductDisplay(ingredient.id, section.kind);
      for (const copy of display.copies) {
        const cos = Math.abs(Math.cos(copy.rotationY));
        const sin = Math.abs(Math.sin(copy.rotationY));
        const halfWidth =
          ((cos * display.size[0] + sin * display.size[2]) *
            copy.scale *
            PRODUCT_MAX_SCALE) /
          2;
        const halfDepth =
          ((sin * display.size[0] + cos * display.size[2]) *
            copy.scale *
            PRODUCT_MAX_SCALE) /
          2;
        assert.ok(
          Math.abs(copy.position[0]) + halfWidth <=
            slot.width / 2 - (section.kind === 'produce' ? 0.02 : 0),
          `${ingredient.id}: width`,
        );
        assert.ok(
          Math.abs(copy.position[2]) + halfDepth <=
            slot.depth / 2 - (section.kind === 'produce' ? 0.013 : 0),
          `${ingredient.id}: depth`,
        );
      }
      if (section.kind === 'grocery' || section.kind === 'chiller') {
        const tier = Math.floor(index / section.columns);
        const next = section.levels[tier + 1];
        if (next)
          assert.ok(
            slot.position[1] + display.size[1] * PRODUCT_MAX_SCALE <
              next - 0.06,
            ingredient.id,
          );
      }
    }
});

test('price cards stay outside crate fronts and grocery shelf rails', () => {
  for (const section of STORE_SECTIONS) {
    for (let index = 0; index < section.ingredientIds.length; index++) {
      const slot = getProductSlot(section, index);
      const nearestZ =
        slot.labelPosition[2] -
        (Math.abs(Math.sin(slot.labelTilt)) * PRICE_LABEL_HEIGHT) / 2;
      if (section.kind === 'produce')
        assert.ok(nearestZ > slot.position[2] + 0.318, section.id);
      if (section.kind === 'grocery' || section.kind === 'chiller')
        assert.ok(nearestZ > section.depth / 2 + 0.0225, section.id);
    }
  }
});

test('compact price labels fit every slot, with space for long product names', () => {
  for (const section of STORE_SECTIONS)
    for (const { ingredient, index } of getSectionProducts(
      section,
      storeIngredients,
    )) {
      const slot = getProductSlot(section, index);
      const width = getPriceLabelWidth(ingredient.name, slot.width);
      assert.ok(width < slot.width);
      assert.ok(
        width * PRICE_LABEL_HEIGHT < 0.43 * 0.14 * 0.6,
        ingredient.name,
      );
    }
  assert.ok(
    getPriceLabelWidth('Chicken Breast', 0.84) >
      getPriceLabelWidth('Beef', 0.84),
  );
});

test('the lowered meat guard clears the close-up sightline to all products and price cards', () => {
  const section = STORE_SECTIONS.find((item) => item.kind === 'meat');
  const guard = getCounterGuard('meat');
  const cameraZ = section.depth / 2 + 0.28;
  const railZ = section.depth / 2;
  const railTop = guard.railY + guard.railHeight / 2;
  assert.ok(guard.top < 1.1);
  for (let index = 0; index < section.ingredientIds.length; index++) {
    const slot = getProductSlot(section, index);
    for (const target of [
      [slot.position[1] + 0.06, slot.position[2]],
      [slot.labelPosition[1], slot.labelPosition[2]],
    ]) {
      if (target[1] > railZ) continue; // Front-row price cards are mounted outside the glass.
      const rayY =
        1.7 + ((target[0] - 1.7) * (cameraZ - railZ)) / (cameraZ - target[1]);
      assert.ok(rayY > railTop, section.ingredientIds[index]);
    }
  }
});

test('different fixture materials do not share overlapping coplanar flat faces', () => {
  for (const section of STORE_SECTIONS) {
    const boxes = getFixtureBoxes(
      section,
      Array.from(
        { length: section.columns * section.levels.length },
        (_, index) => getProductSlot(section, index),
      ),
    );
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i],
          b = boxes[j];
        if (a.color === b.color) continue;
        for (let axis = 0; axis < 3; axis++)
          for (const side of [-1, 1]) {
            const aPlane = a.position[axis] + (side * a.size[axis]) / 2;
            const bPlane = b.position[axis] + (side * b.size[axis]) / 2;
            if (Math.abs(aPlane - bPlane) > 1e-6) continue;
            const ar = Math.min(a.radius ?? 0.012, Math.min(...a.size) * 0.22);
            const br = Math.min(b.radius ?? 0.012, Math.min(...b.size) * 0.22);
            const overlaps = [0, 1, 2]
              .filter((k) => k !== axis)
              .every(
                (k) =>
                  Math.min(
                    a.position[k] + a.size[k] / 2 - ar,
                    b.position[k] + b.size[k] / 2 - br,
                  ) -
                    Math.max(
                      a.position[k] - a.size[k] / 2 + ar,
                      b.position[k] - b.size[k] / 2 + br,
                    ) >
                  0.002,
              );
            assert.equal(
              overlaps,
              false,
              `${section.id}: boxes ${i}/${j}, axis ${axis}`,
            );
          }
      }
  }
});

test('rounded fixture geometry keeps its original footprint and valid normals', () => {
  for (const size of [
    [3, 0.06, 1],
    [0.023, 0.2, 0.023],
    [0.9, 0.36, 0.8],
  ]) {
    const geometry = createStoreBoxGeometry(size);
    geometry.computeBoundingBox();
    const measured = geometry.boundingBox.getSize(new Vector3());
    size.forEach((value, axis) =>
      assert.ok(Math.abs(measured.getComponent(axis) - value) < 1e-6),
    );
    assert.ok([...geometry.attributes.normal.array].every(Number.isFinite));
    assert.equal(geometry.type, 'RoundedBoxGeometry');
    geometry.dispose();
  }
});

test('basket rims enclose an empty cavity above the top basket floor', () => {
  const boxes = getBasketStandBoxes();
  const interior = new Vector3(0.12, 0.65, 0.15);
  for (const box of boxes) {
    const geometry = createStoreBoxGeometry(box.size);
    const mesh = new Mesh(geometry);
    mesh.position.set(...box.position);
    mesh.rotation.set(...(box.rotation ?? [0, 0, 0]));
    mesh.updateMatrixWorld(true);
    assert.equal(
      new Box3().setFromObject(mesh).containsPoint(interior),
      false,
      'basket interior must remain empty',
    );
    geometry.dispose();
  }
  assert.ok(
    boxes.some((box) => box.position[1] > 1),
    'raised handles',
  );
});

test('focus feedback is visible and reaches 90 percent of its enlargement within 0.1 seconds', () => {
  assert.ok(PRODUCT_FOCUS_SCALE >= 1.15);
  assert.ok(1 - Math.exp(-PRODUCT_FOCUS_RESPONSE * 0.1) > 0.9);
});

test('rotated cabinets, checkout, and basket stand block walking; entrance stays clear', () => {
  assert.ok(canWalkTo(STORE_ENTRANCE[0], STORE_ENTRANCE[2]));
  for (const obstacle of STORE_OBSTACLES)
    assert.equal(canWalkTo(...obstacle.position), false);
  assert.equal(canWalkTo(-7, -7), false, 'long rotated meat cabinet');
  assert.equal(canWalkTo(-5.9, -7), true, 'walkway beside meat cabinet');
  assert.equal(canWalkTo(9, 0), false);
  assert.equal(canWalkTo(NaN, 0), false);
});

test('all stocked fixture fronts and the checkout are reachable from the entrance', () => {
  const step = 0.2;
  const key = (x, z) => `${x},${z}`;
  const start = [0, 37];
  const queue = [start];
  const visited = new Set([key(...start)]);
  for (let i = 0; i < queue.length; i++) {
    const [x, z] = queue[i];
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const next = [x + dx, z + dz];
      const k = key(...next);
      if (!visited.has(k) && canWalkTo(next[0] * step, next[1] * step)) {
        visited.add(k);
        queue.push(next);
      }
    }
  }
  const reachable = (x, z) =>
    queue.some(([qx, qz]) => Math.hypot(qx * step - x, qz * step - z) < 0.3);
  for (const section of STORE_SECTIONS)
    for (let column = 0; column < section.columns; column++) {
      const localX = getProductSlot(section, column).position[0];
      const localZ = section.depth / 2 + 0.6;
      const x =
        section.position[0] +
        Math.cos(section.rotation) * localX +
        Math.sin(section.rotation) * localZ;
      const z =
        section.position[1] -
        Math.sin(section.rotation) * localX +
        Math.cos(section.rotation) * localZ;
      assert.ok(reachable(x, z), `${section.id} column ${column}`);
    }
  assert.ok(
    reachable(
      STORE_FURNITURE.checkout.position[0],
      STORE_FURNITURE.checkout.position[1] + 1,
    ),
  );
});

test('instanced model normalization preserves transformed parts, shares geometry, and isolates focus materials', () => {
  const source = new Group();
  source.position.set(3, 4, 1);
  source.rotation.z = 0.2;
  const parent = new Group();
  parent.scale.set(2, 3, 1);
  const geometry = new BoxGeometry(2, 1, 1);
  const material = new MeshStandardMaterial({ color: '#aabbcc' });
  const mesh = new Mesh(geometry, material);
  mesh.position.set(-1, 2, 0);
  parent.add(mesh);
  source.add(parent);
  const model = prepareIngredientModel(source, [0.26, 0.4, 0.22]);
  const part = model.parts[0];
  const bounds = new Box3()
    .setFromBufferAttribute(part.geometry.attributes.position)
    .applyMatrix4(part.matrix);
  const size = bounds.getSize(new Vector3());
  assert.ok(Math.abs(bounds.min.y) < 1e-6, 'bottom rests on the shelf');
  assert.ok(size.x <= 0.260001 && size.y <= 0.400001 && size.z <= 0.220001);
  assert.equal(part.geometry, geometry);
  assert.notEqual(part.material, material);
  const original = material.color.clone();
  setIngredientModelFocus(model, true);
  assert.ok(
    material.color.equals(original),
    'cached source material is untouched',
  );
  assert.ok(!part.material.color.equals(original));
  setIngredientModelFocus(model, false);
  assert.ok(part.material.color.equals(original));
  model.materials.forEach((copy) => copy.dispose());
  geometry.dispose();
  material.dispose();
});
