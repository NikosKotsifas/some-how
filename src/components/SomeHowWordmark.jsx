import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { LOADER_3D_OBJECTS } from '../data/studioData';

// Bold condensed display geometry for SOME.HOW (2020 x 294 viewBox),
// matching 1:1 with the 6 bespoke orthographic 3D luxury renders.
const O_PATH_TEMPLATE = (dx) => {
  const x = (v) => (dx + v).toFixed(2);
  // Outer stadium capsule: width 246 (0..246), height 294 (0..294)
  // Inner stadium capsule counter hole: width 70 (88..158), height 166 (64..230),
  // giving 88px vertical stems and 64px top/bottom arches.
  return (
    `M${x(123)} 0` +
    `C${x(198)} 0 ${x(246)} 44 ${x(246)} 114` +
    `V180` +
    `C${x(246)} 250 ${x(198)} 294 ${x(123)} 294` +
    `C${x(48)} 294 ${x(0)} 250 ${x(0)} 180` +
    `V114` +
    `C${x(0)} 44 ${x(48)} 0 ${x(123)} 0Z` +
    `M${x(123)} 230` +
    `C${x(144)} 230 ${x(158)} 216 ${x(158)} 192` +
    `V102` +
    `C${x(158)} 78 ${x(144)} 64 ${x(123)} 64` +
    `C${x(102)} 64 ${x(88)} 78 ${x(88)} 102` +
    `V192` +
    `C${x(88)} 216 ${x(102)} 230 ${x(123)} 230Z`
  );
};

const H_PATH_TEMPLATE = (dx) => {
  const s = dx - 727.668;
  const x = (v) => (v + s).toFixed(3);
  return `M${x(971.793)} 7.97076C${x(972.7)} 7.97076 ${x(973.478)} 8.35958 ${x(974.126)} 9.13721C${x(974.904)} 9.78524 ${x(975.292)} 10.5629 ${x(975.292)} 11.4701V283.253C${x(975.292)} 284.16 ${x(974.904)} 285.003 ${x(974.126)} 285.78C${x(973.478)} 286.428 ${x(972.7)} 286.752 ${x(971.793)} 286.752H${x(897.638)}C${x(896.731)} 286.752 ${x(895.888)} 286.428 ${x(895.111)} 285.78C${x(894.463)} 285.003 ${x(894.139)} 284.16 ${x(894.139)} 283.253V180.994C${x(894.139)} 180.087 ${x(893.75)} 179.309 ${x(892.972)} 178.661C${x(892.324)} 177.884 ${x(891.547)} 177.495 ${x(890.639)} 177.495H${x(811.126)}C${x(808.793)} 177.495 ${x(807.627)} 178.597 ${x(807.627)} 180.8V283.253C${x(807.627)} 284.16 ${x(807.303)} 285.003 ${x(806.655)} 285.78C${x(806.007)} 286.428 ${x(805.164)} 286.752 ${x(804.128)} 286.752H${x(731.167)}C${x(730.26)} 286.752 ${x(729.418)} 286.428 ${x(728.64)} 285.78C${x(727.992)} 285.003 ${x(727.668)} 284.16 ${x(727.668)} 283.253V11.4701C${x(727.668)} 10.5629 ${x(727.992)} 9.78524 ${x(728.64)} 9.13721C${x(729.418)} 8.35958 ${x(730.26)} 7.97076 ${x(731.167)} 7.97076H${x(804.128)}C${x(805.164)} 7.97076 ${x(806.007)} 8.35958 ${x(806.655)} 9.13721C${x(807.303)} 9.78524 ${x(807.627)} 10.5629 ${x(807.627)} 11.4701V110.23C${x(807.627)} 112.433 ${x(808.793)} 113.535 ${x(811.126)} 113.535H${x(890.639)}C${x(891.547)} 113.535 ${x(892.324)} 113.211 ${x(892.972)} 112.562C${x(893.75)} 111.914 ${x(894.139)} 111.072 ${x(894.139)} 110.035V11.4701C${x(894.139)} 10.5629 ${x(894.463)} 9.78524 ${x(895.111)} 9.13721C${x(895.888)} 8.35958 ${x(896.731)} 7.97076 ${x(897.638)} 7.97076H${x(971.793)}Z`;
};

export const LETTER_DEFS = [
  {
    id: 's',
    char: 'S',
    x: 0,
    w: 232,
    cx: 116,
    cy: 147,
    d: 'M117 0C176 0 222 31 226 86C226.2 88.5 224.5 90 222 90H156C153.5 90 152 88.5 151 86C147 66 133 56 114 56C92 56 77 66 77 81C77 95 90 103 124 111L152 118C202 130 232 156 232 203C232 259 185 293.168 118 293.168C50 293.168 3 258 0 199C-0.2 196.5 1.5 195 4 195H70C72.5 195 74 196.5 75 199C79 223 95 236 119 236C143 236 160 225 160 208C160 192 147 184 113 175L82 168C31 156 5 130 5 85C5 33 51 0 117 0Z',
  },
  {
    id: 'o1',
    char: 'O',
    x: 250,
    w: 246,
    cx: 373,
    cy: 147,
    d: O_PATH_TEMPLATE(250),
  },
  {
    id: 'm',
    char: 'M',
    x: 514,
    w: 322,
    cx: 675,
    cy: 147,
    d: 'M517.5 7.387C515.2 7.387 514 8.489 514 10.692V282.864C514 285.068 515.2 286.169 517.5 286.169H584.5C586.8 286.169 588 285.068 588 282.864V132.5C588 130.2 590.5 129.5 591.8 131.4L645.5 282.864C646.2 285.068 647.6 286.169 650 286.169H700C702.4 286.169 703.8 285.068 704.5 282.864L758.2 131.4C759.5 129.5 762 130.2 762 132.5V282.864C762 285.068 763.2 286.169 765.5 286.169H832.5C834.8 286.169 836 285.068 836 282.864V10.692C836 8.489 834.8 7.387 832.5 7.387H739.5C737.2 7.387 735.8 8.489 735 10.692L677.2 184.5C676.4 186.8 673.6 186.8 672.8 184.5L615 10.692C614.2 8.489 612.8 7.387 610.5 7.387H517.5Z',
  },
  {
    id: 'e',
    char: 'E',
    x: 856,
    w: 206,
    cx: 959,
    cy: 147,
    d: 'M859.5 7.387C857.2 7.387 856 8.489 856 10.692V282.864C856 285.068 857.2 286.169 859.5 286.169H1058.5C1060.8 286.169 1062 285.068 1062 282.864V226.5C1062 224.2 1060.8 223 1058.5 223H928.5C926.2 223 925 221.8 925 219.5V177.5C925 175.2 926.2 174 928.5 174H1040.5C1042.8 174 1044 172.8 1044 170.5V119.5C1044 117.2 1042.8 116 1040.5 116H928.5C926.2 116 925 114.8 925 112.5V74C925 71.7 926.2 70.5 928.5 70.5H1058.5C1060.8 70.5 1062 69.3 1062 67V10.692C1062 8.489 1060.8 7.387 1058.5 7.387H859.5Z',
  },
  {
    id: 'dot',
    char: '.',
    x: 1076,
    w: 80,
    cx: 1116,
    cy: 245,
    isDot: true,
    d: 'M1079.5 210C1077.2 210 1076 211.2 1076 213.5V282.864C1076 285.068 1077.2 286.169 1079.5 286.169H1152.5C1154.8 286.169 1156 285.068 1156 282.864V213.5C1156 211.2 1154.8 210 1152.5 210H1079.5Z',
  },
  {
    id: 'h',
    char: 'H',
    x: 1170,
    w: 248,
    cx: 1294,
    cy: 147,
    d: H_PATH_TEMPLATE(1170),
  },
  {
    id: 'o2',
    char: 'O',
    x: 1436,
    w: 246,
    cx: 1559,
    cy: 147,
    d: O_PATH_TEMPLATE(1436),
  },
  {
    id: 'w',
    char: 'W',
    x: 1700,
    w: 320,
    cx: 1860,
    cy: 147,
    d: 'M1703.5 7.387C1701.2 7.387 1700 8.8 1700.5 11.2L1753.5 282.864C1754 285.068 1755.5 286.169 1758 286.169H1822C1824.5 286.169 1826 285.068 1826.6 282.864L1858.5 138.5C1859.1 136.2 1860.9 136.2 1861.5 138.5L1893.4 282.864C1894 285.068 1895.5 286.169 1898 286.169H1962C1964.5 286.169 1966 285.068 1966.5 282.864L2019.5 11.2C2020 8.8 2018.8 7.387 2016.5 7.387H1954C1951.5 7.387 1950 8.489 1949.5 10.692L1924.5 178.5C1924 180.8 1921.5 180.8 1921 178.5L1886.5 10.692C1886 8.489 1884.5 7.387 1882 7.387H1838C1835.5 7.387 1834 8.489 1833.5 10.692L1799 178.5C1798.5 180.8 1796 180.8 1795.5 178.5L1770.5 10.692C1770 8.489 1768.5 7.387 1766 7.387H1703.5Z',
  },
];

// 1. Navbar collapsible logo (SOME.HOW <-> S.HOW on scroll/hover)
export function SomeHowNavLogo() {
  const svgRef = useRef(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const midChars = svg.querySelectorAll('.nav-o1, .nav-m, .nav-e');
    const tailChars = svg.querySelectorAll('.nav-dot, .nav-h, .nav-o2, .nav-w');

    gsap.set(midChars, { transformOrigin: 'left center' });
    const tl = gsap.timeline({ paused: true });
    tl.to(
      midChars,
      {
        scaleX: 0,
        opacity: 0,
        duration: 0.45,
        stagger: 0.025,
        ease: 'power3.inOut',
      },
      0
    ).to(
      tailChars,
      {
        x: -820,
        duration: 0.5,
        ease: 'power3.inOut',
      },
      0.04
    );

    let collapsed = false;
    let hovered = false;

    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      if (y > 60 && !collapsed && !hovered) {
        collapsed = true;
        tl.play();
      } else if (y <= 60 && collapsed) {
        collapsed = false;
        tl.reverse();
      }
    };

    const onEnter = () => {
      hovered = true;
      if (collapsed) tl.reverse();
    };
    const onLeave = () => {
      hovered = false;
      const y = window.scrollY || document.documentElement.scrollTop;
      if (y > 60) {
        collapsed = true;
        tl.play();
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    svg.addEventListener('mouseenter', onEnter);
    svg.addEventListener('mouseleave', onLeave);

    return () => {
      window.removeEventListener('scroll', onScroll);
      svg.removeEventListener('mouseenter', onEnter);
      svg.removeEventListener('mouseleave', onLeave);
      tl.kill();
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 2020 294"
      fill="none"
      className="nav-logo"
      aria-label="SOME.HOW"
    >
      {LETTER_DEFS.map((l) => (
        <path
          key={l.id}
          d={l.d}
          fill="currentColor"
          className={`nav-char nav-${l.id}`}
        />
      ))}
    </svg>
  );
}

// 2. Monumental 1:1 Opening Loader Logo (viewBox 0 0 2020 294 — exact same size, position, and LETTER_DEFS geometry as the Hero logo underneath)
export const LOADER_LUXURY_EDITIONS = [
  {
    id: 'liquid-mercury',
    code: '01',
    title: 'LIQUID MERCURY // PLATINUM CHROME',
    accent: '#e2e8f0',
  },
  {
    id: 'champagne-gold',
    code: '02',
    title: '24K CHAMPAGNE GOLD // BRUSHED TITANIUM',
    accent: '#f5d08a',
  },
  {
    id: 'obsidian-mylar',
    code: '03',
    title: 'OBSIDIAN MYLAR // SPECULAR MONOLITH',
    accent: '#a1a1aa',
  },
  {
    id: 'smoked-crystal',
    code: '04',
    title: 'SMOKED CRYSTAL // DICHROIC PRISM',
    accent: '#c4b5fd',
  },
  {
    id: 'anodized-cobalt',
    code: '05',
    title: 'ANODIZED COBALT // CRYOGENIC SILVER',
    accent: '#60a5fa',
  },
  {
    id: 'basalt-ember',
    code: '06',
    title: 'VOLCANIC BASALT // MOLTEN AMBER',
    accent: '#fb923c',
  },
];

export function SomeHowLoaderMonumentLogo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 2020 294"
      fill="none"
      className="loader-monument-svg"
      aria-label="SOME.HOW"
    >
      <defs>
        {/* Exact 1:1 LETTER_DEFS ClipPath with per-letter kinetic stagger paths */}
        <clipPath id="loader-somehow-exact-clip">
          {LETTER_DEFS.map((l) => (
            <path
              key={l.id}
              d={l.d}
              className={`loader-char-clip ${l.isDot ? 'loader-dot-clip' : ''}`}
            />
          ))}
        </clipPath>

        {/* 01: Liquid Mercury Platinum */}
        <linearGradient id="lux-grad-mercury" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#090a0f" />
          <stop offset="22%" stopColor="#cbd5e1" />
          <stop offset="38%" stopColor="#ffffff" />
          <stop offset="54%" stopColor="#1e293b" />
          <stop offset="76%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>

        {/* 02: 24K Champagne Gold & Brushed Titanium */}
        <linearGradient id="lux-grad-gold" x1="0%" y1="0%" x2="100%" y2="85%">
          <stop offset="0%" stopColor="#141418" />
          <stop offset="24%" stopColor="#85581A" />
          <stop offset="44%" stopColor="#FDE68A" />
          <stop offset="58%" stopColor="#FFFBEB" />
          <stop offset="75%" stopColor="#B47B2B" />
          <stop offset="100%" stopColor="#18181c" />
        </linearGradient>

        {/* 03: Obsidian Mylar & Specular Silver */}
        <linearGradient id="lux-grad-obsidian" x1="0%" y1="10%" x2="100%" y2="90%">
          <stop offset="0%" stopColor="#050507" />
          <stop offset="30%" stopColor="#18181b" />
          <stop offset="48%" stopColor="#f4f4f5" />
          <stop offset="56%" stopColor="#09090b" />
          <stop offset="82%" stopColor="#52525b" />
          <stop offset="100%" stopColor="#050507" />
        </linearGradient>

        {/* 04: Smoked Crystal & Dichroic Prism */}
        <linearGradient id="lux-grad-crystal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="25%" stopColor="#38bdf8" />
          <stop offset="48%" stopColor="#f8fafc" />
          <stop offset="68%" stopColor="#c084fc" />
          <stop offset="88%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#090d16" />
        </linearGradient>

        {/* 05: Anodized Royal Cobalt & Cryogenic Platinum */}
        <linearGradient id="lux-grad-cobalt" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#061238" />
          <stop offset="28%" stopColor="#1d4ed8" />
          <stop offset="50%" stopColor="#eff6ff" />
          <stop offset="68%" stopColor="#2563eb" />
          <stop offset="88%" stopColor="#93c5fd" />
          <stop offset="100%" stopColor="#040b24" />
        </linearGradient>

        {/* 06: Volcanic Basalt & Molten Amber */}
        <linearGradient id="lux-grad-ember" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0c0a09" />
          <stop offset="28%" stopColor="#7c2d12" />
          <stop offset="50%" stopColor="#fb923c" />
          <stop offset="62%" stopColor="#fff7ed" />
          <stop offset="82%" stopColor="#9a3412" />
          <stop offset="100%" stopColor="#0c0a09" />
        </linearGradient>

        {/* Sweeping Studio Softbox Specular Bar */}
        <linearGradient id="lux-specular-sweep" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="42%" stopColor="rgba(255,255,255,0.04)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.88)" />
          <stop offset="58%" stopColor="rgba(255,255,255,0.04)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>

      {/* All layers inside this group are 100.00% clipped to the exact LETTER_DEFS silhouette */}
      <g clipPath="url(#loader-somehow-exact-clip)">
        {/* Base Crisp White Monumental Layer (matches Hero base layer 1:1) */}
        <rect x="0" y="0" width="2020" height="294" fill="#ffffff" className="loader-base-white" />

        {/* Edition 01: Liquid Mercury Platinum + Studio Reflection Texture */}
        <g className="loader-edition-layer" data-edition="0">
          <rect x="0" y="0" width="2020" height="294" fill="url(#lux-grad-mercury)" />
          <image
            href="somehow-assets/hero-09.jpg"
            x="-60"
            y="-180"
            width="2140"
            height="654"
            preserveAspectRatio="none"
            opacity="0.62"
            style={{ mixBlendMode: 'screen' }}
          />
        </g>

        {/* Edition 02: 24K Champagne Gold & Brushed Titanium */}
        <g className="loader-edition-layer" data-edition="1" style={{ opacity: 0 }}>
          <rect x="0" y="0" width="2020" height="294" fill="url(#lux-grad-gold)" />
          <image
            href="somehow-assets/hero-09.jpg"
            x="-60"
            y="-180"
            width="2140"
            height="654"
            preserveAspectRatio="none"
            opacity="0.48"
            style={{ mixBlendMode: 'overlay' }}
          />
        </g>

        {/* Edition 03: Obsidian Mylar Sculpture */}
        <g className="loader-edition-layer" data-edition="2" style={{ opacity: 0 }}>
          <rect x="0" y="0" width="2020" height="294" fill="url(#lux-grad-obsidian)" />
          <image
            href="somehow-assets/hero-01.jpg"
            x="-60"
            y="-180"
            width="2140"
            height="654"
            preserveAspectRatio="none"
            opacity="0.78"
            style={{ mixBlendMode: 'lighten' }}
          />
        </g>

        {/* Edition 04: Smoked Crystal & Dichroic Prism */}
        <g className="loader-edition-layer" data-edition="3" style={{ opacity: 0 }}>
          <rect x="0" y="0" width="2020" height="294" fill="url(#lux-grad-crystal)" />
          <image
            href="somehow-assets/hero-02.jpg"
            x="-60"
            y="-180"
            width="2140"
            height="654"
            preserveAspectRatio="none"
            opacity="0.58"
            style={{ mixBlendMode: 'screen' }}
          />
        </g>

        {/* Edition 05: Anodized Royal Cobalt & Cryogenic Silver */}
        <g className="loader-edition-layer" data-edition="4" style={{ opacity: 0 }}>
          <rect x="0" y="0" width="2020" height="294" fill="url(#lux-grad-cobalt)" />
          <image
            href="somehow-assets/hero-03.jpg"
            x="-60"
            y="-180"
            width="2140"
            height="654"
            preserveAspectRatio="none"
            opacity="0.68"
            style={{ mixBlendMode: 'screen' }}
          />
        </g>

        {/* Edition 06: Volcanic Basalt & Molten Amber */}
        <g className="loader-edition-layer" data-edition="5" style={{ opacity: 0 }}>
          <rect x="0" y="0" width="2020" height="294" fill="url(#lux-grad-ember)" />
          <image
            href="somehow-assets/hero-01.jpg"
            x="-60"
            y="-180"
            width="2140"
            height="654"
            preserveAspectRatio="none"
            opacity="0.55"
            style={{ mixBlendMode: 'screen' }}
          />
        </g>

        {/* 3D Inner Architectural Chamfer Bevel along exact LETTER_DEFS edges */}
        <g className="loader-3d-bevel-strokes" style={{ pointerEvents: 'none' }}>
          {LETTER_DEFS.map((l) => (
            <path
              key={`bevel-outer-${l.id}`}
              d={l.d}
              fill="none"
              stroke="rgba(0, 0, 0, 0.55)"
              strokeWidth="16"
              strokeLinejoin="round"
            />
          ))}
          {LETTER_DEFS.map((l) => (
            <path
              key={`bevel-spec-${l.id}`}
              d={l.d}
              fill="none"
              stroke="rgba(255, 255, 255, 0.72)"
              strokeWidth="5.5"
              strokeLinejoin="round"
            />
          ))}
        </g>

        {/* Sweeping Studio Softbox Light Bar */}
        <rect
          x="-900"
          y="0"
          width="900"
          height="294"
          fill="url(#lux-specular-sweep)"
          className="loader-specular-bar"
          style={{ mixBlendMode: 'screen' }}
        />
      </g>
    </svg>
  );
}

export function LoaderLeftGlyph() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      viewBox="0 0 222 294"
      fill="none"
      className="n-load"
      aria-hidden="true"
    >
      <path d={LETTER_DEFS[0].d} fill="currentColor" />
    </svg>
  );
}

export function LoaderRightGlyph() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      viewBox="0 0 76 77"
      fill="none"
      className="apos-load"
      aria-hidden="true"
    >
      <rect x="0" y="0" width="76" height="76.169" rx="3.5" fill="currentColor" />
    </svg>
  );
}

export function SomeHowHeroStaticSvg() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      viewBox="0 0 2020 294"
      preserveAspectRatio="none"
      fill="none"
      className="nothin-hero-svg"
      aria-label="SOME.HOW"
    >
      {LETTER_DEFS.map((l) => (
        <path
          key={l.id}
          d={l.d}
          fill="currentColor"
          className={l.isDot ? 'nothin-apos' : ''}
        />
      ))}
    </svg>
  );
}

// 3. Hero Living Wordmark
export function SomeHowHeroLogo({ revealed }) {
  const wrapRef = useRef(null);
  const svgRef = useRef(null);
  const [activeMorphs, setActiveMorphs] = useState(() => ({
    1: { objIdx: 0, rot: -12 },
    4: { objIdx: 2, rot: 14 },
    6: { objIdx: 1, rot: -8 },
  }));

  const objCursorRef = useRef(3);
  const slotHistoryRef = useRef([1, 4, 6]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const paths = [...svg.querySelectorAll('.hero-letter-group:not(.hero-dot-group)')];
    const dot = svg.querySelector('.hero-dot-group');

    if (!revealed) {
      gsap.set(paths, { autoAlpha: 0, yPercent: 120 });
      if (dot) gsap.set(dot, { autoAlpha: 0, scale: 0, transformOrigin: 'center center' });
      return;
    }

    const shuffled = paths.slice().sort(() => Math.random() - 0.5);
    gsap.fromTo(
      shuffled,
      { autoAlpha: 1, yPercent: 120 },
      {
        yPercent: 0,
        duration: 1.6,
        ease: 'power4.inOut',
        stagger: 0.065,
        delay: 0.1,
      }
    );
    if (dot) {
      gsap.fromTo(
        dot,
        { autoAlpha: 1, scale: 0, transformOrigin: 'center center' },
        {
          scale: 1,
          duration: 0.65,
          ease: 'back.out(1.2)',
          delay: 1.1,
        }
      );
    }
  }, [revealed]);

  useEffect(() => {
    if (!revealed) return;

    const candidateSlots = [0, 1, 2, 3, 4, 5, 6, 7];
    const interval = setInterval(() => {
      setActiveMorphs((prev) => {
        const currentSlots = Object.keys(prev).map(Number);
        const available = candidateSlots.filter((s) => !currentSlots.includes(s));
        const nextSlot =
          available[Math.floor(Math.random() * available.length)] ??
          candidateSlots[Math.floor(Math.random() * candidateSlots.length)];

        const nextObjIdx = objCursorRef.current % LOADER_3D_OBJECTS.length;
        objCursorRef.current += 1;

        const nextHistory = [...slotHistoryRef.current, nextSlot];
        const maxSimultaneous = 3;
        while (nextHistory.length > maxSimultaneous) {
          nextHistory.shift();
        }
        slotHistoryRef.current = nextHistory;

        const updated = {};
        nextHistory.forEach((slot) => {
          if (slot === nextSlot || !prev[slot]) {
            updated[slot] = {
              objIdx: nextObjIdx,
              rot: Math.round((Math.random() - 0.5) * 32),
              key: `${slot}-${nextObjIdx}-${Date.now()}`,
            };
          } else {
            updated[slot] = prev[slot];
          }
        });
        return updated;
      });
    }, 850);

    return () => clearInterval(interval);
  }, [revealed]);

  const handleLetterEnter = (idx) => {
    const nextObjIdx = objCursorRef.current % LOADER_3D_OBJECTS.length;
    objCursorRef.current += 1;
    setActiveMorphs((prev) => {
      const next = { ...prev };
      const keys = Object.keys(next).map(Number);
      if (!keys.includes(idx) && keys.length >= 3) {
        delete next[keys[0]];
      }
      next[idx] = {
        objIdx: nextObjIdx,
        rot: Math.round((Math.random() - 0.5) * 36),
        key: `${idx}-${nextObjIdx}-${Date.now()}`,
      };
      return next;
    });
  };

  return (
    <div ref={wrapRef} className="nothin-hero-w somehow-hero-protean">
      <svg
        ref={svgRef}
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        viewBox="0 0 2020 294"
        fill="none"
        className="nothin-hero-svg"
      >
        <defs>
          <clipPath id="somehow-hero-text-clip">
            {LETTER_DEFS.map((l) => (
              <path key={l.id} d={l.d} />
            ))}
          </clipPath>
        </defs>

        {LETTER_DEFS.map((l, idx) => {
          const isMorphed = Boolean(activeMorphs[idx]);
          return (
            <g
              key={l.id}
              className={`hero-letter-group ${l.isDot ? 'hero-dot-group' : ''}`}
              onMouseEnter={() => handleLetterEnter(idx)}
              style={{ cursor: 'pointer' }}
            >
              <path
                d={l.d}
                fill="currentColor"
                className={`hero-letter-path ${isMorphed ? 'is-morphed-letter' : ''}`}
              />
            </g>
          );
        })}
      </svg>

      <div className="hero-3d-morph-layer" aria-hidden="true">
        {LETTER_DEFS.map((l, idx) => {
          const morph = activeMorphs[idx];
          if (!morph) return null;
          const obj = LOADER_3D_OBJECTS[morph.objIdx % LOADER_3D_OBJECTS.length];
          const leftPct = ((l.x + l.w / 2) / 2020) * 100;
          const widthPct = (Math.max(l.w, 190) / 2020) * 100 * 1.28;

          return (
            <div
              key={morph.key || `${idx}-${morph.objIdx}`}
              className="hero-3d-slot"
              style={{
                left: `${leftPct}%`,
                width: `${widthPct}%`,
                '--slot-rot': `${morph.rot}deg`,
              }}
              onMouseEnter={() => handleLetterEnter(idx)}
            >
              <img
                src={obj.src}
                alt={obj.alt}
                className="hero-3d-slot-img"
                draggable={false}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 4. Footer monumental wordmark with elastic squish on hover
export function SomeHowFooterLogo() {
  const wrapRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const paths = [...wrap.querySelectorAll('path')];
    paths.forEach((p) => gsap.set(p, { transformOrigin: '50% 50%' }));

    const handlers = [];
    paths.forEach((p) => {
      let busy = false;
      const onEnter = () => {
        if (busy) return;
        busy = true;
        gsap
          .timeline({
            onComplete: () => {
              busy = false;
            },
          })
          .to(p, { scale: 0.05, duration: 0.6, ease: 'power2.inOut' })
          .to(p, { scale: 1, duration: 1.8, ease: 'elastic.out(1, 0.8)' });
      };
      p.addEventListener('mouseenter', onEnter);
      handlers.push({ p, onEnter });
    });

    return () => {
      handlers.forEach(({ p, onEnter }) => {
        p.removeEventListener('mouseenter', onEnter);
        gsap.killTweensOf(p);
      });
    };
  }, []);

  return (
    <div ref={wrapRef} className="footer-svg-w">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        viewBox="0 0 2020 294"
        fill="none"
        className="footer-nothin-svg"
        aria-label="SOME.HOW"
      >
        {LETTER_DEFS.map((l) => (
          <path
            key={l.id}
            d={l.d}
            fill="currentColor"
            className={l.isDot ? 'nothin-apos' : ''}
          />
        ))}
      </svg>
    </div>
  );
}
