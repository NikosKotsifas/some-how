---
name: design-skill
description: >-
  Creative studio art direction, 3D perspective staging, WebGL/canvas choreography, and
  GSAP + Lenis motion design skill. Use when designing new sections, building interactive
  showreels, staging client portfolio showcases in 3D perspective, or refining animations.
---

# Studio Design Skill — Art Direction & Motion Architecture

Guides high-craft visual design, 3D hardware staging, and scroll-scrubbed motion for **Some.how** and its client showcases.

## 1. Client Brand Integrity Rule (Sacred Constraint)

- **Never alter a real client's website layout (`μορφή του σαιτ`) or logo** when presenting their work in portfolio showcases.
- Never pass real client screenshots through generative AI image models that distort typography or invent fake logos.
- Always capture 100% authentic, unmodified views of the client's actual website (with GDPR/cookie banners hidden cleanly via CSS) and composite them onto 3D studio hardware frames using exact 2D projective homography (`matrix3d`) or 3D CSS perspective (`perspective(1800px) rotateY(...) rotateX(...)`).

## 2. Motion & Scroll Choreography (GSAP + Lenis)

1. **Lenis Smooth Scroll**: Sync `Lenis` with `gsap.ticker` and `ScrollTrigger.update` with `gsap.ticker.lagSmoothing(0)`.
2. **Scroll-Scrubbed Reveals**:
   - Use `clip-path: inset(...)` transitions and `transform: translate3d(...) scale(...)` for 60fps compositor-friendly animations.
   - Avoid animating `top`, `left`, `width`, or `height` unless purposefully scrubbing a sticky container with `invalidateOnRefresh: true`.
3. **Interactive Cursor & Micro-interactions**:
   - Use lerped (`0.11` damping factor) `requestAnimationFrame` loops for custom magnetic/floating cursor pills over portfolio cards.
