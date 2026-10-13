export interface GrabOffset {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function centerFromGrab(pointer: { x: number; y: number }, grab: GrabOffset) {
  return {
    x: pointer.x - grab.x + grab.width / 2,
    y: pointer.y - grab.y + grab.height / 2,
  };
}
