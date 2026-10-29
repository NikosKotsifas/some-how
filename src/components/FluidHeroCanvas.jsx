import React, { useEffect, useRef } from 'react';

/**
 * Recreates noth.in's signature interactive fluid mask-reveal hero canvas.
 * Moving the cursor across the hero leaves a smooth, dissipating liquid trail
 * that peels back the Swiss Editorial Paper (#F4F1EA) to reveal a kinetic
 * International Orange (#FF3B00) + Acid Lime (#D4FF00) + Obsidian shader canvas underneath.
 */
export function FluidHeroCanvas() {
  const revealCanvasRef = useRef(null);

  useEffect(() => {
    const canvas = revealCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let rafId = null;
    let time = 0;

    // Trail splat particles (simulating dye advection + dissipation)
    const splats = [];
    const mouse = { x: width * 0.5, y: height * 0.5, vx: 0, vy: 0, lastX: null, lastY: null };

    // Offscreen mask canvas for smooth metaball/fluid edge thresholding
    const maskCanvas = document.createElement('canvas');
    const maskCtx = maskCanvas.getContext('2d');
    maskCanvas.width = width;
    maskCanvas.height = height;

    // Offscreen art canvas for the vibrant underneath world revealed by the fluid
    const artCanvas = document.createElement('canvas');
    const artCtx = artCanvas.getContext('2d');
    artCanvas.width = width;
    artCanvas.height = height;

    const handleResize = () => {
      width = canvas.width = maskCanvas.width = artCanvas.width = window.innerWidth;
      height = canvas.height = maskCanvas.height = artCanvas.height = window.innerHeight;
    };

    const addSplat = (x, y, radiusBoost = 1) => {
      splats.push({
        x,
        y,
        vx: mouse.vx * 0.18 + (Math.random() - 0.5) * 0.8,
        vy: mouse.vy * 0.18 + (Math.random() - 0.5) * 0.8,
        radius: Math.min(width, height) * 0.11 * radiusBoost,
        life: 1.0,
        decay: 0.014 + Math.random() * 0.006
      });
      if (splats.length > 95) {
        splats.shift();
      }
    };

    const handlePointerMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (mouse.lastX !== null) {
        mouse.vx = x - mouse.lastX;
        mouse.vy = y - mouse.lastY;
        const dist = Math.hypot(mouse.vx, mouse.vy);
        const steps = Math.min(6, Math.max(1, Math.floor(dist / 18)));
        for (let i = 0; i < steps; i++) {
          const t = (i + 1) / steps;
          const sx = mouse.lastX + mouse.vx * t;
          const sy = mouse.lastY + mouse.vy * t;
          addSplat(sx, sy, Math.min(1.45, 0.75 + dist * 0.012));
        }
      } else {
        addSplat(x, y, 1);
      }
      mouse.x = x;
      mouse.y = y;
      mouse.lastX = x;
      mouse.lastY = y;
    };

    // Seed an initial autonomous swirl so the user immediately sees the fluid effect
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 1.6;
      addSplat(
        width * 0.52 + Math.cos(angle) * (width * 0.18),
        height * 0.44 + Math.sin(angle) * (height * 0.14),
        1.15
      );
    }

    const drawUnderneathWorld = (t) => {
      // Deep obsidian base
      artCtx.fillStyle = '#0D0D0D';
      artCtx.fillRect(0, 0, width, height);

      // Animated plasma / gradient orbs in International Orange (#FF3B00) & Acid Lime (#D4FF00)
      const orb1X = width * (0.35 + 0.22 * Math.cos(t * 0.7));
      const orb1Y = height * (0.45 + 0.18 * Math.sin(t * 0.9));
      const g1 = artCtx.createRadialGradient(orb1X, orb1Y, 10, orb1X, orb1Y, width * 0.42);
      g1.addColorStop(0, '#FF3B00');
      g1.addColorStop(0.55, 'rgba(255, 59, 0, 0.35)');
      g1.addColorStop(1, 'rgba(13, 13, 13, 0)');
      artCtx.fillStyle = g1;
      artCtx.fillRect(0, 0, width, height);

      const orb2X = width * (0.68 + 0.2 * Math.sin(t * 0.6));
      const orb2Y = height * (0.52 + 0.22 * Math.cos(t * 0.8));
      const g2 = artCtx.createRadialGradient(orb2X, orb2Y, 10, orb2X, orb2Y, width * 0.38);
      g2.addColorStop(0, '#D4FF00');
      g2.addColorStop(0.5, 'rgba(212, 255, 0, 0.28)');
      g2.addColorStop(1, 'rgba(13, 13, 13, 0)');
      artCtx.fillStyle = g2;
      artCtx.fillRect(0, 0, width, height);

      // Swiss technical grid inside the fluid portal
      artCtx.strokeStyle = 'rgba(244, 241, 234, 0.14)';
      artCtx.lineWidth = 1;
      const step = 64;
      const offset = (t * 24) % step;
      for (let x = offset; x < width; x += step) {
        artCtx.beginPath();
        artCtx.moveTo(x, 0);
        artCtx.lineTo(x, height);
        artCtx.stroke();
      }
      for (let y = offset; y < height; y += step) {
        artCtx.beginPath();
        artCtx.moveTo(0, y);
        artCtx.lineTo(width, y);
        artCtx.stroke();
      }

      // Kinetic technical typography revealed inside the fluid mask
      artCtx.save();
      artCtx.font = '600 13px "IBM Plex Mono", monospace';
      artCtx.fillStyle = '#D4FF00';
      artCtx.fillText('// AUTONOMOUS SYSTEMS · WEBGL · FULL-STACK ARCHITECTURE', width * 0.06, height * 0.26);
      artCtx.fillStyle = 'rgba(244, 241, 234, 0.78)';
      artCtx.fillText('LATENCY: 0.4ms   SHADER: FLUID_DYE_V2   STATUS: SHIPPING', width * 0.06, height * 0.29);
      artCtx.restore();
    };

    const render = () => {
      time += 0.016;
      ctx.clearRect(0, 0, width, height);

      if (splats.length > 0) {
        drawUnderneathWorld(time);

        maskCtx.clearRect(0, 0, width, height);
        for (let i = splats.length - 1; i >= 0; i--) {
          const s = splats[i];
          s.x += s.vx;
          s.y += s.vy;
          s.vx *= 0.94;
          s.vy *= 0.94;
          s.life -= s.decay;

          if (s.life <= 0.01) {
            splats.splice(i, 1);
            continue;
          }

          const r = s.radius * (0.45 + 0.55 * Math.sin(s.life * Math.PI * 0.5));
          const grad = maskCtx.createRadialGradient(s.x, s.y, r * 0.15, s.x, s.y, r);
          grad.addColorStop(0, `rgba(255, 255, 255, ${Math.min(1, s.life * 1.45)})`);
          grad.addColorStop(0.68, `rgba(255, 255, 255, ${s.life * 0.85})`);
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          maskCtx.fillStyle = grad;
          maskCtx.beginPath();
          maskCtx.arc(s.x, s.y, r, 0, Math.PI * 2);
          maskCtx.fill();
        }

        // Composite the revealed underneath world through the fluid mask
        ctx.save();
        ctx.drawImage(maskCanvas, 0, 0);
        ctx.globalCompositeOperation = 'source-in';
        ctx.drawImage(artCanvas, 0, 0);
        ctx.restore();
      }

      rafId = requestAnimationFrame(render);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    rafId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={revealCanvasRef}
      className="mask-reveal-canvas"
      aria-hidden="true"
    />
  );
}
