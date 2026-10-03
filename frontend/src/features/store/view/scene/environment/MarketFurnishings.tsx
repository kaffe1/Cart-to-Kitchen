import { StoreBoxes, type StoreBox } from '../fixtures/StoreBoxes';
import { StoreSign } from '../fixtures/StoreSign';
import { STORE_FURNITURE } from '../layout/storeLayout';
import { getBasketStandBoxes } from '../fixtures/storeGeometry';

const COUNTER: StoreBox[] = [
  { position: [0, 0.46, 0], size: [3.2, 0.92, 1.15], color: '#bb926a' },
  { position: [0, 0.98, 0], size: [3.3, 0.12, 1.22], color: '#e5e2d7' },
  {
    position: [-0.62, 1.046, 0],
    size: [1.55, 0.025, 0.83],
    color: '#293a34',
    roughness: 0.95,
  },
  { position: [0, 0.16, 0.584], size: [3.1, 0.15, 0.025], color: '#3a5146' },
  { position: [1.02, 1.08, -0.18], size: [0.47, 0.07, 0.36], color: '#35463f' },
  { position: [1.02, 1.23, -0.19], size: [0.08, 0.32, 0.08], color: '#35463f' },
  { position: [1.02, 1.46, -0.19], size: [0.58, 0.39, 0.05], color: '#25372f' },
  {
    position: [1.05, 1.11, 0.31],
    size: [0.16, 0.09, 0.25],
    color: '#35463f',
    rotation: [-0.22, 0, 0],
  },
];

const BASKETS = getBasketStandBoxes();

export function MarketFurnishings() {
  return (
    <>
      <group
        position={[
          STORE_FURNITURE.checkout.position[0],
          0,
          STORE_FURNITURE.checkout.position[1],
        ]}
      >
        <StoreBoxes boxes={COUNTER} />
        <StoreSign
          title="Checkout"
          subtitle="B · REVIEW YOUR BASKET"
          position={[0, 0.61, 0.585]}
          width={1.45}
          height={0.43}
          background="#344c43"
          color="#fff8e9"
        />
        <StoreSign
          title="Cart to Kitchen"
          subtitle="GOOD FOOD STARTS HERE"
          position={[1.02, 1.46, -0.159]}
          width={0.51}
          height={0.32}
          background="#d9e4d6"
        />
      </group>
      <group
        position={[
          STORE_FURNITURE.baskets.position[0],
          0,
          STORE_FURNITURE.baskets.position[1],
        ]}
      >
        <StoreBoxes boxes={BASKETS} />
        <StoreSign
          title="Take a basket"
          position={[0, 0.2, 0.407]}
          width={0.7}
          height={0.19}
        />
      </group>
    </>
  );
}
