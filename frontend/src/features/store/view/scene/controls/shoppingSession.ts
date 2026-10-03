export type ShoppingMode = 'entry' | 'shopping' | 'paused';
export type ShoppingEvent = 'lock' | 'unlock' | 'pause';

// Pointer-lock success is the only event that resumes the trip. A denied lock
// request therefore leaves the cart usable and the camera paused.
export function shoppingSessionReducer(
  mode: ShoppingMode,
  event: ShoppingEvent,
): ShoppingMode {
  if (event === 'lock') return 'shopping';
  if (event === 'pause') return 'paused';
  return mode === 'entry' ? 'entry' : 'paused';
}

export function getShoppingShortcut(mode: ShoppingMode, code: string) {
  if (mode === 'shopping' && (code === 'KeyB' || code === 'Escape'))
    return 'pause';
  if (mode === 'paused' && code === 'KeyB') return 'resume';
  return null;
}
