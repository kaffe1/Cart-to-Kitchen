/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- Scrollable instructions must be keyboard focusable. */
/* oxlint-disable jsx-a11y/no-noninteractive-element-interactions -- The scroll viewport yields to pointer, touch and keyboard input. */
import { useEffect, useRef, useState } from 'react';

export const STEP_INTERVAL_MS = 2000;

export function StepLyrics({ steps }: { steps: string[] }) {
  const [active, setActive] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const activeRef = useRef(0);
  const autoPlayingRef = useRef(true);
  const playbackTimerRef = useRef<number | null>(null);
  const schedulePlaybackRef = useRef<() => void>(() => undefined);
  const viewport = useRef<HTMLDivElement>(null);
  const items = useRef<Array<HTMLLIElement | null>>([]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      setReducedMotion(media.matches);
      if (media.matches) {
        autoPlayingRef.current = false;
        if (playbackTimerRef.current !== null)
          window.clearTimeout(playbackTimerRef.current);
      }
    };
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    function cancelPlayback() {
      if (playbackTimerRef.current !== null) {
        window.clearTimeout(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
    }

    function schedulePlayback() {
      cancelPlayback();
      if (!autoPlayingRef.current || !steps.length || activeRef.current >= steps.length - 1) return;
      playbackTimerRef.current = window.setTimeout(() => {
        playbackTimerRef.current = null;
        if (!autoPlayingRef.current) return;
        const next = activeRef.current + 1;
        activeRef.current = next;
        setActive(next);
        const item = items.current[next];
        const container = viewport.current;
        if (item && container)
          container.scrollTo({ top: item.offsetTop - container.clientHeight / 2 + item.clientHeight / 2, behavior: reducedMotion ? 'instant' : 'smooth' });
        if (next < steps.length - 1) schedulePlayback();
        else autoPlayingRef.current = false;
      }, STEP_INTERVAL_MS);
    }

    schedulePlaybackRef.current = schedulePlayback;
    schedulePlayback();
    return () => {
      cancelPlayback();
      schedulePlaybackRef.current = () => undefined;
    };
  }, [reducedMotion, steps.length]);

  function takeManualControl() {
    autoPlayingRef.current = false;
    if (playbackTimerRef.current !== null) {
      window.clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
  }

  function resumeAutoPlayback() {
    if (!reducedMotion && activeRef.current < steps.length - 1) {
      autoPlayingRef.current = true;
      schedulePlaybackRef.current();
    }
  }

  function selectVisibleStep() {
    const container = viewport.current;
    if (!container || autoPlayingRef.current) return;
    const center = container.scrollTop + container.clientHeight / 2;
    let closest = 0;
    let distance = Infinity;
    items.current.forEach((item, index) => {
      if (!item) return;
      const next = Math.abs(item.offsetTop + item.clientHeight / 2 - center);
      if (next < distance) { distance = next; closest = index; }
    });
    // Scrolling selects the displayed line without initiating another scroll.
    if (closest !== activeRef.current) {
      activeRef.current = closest;
      setActive(closest);
    }
  }
  return <section className="step-player" aria-label="Cooking instructions">
    <section
      ref={viewport}
      className="step-lyrics"
      tabIndex={0}
      aria-label="All recipe steps. Scroll to take control; move the pointer away to resume."
      onWheel={takeManualControl}
      onTouchStart={takeManualControl}
      onPointerDown={takeManualControl}
      onMouseLeave={resumeAutoPlayback}
      onKeyDown={(event) => {
        if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) takeManualControl();
      }}
      onScroll={selectVisibleStep}
    >
      <ol>{steps.map((step, index) => <li key={`${index}:${step}`} ref={(node) => { items.current[index] = node; }} className={index === active ? 'active' : ''} aria-current={index === active ? 'step' : undefined}>
        <span>{String(index + 1).padStart(2, '0')}</span><p>{step}</p>
      </li>)}</ol>
    </section>
  </section>;
}
