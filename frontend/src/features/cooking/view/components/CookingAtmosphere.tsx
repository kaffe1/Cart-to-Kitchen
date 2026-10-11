/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Inline SVG needs an accessible image role. */
import type { CSSProperties } from 'react';

export function CookingAtmosphere() {
  const positions = [4, 9, 14, 19, 24, 29, 34, 66, 71, 76, 81, 86, 91, 96, 7, 17, 27, 32, 68, 73, 83, 93, 43, 57];
  return <div className="cooking-bubbles" aria-hidden="true">{positions.map((x, index) =>
    <span key={index} style={{ '--x': `${x}%`, '--size': `${x > 36 && x < 64 ? 18 : 24 + index % 5 * 15}px`, '--duration': `${3 + index % 7 * .45}s`, '--delay': `${-index * .7}s`, '--drift-one': `${x < 50 ? -18 : 18}px`, '--drift-two': `${x < 50 ? 12 : -12}px` } as CSSProperties} />,
  )}</div>;
}

export function CookingIllustration() {
  return <svg className="cooking-illustration" viewBox="0 0 280 190" role="img" aria-label="A gently simmering pot with rising steam">
    <ellipse cx="140" cy="172" rx="81" ry="9" fill="#d8dfca" />
    <g className="pot-steam" fill="none" stroke="#9aaf98" strokeWidth="5" strokeLinecap="round">
      <path d="M112 66c-20-17 19-23 0-44" />
      <path d="M141 60c-20-17 19-23 0-44" />
      <path d="M170 66c-20-17 19-23 0-44" />
    </g>
    <g className="pot-body">
      <path d="M77 99H63c-23 0-23 27 2 27h12M203 99h14c23 0 23 27-2 27h-12" fill="none" stroke="#456550" strokeWidth="10" />
      <path d="M74 91h132l-9 54q-3 20-26 20h-62q-23 0-26-20z" fill="#648767" />
      <path d="M91 104l5 35q2 11 13 12" fill="none" stroke="#92ad82" strokeWidth="7" strokeLinecap="round" />
      <ellipse cx="140" cy="91" rx="67" ry="14" fill="#385845" />
      <ellipse cx="140" cy="92" rx="58" ry="9" fill="#e4b65b" />
      <circle className="soup-bubble" cx="116" cy="90" r="4" fill="#fff1bb" />
      <circle className="soup-bubble second" cx="156" cy="94" r="3" fill="#fff1bb" />
      <path className="cooking-spoon" d="M165 90l24-42" stroke="#ad7549" strokeWidth="8" strokeLinecap="round" />
      <path d="M114 131q7 8 14 0m24 0q7 8 14 0" stroke="#294634" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M133 145q7 6 14 0" stroke="#294634" strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  </svg>;
}
