import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { LOADER_3D_OBJECTS } from '../data/studioData';

// Exact O and H geometry from noth.in's nothin-hero-svg (294px height),
// paired with matching 66px-stem, 3.5px-fillet geometric paths for S, M, E, ., W.
const O_PATH_TEMPLATE = (dx) => {
  // Original O in nothin-hero-svg spans x: 242.965 .. 529.523 (width 286.558)
  // We shift by (dx - 242.965)
  const s = dx - 242.965;
  const x = (v) => (v + s).toFixed(3);
  return `M${x(330.643)} 11.6645C${x(348.269)} 3.88817 ${x(366.803)} 0 ${x(386.244)} 0C${x(405.685)} 0 ${x(424.218)} 3.88817 ${x(441.845)} 11.6645C${x(459.471)} 19.4408 ${x(474.7)} 29.8741 ${x(487.531)} 42.9643C${x(500.362)} 56.0544 ${x(510.536)} 71.6719 ${x(518.053)} 89.8167C${x(525.7)} 107.832 ${x(529.523)} 126.754 ${x(529.523)} 146.584C${x(529.523)} 166.414 ${x(525.7)} 185.401 ${x(518.053)} 203.546C${x(510.536)} 221.561 ${x(500.362)} 237.113 ${x(487.531)} 250.204C${x(474.7)} 263.294 ${x(459.471)} 273.727 ${x(441.845)} 281.503C${x(424.218)} 289.28 ${x(405.685)} 293.168 ${x(386.244)} 293.168C${x(366.803)} 293.168 ${x(348.269)} 289.28 ${x(330.643)} 281.503C${x(313.017)} 273.727 ${x(297.788)} 263.294 ${x(284.957)} 250.204C${x(272.126)} 237.113 ${x(261.887)} 221.561 ${x(254.241)} 203.546C${x(246.723)} 185.401 ${x(242.965)} 166.414 ${x(242.965)} 146.584C${x(242.965)} 126.754 ${x(246.723)} 107.832 ${x(254.241)} 89.8167C${x(261.887)} 71.6719 ${x(272.126)} 56.0544 ${x(284.957)} 42.9643C${x(297.788)} 29.8741 ${x(313.017)} 19.4408 ${x(330.643)} 11.6645ZM${x(330.837)} 203.157C${x(346.131)} 218.839 ${x(364.6)} 226.68 ${x(386.244)} 226.68C${x(407.888)} 226.68 ${x(426.357)} 218.839 ${x(441.65)} 203.157C${x(456.944)} 187.475 ${x(464.59)} 168.617 ${x(464.59)} 146.584C${x(464.59)} 124.551 ${x(456.944)} 105.693 ${x(441.65)} 90.0111C${x(426.357)} 74.3288 ${x(407.888)} 66.4877 ${x(386.244)} 66.4877C${x(364.6)} 66.4877 ${x(346.131)} 74.3288 ${x(330.837)} 90.0111C${x(315.544)} 105.693 ${x(307.897)} 124.551 ${x(307.897)} 146.584C${x(307.897)} 168.617 ${x(315.544)} 187.475 ${x(330.837)} 203.157Z`;
};

const H_PATH_TEMPLATE = (dx) => {
  // Original H in nothin-hero-svg spans x: 727.668 .. 956.292 (width 228.624)
  const s = dx - 727.668;
  const x = (v) => (v + s).toFixed(3);
  return `M${x(952.793)} 7.97076C${x(953.7)} 7.97076 ${x(954.478)} 8.35958 ${x(955.126)} 9.13721C${x(955.904)} 9.78524 ${x(956.292)} 10.5629 ${x(956.292)} 11.4701V283.253C${x(956.292)} 284.16 ${x(955.904)} 285.003 ${x(955.126)} 285.78C${x(954.478)} 286.428 ${x(953.7)} 286.752 ${x(952.793)} 286.752H${x(888.638)}C${x(887.731)} 286.752 ${x(886.888)} 286.428 ${x(886.111)} 285.78C${x(885.463)} 285.003 ${x(885.139)} 284.16 ${x(885.139)} 283.253V180.994C${x(885.139)} 180.087 ${x(884.75)} 179.309 ${x(883.972)} 178.661C${x(883.324)} 177.884 ${x(882.547)} 177.495 ${x(881.639)} 177.495H${x(802.126)}C${x(799.793)} 177.495 ${x(798.627)} 178.597 ${x(798.627)} 180.8V283.253C${x(798.627)} 284.16 ${x(798.303)} 285.003 ${x(797.655)} 285.78C${x(797.007)} 286.428 ${x(796.164)} 286.752 ${x(795.128)} 286.752H${x(731.167)}C${x(730.26)} 286.752 ${x(729.418)} 286.428 ${x(728.64)} 285.78C${x(727.992)} 285.003 ${x(727.668)} 284.16 ${x(727.668)} 283.253V11.4701C${x(727.668)} 10.5629 ${x(727.992)} 9.78524 ${x(728.64)} 9.13721C${x(729.418)} 8.35958 ${x(730.26)} 7.97076 ${x(731.167)} 7.97076H${x(795.128)}C${x(796.164)} 7.97076 ${x(797.007)} 8.35958 ${x(797.655)} 9.13721C${x(798.303)} 9.78524 ${x(798.627)} 10.5629 ${x(798.627)} 11.4701V110.23C${x(798.627)} 112.433 ${x(799.793)} 113.535 ${x(802.126)} 113.535H${x(881.639)}C${x(882.547)} 113.535 ${x(883.324)} 113.211 ${x(883.972)} 112.562C${x(884.75)} 111.914 ${x(885.139)} 111.072 ${x(885.139)} 110.035V11.4701C${x(885.139)} 10.5629 ${x(885.463)} 9.78524 ${x(886.111)} 9.13721C${x(886.888)} 8.35958 ${x(887.731)} 7.97076 ${x(888.638)} 7.97076H${x(952.793)}Z`;
};

export const LETTER_DEFS = [
  {
    id: 's',
    char: 'S',
    x: 0,
    w: 222,
    cx: 111,
    cy: 147,
    // Geometric heavy S with 64px stroke weight matching PP Neue Montreal Bold / noth.in
    d: 'M112 0C168 0 212 31 216 86C216.2 88.5 214.5 90 212 90H150C147.5 90 146 88.5 145 86C141 66 128 56 109 56C88 56 74 66 74 81C74 95 86 103 119 111L146 118C194 130 222 156 222 203C222 259 177 293.168 113 293.168C48 293.168 3 258 0 199C-0.2 196.5 1.5 195 4 195H67C69.5 195 71 196.5 72 199C76 223 91 236 114 236C137 236 153 225 153 208C153 192 141 184 108 175L79 168C30 156 5 130 5 85C5 33 49 0 112 0Z',
  },
  {
    id: 'o1',
    char: 'O',
    x: 236,
    w: 287,
    cx: 379.5,
    cy: 147,
    d: O_PATH_TEMPLATE(236),
  },
  {
    id: 'm',
    char: 'M',
    x: 540,
    w: 284,
    cx: 682,
    cy: 147,
    d: 'M543.5 7.387C541.2 7.387 540 8.489 540 10.692V282.864C540 285.068 541.2 286.169 543.5 286.169H602.5C604.8 286.169 606 285.068 606 282.864V132.5C606 130.2 608.5 129.5 609.8 131.4L656.5 282.864C657.2 285.068 658.6 286.169 661 286.169H703C705.4 286.169 706.8 285.068 707.5 282.864L754.2 131.4C755.5 129.5 758 130.2 758 132.5V282.864C758 285.068 759.2 286.169 761.5 286.169H820.5C822.8 286.169 824 285.068 824 282.864V10.692C824 8.489 822.8 7.387 820.5 7.387H738.5C736.2 7.387 734.8 8.489 734 10.692L684.2 184.5C683.4 186.8 680.6 186.8 679.8 184.5L630 10.692C629.2 8.489 627.8 7.387 625.5 7.387H543.5Z',
  },
  {
    id: 'e',
    char: 'E',
    x: 842,
    w: 204,
    cx: 944,
    cy: 147,
    d: 'M845.5 7.387C843.2 7.387 842 8.489 842 10.692V282.864C842 285.068 843.2 286.169 845.5 286.169H1042.5C1044.8 286.169 1046 285.068 1046 282.864V226.5C1046 224.2 1044.8 223 1042.5 223H913.5C911.2 223 910 221.8 910 219.5V177.5C910 175.2 911.2 174 913.5 174H1024.5C1026.8 174 1028 172.8 1028 170.5V119.5C1028 117.2 1026.8 116 1024.5 116H913.5C911.2 116 910 114.8 910 112.5V74C910 71.7 911.2 70.5 913.5 70.5H1042.5C1044.8 70.5 1046 69.3 1046 67V10.692C1046 8.489 1044.8 7.387 1042.5 7.387H845.5Z',
  },
  {
    id: 'dot',
    char: '.',
    x: 1064,
    w: 76,
    cx: 1102,
    cy: 245,
    isDot: true,
    d: 'M1067.5 210C1065.2 210 1064 211.2 1064 213.5V282.864C1064 285.068 1065.2 286.169 1067.5 286.169H1136.5C1138.8 286.169 1140 285.068 1140 282.864V213.5C1140 211.2 1138.8 210 1136.5 210H1067.5Z',
  },
  {
    id: 'h',
    char: 'H',
    x: 1158,
    w: 229,
    cx: 1272.5,
    cy: 147,
    d: H_PATH_TEMPLATE(1158),
  },
  {
    id: 'o2',
    char: 'O',
    x: 1404,
    w: 287,
    cx: 1547.5,
    cy: 147,
    d: O_PATH_TEMPLATE(1404),
  },
  {
    id: 'w',
    char: 'W',
    x: 1706,
    w: 314,
    cx: 1863,
    cy: 147,
    d: 'M1709.5 7.387C1707.2 7.387 1706 8.8 1706.5 11.2L1758.5 282.864C1759 285.068 1760.5 286.169 1763 286.169H1826C1828.5 286.169 1830 285.068 1830.6 282.864L1861.5 138.5C1862.1 136.2 1863.9 136.2 1864.5 138.5L1895.4 282.864C1896 285.068 1897.5 286.169 1900 286.169H1963C1965.5 286.169 1967 285.068 1967.5 282.864L2019.5 11.2C2020 8.8 2018.8 7.387 2016.5 7.387H1955C1952.5 7.387 1951 8.489 1950.5 10.692L1925.5 178.5C1925 180.8 1922.5 180.8 1922 178.5L1888.5 10.692C1888 8.489 1886.5 7.387 1884 7.387H1842C1839.5 7.387 1838 8.489 1837.5 10.692L1804 178.5C1803.5 180.8 1801 180.8 1800.5 178.5L1775.5 10.692C1775 8.489 1773.5 7.387 1771 7.387H1709.5Z',
  },
];

// 1. Navbar collapsible logo (matches noth.in's vv() function: SOME.HOW <-> S.HOW on scroll/hover)
export function SomeHowNavLogo() {
  const svgRef = useRef(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const midChars = svg.querySelectorAll('.nav-o1, .nav-m, .nav-e');
    const tailChars = svg.querySelectorAll('.nav-dot, .nav-h, .nav-o2, .nav-w');

    gsap.set(midChars, { transformOrigin: 'left center' });
    const tl = gsap.timeline({ paused: true });
    tl.to(midChars, {
      scaleX: 0,
      opacity: 0,
      duration: 0.45,
      stagger: 0.025,
      ease: 'power3.inOut',
    }, 0).to(
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

// 2. Loader left ('S') and right ('.H' / apostrophe) SVGs matching .n-load and .apos-load
export function LoaderLeftGlyph() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      viewBox="0 0 222 294"
      fill="none"
      className="n-load"
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
      viewBox="0 0 41 50"
      fill="none"
      className="apos-load"
    >
      <path
        d="M39.5359 0C39.9821 0 40.3447 0.195095 40.6235 0.585285C40.9582 0.975474 41.0697 1.39353 40.9582 1.83947L20.9631 48.9967C20.7958 49.6656 20.3217 50 19.5409 50H1.47004C1.02385 50 0.633448 49.8328 0.298802 49.4983C0.0199315 49.1081 -0.0637449 48.6901 0.0478035 48.2441L11.3421 1.17057C11.5652 0.39019 12.0393 0 12.7643 0H39.5359Z"
        fill="currentColor"
      />
    </svg>
  );
}

// 3. Hero Living Wordmark that continuously transforms the SOME.HOW logo
// with all 12 of noth.in's 3D sculptural & illustrated designs
export function SomeHowHeroLogo({ revealed }) {
  const wrapRef = useRef(null);
  const svgRef = useRef(null);
  // Active 3D sculptural replacements keyed by letter index -> { objIndex, rotation, scale }
  const [activeMorphs, setActiveMorphs] = useState(() => ({
    1: { objIdx: 0, rot: -12 }, // 'O' starts with bubble-wrap heart
    4: { objIdx: 2, rot: 14 },  // '.' starts with glossy black asterisk balloon
    6: { objIdx: 1, rot: -8 },  // second 'O' starts with chrome blue foil
  }));

  const objCursorRef = useRef(3);
  const slotHistoryRef = useRef([1, 4, 6]);

  // Staggered hero reveal animation (exact tf() from noth.in)
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

  // Continuous choreographed loop: transforms letters of SOME.HOW with all 12 3D objects
  useEffect(() => {
    if (!revealed) return;

    const candidateSlots = [0, 1, 2, 3, 4, 5, 6, 7];
    const interval = setInterval(() => {
      setActiveMorphs((prev) => {
        const currentSlots = Object.keys(prev).map(Number);
        // Pick a new letter slot to transform into the next 3D sculpture
        const available = candidateSlots.filter((s) => !currentSlots.includes(s));
        const nextSlot =
          available[Math.floor(Math.random() * available.length)] ??
          candidateSlots[Math.floor(Math.random() * candidateSlots.length)];

        const nextObjIdx = objCursorRef.current % LOADER_3D_OBJECTS.length;
        objCursorRef.current += 1;

        const nextHistory = [...slotHistoryRef.current, nextSlot];
        // Keep 2 or 3 letters simultaneously transformed into 3D sculptures so the wordSOME.HOW remains readable while continuously morphing
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

  // Hovering any letter immediately transforms it into the next 3D sculpture
  const handleLetterEnter = (idx) => {
    const nextObjIdx = objCursorRef.current % LOADER_3D_OBJECTS.length;
    objCursorRef.current += 1;
    setActiveMorphs((prev) => {
      const next = { ...prev };
      // Keep at most 3 morphed slots
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

      {/* 3D Sculptural & Illustrated Overlay slots continuously transforming the logo */}
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

// 4. Footer monumental wordmark with noth.in's exact hx() elastic squish on hover
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
