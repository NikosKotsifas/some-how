import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import {
  LOADER_3D_OBJECTS,
  HERO_3D_LOGOS,
  MEDIA_ASSETS,
  WORKS_ITEMS,
  STUDIO_SERVICES,
  FAQS,
} from './data/studioData';
import {
  SomeHowNavLogo,
  LoaderLeftGlyph,
  LoaderRightGlyph,
  SomeHowHeroStaticSvg,
  SomeHowFooterLogo,
} from './components/SomeHowWordmark';
import FluidHeroCanvas from './components/FluidHeroCanvas';

gsap.registerPlugin(ScrollTrigger);

// Cache of flood-fill cutout data URLs so each 3D sculptural object is processed once
const cutoutCache = new Map();

/**
 * Flood-fills the exterior #000000 background from the 4 corners of a 3D studio render
 * so the 3D object has a 100% transparent alpha background while preserving internal shadows.
 */
function CutoutSculptureImg({ src, grade = 'obsidian', alt, className, loading }) {
  const cacheKey = `${src}::${grade}`;
  const [cutoutSrc, setCutoutSrc] = useState(() => cutoutCache.get(cacheKey) || src);

  useEffect(() => {
    if (cutoutCache.has(cacheKey)) {
      setCutoutSrc(cutoutCache.get(cacheKey));
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      try {
        const w = img.naturalWidth || 512;
        const h = img.naturalHeight || 512;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;
        const visited = new Uint8Array(w * h);
        const queue = new Int32Array(w * h);
        let head = 0;
        let tail = 0;

        const isBg = (idx4) => {
          const r = data[idx4];
          const g = data[idx4 + 1];
          const b = data[idx4 + 2];
          return r < 30 && g < 30 && b < 30;
        };

        const pushSeed = (x, y) => {
          const i = y * w + x;
          if (!visited[i] && isBg(i * 4)) {
            visited[i] = 1;
            queue[tail++] = i;
          }
        };

        // Seed all 4 edges
        for (let x = 0; x < w; x++) {
          pushSeed(x, 0);
          pushSeed(x, h - 1);
        }
        for (let y = 0; y < h; y++) {
          pushSeed(0, y);
          pushSeed(w - 1, y);
        }

        while (head < tail) {
          const curr = queue[head++];
          const idx4 = curr * 4;
          data[idx4 + 3] = 0; // Transparent exterior pixel

          const cx = curr % w;
          const cy = (curr / w) | 0;

          if (cx > 0) {
            const ni = curr - 1;
            if (!visited[ni] && isBg(ni * 4)) {
              visited[ni] = 1;
              queue[tail++] = ni;
            }
          }
          if (cx < w - 1) {
            const ni = curr + 1;
            if (!visited[ni] && isBg(ni * 4)) {
              visited[ni] = 1;
              queue[tail++] = ni;
            }
          }
          if (cy > 0) {
            const ni = curr - w;
            if (!visited[ni] && isBg(ni * 4)) {
              visited[ni] = 1;
              queue[tail++] = ni;
            }
          }
          if (cy < h - 1) {
            const ni = curr + w;
            if (!visited[ni] && isBg(ni * 4)) {
              visited[ni] = 1;
              queue[tail++] = ni;
            }
          }
        }

        // Apply luxury studio metallic grade & soften 1px exterior fringe
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const i = y * w + x;
            if (!visited[i]) {
              const idx4 = i * 4;
              const r = data[idx4];
              const g = data[idx4 + 1];
              const b = data[idx4 + 2];
              const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;

              if (grade === 'champagne-gold') {
                const c = Math.pow(lum, 0.88);
                data[idx4] = Math.min(255, Math.round(c * 255 + 18));
                data[idx4 + 1] = Math.min(255, Math.round(c * 212 + 8));
                data[idx4 + 2] = Math.min(255, Math.round(c * 138));
              } else if (grade === 'liquid-mercury') {
                const c = Math.pow(lum, 0.92);
                data[idx4] = Math.min(255, Math.round(c * 242));
                data[idx4 + 1] = Math.min(255, Math.round(c * 248));
                data[idx4 + 2] = Math.min(255, Math.round(c * 255));
              } else if (grade === 'rose-bronze') {
                const c = Math.pow(lum, 0.9);
                data[idx4] = Math.min(255, Math.round(c * 238 + 12));
                data[idx4 + 1] = Math.min(255, Math.round(c * 176 + 6));
                data[idx4 + 2] = Math.min(255, Math.round(c * 148));
              } else if (grade === 'smoked-crystal') {
                const c = Math.pow(lum, 1.05);
                data[idx4] = Math.min(255, Math.round(c * 215));
                data[idx4 + 1] = Math.min(255, Math.round(c * 228));
                data[idx4 + 2] = Math.min(255, Math.round(c * 248));
              }

              const touchesBg =
                visited[i - 1] || visited[i + 1] || visited[i - w] || visited[i + w];
              if (touchesBg) {
                const maxCh = Math.max(data[idx4], data[idx4 + 1], data[idx4 + 2]);
                if (maxCh < 68) {
                  data[idx4 + 3] = Math.round((maxCh / 68) * 220);
                }
              }
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const url = canvas.toDataURL('image/png');
        cutoutCache.set(cacheKey, url);
        if (!cancelled) setCutoutSrc(url);
      } catch {
        // Fallback to raw src if canvas fails
      }
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src, grade, cacheKey]);

  return <img src={cutoutSrc} alt={alt} className={className} loading={loading} />;
}

/**
 * 100% Original SOME.HOW 60fps Showreel Canvas (replaces noth.in's showreel mp4)
 */
function SomeHowShowreelCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const sources = [
      ...WORKS_ITEMS.map((w) => ({
        src: w.image,
        tag: w.title.toUpperCase(),
        sub: w.category,
      })),
      ...HERO_3D_LOGOS.slice(0, 6).map((h) => ({
        src: h.src,
        tag: 'SOME.HOW // 3D EDITION',
        sub: h.label,
      })),
    ];

    const loaded = [];
    sources.forEach((item, idx) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        loaded[idx] = { ...item, img };
      };
      img.src = item.src;
    });

    let rafId = null;
    const start = performance.now();

    const render = (now) => {
      const w = canvas.width;
      const h = canvas.height;
      const elapsed = (now - start) / 1000;

      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, w, h);

      const valid = loaded.filter(Boolean);
      if (valid.length > 0) {
        // Fast editorial cuts every 0.55s
        const cutIndex = Math.floor(elapsed / 0.55) % valid.length;
        const cutProgress = (elapsed % 0.55) / 0.55;
        const current = valid[cutIndex];

        if (current && current.img) {
          const zoom = 1.03 + cutProgress * 0.06;
          const iw = current.img.naturalWidth || 1280;
          const ih = current.img.naturalHeight || 720;
          const scale = Math.max(w / iw, h / ih) * zoom;
          const dw = iw * scale;
          const dh = ih * scale;
          const dx = (w - dw) * 0.5;
          const dy = (h - dh) * 0.5;

          ctx.save();
          ctx.drawImage(current.img, dx, dy, dw, dh);
          ctx.restore();

          // Subtle dark vignette for contrast
          const grad = ctx.createLinearGradient(0, 0, 0, h);
          grad.addColorStop(0, 'rgba(0,0,0,0.42)');
          grad.addColorStop(0.5, 'rgba(0,0,0,0.08)');
          grad.addColorStop(1, 'rgba(0,0,0,0.68)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);

          // Editorial HUD & kinetic typography
          ctx.fillStyle = 'rgba(255,255,255,0.92)';
          ctx.font = '600 18px "IBM Plex Mono", monospace';
          ctx.fillText(`SOME.HOW // SHOWREEL 2026`, 42, 48);

          const tc = new Date(Math.floor(elapsed * 1000)).toISOString().slice(14, 22);
          ctx.textAlign = 'right';
          ctx.fillText(`TC 00:${tc}`, w - 42, 48);

          ctx.textAlign = 'left';
          ctx.font = '600 54px "PP Neue Montreal", sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(current.tag, 42, h - 68);

          ctx.font = '400 20px "IBM Plex Mono", monospace';
          ctx.fillStyle = 'rgba(255,255,255,0.75)';
          ctx.fillText(`[ ${current.sub} ]`, 42, h - 34);
        }
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={1280}
      height={720}
      className="showreel-light"
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
    />
  );
}

/**
 * 100% Original SOME.HOW Manifesto Film + Ambient Reflection Canvas (replaces noth.in's museum mp4)
 */
function SomeHowManifestoFilm({ soundOn }) {
  const mainCanvasRef = useRef(null);
  const reflectCanvasRef = useRef(null);
  const audioCtxRef = useRef(null);

  // Ambient synthesizer chord when Sound is toggled ON
  useEffect(() => {
    if (!soundOn) {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const master = ctx.createGain();
      master.gain.value = 0.08;
      master.connect(ctx.destination);

      const freqs = [110, 164.81, 220, 277.18, 329.63];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.value = f;
        gain.gain.value = 0.18 / freqs.length;
        osc.connect(gain);
        gain.connect(master);
        osc.start();
      });
    } catch {
      // Ignore audio errors if blocked
    }

    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [soundOn]);

  useEffect(() => {
    const mainCanvas = mainCanvasRef.current;
    const reflectCanvas = reflectCanvasRef.current;
    if (!mainCanvas || !reflectCanvas) return;
    const mCtx = mainCanvas.getContext('2d');
    const rCtx = reflectCanvas.getContext('2d');

    const slides = [
      {
        line1: 'FORGET THE TEMPLATE.',
        line2: 'OWN THE CATEGORY.',
        imgSrc: HERO_3D_LOGOS[0].src,
      },
      {
        line1: 'SPEED IS A WEAPON.',
        line2: 'TASTE IS THE EDGE.',
        imgSrc: WORKS_ITEMS[0].image,
      },
      {
        line1: 'WE FUSE ART DIRECTION',
        line2: 'WITH DEEP SYSTEMS.',
        imgSrc: HERO_3D_LOGOS[2].src,
      },
      {
        line1: 'WE FIND A WAY.',
        line2: 'SOME.HOW.',
        imgSrc: HERO_3D_LOGOS[1].src,
      },
    ];

    const loadedImgs = [];
    slides.forEach((s, idx) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        loadedImgs[idx] = img;
      };
      img.src = s.imgSrc;
    });

    let rafId = null;
    const start = performance.now();

    const tick = (now) => {
      const elapsed = (now - start) / 1000;
      const w = mainCanvas.width;
      const h = mainCanvas.height;

      const slideIdx = Math.floor(elapsed / 2.4) % slides.length;
      const slideT = (elapsed % 2.4) / 2.4;
      const slide = slides[slideIdx];
      const bgImg = loadedImgs[slideIdx];

      mCtx.fillStyle = '#070709';
      mCtx.fillRect(0, 0, w, h);

      if (bgImg) {
        const scale = Math.max(w / bgImg.naturalWidth, h / bgImg.naturalHeight) * (1.02 + slideT * 0.08);
        const dw = bgImg.naturalWidth * scale;
        const dh = bgImg.naturalHeight * scale;
        mCtx.save();
        mCtx.globalAlpha = 0.72;
        mCtx.drawImage(bgImg, (w - dw) * 0.5, (h - dh) * 0.5, dw, dh);
        mCtx.restore();
      }

      // Vignette overlay
      const grad = mCtx.createRadialGradient(w * 0.5, h * 0.5, h * 0.1, w * 0.5, h * 0.5, w * 0.65);
      grad.addColorStop(0, 'rgba(0,0,0,0.2)');
      grad.addColorStop(1, 'rgba(0,0,0,0.78)');
      mCtx.fillStyle = grad;
      mCtx.fillRect(0, 0, w, h);

      // Center manifesto typography
      mCtx.textAlign = 'center';
      mCtx.textBaseline = 'middle';
      mCtx.fillStyle = '#ffffff';
      mCtx.font = '600 44px "PP Neue Montreal", sans-serif';
      mCtx.fillText(slide.line1, w * 0.5, h * 0.45);
      mCtx.fillText(slide.line2, w * 0.5, h * 0.55);

      mCtx.font = '500 15px "IBM Plex Mono", monospace';
      mCtx.fillStyle = 'rgba(255,255,255,0.65)';
      mCtx.fillText('SOME.HOW // MANIFESTO ARCHIVE 0' + (slideIdx + 1), w * 0.5, h - 36);

      // Copy into ambient reflection canvas
      rCtx.clearRect(0, 0, reflectCanvas.width, reflectCanvas.height);
      rCtx.drawImage(mainCanvas, 0, 0, reflectCanvas.width, reflectCanvas.height);

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <canvas
        ref={mainCanvasRef}
        width={960}
        height={540}
        className="video-sticky"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      <canvas
        ref={reflectCanvasRef}
        width={480}
        height={270}
        className="video-reflet"
      />
      <div
        className="cadre-video"
        style={{
          border: '14px solid #18181b',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.18), 0 30px 90px rgba(0,0,0,0.85)',
          pointerEvents: 'none',
        }}
      />
    </>
  );
}

export default function App() {
  const [openFaq, setOpenFaq] = useState(null);
  const [soundOn, setSoundOn] = useState(false);
  const [selectedWork, setSelectedWork] = useState(null);
  const [activePerspective, setActivePerspective] = useState(null);
  const [contactOpen, setContactOpen] = useState(false);

  const loaderRef = useRef(null);
  const loaderImgWRef = useRef(null);
  const loaderNbrRef = useRef(null);
  const formesRef = useRef(null);
  const glitchSectionRef = useRef(null);

  // 1. Smooth Scroll (Lenis + GSAP ScrollTrigger sync)
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on('scroll', ScrollTrigger.update);
    const tickerFn = (time) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerFn);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tickerFn);
      lenis.destroy();
    };
  }, []);

  // 2. Opening Black Loader Animation
  const runLoaderSequence = () => {
    const loader = loaderRef.current;
    const imgW = loaderImgWRef.current;
    const nbr = loaderNbrRef.current;
    if (!loader || !imgW || !nbr) return () => {};

    const nLoad = loader.querySelector('.n-load');
    const aposLoad = loader.querySelector('.apos-load');
    const imgs = [...loader.querySelectorAll('.loader-img')];

    gsap.killTweensOf([loader, imgW, nbr, nLoad, aposLoad, ...imgs]);

    gsap.set(loader, { display: 'block', autoAlpha: 1, height: '100vh' });
    gsap.set(nbr, { autoAlpha: 1 });
    nbr.textContent = '100';
    imgs.forEach((img) => gsap.set(img, { opacity: 0, scale: 0.8 }));
    gsap.set(imgW, { width: '1rem' });
    if (nLoad) gsap.set(nLoad, { yPercent: 100, opacity: 0 });
    if (aposLoad) gsap.set(aposLoad, { scale: 0, opacity: 1, transformOrigin: 'center center' });

    const totalDurationMs = 2400;
    let activeIdx = 0;
    let cycleTimeout = null;
    let counterObj = { val: 100 };

    const finishLoader = () => {
      if (cycleTimeout) clearTimeout(cycleTimeout);
      const currentImg = imgs[activeIdx];
      if (currentImg) {
        gsap.to(currentImg, { scale: 0, duration: 0.4, ease: 'power4.inOut', delay: 0.1 });
      }
      gsap.to(imgW, {
        width: '1rem',
        duration: 0.55,
        ease: 'power4.inOut',
        delay: 0.18,
        onComplete: () => {
          gsap.to(nbr, { autoAlpha: 0, duration: 0.35, ease: 'power4.inOut' });
          if (nLoad) gsap.to(nLoad, { yPercent: 100, duration: 0.65, ease: 'power4.inOut' });
          if (aposLoad) gsap.to(aposLoad, { scale: 0, duration: 0.65, ease: 'power4.inOut' });
          gsap.to(loader, {
            height: 0,
            duration: 1.05,
            ease: 'power4.inOut',
            onComplete: () => {
              gsap.set(loader, { display: 'none' });
            },
          });
        },
      });
    };

    const stepImages = (startTime) => {
      const elapsed = performance.now() - startTime;
      if (elapsed >= totalDurationMs) {
        finishLoader();
        return;
      }
      const progress = Math.min(elapsed / totalDurationMs, 1);
      const delayMs = 95 + (280 - 95) * (1 - Math.sin(progress * Math.PI));

      cycleTimeout = setTimeout(() => {
        const prevImg = imgs[activeIdx];
        if (prevImg) {
          gsap.killTweensOf(prevImg);
          gsap.set(prevImg, { opacity: 0 });
        }
        activeIdx = (activeIdx + 1) % imgs.length;
        const nextImg = imgs[activeIdx];
        if (nextImg) {
          gsap.killTweensOf(nextImg);
          gsap.fromTo(
            nextImg,
            { opacity: 0, scale: 0.78, rotate: (Math.random() - 0.5) * 24 },
            {
              opacity: 1,
              scale: 1,
              rotate: (Math.random() - 0.5) * 12,
              duration: 0.24,
              ease: 'back.out(1.3)',
            }
          );
        }
        stepImages(startTime);
      }, delayMs);
    };

    gsap.to(nLoad, {
      opacity: 1,
      yPercent: 0,
      duration: 0.6,
      ease: 'power4.inOut',
      onComplete: () => {
        const targetW = window.matchMedia('(max-width: 991px)').matches ? '10rem' : '20rem';
        gsap.fromTo(imgW, { width: '1rem' }, { width: targetW, duration: 0.75, ease: 'power4.inOut' });
        if (imgs[0]) {
          gsap.set(imgs[0], { opacity: 1, scale: 0 });
          gsap.to(imgs[0], {
            scale: 1,
            rotate: 15,
            duration: 0.48,
            ease: 'back.out(0.9)',
            delay: 0.2,
            onComplete: () => {
              gsap.to(counterObj, {
                val: 0,
                duration: totalDurationMs / 1000,
                ease: 'power2.inOut',
                onUpdate: () => {
                  if (nbr) nbr.textContent = String(Math.round(counterObj.val)).padStart(3, '0');
                },
                onComplete: () => {
                  if (nbr) nbr.textContent = '000';
                },
              });
              stepImages(performance.now());
            },
          });
        }
      },
    });
    if (aposLoad) {
      gsap.to(aposLoad, { scale: 1, duration: 0.6, ease: 'power4.inOut' });
    }

    return () => {
      if (cycleTimeout) clearTimeout(cycleTimeout);
      gsap.killTweensOf([loader, imgW, nbr, nLoad, aposLoad, counterObj, ...imgs]);
    };
  };

  useEffect(() => {
    const cleanup = runLoaderSequence();
    return cleanup;
  }, []);

  // 3. Navbar menu hover & scroll animations (xv, Vv, lx, Yv, ax from noth.in)
  useEffect(() => {
    const ctx = gsap.context(() => {
      const isDesktop = window.matchMedia('(min-width: 992px)').matches;

      // A. Menu button 4-square rotation + staggered links slide
      const menuBtn = document.querySelector('.menu-btn');
      const menuLinksW = document.querySelector('.menu-links-w');
      const menuSvg = document.querySelector('.menu-svg');
      const menuRects = menuSvg ? [...menuSvg.querySelectorAll('rect')] : [];
      const menuLinks = menuLinksW ? [...menuLinksW.querySelectorAll('.link-boiler-inner')] : [];

      if (isDesktop && menuBtn && menuLinksW && menuLinks.length) {
        gsap.set(menuLinks, { yPercent: 110 });
        if (menuSvg) gsap.set(menuSvg, { transformOrigin: '50% 50%' });

        const offsets = menuRects.map((r) => ({
          x: parseFloat(r.getAttribute('x') || '0') + 1 < 3 ? 0.35 : -0.35,
          y: parseFloat(r.getAttribute('y') || '0') + 1 < 3 ? 0.35 : -0.35,
        }));

        const menuTl = gsap.timeline({ paused: true });
        if (menuSvg) menuTl.to(menuSvg, { rotateZ: 45, duration: 0.5, ease: 'power4.out' }, 0);
        menuRects.forEach((r, idx) => {
          menuTl.to(r, { x: offsets[idx].x, y: offsets[idx].y, duration: 0.5, ease: 'power4.out' }, 0);
        });
        menuTl.to(menuLinks, { yPercent: 0, duration: 0.55, ease: 'power4.out', stagger: 0.07 }, 0);

        let closeTimer = null;
        const openMenu = () => {
          clearTimeout(closeTimer);
          menuTl.play();
        };
        const closeMenu = () => {
          clearTimeout(closeTimer);
          closeTimer = setTimeout(() => menuTl.reverse(), 80);
        };

        menuBtn.addEventListener('mouseenter', openMenu);
        menuBtn.addEventListener('mouseleave', closeMenu);
        menuLinksW.addEventListener('mouseenter', openMenu);
        menuLinksW.addEventListener('mouseleave', closeMenu);
      }

      // B. Showreel scroll-scrubbed scale down (exact xv() from noth.in)
      if (isDesktop) {
        const showreelSection = document.querySelector('.section.showreel');
        const showreelFullW = document.querySelector('.video-showreel-full-w');
        if (showreelSection && showreelFullW) {
          gsap.fromTo(
            showreelFullW,
            { width: '100%', height: '100%' },
            {
              width: '33.3%',
              height: '35%',
              ease: 'power4.inOut',
              immediateRender: false,
              scrollTrigger: {
                trigger: showreelSection,
                start: 'top top',
                end: 'bottom bottom',
                scrub: 2.5,
                invalidateOnRefresh: true,
              },
            }
          );
        }
      }

      // C. Works sticky word convergence + clip-path reveal + parallax + lerped cursor
      const worksSection = document.querySelector('.section.works');
      if (worksSection && isDesktop) {
        const letters = [...worksSection.querySelectorAll('.works-word')];
        if (letters.length === 5) {
          gsap.fromTo(
            letters,
            {
              x: (i) => (i - 2) * window.innerWidth * 0.17,
            },
            {
              x: 0,
              ease: 'power4.inOut',
              scrollTrigger: {
                trigger: worksSection,
                start: 'top 80%',
                end: 'bottom bottom',
                scrub: 2,
              },
            }
          );
        }
      }

      const workItems = [...document.querySelectorAll('.work_item')];
      workItems.forEach((item, idx) => {
        const imgW = item.querySelector('.img-work-w');
        const img = item.querySelector('.img-work');
        const cfg = WORKS_ITEMS[idx % WORKS_ITEMS.length];

        if (imgW) {
          gsap.set(imgW, { clipPath: cfg.clipInitial });
          gsap.to(imgW, {
            clipPath: 'inset(0% 0% 0% 0%)',
            ease: 'power4.inOut',
            duration: 1.1,
            scrollTrigger: {
              trigger: item,
              start: 'top 88%',
              toggleActions: 'play none none none',
            },
          });
        }

        if (isDesktop) {
          gsap.fromTo(
            item,
            { y: 0 },
            {
              y: cfg.parallaxY,
              ease: 'none',
              scrollTrigger: {
                trigger: item,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1.5,
              },
            }
          );
        }

        // Lerped cursor pill inside each work card (exact Wv() from noth.in)
        const link = item.querySelector('.work-link');
        const cursor = item.querySelector('.cursor-work');
        if (link && cursor) {
          gsap.set(cursor, {
            position: 'absolute',
            xPercent: -50,
            yPercent: -50,
            left: 0,
            top: 0,
            scale: 0,
            autoAlpha: 0,
            pointerEvents: 'none',
            zIndex: 10,
          });
          const state = { tx: 0, ty: 0, cx: 0, cy: 0, raf: null, active: false };
          const tick = () => {
            state.cx += (state.tx - state.cx) * 0.11;
            state.cy += (state.ty - state.cy) * 0.11;
            gsap.set(cursor, { x: state.cx, y: state.cy });
            if (
              state.active ||
              Math.abs(state.cx - state.tx) > 0.05 ||
              Math.abs(state.cy - state.ty) > 0.05
            ) {
              state.raf = requestAnimationFrame(tick);
            } else {
              state.raf = null;
            }
          };
          link.addEventListener('mousemove', (e) => {
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
                autoAlpha: 1,
                duration: 0.55,
                ease: 'back.out(1.8)',
                overwrite: 'auto',
              });
            }
            if (!state.raf) state.raf = requestAnimationFrame(tick);
          });
          link.addEventListener('mouseleave', () => {
            state.active = false;
            gsap.to(cursor, {
              scale: 0,
              autoAlpha: 0,
              duration: 0.35,
              ease: 'power3.in',
              overwrite: 'auto',
            });
          });
        }
      });

      // D. Museum / Manifesto Pinned Video Section (exact lx() from noth.in)
      const museeW = document.querySelector('.musee-w');
      if (museeW && isDesktop) {
        const videoW = museeW.querySelector('.video-w');
        const museeBg = museeW.querySelector('.musee-bg');
        if (videoW) {
          gsap.fromTo(
            videoW,
            { scale: 1.4 },
            {
              scale: 0.38,
              ease: 'none',
              scrollTrigger: {
                trigger: museeW,
                start: 'top top',
                end: 'bottom top',
                pin: museeW,
                pinSpacing: true,
                scrub: 1,
                invalidateOnRefresh: true,
              },
            }
          );
        }
        if (museeBg) {
          gsap.fromTo(
            museeBg,
            { scale: 1.8 },
            {
              scale: 1,
              ease: 'none',
              scrollTrigger: {
                trigger: museeW,
                start: 'top top',
                end: 'bottom top',
                scrub: 1,
                invalidateOnRefresh: true,
              },
            }
          );
        }
      }

      // E. Parallax image blocks in Studio section (exact nx() from noth.in)
      document.querySelectorAll('[data-parallax-y]').forEach((el) => {
        const py = parseFloat(el.getAttribute('data-parallax-y') || '-60');
        const scrub = parseFloat(el.getAttribute('data-parallax-scrub') || '1.5');
        gsap.fromTo(
          el,
          { y: 0 },
          {
            y: py,
            ease: 'none',
            scrollTrigger: {
              trigger: el,
              start: 'top bottom',
              end: 'bottom top',
              scrub,
            },
          }
        );
      });

      // F. Repulsive 3D Objects & Letter Cursors in .formes-w (exact Yv() from noth.in)
      const formesEl = formesRef.current;
      if (formesEl) {
        const getObjects = () => [...formesEl.querySelectorAll('img, svg')];
        getObjects().forEach((obj) => {
          const computedRot = Number(gsap.getProperty(obj, 'rotation')) || 0;
          obj.dataset.baseRot = String(computedRot);
        });

        const applyRepulsion = (mx, my) => {
          const objects = getObjects();
          const isMobile = window.matchMedia('(max-width: 767px)').matches;
          const influenceRadius = isMobile ? 260 : 460;
          const maxDistance = isMobile ? 110 : 380;
          const rotForce = isMobile ? 12 : 30;
          const scaleForce = isMobile ? 0.1 : 0.2;

          objects.forEach((obj) => {
            const curX = Number(gsap.getProperty(obj, 'x')) || 0;
            const curY = Number(gsap.getProperty(obj, 'y')) || 0;
            const rect = obj.getBoundingClientRect();
            const ox = rect.left + rect.width / 2 - curX;
            const oy = rect.top + rect.height / 2 - curY;
            const dist = Math.hypot(mx - ox, my - oy);
            const baseRot = parseFloat(obj.dataset.baseRot || '0');

            if (dist < influenceRadius) {
              const angle = Math.atan2(my - oy, mx - ox);
              const factor = Math.pow((influenceRadius - dist) / influenceRadius, 1.6);
              const push = factor * maxDistance;
              const rot = baseRot - Math.cos(angle) * factor * rotForce;
              gsap.to(obj, {
                x: -Math.cos(angle) * push,
                y: -Math.sin(angle) * push,
                rotation: rot,
                scale: 1 + factor * scaleForce,
                duration: 0.45,
                ease: 'power4.out',
                overwrite: 'auto',
              });
            } else {
              gsap.to(obj, {
                x: 0,
                y: 0,
                rotation: baseRot,
                scale: 1,
                duration: 1.2,
                ease: 'elastic.out(1, 0.35)',
                overwrite: 'auto',
              });
            }
          });
        };

        const onMove = (e) => applyRepulsion(e.clientX, e.clientY);
        const onLeave = () => {
          getObjects().forEach((obj) => {
            gsap.to(obj, {
              x: 0,
              y: 0,
              rotation: parseFloat(obj.dataset.baseRot || '0'),
              scale: 1,
              duration: 1.2,
              ease: 'elastic.out(1, 0.35)',
              overwrite: 'auto',
            });
          });
        };

        formesEl.addEventListener('mousemove', onMove);
        formesEl.addEventListener('mouseleave', onLeave);
      }

      // G. Glitch Section Scroll-Velocity Scramble & Parallax (exact ax() from noth.in)
      const glitchEl = glitchSectionRef.current;
      if (glitchEl) {
        const glitchImgW = glitchEl.querySelector('.glitch-img-w');
        const imgGlitchW = glitchEl.querySelector('.img-glitch-w');
        const glitchBlocks = [...glitchEl.querySelectorAll('.text-block-6')];
        const glitchCharset = 'Pj(è !”.U§hsjkjkrh@#%&*+=?/:;<>[]{}~';

        if (glitchImgW) {
          gsap.to(glitchImgW, {
            opacity: 0.28,
            ease: 'none',
            scrollTrigger: {
              trigger: glitchEl,
              start: 'top top',
              end: 'center center',
              scrub: 2,
            },
          });
        }
        if (imgGlitchW) {
          const [leftCard, rightCard] = [...imgGlitchW.children];
          if (leftCard) {
            gsap.fromTo(
              leftCard,
              { y: 100 },
              {
                y: -280,
                ease: 'none',
                scrollTrigger: {
                  trigger: glitchEl,
                  start: 'top top',
                  end: 'bottom top',
                  scrub: 1.5,
                },
              }
            );
          }
          if (rightCard) {
            gsap.fromTo(
              rightCard,
              { y: 100 },
              {
                y: -680,
                ease: 'none',
                scrollTrigger: {
                  trigger: glitchEl,
                  start: 'top top',
                  end: 'bottom top',
                  scrub: 2.8,
                },
              }
            );
          }
        }

        // Scroll-driven glitch scramble on .text-block-6
        const baseLines = [
          'break the pattern // some.how',
          'break the pattern // some.how',
          'break the pattern // some.how',
          'ERR_GENERIC_404 >> OVERRIDE_OK',
        ];
        ScrollTrigger.create({
          trigger: glitchEl,
          start: 'top bottom',
          end: 'bottom top',
          onUpdate: (self) => {
            const vel = Math.min(Math.abs(self.getVelocity()) / 1800, 0.55);
            if (vel < 0.04) return;
            glitchBlocks.forEach((blk) => {
              const lines = baseLines.map((line, li) => {
                if (li === 3) return line;
                return line
                  .split('')
                  .map((ch) => {
                    if (ch === ' ') return ' ';
                    return Math.random() < vel * 0.45
                      ? glitchCharset[Math.floor(Math.random() * glitchCharset.length)]
                      : ch;
                  })
                  .join('');
              });
              blk.innerHTML = lines.join('<br/>');
            });
          },
        });
      }
    });

    return () => ctx.revert();
  }, []);

  // Toggle sound on Manifesto film
  const handleToggleSound = () => {
    setSoundOn((prev) => !prev);
  };

  return (
    <>
      {/* Persistent Architectural Blueprint Grid across the entire website & landing page */}
      <div className="architectural-grid-bg" aria-hidden="true">
        <div className="arch-grid-columns">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div key={idx} className="arch-grid-col">
              <span className="arch-col-index">{String(idx + 1).padStart(2, '0')}</span>
              <span className="arch-crosshair top">+</span>
              <span className="arch-crosshair mid">+</span>
              <span className="arch-crosshair bot">+</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fixed Mix-Blend Navbar (exact .nav-boiler from noth.in) */}
      <nav className="nav-boiler">
        <a
          href="#top"
          className="nav-logo-wrap"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <SomeHowNavLogo />
        </a>

        <div className="menu-w">
          <div className="menu-btn">
            <div className="menu-btn-text">menu</div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="100%"
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
              <span className="link-boiler-inner">works</span>
            </a>
            <a href="#studio" className="link-boiler">
              <span className="link-boiler-inner">STUDIO</span>
            </a>
            <a href="#studio-video" className="link-boiler">
              <span className="link-boiler-inner">manifesto</span>
            </a>
            <a href="#faqs" className="link-boiler">
              <span className="link-boiler-inner">faqs</span>
            </a>
            <a
              href="#contact"
              className="link-boiler"
              onClick={(e) => {
                e.preventDefault();
                setContactOpen(true);
              }}
            >
              <span className="link-boiler-inner">contact</span>
            </a>
          </div>
        </div>
      </nav>

      {/* Black Opening Loader with SOME.HOW 3D sculptural objects (click to skip) */}
      <div
        ref={loaderRef}
        className="loader"
        onClick={() => {
          if (loaderRef.current) {
            gsap.to(loaderRef.current, {
              height: 0,
              duration: 0.55,
              ease: 'power4.inOut',
              onComplete: () => gsap.set(loaderRef.current, { display: 'none' }),
            });
          }
        }}
        title="Click anywhere to skip intro"
      >
        <div className="loader-c">
          <div className="fake-top-loader">
            <div>SOME.HOW</div>
          </div>
          <div className="loader-anim">
            <div className="loader-glyph-clip">
              <LoaderLeftGlyph />
            </div>
            <div ref={loaderImgWRef} className="loader-img-w">
              {LOADER_3D_OBJECTS.map((obj) => (
                <CutoutSculptureImg
                  key={obj.id}
                  src={obj.src}
                  grade={obj.grade}
                  alt={obj.alt}
                  className={`loader-img ${obj.cls}`}
                />
              ))}
            </div>
            <LoaderRightGlyph />
          </div>
          <div className="loader-nbr-w">
            <div ref={loaderNbrRef}>100</div>
          </div>
        </div>
      </div>

      {/* Main Page Wrapper */}
      <div id="top" className="page-wrapper">
        <div className="main-wrapper">
          <div className="page_view">
            {/* 1. HERO LANDING SECTION — Black/Grey Architectural Grid + Navier-Stokes Fluid Reveal of 12 Rapid-Cycling 3D SOME.HOW Logos */}
            <section className="section-w">
              <div className="section-fake-hero">
                <div className="div-block">
                  <div className="p-l">
                    When they say it can’t be built,
                    <br />
                    we make it happen—some.how.
                  </div>
                  <div className="space-24" />
                  <div className="hero-cta-row">
                    <a
                      href="#contact"
                      onClick={(e) => {
                        e.preventDefault();
                        setContactOpen(true);
                      }}
                      className="btn black-blend"
                    >
                      <div className="btn__text">
                        <p className="btn__text-p">initiate a brief</p>
                      </div>
                      <div className="arrow-w">
                        <div className="arrow black-blend">
                          <div className="line-arrow" />
                          <div className="shape-arrow" />
                        </div>
                      </div>
                    </a>
                    <button
                      type="button"
                      className="replay-loader-pill"
                      onClick={runLoaderSequence}
                      title="Replay opening 3D sequence"
                    >
                      replay intro ↻
                    </button>
                  </div>
                </div>

                <div className="link-hero-bottom-w">
                  <h1 className="h1">Design, Software &amp; AI Engineering</h1>
                  <div className="link-hero-lang-w">
                    <div className="link-hero-w">
                      <a
                        href="https://github.com/NikosKotsifas"
                        target="_blank"
                        rel="noreferrer"
                        className="link"
                      >
                        <div>GitHub</div>
                      </a>
                      <span className="link pointer-none">/</span>
                      <a href="#works" className="link">
                        <div>Selected Works</div>
                      </a>
                    </div>
                    <div className="lang-wrapper">
                      <div className="lang-list">
                        <span className="lang-link w--current">ENG</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Exact noth.in Two-Layer Hero Architecture:
                  Layer 0 (z-index: 0): .video-hero-bg — 60fps continuously developing 3D luxury SOME.HOW logos
                  Layer 1 (z-index: 1): .mask-reveal-canvas — opaque static white SOME.HOW logo layer that becomes transparent ONLY along the cursor fluid wake */}
              <FluidHeroCanvas />

              <section className="section hero-home">
                <div className="container hero-home">
                  <div className="nothin-hero-w">
                    <SomeHowHeroStaticSvg />
                  </div>
                </div>
              </section>
            </section>

            {/* 2. SHOWREEL SECTION (100% original SOME.HOW 60fps Showreel Canvas) */}
            <section className="section showreel">
              <div className="container showreel">
                <div className="space-150 mob-50" />
                <h2 className="h1-home balance">
                  Templates are for followers.
                  <br />
                  We build category leaders.
                </h2>
                <div className="space-65" />
                <div className="video-showreel-w">
                  <div className="video-showreel-full-w">
                    <SomeHowShowreelCanvas />
                  </div>
                  <div className="video-showreel-flip p-m">
                    <div>( The unfair advantage )</div>
                    <div className="text-block-2">
                      A great digital presence isn’t decoration—it’s leverage. We engineer spatial
                      web experiences and intelligent software that make your brand impossible to
                      ignore.
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. WORKS SECTION (100% original SOME.HOW Case Studies) */}
            <section id="works" className="section works">
              <div className="container works">
                <div className="works-word-w">
                  <div className="div-block-2">
                    <div className="works-word-block-state1">
                      <div className="works-word">w</div>
                    </div>
                    <div className="works-word-block-state1">
                      <div className="works-word o">o</div>
                    </div>
                    <div className="works-word-block-state1">
                      <div className="works-word r">r</div>
                    </div>
                    <div className="works-word-block-state1">
                      <div className="works-word k">k</div>
                    </div>
                    <div className="works-word-block-state1">
                      <div className="works-word">s</div>
                    </div>
                  </div>
                </div>

                <div className="space-87" />
                <div className="titile-section-work">
                  <h2 className="h3-style">
                    Don’t just launch.
                    <br />
                    Set the new standard.
                  </h2>
                </div>

                <div className="work_list_w">
                  <div role="list" className="work_list">
                    {WORKS_ITEMS.map((item, idx) => {
                      const row = Math.floor(idx / 6) * 4 + item.rowOffset + 1;
                      return (
                        <div
                          key={item.id}
                          role="listitem"
                          className="work_item"
                          style={{
                            gridColumn: item.col,
                            gridRow: String(row),
                            alignSelf: item.alignSelf || 'end',
                          }}
                        >
                          <h2 className="title-work">{item.title}</h2>
                          <p className="short-p-work">{item.subtitle}</p>
                          <a
                            href={`#work-${item.id}`}
                            className="work-link"
                            onClick={(e) => {
                              e.preventDefault();
                              setSelectedWork(item);
                              setActivePerspective(item.image);
                            }}
                          >
                            <div className="img-work-w">
                              <img
                                src={item.image}
                                alt={item.title}
                                loading="lazy"
                                className="img-work"
                              />
                            </div>
                            <div className="cursor-work">
                              <div>view case</div>
                              <svg
                                width="14"
                                height="10"
                                viewBox="0 0 14 10"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M8.60254 0.353516L13.1188 4.86981L8.60254 9.3861"
                                  stroke="white"
                                />
                                <line y1="5.01562" x2="13.1188" y2="5.01562" stroke="white" />
                              </svg>
                            </div>
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-150 hide-tablet" />
                <div className="space-150 mob-100" />
                <div className="work-view-all-w">
                  <a
                    href="#contact"
                    className="btn view-all-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      setContactOpen(true);
                    }}
                  >
                    <div>Build with us</div>
                    <div className="code-embed-2">
                      <svg
                        className="arrow-icon"
                        width="24"
                        height="12"
                        viewBox="-8 -1 26 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <polyline
                          className="arrow-shaft"
                          points="0.5,0 0.5,7.5 15.5,7.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          fill="none"
                          strokeLinejoin="round"
                        />
                        <polyline
                          className="arrow-head"
                          points="12,4 15.5,7.5 12,11"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </a>
                  <div className="nbr-works-w">
                    <div className="div-block-3">
                      <div>(</div>
                      <div>{String(WORKS_ITEMS.length).padStart(2, '0')}</div>
                      <div>)</div>
                    </div>
                  </div>
                  <div className="text-block-3">© 24 . 26</div>
                </div>
                <div className="space-150 mob-100" />
              </div>
            </section>

            {/* 4. MANIFESTO / MUSEUM STICKY FILM SECTION (100% original SOME.HOW gallery + film) */}
            <section id="studio-video" className="section video">
              <div className="container video">
                <div className="musee-w">
                  <img
                    src={MEDIA_ASSETS.manifestoBg}
                    loading="lazy"
                    alt="SOME.HOW Gallery Space"
                    className="musee-bg"
                  />
                  <div className="video-w">
                    <SomeHowManifestoFilm soundOn={soundOn} />
                  </div>
                  <button
                    type="button"
                    className={`btn-sound ${soundOn ? 'is-on' : ''}`}
                    onClick={handleToggleSound}
                  >
                    <div>Sound</div>
                    <div className="toggle-sound">
                      <div
                        className="tick-sound"
                        style={{
                          transform: soundOn ? 'translateX(0.65rem)' : 'translateX(0)',
                          transition: 'transform 0.3s ease',
                        }}
                      />
                    </div>
                  </button>
                </div>
              </div>
            </section>

            {/* 5. THE STUDIO + REPULSIVE 3D ILLUSTRATIONS PLAYGROUND (100% original SOME.HOW sculptures) */}
            <section id="studio" className="section info-img">
              <div className="section-separator-blur" />
              <div className="container">
                <div className="space-87" />
                <div className="info-w p-l">
                  <div>( Why Some.how )</div>
                  <div className="text-block-7">
                    “We’ll figure it out, somehow.” That single word is how every ambitious
                    company is born. We turned it into a studio—combining senior design direction,
                    full-stack engineering, and autonomous AI under one roof...
                  </div>
                  <div className="space-24" />
                  <div className="space-24" />
                  <div className="img-block-grid studio-parallax-pair">
                    <div
                      data-parallax-y="-100"
                      data-parallax-scrub="1"
                      className="img-block-left"
                    >
                      <div className="img-block-left-w">
                        <img
                          className="image"
                          src={MEDIA_ASSETS.studioLeftImg}
                          alt="Brutalist Vinyl Sculpture"
                          loading="lazy"
                        />
                      </div>
                      <div className="text-block-4">
                        and we make
                        <br />
                        it look effortless.
                      </div>
                    </div>
                    <div
                      data-parallax-y="-60"
                      data-parallax-scrub="2"
                      className="img-block-right-w"
                    >
                      <img
                        className="image"
                        src={MEDIA_ASSETS.studioRightImg}
                        alt="Chrome Sphere Landscape"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-150 hide-landscape" />
                <div className="space-87" />
                <h2 className="h1-home">
                  Taste meets
                  <br />
                  technology.
                </h2>
                <div className="space-87" />

                <div className="infobusiness-grid">
                  <div className="img-block-grid">
                    <div className="info-grid-left">
                      <div className="text-block-4">Core capabilities :</div>
                      <div className="fake-img" />
                    </div>
                    <div className="info-grid-right">
                      <div className="div-block-4">
                        <div className="list">
                          {STUDIO_SERVICES.map((srv) => (
                            <div key={srv} className="list-item">
                              <div className="list-dot" />
                              <div>{srv}</div>
                            </div>
                          ))}
                        </div>
                        <div className="hide-tablet">
                          Designed for humans.
                          <br />
                          Powered by autonomous code.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-87" />

                {/* 3D Repulsive Playground with our 6 original SOME.HOW 3D sculptural objects + letter cursors */}
                <div ref={formesRef} className="formes-w">
                  <CutoutSculptureImg
                    src={LOADER_3D_OBJECTS[1].src}
                    grade={LOADER_3D_OBJECTS[1].grade}
                    loading="lazy"
                    alt={LOADER_3D_OBJECTS[1].alt}
                    className="papier-form"
                  />
                  <CutoutSculptureImg
                    src={LOADER_3D_OBJECTS[5].src}
                    grade={LOADER_3D_OBJECTS[5].grade}
                    loading="lazy"
                    alt={LOADER_3D_OBJECTS[5].alt}
                    className="chewing-gum"
                  />
                  <CutoutSculptureImg
                    src={LOADER_3D_OBJECTS[4].src}
                    grade={LOADER_3D_OBJECTS[4].grade}
                    loading="lazy"
                    alt={LOADER_3D_OBJECTS[4].alt}
                    className="bonbon-copy"
                  />
                  <CutoutSculptureImg
                    src={LOADER_3D_OBJECTS[2].src}
                    grade={LOADER_3D_OBJECTS[2].grade}
                    loading="lazy"
                    alt={LOADER_3D_OBJECTS[2].alt}
                    className="etoile"
                  />
                  <CutoutSculptureImg
                    src={LOADER_3D_OBJECTS[0].src}
                    grade={LOADER_3D_OBJECTS[0].grade}
                    loading="lazy"
                    alt={LOADER_3D_OBJECTS[0].alt}
                    className="coeur-copy"
                  />
                  {/* Floating vector letter cursors */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="100%"
                    viewBox="0 0 62 69"
                    fill="none"
                    className="n-cursor _2"
                  >
                    <path
                      d="M45.2833 0.043432C45.7249 -0.0847957 46.0096 0.0711954 46.1374 0.511405L61.9272 54.8902C62.055 55.3304 61.8981 55.6146 61.4565 55.7429L50.1176 59.0353C49.8578 59.1107 49.6497 59.0729 49.4931 58.9218L22.8641 37.9303C22.581 37.7317 22.2987 37.7294 22.0171 37.9235C21.7279 38.0917 21.6322 38.3441 21.7299 38.6808L29.4577 64.2761C29.5931 64.7422 29.4399 65.0394 28.9983 65.1676L16.7242 68.7316C16.2566 68.8674 15.9589 68.7152 15.8311 68.275L0.0413424 13.8962C-0.0864795 13.4559 0.0834018 13.168 0.550987 13.0322L11.7341 9.785C11.9938 9.70957 12.2187 9.75657 12.4088 9.92602L39.7022 32.9147C39.9593 33.1208 40.2324 33.1398 40.5215 32.9716C40.8292 32.77 40.9341 32.5008 40.8364 32.1642L32.4995 4.47139C32.3717 4.03118 32.5286 3.74696 32.9702 3.61873L45.2833 0.043432Z"
                      fill="currentColor"
                    />
                  </svg>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="100%"
                    viewBox="0 0 62 69"
                    fill="none"
                    className="n-cursor"
                  >
                    <path
                      d="M45.2833 0.043432C45.7249 -0.0847957 46.0096 0.0711954 46.1374 0.511405L61.9272 54.8902C62.055 55.3304 61.8981 55.6146 61.4565 55.7429L50.1176 59.0353C49.8578 59.1107 49.6497 59.0729 49.4931 58.9218L22.8641 37.9303C22.581 37.7317 22.2987 37.7294 22.0171 37.9235C21.7279 38.0917 21.6322 38.3441 21.7299 38.6808L29.4577 64.2761C29.5931 64.7422 29.4399 65.0394 28.9983 65.1676L16.7242 68.7316C16.2566 68.8674 15.9589 68.7152 15.8311 68.275L0.0413424 13.8962C-0.0864795 13.4559 0.0834018 13.168 0.550987 13.0322L11.7341 9.785C11.9938 9.70957 12.2187 9.75657 12.4088 9.92602L39.7022 32.9147C39.9593 33.1208 40.2324 33.1398 40.5215 32.9716C40.8292 32.77 40.9341 32.5008 40.8364 32.1642L32.4995 4.47139C32.3717 4.03118 32.5286 3.74696 32.9702 3.61873L45.2833 0.043432Z"
                      fill="currentColor"
                    />
                  </svg>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="100%"
                    viewBox="0 0 31 33"
                    fill="none"
                    className="t-cursor"
                  >
                    <path
                      d="M11.5142 28.4178L6.17276 25.0772L16.7141 8.22217L10.5419 4.36195L13.27 -0.000193374L30.9263 11.0423L28.1982 15.4044L22.0555 11.5628L11.5142 28.4178Z"
                      fill="currentColor"
                    />
                  </svg>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="100%"
                    viewBox="0 0 17 18"
                    fill="none"
                    className="h-cursor"
                  >
                    <path
                      d="M8.89896 16.4842L5.58487 17.8902L2.76937e-06 4.72589L3.3141 3.31992L5.50118 8.47517L10.012 6.56148L7.82495 1.40622L11.139 0.000241487L16.7239 13.1646L13.4098 14.5705L11.1602 9.26799L6.64939 11.1817L8.89896 16.4842Z"
                      fill="currentColor"
                    />
                  </svg>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="100%"
                    viewBox="0 0 24 25"
                    fill="none"
                    className="apos-cursor"
                  >
                    <path
                      d="M23.0424 2.76167C23.2441 2.80736 23.3872 2.93582 23.4719 3.14704C23.5817 3.36397 23.5878 3.5711 23.4901 3.76843L9.45106 23.7966C9.30448 24.0926 9.05475 24.2006 8.70184 24.1207L0.53459 22.2701C0.332929 22.2244 0.174224 22.1061 0.0584542 21.9153C-0.0261954 21.7041 -0.019669 21.4998 0.0780476 21.3025L10.1758 0.422389C10.3594 0.079915 10.6151 -0.054197 10.9428 0.0200552L23.0424 2.76167Z"
                      fill="currentColor"
                    />
                  </svg>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="100%"
                    viewBox="0 0 13 22"
                    fill="none"
                    className="i-cursor"
                  >
                    <path
                      d="M5.03568 21.9525L9.34553e-05 20.0024L7.74633 -8.77758e-05L12.7819 1.95001L5.03568 21.9525Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>

                <div className="infobusiness-grid">
                  <div className="img-block-grid p-s">
                    <div className="info-grid-left">
                      <div className="text-block-4 marg-40">Leadership &amp; Architecture :</div>
                      <div className="fake-img" />
                    </div>
                    <div className="info-grid-right second">
                      <div className="div-block-4">
                        <div className="list">
                          <h2 className="title-work info-team">direction &amp; engineering</h2>
                          <div className="list-item">
                            <div>Nikos Kotsifas</div>
                          </div>
                          <div className="list-item">
                            <div>Creative Direction</div>
                          </div>
                          <div className="list-item">
                            <div>Full-Stack Systems</div>
                          </div>
                        </div>
                        <div>
                          <h2 className="title-work info-team">capabilities</h2>
                          <div className="list-item">
                            <div>WebGL &amp; Motion</div>
                          </div>
                          <div className="list-item">
                            <div>AI Automation</div>
                          </div>
                          <div className="list-item">
                            <div>Brand Architecture</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-87 hide-landscape" />
              </div>
            </section>

            {/* 6. GLITCH SECTION (100% original SOME.HOW glitch editorial photography) */}
            <section ref={glitchSectionRef} className="section glitch">
              <div className="glitch-img-w">
                <img
                  src={MEDIA_ASSETS.glitchBgImg}
                  loading="lazy"
                  alt=""
                  className="img-ascenseur"
                />
              </div>
              <div className="glitch-text-w">
                <div className="glitch-text-sticky-w">
                  <div className="div-block-5">
                    <div className="text-block-6 _3">
                      break the pattern // some.how
                      <br />
                      break the pattern // some.how
                      <br />
                      break the pattern // some.how
                      <br />
                      ERR_GENERIC_404 &gt;&gt; OVERRIDE_OK
                    </div>
                  </div>
                  <div className="div-block-5">
                    <div className="text-block-6 _1">
                      break the pattern // some.how
                      <br />
                      break the pattern // some.how
                      <br />
                      break the pattern // some.how
                      <br />
                      ERR_GENERIC_404 &gt;&gt; OVERRIDE_OK
                    </div>
                  </div>
                  <div className="div-block-5">
                    <div className="text-block-6 _2">
                      break the pattern // some.how
                      <br />
                      break the pattern // some.how
                      <br />
                      break the pattern // some.how
                      <br />
                      ERR_GENERIC_404 &gt;&gt; OVERRIDE_OK
                    </div>
                  </div>
                  <div className="div-block-5">
                    <div className="text-block-6 _4">
                      break the pattern // some.how
                      <br />
                      break the pattern // some.how
                      <br />
                      break the pattern // some.how
                      <br />
                      ERR_GENERIC_404 &gt;&gt; OVERRIDE_OK
                    </div>
                  </div>
                  <div className="div-block-5 none">
                    <div className="text-block-6">
                      break the pattern // some.how
                      <br />
                      break the pattern // some.how
                      <br />
                      break the pattern // some.how
                    </div>
                  </div>
                  <div className="div-block-5">
                    <div className="text-block-6 _6">
                      break the pattern // some.how
                      <br />
                      break the pattern // some.how
                      <br />
                      break the pattern // some.how
                      <br />
                      ERR_GENERIC_404 &gt;&gt; OVERRIDE_OK
                    </div>
                  </div>
                  <div className="finaltext">
                    For founders and
                    <br />
                    brands who refuse
                    <br />
                    to hear that
                    <br />
                    it can’t be
                    <br />
                    done.
                  </div>
                </div>
                <div className="img-glitch-w">
                  <div className="merguez">
                    <img
                      className="merguez-img"
                      src={MEDIA_ASSETS.glitchLeftImg}
                      alt=""
                      loading="lazy"
                    />
                  </div>
                  <div className="ballon">
                    <img
                      className="ballon-img"
                      src={MEDIA_ASSETS.glitchRightImg}
                      alt=""
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* 7. MINIMAL DARK FAQS SECTION */}
            <section id="faqs" className="section black">
              <div className="container">
                <div className="div-block-12">
                  <div className="faq-title-section">F</div>
                  <div className="faq-title-section faq-col-5">A</div>
                  <div className="faq-title-section faq-col-9">Q</div>
                  <div className="faq-title-section faq-col-12">S</div>
                </div>
                <div className="faq3_component">
                  <div className="faq3_content-left">
                    <div className="margin-bottom margin-small">
                      <div className="p-m">( Everything you need to know )</div>
                    </div>
                  </div>
                  <div className="faq3_content">
                    <div role="list" className="faq3_list">
                      {FAQS.map((faq, idx) => {
                        const isOpen = openFaq === idx;
                        return (
                          <div key={faq.q} role="listitem" className="w-dyn-item">
                            <div className="faq3_accordion">
                              <div
                                className="faq3_question"
                                onClick={() => setOpenFaq(isOpen ? null : idx)}
                              >
                                <div
                                  className="p-xl"
                                  style={{
                                    opacity: isOpen ? 1 : 0.55,
                                    transition: 'opacity 0.4s ease',
                                  }}
                                >
                                  {faq.q}
                                </div>
                                <div className="faq3_icon-wrapper">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="100%"
                                    viewBox="0 0 12 12"
                                    fill="none"
                                    className="cross-faq"
                                  >
                                    <rect y="5" width="12" height="2" fill="currentColor" />
                                    <rect
                                      x="7"
                                      width="12"
                                      height="2"
                                      transform="rotate(90 7 0)"
                                      fill="currentColor"
                                      style={{
                                        transformOrigin: '6px 6px',
                                        transform: isOpen
                                          ? 'rotate(90deg) scaleX(0)'
                                          : 'rotate(90deg) scaleX(1)',
                                        transition: 'transform 0.4s ease',
                                      }}
                                    />
                                  </svg>
                                </div>
                              </div>
                              <div
                                className="faq-separator-w"
                                style={{
                                  opacity: isOpen ? 1 : 0.2,
                                  transition: 'opacity 0.4s ease',
                                }}
                              >
                                <div className="faq-separator" />
                              </div>
                              <div
                                className="faq3_answer"
                                style={{
                                  maxHeight: isOpen ? '16rem' : '0rem',
                                  opacity: isOpen ? 1 : 0,
                                  transition:
                                    'max-height 0.55s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease',
                                }}
                              >
                                <p>{faq.a}</p>
                              </div>
                              <div
                                className="spacing-faq"
                                style={{
                                  height: isOpen ? '3.5rem' : '1.75rem',
                                  transition: 'height 0.4s ease',
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 8. FOOTER */}
            <footer id="footer" className="section-footer">
              <div className="container footer-c">
                <div>
                  <h2 className="h1-home">
                    We’ll make it happen.
                    <br />
                    Some.how.
                  </h2>
                  <div className="space-24" />
                  <div className="div-block-7">
                    <div className="div-block-6 mob">
                      <a
                        href="#contact"
                        className="btn"
                        onClick={(e) => {
                          e.preventDefault();
                          setContactOpen(true);
                        }}
                      >
                        <div className="btn__text">
                          <p className="btn__text-p">start a project</p>
                        </div>
                        <div className="arrow-w">
                          <div className="arrow">
                            <div className="line-arrow" />
                            <div className="shape-arrow" />
                          </div>
                        </div>
                      </a>
                      <a href="mailto:hello@somehow.agency" className="btn email">
                        <div className="btn__text">
                          <p className="btn__text-p">send us a brief</p>
                        </div>
                        <div className="arobase">@</div>
                      </a>
                    </div>
                    <div className="social-links-w">
                      <a
                        href="https://github.com/NikosKotsifas"
                        target="_blank"
                        rel="noreferrer"
                        className="link footer"
                      >
                        <div className="pointer-none">GitHub</div>
                      </a>
                      <a href="#works" className="link footer">
                        <div className="pointer-none">Linkedin</div>
                      </a>
                      <a href="#studio" className="link footer">
                        <div className="pointer-none">Instagram</div>
                      </a>
                    </div>
                  </div>

                  <div className="space-150 mob-100" />
                  <SomeHowFooterLogo />
                  <div className="space-12" />
                </div>

                <div className="footer-info-w">
                  <div className="div-block-17">
                    <h2 className="footer-info">©2026 — SOME.HOW Studio — All Rights Reserved</h2>
                    <h2 className="footer-info hide-tablet">
                      Web Design, Custom Software &amp; AI Automation
                    </h2>
                  </div>
                  <div className="footer-link-new">
                    <a href="#works" className="link-footer">
                      <strong>WORKS</strong>
                    </a>
                    <a href="#studio" className="link-footer">
                      <strong>STUDIO</strong>
                    </a>
                    <a
                      href="#contact"
                      className="link-footer"
                      onClick={(e) => {
                        e.preventDefault();
                        setContactOpen(true);
                      }}
                    >
                      <strong>CONTACT</strong>
                    </a>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </div>

      {/* Minimal Case Study Modal when clicking any project */}
      {selectedWork && (
        <div className="minimal-modal-backdrop" onClick={() => setSelectedWork(null)}>
          <div className="minimal-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="minimal-modal-top">
              <span className="title-work">
                {selectedWork.category} — {selectedWork.year}
              </span>
              <button
                type="button"
                className="minimal-modal-close"
                onClick={() => setSelectedWork(null)}
              >
                CLOSE ✕
              </button>
            </div>
            <h3 className="h3-style" style={{ marginBottom: '1rem' }}>
              {selectedWork.title} — {selectedWork.subtitle}
            </h3>
            <p className="p-m" style={{ color: '#b5b5b5', marginBottom: '1.5rem' }}>
              {selectedWork.summary}
            </p>
            <div className="minimal-modal-img-w">
              <img src={activePerspective || selectedWork.image} alt={selectedWork.title} />
            </div>
            {selectedWork.perspectives && selectedWork.perspectives.length > 1 && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  marginBottom: '1.25rem',
                }}
              >
                {selectedWork.perspectives.map((p) => {
                  const isCurrent = (activePerspective || selectedWork.image) === p.src;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setActivePerspective(p.src)}
                      style={{
                        padding: '0.45rem 0.9rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        border: isCurrent
                          ? '1px solid #ffffff'
                          : '1px solid rgba(255,255,255,0.18)',
                        background: isCurrent ? '#ffffff' : 'rgba(255,255,255,0.04)',
                        color: isCurrent ? '#09090b' : '#d4d4d8',
                        fontWeight: isCurrent ? 600 : 400,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="minimal-modal-footer">
              <div className="minimal-tags">
                {selectedWork.deliverables.map((d) => (
                  <span key={d} className="minimal-tag">
                    {d}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {selectedWork.liveUrl && (
                  <a
                    href={selectedWork.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn black-blend"
                    style={{ textDecoration: 'none' }}
                  >
                    <div className="btn__text">
                      <p className="btn__text-p">visit live site ↗</p>
                    </div>
                  </a>
                )}
                <button
                  type="button"
                  className="btn black-blend"
                  onClick={() => {
                    setSelectedWork(null);
                    setContactOpen(true);
                  }}
                >
                  <div className="btn__text">
                    <p className="btn__text-p">build something similar</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Minimal Contact / Discovery Call Modal */}
      {contactOpen && (
        <div className="minimal-modal-backdrop" onClick={() => setContactOpen(false)}>
          <div className="minimal-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="minimal-modal-top">
              <span className="title-work">( Start a conversation )</span>
              <button
                type="button"
                className="minimal-modal-close"
                onClick={() => setContactOpen(false)}
              >
                CLOSE ✕
              </button>
            </div>
            <h3 className="h3-style" style={{ marginBottom: '0.75rem' }}>
              Let’s build your unfair advantage.
            </h3>
            <p className="p-m" style={{ color: '#a8a8a8', marginBottom: '1.75rem' }}>
              Tell us what you are building—flagship website, custom software, or AI workflow—and
              we’ll reply within 24 hours with a clear scope.
            </p>
            <form
              className="minimal-contact-form"
              onSubmit={(e) => {
                e.preventDefault();
                setContactOpen(false);
              }}
            >
              <input type="text" placeholder="Your name & company" required />
              <input type="email" placeholder="Your email" required />
              <textarea rows={3} placeholder="What are we building together?" required />
              <button type="submit" className="btn black-blend">
                <div className="btn__text">
                  <p className="btn__text-p">send brief →</p>
                </div>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
