import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { SomeHowWordmark } from './components/SomeHowWordmark.jsx';
import { FluidHeroCanvas } from './components/FluidHeroCanvas.jsx';
import { ARTIFACT_TYPES, TactileArtifact } from './components/TactileArtifacts.jsx';
import { ProjectVisualCard } from './components/ProjectVisualCard.jsx';
import {
  CAPABILITIES_LIST,
  FAQ_ITEMS,
  PRICING_CATALOG,
  TEAM_DATA,
  WORKS_DATA
} from './data/studioData.js';

gsap.registerPlugin(ScrollTrigger);

const SCRAMBLE_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ0123456789#$()!?"§&<>@*+-';

const PHYSICS_ITEMS = [
  { id: 'art-1', kind: 'artifact', type: 'chrome-asterisk', left: '12%', top: '22%', baseRot: -14 },
  { id: 'art-2', kind: 'artifact', type: 'acid-torus', left: '28%', top: '62%', baseRot: 18 },
  { id: 'art-3', kind: 'artifact', type: 'orange-cube', left: '48%', top: '25%', baseRot: 12 },
  { id: 'art-4', kind: 'artifact', type: 'metallic-pill', left: '68%', top: '58%', baseRot: -22 },
  { id: 'art-5', kind: 'artifact', type: 'wire-sphere', left: '82%', top: '26%', baseRot: 9 },
  { id: 'art-6', kind: 'artifact', type: 'liquid-star', left: '42%', top: '68%', baseRot: -8 },
  { id: 'let-s', kind: 'letter', char: 'S', left: '18%', top: '66%', baseRot: -12, bg: '#0D0D0D', fg: '#F4F1EA' },
  { id: 'let-o', kind: 'letter', char: 'O', left: '36%', top: '20%', baseRot: 15, bg: '#FF3B00', fg: '#F4F1EA' },
  { id: 'let-m', kind: 'letter', char: 'M', left: '58%', top: '38%', baseRot: -9, bg: '#D4FF00', fg: '#0D0D0D' },
  { id: 'let-h', kind: 'letter', char: '.H', left: '75%', top: '20%', baseRot: 14, bg: '#0D0D0D', fg: '#D4FF00' },
  { id: 'let-w', kind: 'letter', char: 'W', left: '84%', top: '66%', baseRot: -16, bg: '#FF3B00', fg: '#F4F1EA' }
];

export default function App() {
  const [loaderDone, setLoaderDone] = useState(false);
  const [loaderCount, setLoaderCount] = useState('000');
  const [loaderArtifactIdx, setLoaderArtifactIdx] = useState(0);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [openFaqIdx, setOpenFaqIdx] = useState(0);
  const [selectedWork, setSelectedWork] = useState(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState('Interactive Web Flagship (€4,500)');
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [ribbonDark, setRibbonDark] = useState(false);
  const [activeReelMode, setActiveReelMode] = useState('agents');
  const [lang, setLang] = useState('ENG');

  const loaderRef = useRef(null);
  const heroWordmarkRef = useRef(null);
  const worksSectionRef = useRef(null);
  const museeSectionRef = useRef(null);
  const museeFrameRef = useRef(null);
  const formesWrapperRef = useRef(null);
  const glitchSectionRef = useRef(null);
  const faqSectionRef = useRef(null);
  const footerWordmarkRef = useRef(null);
  const audioCtxRef = useRef(null);
  const oscRef = useRef(null);

  // 1. Preloader sequence (000 -> 100 + rapid artifact cycling + hero wordmark staggered reveal)
  useEffect(() => {
    const cycleInterval = setInterval(() => {
      setLoaderArtifactIdx((prev) => (prev + 1) % ARTIFACT_TYPES.length);
    }, 240);

    const counterObj = { val: 0 };
    const tl = gsap.timeline({
      onComplete: () => {
        clearInterval(cycleInterval);
        if (loaderRef.current) {
          gsap.to(loaderRef.current, {
            yPercent: -100,
            duration: 1.15,
            ease: 'power4.inOut',
            onComplete: () => setLoaderDone(true)
          });
        } else {
          setLoaderDone(true);
        }

        // Staggered Hero Wordmark Reveal (exact noth.in tf() mechanic)
        if (heroWordmarkRef.current) {
          const letters = heroWordmarkRef.current.querySelectorAll('.sh-letter');
          const dot = heroWordmarkRef.current.querySelector('.sh-dot');
          gsap.fromTo(
            letters,
            { yPercent: 120, opacity: 0 },
            {
              yPercent: 0,
              opacity: 1,
              duration: 1.35,
              ease: 'power4.out',
              stagger: 0.055,
              delay: 0.15
            }
          );
          if (dot) {
            gsap.fromTo(
              dot,
              { scale: 0, transformOrigin: 'center center' },
              {
                scale: 1,
                duration: 0.65,
                ease: 'back.out(1.7)',
                delay: 0.75
              }
            );
          }
        }
      }
    });

    tl.to(counterObj, {
      val: 100,
      duration: 2.1,
      ease: 'power2.inOut',
      onUpdate: () => {
        setLoaderCount(String(Math.round(counterObj.val)).padStart(3, '0'));
      }
    });

    return () => {
      clearInterval(cycleInterval);
      tl.kill();
    };
  }, []);

  // 2. Lenis Smooth Scrolling + GSAP ScrollTrigger animations
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true
    });

    lenis.on('scroll', ScrollTrigger.update);
    const tickerFn = (time) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerFn);
    gsap.ticker.lagSmoothing(0);

    // Kinetic "w o r k s" letter vertical wave on scroll
    const ctx = gsap.context(() => {
      const workLetters = gsap.utils.toArray('.works-letter');
      workLetters.forEach((el, idx) => {
        const dir = idx % 2 === 0 ? 1 : -1;
        gsap.fromTo(
          el,
          { yPercent: 0, scale: 1 },
          {
            yPercent: dir * 32,
            scale: idx === 2 ? 0.86 : 1.06,
            ease: 'none',
            scrollTrigger: {
              trigger: worksSectionRef.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1.5
            }
          }
        );
      });

      // Museum / Architectural Frame scale-down on scroll (.musee-w)
      if (museeSectionRef.current && museeFrameRef.current) {
        gsap.fromTo(
          museeFrameRef.current,
          { scale: 1.14 },
          {
            scale: 0.92,
            ease: 'none',
            scrollTrigger: {
              trigger: museeSectionRef.current,
              start: 'top 85%',
              end: 'bottom top',
              scrub: 1.2
            }
          }
        );
      }

      // Dark section detection for the left-edge Studio Ribbon
      if (glitchSectionRef.current) {
        ScrollTrigger.create({
          trigger: glitchSectionRef.current,
          start: 'top 50%',
          end: 'bottom 50%',
          onEnter: () => setRibbonDark(true),
          onLeave: () => setRibbonDark(false),
          onEnterBack: () => setRibbonDark(true),
          onLeaveBack: () => setRibbonDark(false)
        });
      }
      if (faqSectionRef.current) {
        ScrollTrigger.create({
          trigger: faqSectionRef.current,
          start: 'top 50%',
          end: 'bottom 50%',
          onEnter: () => setRibbonDark(true),
          onLeave: () => setRibbonDark(false),
          onEnterBack: () => setRibbonDark(true),
          onLeaveBack: () => setRibbonDark(false)
        });
      }

      // Footer giant SOME.HOW staggered entrance on scroll
      if (footerWordmarkRef.current) {
        const footerLetters = footerWordmarkRef.current.querySelectorAll('.sh-letter');
        const footerDot = footerWordmarkRef.current.querySelector('.sh-dot');
        gsap.fromTo(
          footerLetters,
          { yPercent: 110 },
          {
            yPercent: 0,
            duration: 1.15,
            ease: 'power4.out',
            stagger: 0.04,
            scrollTrigger: {
              trigger: footerWordmarkRef.current,
              start: 'top 95%',
              once: true
            }
          }
        );
        if (footerDot) {
          gsap.fromTo(
            footerDot,
            { scale: 0, transformOrigin: 'center center' },
            {
              scale: 1,
              duration: 0.65,
              ease: 'back.out(1.7)',
              delay: 0.45,
              scrollTrigger: {
                trigger: footerWordmarkRef.current,
                start: 'top 95%',
                once: true
              }
            }
          );
        }
      }
    });

    return () => {
      ctx.revert();
      gsap.ticker.remove(tickerFn);
      lenis.destroy();
    };
  }, []);

  // 3. Custom Magnetic "explore ->" Cursor inside Work Cards (exact noth.in Wv() lerp)
  useEffect(() => {
    const links = document.querySelectorAll('.work-link');
    const cleanups = [];

    links.forEach((link) => {
      const cursor = link.querySelector('.cursor-work');
      if (!cursor) return;

      const state = { tx: 0, ty: 0, cx: 0, cy: 0, raf: null, active: false };
      const lerp = 0.14;

      const tick = () => {
        state.cx += (state.tx - state.cx) * lerp;
        state.cy += (state.ty - state.cy) * lerp;
        gsap.set(cursor, { x: state.cx, y: state.cy });
        if (
          state.active ||
          Math.abs(state.cx - state.tx) > 0.1 ||
          Math.abs(state.cy - state.ty) > 0.1
        ) {
          state.raf = requestAnimationFrame(tick);
        } else {
          state.raf = null;
        }
      };

      const onMove = (e) => {
        const rect = link.getBoundingClientRect();
        state.tx = e.clientX - rect.left;
        state.ty = e.clientY - rect.top;
        if (!state.active) {
          state.cx = state.tx;
          state.cy = state.ty;
          gsap.set(cursor, { x: state.cx, y: state.cy });
          state.active = true;
          gsap.to(cursor, {
            scale: 1,
            opacity: 1,
            duration: 0.45,
            ease: 'back.out(1.8)',
            overwrite: 'auto'
          });
        }
        if (!state.raf) state.raf = requestAnimationFrame(tick);
      };

      const onLeave = () => {
        state.active = false;
        gsap.to(cursor, {
          scale: 0,
          opacity: 0,
          duration: 0.3,
          ease: 'power3.in',
          overwrite: 'auto'
        });
      };

      link.addEventListener('mousemove', onMove);
      link.addEventListener('mouseleave', onLeave);
      cleanups.push(() => {
        link.removeEventListener('mousemove', onMove);
        link.removeEventListener('mouseleave', onLeave);
        if (state.raf) cancelAnimationFrame(state.raf);
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, [activeFilter]);

  // 4. Repulsive Physics Playground (.formes-w — exact noth.in Yv() repulsion formula)
  useEffect(() => {
    const wrapper = formesWrapperRef.current;
    if (!wrapper) return;
    const objects = [...wrapper.querySelectorAll('.formes-object')];
    if (objects.length === 0) return;

    const handleMove = (e) => {
      const mx = e.clientX;
      const my = e.clientY;
      const influenceRadius = window.innerWidth < 768 ? 220 : 380;
      const maxDistance = window.innerWidth < 768 ? 95 : 240;
      const rotForce = 28;
      const scaleForce = 0.18;

      objects.forEach((obj) => {
        const curX = Number(gsap.getProperty(obj, 'x')) || 0;
        const curY = Number(gsap.getProperty(obj, 'y')) || 0;
        const baseRot = parseFloat(obj.dataset.baseRot || '0');
        const rect = obj.getBoundingClientRect();
        const ox = rect.left + rect.width / 2 - curX;
        const oy = rect.top + rect.height / 2 - curY;
        const dist = Math.hypot(mx - ox, my - oy);

        if (dist < influenceRadius) {
          const angle = Math.atan2(my - oy, mx - ox);
          const power = Math.pow((influenceRadius - dist) / influenceRadius, 1.55);
          const push = power * maxDistance;
          const rot = baseRot - Math.cos(angle) * power * rotForce;
          gsap.to(obj, {
            x: -Math.cos(angle) * push,
            y: -Math.sin(angle) * push,
            rotation: rot,
            scale: 1 + power * scaleForce,
            duration: 0.42,
            ease: 'power4.out',
            overwrite: 'auto'
          });
        } else {
          gsap.to(obj, {
            x: 0,
            y: 0,
            rotation: baseRot,
            scale: 1,
            duration: 1.15,
            ease: 'elastic.out(1, 0.35)',
            overwrite: 'auto'
          });
        }
      });
    };

    const handleLeave = () => {
      objects.forEach((obj) => {
        const baseRot = parseFloat(obj.dataset.baseRot || '0');
        gsap.to(obj, {
          x: 0,
          y: 0,
          rotation: baseRot,
          scale: 1,
          duration: 1.2,
          ease: 'elastic.out(1, 0.35)',
          overwrite: 'auto'
        });
      });
    };

    wrapper.addEventListener('mousemove', handleMove);
    wrapper.addEventListener('mouseleave', handleLeave);
    return () => {
      wrapper.removeEventListener('mousemove', handleMove);
      wrapper.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

  // 5. Scroll-Velocity Character Scramble in Glitch Section (exact noth.in ax() mechanic)
  useEffect(() => {
    const section = glitchSectionRef.current;
    if (!section) return;
    const lines = [...section.querySelectorAll('.glitch-scramble-line')];
    const originals = lines.map((l) => l.dataset.text || l.textContent);

    let raf = null;
    let intensity = 0;

    const scrambleString = (str, prob) =>
      str
        .split('')
        .map((ch) => {
          if (ch === ' ') return ' ';
          return Math.random() < prob
            ? SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
            : ch;
        })
        .join('');

    const updateLoop = () => {
      intensity *= 0.9;
      if (intensity > 0.015) {
        lines.forEach((line, idx) => {
          line.textContent = scrambleString(originals[idx], intensity);
        });
        raf = requestAnimationFrame(updateLoop);
      } else {
        lines.forEach((line, idx) => {
          line.textContent = originals[idx];
        });
        raf = null;
      }
    };

    const st = ScrollTrigger.create({
      trigger: section,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const vel = Math.abs(self.getVelocity());
        intensity = Math.min(vel / 2800, 0.55);
        if (intensity > 0.02 && !raf) {
          raf = requestAnimationFrame(updateLoop);
        }
      }
    });

    return () => {
      st.kill();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Elastic squish-and-rebound on wordmark letters (exact noth.in hx() mechanic)
  const handleWordmarkLetterHover = (pathEl) => {
    if (pathEl.dataset.animating === '1') return;
    pathEl.dataset.animating = '1';
    gsap
      .timeline({
        onComplete: () => {
          pathEl.dataset.animating = '0';
        }
      })
      .to(pathEl, {
        scaleY: 0.08,
        scaleX: 1.12,
        duration: 0.45,
        ease: 'power2.inOut',
        transformOrigin: '50% 50%'
      })
      .to(pathEl, {
        scaleY: 1,
        scaleX: 1,
        duration: 1.55,
        ease: 'elastic.out(1, 0.75)'
      });
  };

  // Ambient Web Audio Synthesizer toggle for the Museum Showcase Frame
  const toggleAmbientSound = () => {
    if (!soundOn) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(110, ctx.currentTime); // A2 warm drone
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(164.81, ctx.currentTime); // E3 fifth harmonic

        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.035, ctx.currentTime + 0.8);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        audioCtxRef.current = ctx;
        oscRef.current = { osc1, osc2, gain };
        setSoundOn(true);
      } catch {
        setSoundOn(true);
      }
    } else {
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close();
        } catch {}
        audioCtxRef.current = null;
      }
      setSoundOn(false);
    }
  };

  const filteredWorks = WORKS_DATA.filter((w) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'WEB') return w.category.includes('Web') || w.category.includes('3D');
    if (activeFilter === 'SOFTWARE') return w.category.includes('Software');
    if (activeFilter === 'AI') return w.category.includes('AI');
    return true;
  });

  const openContactWithPackage = (pkgName) => {
    setSelectedPackage(pkgName);
    setContactSubmitted(false);
    setContactModalOpen(true);
  };

  return (
    <>
      {/* ====================================================================
          PRELOADER (000 -> 100 WITH TACTILE ARTIFACTS)
         ==================================================================== */}
      {!loaderDone && (
        <div ref={loaderRef} className="loader" aria-label="Loading Some.how">
          <div className="loader-top-bar">
            <span>SOME.HOW // AUGMENTED DESIGN, SOFTWARE &amp; AI STUDIO</span>
            <span>ATHENS · LONDON · REMOTE</span>
          </div>

          <div className="loader-center-stage">
            <span className="loader-glyph">S</span>
            <div className="loader-artifact-slot">
              <TactileArtifact
                type={ARTIFACT_TYPES[loaderArtifactIdx]}
                className="loader-artifact-svg"
              />
            </div>
            <span className="loader-glyph">
              <span className="loader-dot">.</span>H
            </span>
          </div>

          <div className="loader-bottom-bar">
            <div className="loader-status-tag">
              INITIALIZING FLUID SHADER &amp; SYSTEM ARCHITECTURE...
            </div>
            <div className="loader-counter">{loaderCount}</div>
          </div>
        </div>
      )}

      {/* ====================================================================
          FIXED MIX-BLEND NAVIGATION BAR & 4-DOT ROTATING MENU
         ==================================================================== */}
      <nav className="nav-boiler" aria-label="Primary Navigation">
        <a href="#top" className="nav-logo-wrap" aria-label="Some.how Home">
          <SomeHowWordmark className="nav-logo" dotColor="#FF3B00" />
        </a>

        <div className="menu-w">
          <div className="menu-btn">
            <div className="menu-btn-text">menu</div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 6 6"
              fill="none"
              className="menu-svg"
            >
              <rect y="4" width="2" height="2" fill="currentColor" />
              <rect x="4" y="4" width="2" height="2" fill="currentColor" />
              <rect width="2" height="2" fill="currentColor" />
              <rect x="4" width="2" height="2" fill="currentColor" />
            </svg>
          </div>
          <div className="menu-links-w">
            <a href="#works" className="link-boiler">
              works
            </a>
            <a href="#studio" className="link-boiler">
              studio
            </a>
            <a href="#method" className="link-boiler">
              method &amp; pricing
            </a>
            <a href="#faqs" className="link-boiler">
              faqs
            </a>
            <button
              type="button"
              onClick={() => openContactWithPackage('General Discovery Call')}
              className="link-boiler"
            >
              contact
            </button>
          </div>
        </div>
      </nav>

      {/* ====================================================================
          LEFT-EDGE CONTRAST-AWARE STUDIO RIBBON
         ==================================================================== */}
      <div
        className={`studio-ribbon ${ribbonDark ? 'on-dark' : ''}`}
        onClick={() => openContactWithPackage('Discovery Call — Q4/Q1 Slot')}
        title="Start a project with Some.how"
      >
        <span className="ribbon-mark">S.H</span>
        <span className="ribbon-vertical-text">Featured Studio &apos;26</span>
      </div>

      {/* ====================================================================
          HERO SECTION WITH FLUID REVEAL CANVAS & MONUMENTAL WORDMARK
         ==================================================================== */}
      <header id="top" className="section-hero-wrap">
        <FluidHeroCanvas />

        <div className="hero-top-grid">
          <div className="hero-manifesto-block">
            <p className="p-l">
              {lang === 'ENG' ? (
                <>
                  Not a template, an instinct.
                  <br />
                  Because impossible happens{' '}
                  <span className="hero-accent-highlight">Some.how.</span>
                </>
              ) : (
                <>
                  Όχι πρότυπο, αλλά ένστικτο.
                  <br />
                  Γιατί το αδύνατο γίνεται{' '}
                  <span className="hero-accent-highlight">Some.how.</span>
                </>
              )}
            </p>

            <div className="hero-cta-row">
              <button
                type="button"
                onClick={() => openContactWithPackage('Discovery Call — Custom Project')}
                className="btn"
              >
                <span>{lang === 'ENG' ? 'book a discovery call' : 'κλείστε κλήση'}</span>
                <span className="arrow-w">
                  <svg viewBox="0 0 18 12" fill="none" className="btn-arrow-svg">
                    <path
                      d="M11.5 1L16.5 6L11.5 11M16 6H1"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </button>

              <a href="#works" className="btn btn-outline">
                <span>explore selected works (06)</span>
              </a>
            </div>
          </div>

          <div className="hero-telemetry-card">
            <div className="telemetry-header">
              <span>( LIVE STUDIO STATUS )</span>
              <span className="status-pulse">
                <span className="status-pulse-dot" />2 SLOTS FOR Q4
              </span>
            </div>
            <p style={{ fontSize: '0.96rem', lineHeight: 1.4, marginBottom: '0.9rem' }}>
              Move your cursor across the canvas to peel back the surface. We fuse Swiss editorial
              design, full-stack software, and autonomous AI systems.
            </p>
            <div className="telemetry-tags">
              <span className="telemetry-tag">Web Design &amp; WebGL</span>
              <span className="telemetry-tag">Custom Software</span>
              <span className="telemetry-tag">AI Agents &amp; Workflows</span>
            </div>
          </div>
        </div>

        <div className="hero-middle-bar">
          <h1 className="hero-h1-label">
            Web Design, Software Engineering &amp; AI Automation Studio
          </h1>

          <div className="hero-links-lang-row">
            <div className="hero-social-Cluster">
              <a
                href="https://github.com/NikosKotsifas"
                target="_blank"
                rel="noreferrer"
                className="editorial-link"
              >
                GitHub
              </a>
              <span>/</span>
              <a href="#method" className="editorial-link">
                Fixed-Fee Pricing
              </a>
              <span>/</span>
              <button
                type="button"
                onClick={() => openContactWithPackage('Direct Inquiry')}
                className="editorial-link"
              >
                Start a Project
              </button>
            </div>

            <div className="hero-social-Cluster" style={{ fontFamily: 'var(--font-mono)' }}>
              <button
                type="button"
                onClick={() => setLang('ENG')}
                style={{
                  fontWeight: lang === 'ENG' ? 700 : 400,
                  textDecoration: lang === 'ENG' ? 'underline' : 'none'
                }}
              >
                ENG
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setLang('GR')}
                style={{
                  fontWeight: lang === 'GR' ? 700 : 400,
                  textDecoration: lang === 'GR' ? 'underline' : 'none'
                }}
              >
                GR
              </button>
            </div>
          </div>
        </div>

        <div ref={heroWordmarkRef} className="hero-wordmark-container">
          <SomeHowWordmark
            className="somehow-hero-svg"
            dotColor="#FF3B00"
            interactiveHover={true}
            onLetterEnter={handleWordmarkLetterHover}
          />
        </div>
      </header>

      {/* ====================================================================
          SECTION 2: SHOWREEL & "( THE STEP ASIDE )"
         ==================================================================== */}
      <section className="section showreel">
        <div className="container">
          <h2 className="h1-home">
            Most agencies ship templates.
            <br />
            We engineer breakthroughs.
          </h2>

          <div className="showreel-stage">
            <div className="showreel-frame-wrap">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.76rem',
                    color: '#D4FF00',
                    letterSpacing: '0.08em'
                  }}
                >
                  ● INTERACTIVE CAPABILITY REEL // 2026
                </span>

                <div style={{ display: 'flex', gap: '0.45rem' }}>
                  {[
                    { id: 'agents', label: '01 · AI Automation' },
                    { id: 'webgl', label: '02 · Web & Shaders' },
                    { id: 'saas', label: '03 · Full-Stack SaaS' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveReelMode(tab.id)}
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.72rem',
                        padding: '0.38rem 0.8rem',
                        borderRadius: '999px',
                        border: '1px solid rgba(244,241,234,0.22)',
                        backgroundColor:
                          activeReelMode === tab.id ? '#FF3B00' : 'rgba(244,241,234,0.06)',
                        color: '#F4F1EA'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {activeReelMode === 'agents' && (
                <div className="showreel-Interactive-grid">
                  <div className="showreel-metric-card">
                    <div className="showreel-metric-val">24/7</div>
                    <div className="showreel-metric-label">
                      Autonomous Multi-Agent Triage &amp; Execution
                    </div>
                  </div>
                  <div className="showreel-metric-card">
                    <div className="showreel-metric-val">-82%</div>
                    <div className="showreel-metric-label">
                      Manual Ops Overhead Across CRM, ERP &amp; Support
                    </div>
                  </div>
                  <div className="showreel-metric-card">
                    <div className="showreel-metric-val">&lt;1.2s</div>
                    <div className="showreel-metric-label">
                      RAG Knowledge Retrieval with Verifiable Citations
                    </div>
                  </div>
                </div>
              )}

              {activeReelMode === 'webgl' && (
                <div className="showreel-Interactive-grid">
                  <div className="showreel-metric-card">
                    <div className="showreel-metric-val">60fps</div>
                    <div className="showreel-metric-label">
                      Custom GLSL Shaders, GSAP Motion &amp; 3D Scenes
                    </div>
                  </div>
                  <div className="showreel-metric-card">
                    <div className="showreel-metric-val">99/100</div>
                    <div className="showreel-metric-label">
                      Lighthouse Performance &amp; Sub-Second First Paint
                    </div>
                  </div>
                  <div className="showreel-metric-card">
                    <div className="showreel-metric-val">+190%</div>
                    <div className="showreel-metric-label">
                      Average Lift in Enterprise Demo Conversions
                    </div>
                  </div>
                </div>
              )}

              {activeReelMode === 'saas' && (
                <div className="showreel-Interactive-grid">
                  <div className="showreel-metric-card">
                    <div className="showreel-metric-val">6 Wks</div>
                    <div className="showreel-metric-label">
                      From Blank Repo to Production Full-Stack Platform
                    </div>
                  </div>
                  <div className="showreel-metric-card">
                    <div className="showreel-metric-val">100%</div>
                    <div className="showreel-metric-label">
                      IP Ownership, Clean TypeScript/Go/Python Codebase
                    </div>
                  </div>
                  <div className="showreel-metric-card">
                    <div className="showreel-metric-val">99.99%</div>
                    <div className="showreel-metric-label">
                      Edge-Deployed Reliability on Cloudflare &amp; AWS
                    </div>
                  </div>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.74rem',
                  color: 'rgba(244,241,234,0.6)'
                }}
              >
                <span>STACK // REACT · NEXT.JS · GSAP · WEBGL · PYTHON · RUST · LLM AGENTS</span>
                <span>SOME.HOW ARCHITECTURE v2.6</span>
              </div>
            </div>

            <div className="showreel-aside-block">
              <div className="mono-parenthetical">( The step aside )</div>
              <p className="p-m">
                In an era of infinite AI noise and cookie-cutter templates, the rarest asset is
                clarity. Great interfaces shift perception, clean software scales effortlessly, and
                intelligent automation frees humans to do only what humans can do.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 3: KINETIC "W O R K S" GRID & ASYMMETRIC PORTFOLIO
         ==================================================================== */}
      <section id="works" ref={worksSectionRef} className="section works">
        <div className="container">
          <div className="works-word-w" aria-label="Works">
            <div className="works-word-row">
              <div className="works-word-cell">
                <span className="works-letter">w</span>
              </div>
              <div className="works-word-cell">
                <span className="works-letter">o</span>
              </div>
              <div className="works-word-cell">
                <span className="works-letter accent-dot">r</span>
              </div>
              <div className="works-word-cell">
                <span className="works-letter">k</span>
              </div>
              <div className="works-word-cell">
                <span className="works-letter">s</span>
              </div>
            </div>
          </div>

          <div className="works-section-header">
            <h2 className="h3-style">
              Good software functions.
              <br />
              Great systems feel like magic.
            </h2>

            <div className="work-filter-pills" role="tablist" aria-label="Filter projects">
              {[
                { id: 'ALL', label: 'All (06)' },
                { id: 'WEB', label: 'Web & WebGL' },
                { id: 'SOFTWARE', label: 'Software & SaaS' },
                { id: 'AI', label: 'AI Automation' }
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveFilter(f.id)}
                  className={`filter-pill ${activeFilter === f.id ? 'active' : ''}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* 12-Column Asymmetric Works List (matching noth.in's exact layout grid) */}
          <div className="work_list">
            {filteredWorks.map((work, index) => {
              const rowBase = Math.floor(index / 6) * 4 + work.rowOffset + 1;
              return (
                <article
                  key={work.id}
                  className="work_item"
                  style={{
                    gridColumn: activeFilter === 'ALL' ? work.col : index % 2 === 0 ? '1 / 7' : '7 / 13',
                    gridRow: activeFilter === 'ALL' ? String(rowBase) : 'auto',
                    alignSelf: work.alignSelf
                  }}
                >
                  <div className="work-item-meta">
                    <h3 className="title-work">{work.title}</h3>
                    <span className="work-year-tag">
                      ({work.number}) · {work.year}
                    </span>
                  </div>
                  <p className="short-p-work">{work.subtitle}</p>

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedWork(work)}
                    onKeyDown={(e) => e.key === 'Enter' && setSelectedWork(work)}
                    className="work-link"
                  >
                    <div className="img-work-w" style={{ height: work.imgH }}>
                      <ProjectVisualCard work={work} />
                    </div>

                    <div className="cursor-work">
                      <span>inspect case</span>
                      <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                        <path d="M8.6 0.35L13.1 4.87L8.6 9.38" stroke="currentColor" strokeWidth="1.5" />
                        <line y1="5" x2="13.1" y2="5" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="work-view-all-w">
            <button
              type="button"
              onClick={() => openContactWithPackage('Request Full Portfolio & Private Architecture Walkthrough')}
              className="btn btn-outline"
            >
              <span>Request private case studies</span>
              <svg width="24" height="12" viewBox="-8 -1 26 14" fill="none">
                <polyline
                  points="0.5,0 0.5,7.5 15.5,7.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinejoin="round"
                />
                <polyline
                  points="12,4 15.5,7.5 12,11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <div>( 0{filteredWorks.length} DEPLOYED SYSTEMS )</div>
            <div>© 25 . 26</div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 4: ARCHITECTURAL GALLERY FRAME & FLOOR REFLECTION (.musee-w)
         ==================================================================== */}
      <section id="studio-video" ref={museeSectionRef} className="section-video-showcase">
        <div className="musee-w">
          <div ref={museeFrameRef} className="musee-frame-box">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.74rem',
                color: 'rgba(244,241,234,0.65)'
              }}
            >
              <span>MANIFESTO // SOME.HOW STUDIO</span>
              <span style={{ color: '#D4FF00' }}>
                {soundOn ? '♦ AUDIO SYNTH: ACTIVE (110Hz)' : '◊ AUDIO SYNTH: MUTED'}
              </span>
            </div>

            <div style={{ my: 'auto' }}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  color: '#FF3B00',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: '0.8rem'
                }}
              >
                ( The Some.how Doctrine )
              </div>
              <h3
                style={{
                  fontSize: '2.9rem',
                  fontWeight: 500,
                  lineHeight: 1.06,
                  letterSpacing: '-0.03em',
                  maxWidth: '42rem'
                }}
              >
                We use autonomous AI to eliminate the mechanical—so human taste, architecture, and
                direction can go further than ever before.
              </h3>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid rgba(244,241,234,0.14)',
                paddingTop: '1rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem'
              }}
            >
              <span>DESIGNED BY HUMANS · ACCELERATED BY AUTONOMOUS SYSTEMS</span>
              <span style={{ color: '#FF3B00' }}>SOME.HOW // 2026</span>
            </div>
          </div>

          <div className="musee-reflection" aria-hidden="true" />

          <button
            type="button"
            onClick={toggleAmbientSound}
            className={`btn-sound ${soundOn ? 'is-on' : ''}`}
          >
            <span>Sound</span>
            <div className="toggle-sound">
              <div className="tick-sound" />
            </div>
          </button>
        </div>
      </section>

      {/* ====================================================================
          SECTION 5: "( THE STUDIO )" & REPULSIVE PHYSICS PLAYGROUND (.formes-w)
         ==================================================================== */}
      <section id="studio" className="section info-img">
        <div className="container">
          <div className="studio-intro-grid">
            <div className="studio-intro-label mono-parenthetical">( The Studio )</div>
            <div className="studio-intro-copy">
              We called it <strong>Some.how</strong> because the most ambitious digital products
              never start with a ready-made roadmap. They start as an open question—broad enough to
              become a flagship website, a proprietary software platform, or an autonomous AI
              workforce...
            </div>
          </div>

          <div className="studio-parallax-pair">
            <div className="studio-card-left">
              <div
                className="studio-visual-box"
                style={{ backgroundColor: '#0D0D0D', color: '#F4F1EA' }}
              >
                <span className="mono-parenthetical" style={{ color: '#D4FF00' }}>
                  01 // ENGINEERING PRECISION
                </span>
                <p style={{ fontSize: '1.85rem', lineHeight: 1.15, margin: '2rem 0' }}>
                  Zero bloat. Sub-second load times, deterministic state machines, and interfaces
                  that feel physical under the cursor.
                </p>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', opacity: 0.6 }}>
                  REACT · RUST · GO · WEBGL · GLSL
                </span>
              </div>
              <p
                style={{
                  fontSize: '1.6rem',
                  fontWeight: 500,
                  marginTop: '1.2rem',
                  letterSpacing: '-0.02em'
                }}
              >
                ...or something nobody in your industry has dared to build yet.
              </p>
            </div>

            <div className="studio-card-right">
              <div
                className="studio-visual-box"
                style={{ backgroundColor: '#FF3B00', color: '#F4F1EA' }}
              >
                <span className="mono-parenthetical" style={{ color: '#0D0D0D', fontWeight: 700 }}>
                  02 // AI-NATIVE VELOCITY
                </span>
                <p style={{ fontSize: '2rem', lineHeight: 1.12, margin: '2.5rem 0' }}>
                  What traditional agencies quote at six months and €80k, we ship in weeks with a
                  tight senior squad and custom internal AI tooling.
                </p>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                  FIXED SCOPE · ZERO DAY-RATES · DIRECT FOUNDER ACCESS
                </span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '6rem' }}>
            <h2 className="h1-home">
              Systems follow
              <br />
              perspective.
            </h2>
          </div>

          <div className="capabilities-grid">
            <div className="capabilities-left">
              <div style={{ fontSize: '1.6rem', fontWeight: 500 }}>We engineer :</div>
              <p
                style={{
                  marginTop: '1rem',
                  color: 'var(--ink-muted)',
                  fontSize: '1.05rem',
                  maxWidth: '22rem',
                  lineHeight: 1.45
                }}
              >
                Perspective is where product strategy, visual culture, and autonomous code meet.
              </p>
            </div>

            <div className="capabilities-right">
              {CAPABILITIES_LIST.map((cap) => (
                <div key={cap.tag} className="capability-row">
                  <div className="list-dot" style={{ backgroundColor: cap.accent }} />
                  <div>
                    <div style={{ fontSize: '1.65rem', fontWeight: 500, letterSpacing: '-0.02em' }}>
                      {cap.title}
                    </div>
                    <p style={{ color: 'var(--ink-muted)', marginTop: '0.35rem', fontSize: '1rem' }}>
                      {cap.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Repulsive Physics Playground (.formes-w) */}
          <div ref={formesWrapperRef} className="formes-w">
            <div className="formes-hint">
              ( Interactive Physics Field — Move cursor to scatter artifacts )
            </div>

            {PHYSICS_ITEMS.map((item) => (
              <div
                key={item.id}
                className="formes-object"
                data-base-rot={item.baseRot}
                style={{
                  left: item.left,
                  top: item.top,
                  transform: `rotate(${item.baseRot}deg)`
                }}
              >
                {item.kind === 'artifact' ? (
                  <TactileArtifact type={item.type} className="formes-artifact-item" />
                ) : (
                  <div
                    className="formes-letter-badge"
                    style={{ backgroundColor: item.bg, color: item.fg }}
                  >
                    {item.char}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Team & Creative/Engineering Partners */}
          <div className="team-grid">
            <div className="team-left">
              <div style={{ fontSize: '1.6rem', fontWeight: 500 }}>
                Some.how without people :
              </div>
            </div>

            <div className="team-columns">
              <div>
                <h3 className="team-col-title">founders &amp; lead architecture</h3>
                {TEAM_DATA.leadership.map((person) => (
                  <div key={person.name} className="team-member-row">
                    <span className="team-member-name">{person.name}</span>
                    <span className="team-member-role">{person.role}</span>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="team-col-title">specialized engineering partners</h3>
                {TEAM_DATA.partners.map((partner) => (
                  <div key={partner.name} className="team-member-row">
                    <span className="team-member-name">{partner.name}</span>
                    <span className="team-member-role">{partner.role}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 6: VELOCITY CHARACTER SCRAMBLE & GLITCH CASCADE (.section.glitch)
         ==================================================================== */}
      <section ref={glitchSectionRef} className="section glitch">
        <div className="glitch-backdrop-grid" />
        <div className="container glitch-stage">
          <div className="glitch-stack-col">
            {[
              'we make it happen some.how',
              'we make it happen some.how',
              '0x7F !!” .   U§hs .   sys.compile() .   rh',
              'we make it happen some.how',
              'agent.dispatch() // shader.init() // 60fps',
              'Pj(è !!” .   some.how .   jkj . k .   rh'
            ].map((txt, idx) => (
              <div
                key={idx}
                className="glitch-line-block glitch-scramble-line"
                data-text={txt}
              >
                {txt}
              </div>
            ))}
          </div>

          <div className="glitch-final-col">
            <div
              className="mono-parenthetical"
              style={{ color: '#D4FF00', marginBottom: '1rem' }}
            >
              ( BEYOND THE ORDINARY )
            </div>
            <div className="finaltext">
              We build digital products, web flagships &amp; AI systems for those ready to outpace
              their category.
            </div>
            <div style={{ marginTop: '2rem' }}>
              <button
                type="button"
                onClick={() => openContactWithPackage('Custom Architecture & Product Build')}
                className="btn btn-light"
              >
                <span>start a conversation</span>
                <span className="arobase">→</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 7: TRANSPARENT FIXED-FEE METHOD & PRICING CATALOG (#method)
         ==================================================================== */}
      <section id="method" className="section section-method">
        <div className="container">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: '2rem'
            }}
          >
            <div>
              <div className="mono-parenthetical" style={{ marginBottom: '0.8rem' }}>
                ( Transparent Fixed-Fee Method )
              </div>
              <h2 className="h1-home">
                Priced by scope.
                <br />
                Never by the hour.
              </h2>
            </div>

            <p style={{ maxWidth: '28rem', fontSize: '1.1rem', color: 'var(--ink-muted)' }}>
              Inspired by radical studio transparency: every engagement is a fixed fee with clear
              deliverables and launch dates locked in before we write a single line of code.
            </p>
          </div>

          <div className="pricing-grid">
            {PRICING_CATALOG.map((pkg) => (
              <div key={pkg.id} className="pricing-card">
                <div>
                  <div className="pricing-type-tag">{pkg.type}</div>
                  <h3 className="pricing-name">{pkg.name}</h3>
                  <div className="pricing-price" style={{ color: pkg.accent === '#FF3B00' ? '#FF3B00' : 'inherit' }}>
                    {pkg.price}
                  </div>
                  <div className="pricing-timeline">TIMELINE // {pkg.timeline}</div>
                  <p className="pricing-desc">{pkg.description}</p>

                  <ul className="pricing-includes">
                    {pkg.includes.map((inc, i) => (
                      <li key={i}>
                        <span style={{ color: '#FF3B00', fontWeight: 700 }}>+</span>
                        <span>{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => openContactWithPackage(`${pkg.name} (${pkg.price})`)}
                  className="btn"
                  style={{ width: '100%', justifyContent: 'space-between' }}
                >
                  <span>select scope</span>
                  <span>→</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 8: DARK OBSIDIAN "F A Q S" ACCORDION (#faqs)
         ==================================================================== */}
      <section id="faqs" ref={faqSectionRef} className="section black">
        <div className="container">
          <div className="faq-giant-letters" aria-label="FAQs">
            <div className="faq-title-section">F</div>
            <div className="faq-title-section">A</div>
            <div className="faq-title-section">Q</div>
            <div className="faq-title-section" style={{ color: '#D4FF00' }}>
              S
            </div>
          </div>

          <div className="faq3_component">
            <div className="faq3_content-left">
              <div className="mono-parenthetical" style={{ color: 'rgba(244,241,234,0.6)' }}>
                ( Questions we are asked )
              </div>
            </div>

            <div className="faq3_content">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openFaqIdx === idx;
                return (
                  <div
                    key={idx}
                    className={`faq3_accordion ${isOpen ? 'is-open' : ''}`}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setOpenFaqIdx(isOpen ? -1 : idx)}
                      onKeyDown={(e) => e.key === 'Enter' && setOpenFaqIdx(isOpen ? -1 : idx)}
                      className="faq3_question"
                    >
                      <div className="p-xl">{item.question}</div>
                      <div className="faq3_icon-wrapper">
                        <svg viewBox="0 0 12 12" fill="none" className="cross-faq">
                          <rect y="5" width="12" height="2" fill="currentColor" />
                          <rect
                            x="7"
                            width="12"
                            height="2"
                            transform={isOpen ? 'rotate(0 7 0)' : 'rotate(90 7 0)'}
                            style={{
                              opacity: isOpen ? 0 : 1,
                              transition: 'opacity 0.3s ease'
                            }}
                            fill="currentColor"
                          />
                        </svg>
                      </div>
                    </div>

                    <div className="faq-separator-w">
                      <div className="faq-separator" />
                    </div>

                    <div
                      className="faq3_answer"
                      style={{
                        maxHeight: isOpen ? '24rem' : '0rem',
                        opacity: isOpen ? 1 : 0
                      }}
                    >
                      <div className="faq3_answer-inner">
                        <p>{item.answer}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 9: MONUMENTAL ELASTIC FOOTER
         ==================================================================== */}
      <footer id="footer" className="section-footer">
        <div className="container">
          <h2 className="h1-home">
            Let’s make it happen,
            <br />
            some.how
          </h2>

          <div className="footer-top-row">
            <div className="footer-cta-group">
              <button
                type="button"
                onClick={() => openContactWithPackage('Discovery Call — Footer CTA')}
                className="btn"
              >
                <span>book a call</span>
                <span className="arrow-w">
                  <svg viewBox="0 0 18 12" fill="none" className="btn-arrow-svg">
                    <path
                      d="M11.5 1L16.5 6L11.5 11M16 6H1"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </button>

              <a href="mailto:hello@some.how" className="btn btn-outline">
                <span>drop us an email</span>
                <span className="arobase">@</span>
              </a>
            </div>

            <div className="footer-social-group">
              <a
                href="https://github.com/NikosKotsifas"
                target="_blank"
                rel="noreferrer"
                className="editorial-link"
              >
                GitHub
              </a>
              <a href="#works" className="editorial-link">
                LinkedIn
              </a>
              <a href="#works" className="editorial-link">
                X / Twitter
              </a>
              <a href="#works" className="editorial-link">
                Instagram
              </a>
            </div>
          </div>

          <div ref={footerWordmarkRef} className="footer-svg-w">
            <SomeHowWordmark
              className="footer-somehow-svg"
              dotColor="#FF3B00"
              interactiveHover={true}
              onLetterEnter={handleWordmarkLetterHover}
            />
          </div>

          <div className="footer-info-w">
            <div>©2026 SOME.HOW STUDIO — FOUNDED BY NIKOS KOTSIFAS — ATHENS &amp; GLOBAL</div>
            <div>WEB DESIGN · CUSTOM SOFTWARE · AI AUTOMATION</div>
            <div className="footer-nav-links">
              <a href="#works">WORKS</a>
              <a href="#studio">STUDIO</a>
              <a href="#method">PRICING</a>
              <a href="#faqs">FAQS</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ====================================================================
          MODAL 1: CASE STUDY DEEP-DIVE DRAWER
         ==================================================================== */}
      {selectedWork && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedWork(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-drawer" onClick={(e) => e.stopPropagation()}>
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '2rem'
                }}
              >
                <span className="mono-parenthetical">
                  CASE STUDY // ({selectedWork.number}) · {selectedWork.year}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedWork(null)}
                  className="modal-close-btn"
                >
                  Close [ESC]
                </button>
              </div>

              <h2 style={{ fontSize: '3rem', fontWeight: 600, letterSpacing: '-0.03em' }}>
                {selectedWork.title}
              </h2>
              <p
                style={{
                  fontSize: '1.25rem',
                  color: 'var(--ink-muted)',
                  marginTop: '0.4rem',
                  marginBottom: '1.5rem'
                }}
              >
                {selectedWork.subtitle}
              </p>

              <div style={{ borderRadius: '0.85rem', overflow: 'hidden', marginBottom: '2rem' }}>
                <ProjectVisualCard work={selectedWork} />
              </div>

              <div className="mono-parenthetical" style={{ marginBottom: '0.6rem' }}>
                ( Architecture &amp; Impact )
              </div>
              <p style={{ fontSize: '1.1rem', lineHeight: 1.55, marginBottom: '2rem' }}>
                {selectedWork.summary}
              </p>

              <div className="mono-parenthetical" style={{ marginBottom: '0.8rem' }}>
                ( Key Deliverables )
              </div>
              <ul
                style={{
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                  marginBottom: '2rem'
                }}
              >
                {selectedWork.deliverables.map((d, i) => (
                  <li
                    key={i}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '0.5rem',
                      backgroundColor: 'var(--bg-paper-warm)',
                      border: '1px solid var(--border-subtle)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.82rem'
                    }}
                  >
                    0{i + 1} // {d}
                  </li>
                ))}
              </ul>
            </div>

            <div
              style={{
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                Want something similar?
              </span>
              <button
                type="button"
                onClick={() => {
                  const title = selectedWork.title;
                  setSelectedWork(null);
                  openContactWithPackage(`Similar to ${title}`);
                }}
                className="btn"
              >
                <span>scope a project like this</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 2: INTERACTIVE PROJECT & DISCOVERY CALL DRAWER
         ==================================================================== */}
      {contactModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setContactModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-drawer" onClick={(e) => e.stopPropagation()}>
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '2rem'
                }}
              >
                <span className="mono-parenthetical">( START A PROJECT // SOME.HOW )</span>
                <button
                  type="button"
                  onClick={() => setContactModalOpen(false)}
                  className="modal-close-btn"
                >
                  Close [ESC]
                </button>
              </div>

              <h2 style={{ fontSize: '2.6rem', fontWeight: 600, letterSpacing: '-0.03em' }}>
                Let’s build it, some.how.
              </h2>
              <p style={{ color: 'var(--ink-muted)', marginTop: '0.5rem', fontSize: '1.05rem' }}>
                Tell us what is at stake. We respond within 24 hours with a concrete architectural
                perspective and fixed-fee scope.
              </p>

              {contactSubmitted ? (
                <div
                  style={{
                    marginTop: '2.5rem',
                    padding: '2rem',
                    borderRadius: '1rem',
                    backgroundColor: '#0D0D0D',
                    color: '#F4F1EA'
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: '#D4FF00',
                      fontSize: '0.8rem',
                      marginBottom: '0.6rem'
                    }}
                  >
                    ✓ TRANSMISSION RECEIVED
                  </div>
                  <h3 style={{ fontSize: '1.6rem', marginBottom: '0.6rem' }}>
                    We’ve locked in your inquiry.
                  </h3>
                  <p style={{ opacity: 0.8, lineHeight: 1.5 }}>
                    Selected Scope: <strong>{selectedPackage}</strong>. Nikos will review your brief
                    and reach out shortly.
                  </p>
                </div>
              ) : (
                <form
                  className="contact-form-grid"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setContactSubmitted(true);
                  }}
                >
                  <div className="form-field">
                    <label>Your Name</label>
                    <input type="text" required placeholder="Alex Mercer" />
                  </div>

                  <div className="form-field">
                    <label>Work Email</label>
                    <input type="email" required placeholder="alex@company.com" />
                  </div>

                  <div className="form-field">
                    <label>Selected Scope / Package</label>
                    <select
                      value={selectedPackage}
                      onChange={(e) => setSelectedPackage(e.target.value)}
                    >
                      <option value="Interactive Web Flagship (€4,500)">
                        Interactive Web Flagship (from €4,500)
                      </option>
                      <option value="Custom Software / SaaS Platform (€9,500)">
                        Custom Software / SaaS Platform (from €9,500)
                      </option>
                      <option value="AI Automation & Agent Systems (€3,500)">
                        AI Automation &amp; Agent Systems (from €3,500)
                      </option>
                      <option value="Embedded Studio Partner (€3,000 / mo)">
                        Embedded Studio Partner (€3,000 / mo)
                      </option>
                      <option value="Custom Multi-Discipline Scope">
                        Custom Multi-Discipline Scope
                      </option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label>What are we building or automating?</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Tell us about your product, timeline, or the workflow you want to automate..."
                    />
                  </div>

                  <button type="submit" className="btn" style={{ justifyContent: 'center' }}>
                    <span>send project brief</span>
                    <span>→</span>
                  </button>
                </form>
              )}
            </div>

            <div
              style={{
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '1.2rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--ink-muted)'
              }}
            >
              DIRECT EMAIL // HELLO@SOME.HOW · GITHUB // @NIKOSKOTSIFAS
            </div>
          </div>
        </div>
      )}
    </>
  );
}
