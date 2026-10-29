import React from 'react';

/**
 * High-craft 3D-shaded tactile SVG artifacts for the Preloader and the
 * Repulsive Physics Playground (.formes-w), customized in our
 * Swiss Editorial + Acid Lime (#D4FF00) + International Orange (#FF3B00) + Chrome palette.
 */
export const ARTIFACT_TYPES = [
  'chrome-asterisk',
  'acid-torus',
  'orange-cube',
  'metallic-pill',
  'wire-sphere',
  'liquid-star'
];

export function TactileArtifact({ type, className = '', style = {} }) {
  switch (type) {
    case 'chrome-asterisk':
      return (
        <svg viewBox="0 0 200 200" fill="none" className={className} style={style}>
          <defs>
            <radialGradient id="chromeAst" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="35%" stopColor="#B8BEC6" />
              <stop offset="70%" stopColor="#1E2024" />
              <stop offset="100%" stopColor="#090A0B" />
            </radialGradient>
          </defs>
          <g filter="drop-shadow(0 18px 28px rgba(0,0,0,0.22))">
            <rect x="82" y="14" width="36" height="172" rx="18" fill="url(#chromeAst)" />
            <rect
              x="82"
              y="14"
              width="36"
              height="172"
              rx="18"
              transform="rotate(60 100 100)"
              fill="url(#chromeAst)"
            />
            <rect
              x="82"
              y="14"
              width="36"
              height="172"
              rx="18"
              transform="rotate(120 100 100)"
              fill="url(#chromeAst)"
            />
            <circle cx="100" cy="100" r="24" fill="#D4FF00" />
          </g>
        </svg>
      );

    case 'acid-torus':
      return (
        <svg viewBox="0 0 200 200" fill="none" className={className} style={style}>
          <defs>
            <radialGradient id="acidTorusGrad" cx="32%" cy="28%" r="70%">
              <stop offset="0%" stopColor="#F5FF9E" />
              <stop offset="45%" stopColor="#D4FF00" />
              <stop offset="85%" stopColor="#6E8A00" />
              <stop offset="100%" stopColor="#1D2600" />
            </radialGradient>
          </defs>
          <g filter="drop-shadow(0 18px 28px rgba(0,0,0,0.2))">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M100 18C54.7 18 18 54.7 18 100C18 145.3 54.7 182 100 182C145.3 182 182 145.3 182 100C182 54.7 145.3 18 100 18ZM100 64C80.1 64 64 80.1 64 100C64 119.9 80.1 136 100 136C119.9 136 136 119.9 136 100C136 80.1 119.9 64 100 64Z"
              fill="url(#acidTorusGrad)"
            />
            <ellipse
              cx="74"
              cy="52"
              rx="22"
              ry="8"
              transform="rotate(-28 74 52)"
              fill="rgba(255,255,255,0.65)"
            />
          </g>
        </svg>
      );

    case 'orange-cube':
      return (
        <svg viewBox="0 0 200 200" fill="none" className={className} style={style}>
          <defs>
            <linearGradient id="orangeCubeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF7A4D" />
              <stop offset="50%" stopColor="#FF3B00" />
              <stop offset="100%" stopColor="#7A1800" />
            </linearGradient>
          </defs>
          <g filter="drop-shadow(0 18px 28px rgba(255,59,0,0.25))">
            <rect
              x="28"
              y="28"
              width="144"
              height="144"
              rx="38"
              transform="rotate(12 100 100)"
              fill="url(#orangeCubeGrad)"
            />
            <circle cx="76" cy="72" r="18" fill="rgba(255,255,255,0.35)" />
            <path
              d="M65 125C82 142 118 142 135 125"
              stroke="#0D0D0D"
              strokeWidth="8"
              strokeLinecap="round"
            />
          </g>
        </svg>
      );

    case 'metallic-pill':
      return (
        <svg viewBox="0 0 200 200" fill="none" className={className} style={style}>
          <defs>
            <linearGradient id="metalPill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="40%" stopColor="#D6D3CD" />
              <stop offset="75%" stopColor="#52525B" />
              <stop offset="100%" stopColor="#0D0D0D" />
            </linearGradient>
          </defs>
          <g filter="drop-shadow(0 16px 24px rgba(0,0,0,0.24))">
            <rect
              x="24"
              y="58"
              width="152"
              height="84"
              rx="42"
              transform="rotate(-24 100 100)"
              fill="url(#metalPill)"
              stroke="#0D0D0D"
              strokeWidth="3"
            />
            <line
              x1="100"
              y1="48"
              x2="100"
              y2="152"
              transform="rotate(-24 100 100)"
              stroke="#FF3B00"
              strokeWidth="5"
            />
          </g>
        </svg>
      );

    case 'wire-sphere':
      return (
        <svg viewBox="0 0 200 200" fill="none" className={className} style={style}>
          <g filter="drop-shadow(0 14px 22px rgba(0,0,0,0.18))">
            <circle cx="100" cy="100" r="76" fill="#0D0D0D" />
            <circle cx="100" cy="100" r="74" stroke="#D4FF00" strokeWidth="3" />
            <ellipse cx="100" cy="100" rx="74" ry="30" stroke="#D4FF00" strokeWidth="2.5" />
            <ellipse
              cx="100"
              cy="100"
              rx="30"
              ry="74"
              stroke="#FF3B00"
              strokeWidth="2.5"
            />
            <circle cx="100" cy="100" r="14" fill="#FF3B00" />
          </g>
        </svg>
      );

    case 'liquid-star':
    default:
      return (
        <svg viewBox="0 0 200 200" fill="none" className={className} style={style}>
          <defs>
            <radialGradient id="liquidStarGrad" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#FF3B00" />
              <stop offset="100%" stopColor="#121212" />
            </radialGradient>
          </defs>
          <path
            d="M100 10C108 62 138 92 190 100C138 108 108 138 100 190C92 138 62 108 10 100C62 92 92 62 100 10Z"
            fill="url(#liquidStarGrad)"
          />
        </svg>
      );
  }
}
