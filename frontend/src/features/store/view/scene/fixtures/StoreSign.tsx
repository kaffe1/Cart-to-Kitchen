import { useEffect, useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';
import type { Position3 } from '../layout/storeLayout';

interface StoreSignProps {
  title: string;
  subtitle?: string;
  price?: string;
  position: Position3;
  width: number;
  height: number;
  background?: string;
  color?: string;
  accent?: string;
  rotation?: Position3;
}

export function StoreSign({
  title,
  subtitle,
  price,
  position,
  width,
  height,
  background = '#f8f3e8',
  color = '#254238',
  accent = '#b76b40',
  rotation = [0, 0, 0],
}: StoreSignProps) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = price ? 256 : 1024;
    canvas.height = Math.round((canvas.width * height) / width);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not create a store sign');
    const w = canvas.width;
    const h = canvas.height;
    context.fillStyle = background;
    context.fillRect(0, 0, w, h);
    context.fillStyle = accent;
    context.fillRect(0, h - Math.max(3, h * 0.045), w, h * 0.045);
    context.fillStyle = color;
    context.textBaseline = 'middle';
    context.textAlign = price ? 'left' : 'center';
    let titleSize = price ? h * 0.52 : h * (subtitle ? 0.34 : 0.45);
    if (price) {
      // Share a single baseline, reserving space for the full price on the right.
      const padding = w * 0.035;
      const gap = w * 0.035;
      context.font = `600 ${titleSize}px Arial, sans-serif`;
      const titleWidth = context.measureText(title).width;
      context.font = `700 ${titleSize}px Arial, sans-serif`;
      const priceWidth = context.measureText(price).width;
      titleSize *= Math.min(
        1,
        (w - padding * 2 - gap) / (titleWidth + priceWidth),
      );
      context.font = `600 ${titleSize}px Arial, sans-serif`;
      context.fillText(title, padding, h * 0.49);
      context.textAlign = 'right';
      context.font = `700 ${titleSize}px Arial, sans-serif`;
      context.fillText(price, w - padding, h * 0.49);
    } else {
      context.font = `600 ${titleSize}px Arial, sans-serif`;
      context.fillText(
        title,
        price ? w * 0.07 : w / 2,
        h * (price ? 0.25 : subtitle ? 0.43 : 0.49),
        w * 0.88,
      );
      if (subtitle) {
        context.font = `500 ${h * 0.12}px Arial, sans-serif`;
        context.fillText(subtitle, w / 2, h * 0.77, w * 0.88);
      }
    }
    const map = new CanvasTexture(canvas);
    map.colorSpace = SRGBColorSpace;
    map.anisotropy = 4;
    return map;
  }, [title, subtitle, price, width, height, background, color, accent]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={position} rotation={rotation} raycast={() => {}}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}
