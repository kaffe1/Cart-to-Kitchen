import { useMemo, type ReactNode } from 'react';
import { StoreBoxes } from './StoreBoxes';
import { getCounterGuard, getFixtureBoxes } from './storeGeometry';
import { StoreSign } from './StoreSign';
import { getProductSlot, type StoreSection } from '../layout/storeLayout';

function CabinetLight({ section }: { section: StoreSection }) {
  return (
    <>
      <mesh
        position={[
          0,
          section.kind === 'chiller' ? 2.13 : 1.37,
          -section.depth / 2 + 0.1,
        ]}
      >
        <boxGeometry args={[section.width - 0.2, 0.025, 0.03]} />
        <meshStandardMaterial
          color="#e7fff8"
          emissive="#dbfff5"
          emissiveIntensity={2}
        />
      </mesh>
      <pointLight
        position={[0, 1.8, 0.1]}
        color="#e9fff7"
        intensity={2.5}
        distance={3}
        decay={2}
      />
    </>
  );
}

export function Shelf({
  section,
  children,
}: {
  section: StoreSection;
  children?: ReactNode;
}) {
  const boxes = useMemo(
    () =>
      getFixtureBoxes(
        section,
        Array.from(
          { length: section.columns * section.levels.length },
          (_, index) => getProductSlot(section, index),
        ),
      ),
    [section],
  );
  const guard = getCounterGuard(section.kind);
  const cold = section.kind === 'chiller';
  const counter = section.kind === 'meat' || section.kind === 'freezer';
  const signY =
    section.kind === 'produce' ? 1.55 : cold ? 2.315 : counter ? 1.54 : 2.185;
  const signZ =
    section.kind === 'produce'
      ? -0.675
      : counter
        ? -section.depth / 2 + 0.075
        : section.depth / 2 + 0.09;
  return (
    <group
      position={[section.position[0], 0, section.position[1]]}
      rotation={[0, section.rotation, 0]}
    >
      <StoreBoxes boxes={boxes} />
      <StoreSign
        title={section.title}
        subtitle={section.subtitle}
        position={[0, signY, signZ]}
        width={section.width - 0.2}
        height={section.kind === 'produce' ? 0.3 : 0.25}
        background={section.accent}
        color="#fff8e9"
        accent="#e0b67c"
      />
      {(cold || counter) && <CabinetLight section={section} />}
      {counter && (
        <mesh
          position={[
            0,
            (guard.top + guard.bottom) / 2,
            section.depth / 2 - 0.02,
          ]}
        >
          <boxGeometry
            args={[section.width - 0.12, guard.top - guard.bottom, 0.018]}
          />
          {/* Glass stays off the picking layer, allowing shopping through it. */}
          <meshStandardMaterial
            color="#c3e4da"
            transparent
            opacity={0.12}
            roughness={0.12}
            metalness={0.1}
            depthWrite={false}
          />
        </mesh>
      )}
      {children}
    </group>
  );
}
