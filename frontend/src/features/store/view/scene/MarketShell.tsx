import { DoubleSide } from 'three';

export function MarketShell() {
  return (
    <>
      <color attach="background" args={['#eee9dc']} />
      <fog attach="fog" args={['#eee9dc', 12, 29]} />
      <ambientLight intensity={0.95} />
      <hemisphereLight args={['#fff6df', '#879582', 1.1]} />
      <directionalLight position={[3, 4, 5]} intensity={1.3} castShadow />
      {[-5.5, 0, 5.5].map((z) => (
        <group key={z} position={[0, 4.35, z]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[5.2, 0.7]} />
            <meshStandardMaterial color="#fff4d9" emissive="#fff0bd" emissiveIntensity={1.3} side={DoubleSide} />
          </mesh>
          <pointLight position={[0, -0.2, 0]} intensity={9} distance={10} decay={2} />
        </group>
      ))}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} receiveShadow>
        <planeGeometry args={[16, 18]} />
        <meshStandardMaterial color="#dfd7c6" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.075, 0]}>
        <planeGeometry args={[3.4, 16.8]} />
        <meshStandardMaterial color="#eae5d9" roughness={1} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 4.55, 0]}>
        <planeGeometry args={[16, 18]} />
        <meshStandardMaterial color="#f1ede4" side={DoubleSide} roughness={1} />
      </mesh>

      {[-8, 8].map((x) => (
        <mesh key={x} position={[x, 2.23, 0]} receiveShadow>
          <boxGeometry args={[0.2, 4.62, 18]} />
          <meshStandardMaterial color="#e6ddca" roughness={0.95} />
        </mesh>
      ))}
      <mesh position={[0, 2.23, -9]} receiveShadow>
        <boxGeometry args={[16, 4.62, 0.2]} />
        <meshStandardMaterial color="#e6ddca" roughness={0.95} />
      </mesh>
      {[-4.85, 4.85].map((x) => (
        <mesh key={x} position={[x, 2.23, 9]} receiveShadow>
          <boxGeometry args={[6.3, 4.62, 0.2]} />
          <meshStandardMaterial color="#e6ddca" roughness={0.95} />
        </mesh>
      ))}
      <mesh position={[0, 3.78, 9]}>
        <boxGeometry args={[3.4, 1.52, 0.2]} />
        <meshStandardMaterial color="#31594b" roughness={0.8} />
      </mesh>
    </>
  );
}
