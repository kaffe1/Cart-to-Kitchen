import { Environment, Lightformer } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import {
  CanvasTexture,
  DoubleSide,
  RepeatWrapping,
  SRGBColorSpace,
} from 'three';
import { MarketFurnishings } from './MarketFurnishings';
import { StoreBoxes, type StoreBox } from '../fixtures/StoreBoxes';
import { StoreSign } from '../fixtures/StoreSign';

const ROOM: StoreBox[] = [
  { position: [-8, 1.8, 0], size: [0.2, 3.6, 18], color: '#eee9df' },
  { position: [8, 1.8, 0], size: [0.2, 3.6, 18], color: '#eee9df' },
  { position: [0, 1.8, -9], size: [16, 3.6, 0.2], color: '#eee9df' },
  { position: [0, 1.03, -8.89], size: [15.8, 2.06, 0.025], color: '#708a6e' },
  { position: [-7.88, 0.1, 0], size: [0.035, 0.2, 18], color: '#344c43' },
  { position: [7.88, 0.1, 0], size: [0.035, 0.2, 18], color: '#344c43' },
  { position: [0, 0.1, -8.86], size: [16, 0.2, 0.035], color: '#344c43' },
  { position: [-7.88, 2.28, 0], size: [0.04, 0.08, 18], color: '#c5a980' },
  { position: [7.88, 2.28, 0], size: [0.04, 0.08, 18], color: '#c5a980' },
  { position: [-4.9, 1.8, 9], size: [6.2, 3.6, 0.2], color: '#eee9df' },
  { position: [4.9, 1.8, 9], size: [6.2, 3.6, 0.2], color: '#eee9df' },
  { position: [0, 3.23, 9], size: [3.6, 0.75, 0.2], color: '#344c43' },
  { position: [-1.8, 1.45, 8.88], size: [0.07, 2.9, 0.08], color: '#344c43' },
  { position: [1.8, 1.45, 8.88], size: [0.07, 2.9, 0.08], color: '#344c43' },
];
for (const z of [-6, 0, 6])
  ROOM.push({
    position: [0, 3.52, z],
    size: [16, 0.14, 0.16],
    color: '#d6d3c7',
    blocking: false,
  });

function TileFloor() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 512;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not create the floor texture');
    context.fillStyle = '#c9c7bd';
    context.fillRect(0, 0, 512, 512);
    for (let x = 0; x < 2; x++)
      for (let y = 0; y < 2; y++) {
        context.fillStyle = (x + y) % 2 ? '#e2dfd6' : '#ddd9cf';
        context.fillRect(x * 256 + 1, y * 256 + 1, 254, 254);
      }
    for (let i = 0; i < 2200; i++) {
      context.fillStyle = i % 2 ? '#b9b5aa28' : '#fffdf02c';
      context.fillRect(
        (i * 137) % 512,
        (i * 241 + Math.floor(i / 7)) % 512,
        1,
        1,
      );
    }
    const map = new CanvasTexture(canvas);
    map.colorSpace = SRGBColorSpace;
    map.wrapS = map.wrapT = RepeatWrapping;
    map.repeat.set(8, 9);
    map.anisotropy = 4;
    return map;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.005, 0]}
      receiveShadow
    >
      <planeGeometry args={[16, 18]} />
      <meshStandardMaterial map={texture} roughness={0.82} />
    </mesh>
  );
}

export function MarketShell() {
  return (
    <>
      <color attach="background" args={['#eae7df']} />
      <fog attach="fog" args={['#eae7df', 20, 38]} />
      <ambientLight intensity={0.65} />
      <hemisphereLight args={['#fff9ee', '#a0ad91', 1.1]} />
      <directionalLight
        position={[2, 8, 5]}
        intensity={2.5}
        color="#fff4df"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-11}
        shadow-camera-right={11}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-normalBias={0.012}
        shadow-bias={-0.00015}
      />
      {/* Small, generated environment for glass/metal reflections; no external HDR. */}
      <Environment resolution={128} frames={1} environmentIntensity={0.5}>
        <Lightformer
          form="rect"
          intensity={2}
          position={[0, 4, 0]}
          scale={[10, 12, 1]}
          rotation={[Math.PI / 2, 0, 0]}
        />
        <Lightformer
          form="rect"
          intensity={1}
          position={[0, 2, 9]}
          scale={[5, 3, 1]}
          rotation={[0, Math.PI, 0]}
        />
      </Environment>
      {[-5, 0.3, 5.5].flatMap((z) =>
        [-3.5, 3.5].map((x) => (
          <group key={`${x}-${z}`} position={[x, 3.48, z]}>
            <mesh>
              <boxGeometry args={[0.54, 0.065, 2.5]} />
              <meshStandardMaterial
                color="#bfc3b9"
                metalness={0.35}
                roughness={0.5}
              />
            </mesh>
            <mesh position={[0, -0.038, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.43, 2.38]} />
              <meshStandardMaterial
                color="#fff8e6"
                emissive="#fff6dc"
                emissiveIntensity={2}
                side={DoubleSide}
              />
            </mesh>
            <pointLight
              position={[0, -0.22, 0]}
              intensity={12}
              color="#fff7e5"
              distance={7}
              decay={2}
            />
          </group>
        )),
      )}
      <TileFloor />
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3.62, 0]}>
        <planeGeometry args={[16, 18]} />
        <meshStandardMaterial color="#efede5" roughness={1} side={DoubleSide} />
      </mesh>
      <StoreBoxes boxes={ROOM} />
      <StoreSign
        title="The neighbourhood market"
        subtitle="CART TO KITCHEN · GOOD FOOD STARTS HERE"
        position={[0, 2.9, -8.88]}
        width={5.2}
        height={0.78}
        background="#eee9df"
      />
      <StoreSign
        title="A little care. A good meal."
        subtitle="FIND YOUR NEXT INGREDIENT"
        position={[-7.88, 2.82, 3]}
        rotation={[0, Math.PI / 2, 0]}
        width={3.1}
        height={0.7}
      />
      <StoreSign
        title="Shop smart. Cook curious."
        subtitle="CART TO KITCHEN"
        position={[7.88, 2.82, 3]}
        rotation={[0, -Math.PI / 2, 0]}
        width={3.1}
        height={0.7}
      />
      <StoreSign
        title="Thanks for stopping by"
        position={[0, 3.24, 8.88]}
        rotation={[0, Math.PI, 0]}
        width={3.3}
        height={0.47}
        background="#344c43"
        color="#fff8e9"
      />
      <StoreSign
        title="WELCOME"
        position={[0, 0.006, 7.6]}
        rotation={[-Math.PI / 2, 0, 0]}
        width={3}
        height={1.3}
        background="#344c43"
        color="#e4deca"
        accent="#344c43"
      />
      <MarketFurnishings />
    </>
  );
}
