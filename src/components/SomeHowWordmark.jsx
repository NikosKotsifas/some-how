import React from 'react';

/**
 * Custom ultra-bold geometric Swiss wordmark for SOME.HOW
 * Each letter is an individual <path> so GSAP can animate/stagger/squish each glyph independently,
 * matching noth.in's signature hero, loader, and footer SVG wordmark mechanics.
 */
export function SomeHowWordmark({
  className = '',
  dotColor = '#FF3B00',
  interactiveHover = false,
  onLetterEnter
}) {
  const handleEnter = (e) => {
    if (interactiveHover && onLetterEnter) {
      onLetterEnter(e.currentTarget);
    }
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1820 294"
      fill="none"
      className={className}
      aria-label="SOME.HOW"
    >
      {/* S */}
      <path
        className="sh-glyph sh-letter"
        onMouseEnter={handleEnter}
        d="M114 4C50 4 6 38 6 88C6 138 46 162 110 174C152 182 168 192 168 210C168 228 148 240 114 240C76 240 54 224 50 198H0C4 258 48 290 116 290C184 290 228 256 228 202C228 150 186 126 120 114C78 106 64 96 64 78C64 62 82 50 112 50C144 50 164 64 168 88H222C218 34 176 4 114 4Z"
        fill="currentColor"
      />
      {/* O */}
      <path
        className="sh-glyph sh-letter"
        onMouseEnter={handleEnter}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M382 4C300 4 246 62 246 147C246 232 300 290 382 290C464 290 518 232 518 147C518 62 464 4 382 4ZM382 62C428 62 456 96 456 147C456 198 428 232 382 232C336 232 308 198 308 147C308 96 336 62 382 62Z"
        fill="currentColor"
      />
      {/* M */}
      <path
        className="sh-glyph sh-letter"
        onMouseEnter={handleEnter}
        d="M542 10V284H600V112L662 284H708L770 112V284H828V10H742L685 178L628 10H542Z"
        fill="currentColor"
      />
      {/* E */}
      <path
        className="sh-glyph sh-letter"
        onMouseEnter={handleEnter}
        d="M858 10V284H1058V228H920V172H1040V118H920V66H1056V10H858Z"
        fill="currentColor"
      />
      {/* . (Signature Dot) */}
      <path
        className="sh-glyph sh-dot"
        onMouseEnter={handleEnter}
        d="M1118 212C1096 212 1080 228 1080 250C1080 272 1096 288 1118 288C1140 288 1156 272 1156 250C1156 228 1140 212 1118 212Z"
        fill={dotColor}
      />
      {/* H */}
      <path
        className="sh-glyph sh-letter"
        onMouseEnter={handleEnter}
        d="M1182 10V284H1244V174H1340V284H1402V10H1340V116H1244V10H1182Z"
        fill="currentColor"
      />
      {/* O */}
      <path
        className="sh-glyph sh-letter"
        onMouseEnter={handleEnter}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1540 4C1462 4 1412 62 1412 147C1412 232 1462 290 1540 290C1618 290 1668 232 1668 147C1668 62 1618 4 1540 4ZM1540 62C1584 62 1608 96 1608 147C1608 198 1584 232 1540 232C1496 232 1472 198 1472 147C1472 96 1496 62 1540 62Z"
        fill="currentColor"
      />
      {/* W */}
      <path
        className="sh-glyph sh-letter"
        onMouseEnter={handleEnter}
        d="M1672 10L1702 284H1754L1778 134L1802 284H1854L1884 10H1832L1816 176L1794 40H1762L1740 176L1724 10H1672Z"
        transform="translate(-68, 0)"
        fill="currentColor"
      />
    </svg>
  );
}
