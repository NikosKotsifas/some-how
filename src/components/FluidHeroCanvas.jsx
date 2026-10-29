import React, { useEffect, useRef } from 'react';
import { MEDIA_ASSETS } from '../data/studioData';

export default function FluidHeroCanvas() {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (video) {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.play().catch(() => {});
    }

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Fluid metaball trail points (exact dissipation feel of noth.in's Navier-Stokes dye)
    const blobs = [];
    let lastMouse = { x: width * 0.5, y: height * 0.5, init: false };

    const onPointerMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (!lastMouse.init) {
        lastMouse = { x, y, init: true };
      }
      const dx = x - lastMouse.x;
      const dy = y - lastMouse.y;
      const speed = Math.min(Math.hypot(dx, dy), 95);

      blobs.push({
        x,
        y,
        vx: dx * 0.16,
        vy: dy * 0.16,
        r: Math.max(90, speed * 2.4),
        life: 1.0,
      });

      if (blobs.length > 52) blobs.shift();
      lastMouse = { x, y, init: true };
    };

    window.addEventListener('mousemove', onPointerMove, { passive: true });

    let rafId;
    let t = 0;

    const render = () => {
      t += 0.014;
      ctx.clearRect(0, 0, width, height);

      // Update & draw fluid reveal mask only where blobs exist
      if (blobs.length > 0) {
        ctx.save();
        for (let i = blobs.length - 1; i >= 0; i--) {
          const b = blobs[i];
          b.x += b.vx;
          b.y += b.vy;
          b.vx *= 0.94;
          b.vy *= 0.94;
          b.r *= 0.993;
          b.life *= 0.972;

          if (b.life < 0.02) {
            blobs.splice(i, 1);
            continue;
          }

          const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
          grad.addColorStop(0, `rgba(255, 255, 255, ${Math.min(1, b.life * 1.15)})`);
          grad.addColorStop(0.55, `rgba(255, 255, 255, ${b.life * 0.55})`);
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fill();
        }

        // Composite the video / 3D shader pattern inside the fluid mask
        ctx.globalCompositeOperation = 'source-in';
        if (video && video.readyState >= 2) {
          const vw = video.videoWidth || 1920;
          const vh = video.videoHeight || 1080;
          const scale = Math.max(width / vw, height / vh);
          const dw = vw * scale;
          const dh = vh * scale;
          ctx.filter = 'contrast(1.25) brightness(0.88)';
          ctx.drawImage(video, (width - dw) / 2, (height - dh) / 2, dw, dh);
          ctx.filter = 'none';
        } else {
          const fallbackGrad = ctx.createLinearGradient(0, 0, width, height);
          fallbackGrad.addColorStop(0, '#1e1e24');
          fallbackGrad.addColorStop(0.5, '#2b2b36');
          fallbackGrad.addColorStop(1, '#121216');
          ctx.fillStyle = fallbackGrad;
          ctx.fillRect(0, 0, width, height);
        }
        ctx.restore();
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onPointerMove);
    };
  }, []);

  return (
    <>
      <video
        ref={videoRef}
        src={MEDIA_ASSETS.heroVideo}
        autoPlay
        loop
        muted
        playsInline
        crossOrigin="anonymous"
        className="video-hero-bg-hidden"
        aria-hidden="true"
      />
      <canvas ref={canvasRef} className="mask-reveal-canvas" aria-hidden="true" />
    </>
  );
}
