import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { Float, OrbitControls, RoundedBox } from '@react-three/drei';
import { Suspense, useState } from 'react';
import type { Ingredient } from '../../model/store.types';

interface ProductShapeProps {
  ingredient: Ingredient;
  position: [number, number, number];
  selected: boolean;
  onSelect: (ingredientId: string) => void;
}

function ProductShape({ ingredient, position, selected, onSelect }: ProductShapeProps) {
  const [hovered, setHovered] = useState(false);
  const scale = selected ? 1.22 : hovered ? 1.12 : 1;
  const click = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect(ingredient.id);
  };

  return (
    <Float speed={1.5} rotationIntensity={0.12} floatIntensity={0.18}>
      <group position={position} scale={scale}>
        <mesh
          castShadow
          onClick={click}
          onPointerOver={(event) => {
            event.stopPropagation();
            setHovered(true);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = 'default';
          }}
        >
          <sphereGeometry args={[0.32, 24, 24]} />
          <meshStandardMaterial color={ingredient.color} roughness={0.72} />
        </mesh>
        <mesh position={[0, -0.38, 0]} castShadow>
          <cylinderGeometry args={[0.23, 0.28, 0.25, 20]} />
          <meshStandardMaterial color="#f5d990" roughness={0.9} />
        </mesh>
        {selected && (
          <mesh position={[0, -0.54, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.32, 0.43, 32]} />
            <meshBasicMaterial color="#f7b928" />
          </mesh>
        )}
      </group>
    </Float>
  );
}

function MarketScene({ ingredients, selectedId, onSelect }: StoreCanvasProps) {
  const positions: [number, number, number][] = [
    [-2.5, 1.1, -0.1], [-1.7, 1.1, -0.1], [-0.9, 1.1, -0.1],
    [0.9, 1.1, -0.1], [1.7, 1.1, -0.1], [2.5, 1.1, -0.1],
    [-2.5, 0.15, 0.15], [-1.7, 0.15, 0.15], [-0.9, 0.15, 0.15],
    [0.9, 0.15, 0.15], [1.7, 0.15, 0.15], [2.5, 0.15, 0.15],
  ];

  return (
    <>
      <color attach="background" args={['#eef3e8']} />
      <fog attach="fog" args={['#eef3e8', 8, 16]} />
      <ambientLight intensity={1.25} />
      <directionalLight position={[4, 7, 5]} intensity={2.4} castShadow />
      <RoundedBox args={[7, 0.22, 1.45]} radius={0.08} position={[0, -0.58, 0]} receiveShadow>
        <meshStandardMaterial color="#234f43" roughness={0.88} />
      </RoundedBox>
      <RoundedBox args={[7.3, 0.32, 1.8]} radius={0.08} position={[0, -1.12, 0.15]} receiveShadow>
        <meshStandardMaterial color="#d8a24b" roughness={0.9} />
      </RoundedBox>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.29, 0]} receiveShadow>
        <planeGeometry args={[18, 18]} />
        <meshStandardMaterial color="#f5e8cf" roughness={1} />
      </mesh>
      {ingredients.slice(0, 12).map((item, index) => (
        <ProductShape
          key={item.id}
          ingredient={item}
          position={positions[index]}
          selected={selectedId === item.id}
          onSelect={onSelect}
        />
      ))}
      <OrbitControls enablePan={false} minDistance={5} maxDistance={10} maxPolarAngle={Math.PI / 2.05} />
    </>
  );
}

interface StoreCanvasProps {
  ingredients: Ingredient[];
  selectedId: string | null;
  onSelect: (ingredientId: string) => void;
}

export function StoreCanvas(props: StoreCanvasProps) {
  return (
    <div className="store-canvas" aria-label="Interactive 3D grocery shelf">
      <Suspense fallback={<div className="canvas-loading">Stocking the shelves…</div>}>
        <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 2.7, 7], fov: 46 }}>
          <MarketScene {...props} />
        </Canvas>
      </Suspense>
      <div className="canvas-help">Drag to look around · click a product</div>
    </div>
  );
}
