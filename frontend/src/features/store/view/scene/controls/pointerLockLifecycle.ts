interface PointerLockTarget {
  domElement?: HTMLElement;
  lock: () => void;
}

const configuredControls = new WeakSet<PointerLockTarget>();

/**
 * Browsers may deny pointer lock, e.g. when the window is not focused or when
 * the user re-enters right after leaving with Esc. Three's PointerLockControls
 * reports that expected decision with console.error and leaves the request's
 * promise unhandled. Route the denial to the caller instead. This must run
 * before the controls connect, because connect() registers the error handler.
 */
export function configurePointerLock(
  controls: PointerLockTarget,
  onDenied: () => void,
): void {
  if (configuredControls.has(controls)) return;
  configuredControls.add(controls);

  const internals = controls as PointerLockTarget & {
    onPointerlockError: () => void;
  };
  internals.onPointerlockError = onDenied;
  controls.lock = () => {
    // Older browsers return undefined and only fire pointerlockerror.
    void Promise.resolve(controls.domElement?.requestPointerLock()).catch(
      onDenied,
    );
  };
}
