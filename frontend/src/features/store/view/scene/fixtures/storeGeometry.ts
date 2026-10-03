import { BoxGeometry } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type {
  Position3,
  ProductSlot,
  StoreSection,
} from '../layout/storeLayout';

export interface StoreBox {
  position: Position3;
  size: Position3;
  color: string;
  metalness?: number;
  roughness?: number;
  rotation?: Position3;
  blocking?: boolean;
  radius?: number;
}

export function createStoreBoxGeometry(size: Position3, radius = 0.012) {
  const bevel = Math.min(radius, Math.min(...size) * 0.22);
  return bevel > 0
    ? new RoundedBoxGeometry(...size, 2, bevel)
    : new BoxGeometry(...size);
}

export function getCounterGuard(kind: StoreSection['kind']) {
  return kind === 'meat'
    ? { bottom: 0.715, top: 1, railY: 1.025, railHeight: 0.032 }
    : { bottom: 0.885, top: 1.155, railY: 1.19, railHeight: 0.032 };
}

export function getBasketStandBoxes(): StoreBox[] {
  const boxes: StoreBox[] = [];
  const add = (
    position: Position3,
    size: Position3,
    color: string,
    rotation?: Position3,
  ) => boxes.push({ position, size, color, rotation });
  add([0, 0.04, 0], [0.9, 0.08, 0.8], '#344c43');
  add([0, 0.338, 0], [0.86, 0.055, 0.75], '#344c43');
  for (const x of [-0.4, 0.4])
    for (const z of [-0.35, 0.35])
      add([x, 0.196, z], [0.05, 0.23, 0.05], '#344c43');

  // Tapered, nested baskets: each has a bottom, open mesh walls, and an open top.
  // Different widths/depths keep overlapping basket walls from being coplanar.
  for (let tier = 0; tier < 3; tier++) {
    const bottom = 0.385 + tier * 0.065;
    const width = 0.64 + tier * 0.05;
    const depth = 0.46 + tier * 0.04;
    const top = bottom + 0.25;
    add(
      [0, bottom + 0.009, 0],
      [width - 0.012, 0.018, depth - 0.012],
      '#b76b40',
    );
    for (const side of [-1, 1]) {
      for (let column = 0; column < 7; column++)
        add(
          [
            ((column - 3) * (width - 0.03)) / 6,
            bottom + 0.125,
            (side * depth) / 2,
          ],
          [0.023, 0.215, 0.023],
          '#b76b40',
        );
      for (let column = 0; column < 5; column++)
        add(
          [
            (side * width) / 2,
            bottom + 0.125,
            ((column - 2) * (depth - 0.06)) / 4,
          ],
          [0.023, 0.215, 0.023],
          '#b76b40',
        );
      for (const offset of [0.065, 0.15]) {
        add(
          [0, bottom + offset, side * (depth / 2 + 0.002)],
          [width, 0.016, 0.026],
          '#b76b40',
        );
        add(
          [side * (width / 2 + 0.002), bottom + offset, 0],
          [0.026, 0.016, depth - 0.03],
          '#b76b40',
        );
      }
      add([0, top, (side * depth) / 2], [width + 0.04, 0.026, 0.04], '#d59a6c');
      add(
        [(side * width) / 2, top, 0],
        [0.04, 0.026, depth - 0.005],
        '#d59a6c',
      );
    }
  }
  // Two raised bail handles leave the basket cavity empty below the grip.
  for (const side of [-1, 1]) {
    for (const x of [-0.355, 0.355])
      add([x, 0.902, side * 0.026], [0.025, 0.29, 0.027], '#35463f', [
        side * 0.12,
        0,
        0,
      ]);
    add([0, 1.047, side * 0.009], [0.74, 0.03, 0.035], '#35463f');
  }
  return boxes;
}

const WOOD = '#caa77e';
const WOOD_LIGHT = '#e5cba8';
const FRAME = '#52715d';
const IVORY = '#f4f0e4';
const METAL = '#bfc7c2';

export function getFixtureBoxes(
  section: StoreSection,
  slots: ProductSlot[],
): StoreBox[] {
  const boxes: StoreBox[] = [];
  const add = (
    position: Position3,
    size: Position3,
    color: string,
    extra: Partial<StoreBox> = {},
  ) => boxes.push({ position, size, color, ...extra });
  const { width: w, depth: d, kind } = section;
  if (kind === 'produce') {
    add([0, 0.34, 0], [w - 0.12, 0.68, d - 0.1], FRAME);
    for (let i = 0; i < 5; i++)
      add(
        [0, 0.1 + i * 0.12, d / 2 - 0.045],
        [w - 0.18, 0.085, 0.045],
        i % 2 ? WOOD : WOOD_LIGHT,
      );
    section.levels.forEach((level, tier) => {
      add([0, level - 0.055, tier === 0 ? 0.36 : -0.32], [w, 0.08, 0.65], WOOD);
    });
    for (
      let index = 0;
      index < section.columns * section.levels.length;
      index++
    ) {
      const {
        position: [x, y, z],
        width,
      } = slots[index];
      add([x, y - 0.02, z], [width - 0.04, 0.04, 0.55], WOOD_LIGHT);
      for (const side of [-1, 1]) {
        add([x + (side * width) / 2, y + 0.07, z], [0.035, 0.18, 0.63], WOOD);
        add([x, y + 0.06, z + side * 0.3], [width, 0.13, 0.035], WOOD);
      }
      // Small corner battens make the boxes read as crates rather than slabs.
      for (const side of [-1, 1])
        add(
          [x + side * (width / 2 - 0.055), y + 0.08, z + 0.32],
          [0.05, 0.2, 0.025],
          WOOD_LIGHT,
        );
    }
    for (const side of [-1, 1])
      add([side * (w / 2 - 0.08), 0.86, -0.72], [0.06, 1.72, 0.06], FRAME);
    add([0, 1.55, -0.72], [w - 0.12, 0.35, 0.08], FRAME);
  } else if (kind === 'grocery' || kind === 'chiller') {
    const cold = kind === 'chiller';
    const h = cold ? 2.25 : 2.12;
    add([0, 0.15, 0], [w, 0.3, d], cold ? FRAME : IVORY);
    const bodyBottom = 0.305;
    const bodyHeight = h - bodyBottom;
    add(
      [0, bodyBottom + bodyHeight / 2, -d / 2 + 0.045],
      [w - 0.18, bodyHeight, 0.07],
      cold ? '#d4e0dd' : '#dfded2',
    );
    for (const side of [-1, 1]) {
      add(
        [side * (w / 2 - 0.04), bodyBottom + bodyHeight / 2, 0],
        [0.08, bodyHeight, d - 0.04],
        cold ? FRAME : IVORY,
        { metalness: 0.2 },
      );
    }
    // Modular uprights and slots add a recognizable supermarket shelf rhythm.
    for (let i = 0; i <= (cold ? 3 : 2); i++) {
      const x = -w / 2 + 0.15 + (i * (w - 0.3)) / (cold ? 3 : 2);
      add(
        [x, bodyBottom + bodyHeight / 2, -d / 2 + 0.12],
        [0.055, bodyHeight - 0.06, 0.05],
        METAL,
        {
          metalness: 0.55,
          roughness: 0.4,
        },
      );
      if (!cold)
        for (let slot = 0; slot < 11; slot++)
          add(
            [x, 0.39 + slot * 0.14, -d / 2 + 0.151],
            [0.018, 0.045, 0.004],
            FRAME,
            { blocking: false },
          );
    }
    section.levels.forEach((level) => {
      add(
        [0, level - 0.03, 0.045],
        [w - 0.18, 0.06, d - 0.15],
        cold ? IVORY : '#efeee6',
        { metalness: 0.15 },
      );
      add([0, level - 0.022, d / 2], [w - 0.1, 0.085, 0.045], FRAME);
    });
    add([0, h + 0.045, 0], [w + 0.02, 0.08, d + 0.02], cold ? FRAME : IVORY);
    add([0, h + 0.065, d / 2 + 0.04], [w - 0.02, 0.26, 0.075], section.accent);
    for (let vent = 0; vent < Math.floor(w / 0.13); vent++)
      add(
        [-w / 2 + 0.13 + vent * 0.13, 0.15, d / 2 + 0.005],
        [0.06, 0.085, 0.012],
        cold ? '#182f2d' : '#babbae',
        { blocking: false },
      );
  } else {
    const frozen = kind === 'freezer';
    add([0, 0.35, 0], [w, 0.7, d], FRAME);
    add(
      [0, 0.37, d / 2 + 0.012],
      [w - 0.18, 0.44, 0.035],
      frozen ? '#d6e2de' : '#dddcd2',
    );
    add([0, 0.1, d / 2 + 0.035], [w, 0.12, 0.025], '#263e37');
    section.levels.forEach((level, tier) => {
      add(
        [0, level - 0.05, frozen ? 0 : tier === 0 ? 0.36 : -0.32],
        [w - 0.12, 0.1, frozen ? d - 0.08 : 0.65],
        IVORY,
        { metalness: 0.3, roughness: 0.4 },
      );
    });
    const sideTop = frozen ? 1.23 : 1.095;
    for (const side of [-1, 1])
      add(
        [side * (w / 2 - 0.04), (0.705 + sideTop) / 2, 0],
        [0.08, sideTop - 0.705, d - 0.08],
        '#d7dfda',
        {
          metalness: 0.35,
        },
      );
    add([0, 1.04, -d / 2 + 0.05], [w - 0.18, 0.67, 0.07], '#d4ded8');
    const guard = getCounterGuard(kind);
    add([0, guard.railY, d / 2], [w - 0.16, guard.railHeight, 0.035], METAL, {
      metalness: 0.65,
      roughness: 0.25,
      blocking: false,
    });
    add([0, 1.54, -d / 2 + 0.02], [w - 0.04, 0.29, 0.07], section.accent);
    for (let i = 0; i < Math.floor(w / 0.15); i++)
      add(
        [-w / 2 + 0.13 + i * 0.15, 0.12, d / 2 + 0.047],
        [0.07, 0.05, 0.008],
        '#101f1c',
        { blocking: false },
      );
  }
  return boxes;
}
