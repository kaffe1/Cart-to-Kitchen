import {
  getConsoleFunction,
  setConsoleFunction,
  type WebGLRenderer,
} from 'three';

const configuredRenderers = new WeakSet<WebGLRenderer>();
const ignoreExpectedDisposalMessage = () => undefined;
type ThreeConsoleFunction = Parameters<typeof setConsoleFunction>[0];
const readThreeConsoleFunction = getConsoleFunction as () =>
  | ThreeConsoleFunction
  | null;
const writeThreeConsoleFunction = setConsoleFunction as (
  handler: ThreeConsoleFunction | null,
) => void;

/**
 * React Three Fiber deliberately loses the WebGL context when a Canvas is
 * unmounted so the browser can reclaim its GPU resources immediately. Three
 * reports that expected lifecycle event as a normal log message. Suppress
 * Three's logger only during that deliberate disposal event; genuine context-
 * loss events still use the normal logger.
 */
export function configureRendererDisposal(renderer: WebGLRenderer): void {
  if (configuredRenderers.has(renderer)) return;
  configuredRenderers.add(renderer);

  const disposal = {
    intentional: false,
    isFiltering: false,
    previousConsoleFunction: null as ThreeConsoleFunction | null,
  };
  const finishIntentionalContextLoss = () => {
    if (!disposal.intentional || !disposal.isFiltering) return;
    writeThreeConsoleFunction(disposal.previousConsoleFunction);
    disposal.previousConsoleFunction = null;
    disposal.isFiltering = false;
    disposal.intentional = false;
  };
  renderer.domElement.addEventListener(
    'webglcontextlost',
    finishIntentionalContextLoss,
  );

  const forceContextLoss = renderer.forceContextLoss.bind(renderer);
  renderer.forceContextLoss = () => {
    disposal.intentional = true;
    disposal.previousConsoleFunction = readThreeConsoleFunction();
    writeThreeConsoleFunction(ignoreExpectedDisposalMessage);
    disposal.isFiltering = true;
    forceContextLoss();
    globalThis.setTimeout(finishIntentionalContextLoss, 1_000);
  };
}
