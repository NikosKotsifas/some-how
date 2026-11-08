---
name: ui-ux-pro-max
description: >-
  Comprehensive UI/UX design intelligence skill (UI/UX Pro Max) covering 50+ UI paradigms,
  curated typography pairings, color systems, layout grids, motion choreography, and
  anti-generic frontend rules for React, Vite, Next.js, Tailwind, and WebGL experiences.
  Use whenever designing, creating, restyling, or auditing any web interface, landing page,
  portfolio, component, or design system.
---

# UI/UX Pro Max — Design Intelligence System

Use this skill before writing or modifying any UI, layout, or styling code to ensure the output looks crafted by an award-winning creative studio rather than an AI template.

## 1. Style Direction Matrix

Select an explicit visual paradigm that matches the brand before writing CSS:

| Style Paradigm | Visual Signature | Typography Pairing | Surface & Border Treatment |
| :--- | :--- | :--- | :--- |
| **Kinetic Editorial Studio** *(Some.how)* | Stark monochrome `#09090b` / `#f4f4f0`, oversized display headlines, 3D tactile objects, scroll-scrubbed video/canvas | `PP Neue Montreal` / `Syne` + `Instrument Sans` + `IBM Plex Mono` | `1px solid rgba(255,255,255,0.12)`, zero soft shadows, sharp editorial dividers |
| **Architectural Luxury Minimal** *(The Holt)* | Warm travertine `#f6f4f0`, charcoal `#141413`, generous negative space, asymmetric 12-column editorial grids | High-contrast serif or neo-grotesk + clean geometric sans | Subtle `1px` hairline borders, full-bleed imagery with `clip-path` reveals |
| **Industrial Precision Hearth** *(Tzakia Kotsifas)* | Deep matte black `#0a0a0c`, warm ember accents `#e11d48` / `#ef4444`, structured technical specs | Clean Greek/Latin neo-grotesk (`Inter` / `Outfit`) | High-contrast product cards, crisp specification tags |
| **Bento Modular System** | Multi-span CSS Grid (`grid-template-columns: repeat(12, 1fr)`), varied card ratios | Geometric sans + monospace metadata | `border-radius: 16px–24px`, `1px` specular inner border |

## 2. Typography & Fluid Scale Rules

1. **Fluid Sizing (`clamp`)**: Never use fixed pixel sizes for display headings. Use fluid scales:
   - Hero Display: `clamp(3.25rem, 8.5vw, 9.5rem)` with `line-height: 0.92` and `letter-spacing: -0.03em`
   - Section Title: `clamp(2.25rem, 5vw, 5.5rem)` with `line-height: 0.98`
   - Body Copy: `clamp(1rem, 1.1vw, 1.2rem)` with `line-height: 1.55` and max measure `62ch`
   - Technical Metadata / HUD: `0.75rem–0.85rem` uppercase `IBM Plex Mono` with `letter-spacing: 0.14em`
2. **Contrast & Hierarchy**: Every view must have an unmistakable focal point (1 primary headline, 1 visual anchor, and clear secondary metadata).

## 3. Layout, Grid & Spacing

1. **No Accidental Overflow**: Always enforce `overflow-x: hidden` on root containers and test at `390px`, `768px`, `1440px`, and `2560px+`.
2. **Aspect-Ratio Locking**: Reserve explicit `aspect-ratio` on all media containers to guarantee `CLS = 0`.
3. **Interactive Ergonomics**:
   - Minimum `44x44px` hit target on mobile/touch.
   - Distinct `:hover`, `:focus-visible`, and `:active` states using transform/opacity or clip-path rather than layout-shifting properties.

## 4. Verification Checklist

Before declaring any UI change complete:
- [ ] Zero generic AI gradients, stock icon grids, or unstyled browser defaults.
- [ ] All real client logos and brand marks are 100% authentic and unmodified.
- [ ] Typography scales cleanly without text clipping or horizontal scrollbars.
- [ ] Verified in a real browser viewport (desktop + mobile).
