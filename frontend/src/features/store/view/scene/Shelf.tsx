import { Center, Text3D } from '@react-three/drei';
import type { ReactNode } from 'react';
import shelfFontUrl from './fonts/helvetiker_bold.typeface.json?url';
import { SHELF_DEPTH, SHELF_LEVELS, type StoreSection } from './storeLayout';

interface ShelfProps {
  section: StoreSection;
  children?: ReactNode;
}

export function Shelf({ section, children }: ShelfProps) {
  const [x, z] = section.position;
  const width = section.width;
  const supports = width > 6
    ? [-width / 2 + 0.1, -width / 4, 0, width / 4, width / 2 - 0.1]
    : [-width / 2 + 0.1, width / 2 - 0.1];

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.09, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, 0.18, SHELF_DEPTH]} />
        <meshStandardMaterial color="#d6b47b" roughness={0.85} />
      </mesh>
      {SHELF_LEVELS.map((height) => (
        <mesh key={height} position={[0, height, 0]} castShadow receiveShadow>
          <boxGeometry args={[width, 0.12, SHELF_DEPTH]} />
          <meshStandardMaterial color="#e8d5ad" roughness={0.82} />
        </mesh>
      ))}
      {supports.map((legX) => (
        <mesh key={legX} position={[legX, 1.48, -0.42]} castShadow>
          <boxGeometry args={[0.15, 2.96, 0.16]} />
          <meshStandardMaterial color="#31594b" roughness={0.72} />
        </mesh>
      ))}
      <mesh position={[0, 3.22, -0.32]} castShadow>
        <boxGeometry args={[width, 0.53, 0.16]} />
        <meshStandardMaterial color={section.accent} roughness={0.72} />
      </mesh>
      {[false, true].map((back) => (
        <Center
          key={back ? 'back' : 'front'}
          position={[0, 3.22, back ? -0.394 : -0.246]}
          rotation={back ? [0, Math.PI, 0] : [0, 0, 0]}
          disableZ
        >
          <Text3D font={shelfFontUrl} size={0.21} height={0.008} curveSegments={3}>
            {section.category}
            <meshStandardMaterial color="#fff7e6" roughness={1} />
          </Text3D>
        </Center>
      ))}
      {children}
    </group>
  );
}
