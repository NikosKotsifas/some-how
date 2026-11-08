import React, { useEffect, useRef } from 'react';
import { HERO_3D_LOGOS } from '../data/studioData';
import { LETTER_DEFS } from './SomeHowWordmark';

function computeHeroLogoTransform(w, h) {
  const padX = Math.max(24, w * 0.01389);
  const availW = Math.max(100, w - padX * 2);
  const rh = availW * (356 / 2020);
  const scaleX = availW / 2020;
  const scaleY = rh / 294;
  return {
    x: (w - availW) * 0.5,
    y: (h - rh) * 0.54,
    w: availW,
    h: rh,
    scaleX,
    scaleY,
  };
}

/**
 * Exact https://www.noth.in/ Two-Layer Hero Architecture for SOME.HOW:
 *
 * Layer 0 (<canvas className="video-hero-bg" />, z-index: 0):
 *   A continuous 60fps full-bleed background animation ("στο background ένα βίντεο με αυτά τα
 *   περίεργα logo το οποίο αλλάζει συνεχώς/αναπτύσσεται") cycling and inflating through the 6
 *   bespoke luxury 3D SOME.HOW logos:
 *     1. Glossy Pink Couture Fur (hero-pink-fur.jpg)
 *     2. Crinkled Silver Aluminum Foil (hero-silver-foil.jpg)
 *     3. Glossy Golden-Yellow Bubbles (hero-yellow-bubbles.jpg)
 *     4. Luxury Disco Mirrorball Mosaic (hero-disco-mirror.jpg)
 *     5. Inflating Chrome Silver Mylar Balloon (hero-silver-balloon.jpg)
 *     6. 24K Champagne Gold Balloon (hero-gold-lux.jpg)
 *   Each of the 8 glyphs (S, O, M, E, ., H, O, W) is aligned 1:1 to the exact horizontal & vertical
 *   coordinates of the static white base logo on top, while keeping all outer 3D details (pink fur hairs,
 *   silver balloon tie-valves, 3D yellow spheres, disco starlight flares) 100% UNCLIPPED.
 *
 * Layer 1 (<canvas className="mask-reveal-canvas" />, z-index: 1):
 *   WebGL Navier-Stokes fluid mask canvas (alpha: true, premultipliedAlpha: false) holding the
 *   opaque dark architectural background + the static classic white SOME.HOW logo (uBaseTexture).
 *   - Without cursor movement, mask == 0.0 everywhere (alpha = 1.0, 100% opaque static white logo;
 *     "η διαφάνεια δεν συμβαίνει αν δεν περάσεις από πάνω").
 *   - As the cursor passes over the Hero, the fluid trail punches a smooth transparent liquid window
 *     (gl_FragColor = mix(baseColor, vec4(0.0, 0.0, 0.0, 0.0), mask)) with a focused radius
 *     ("με μικρότερο εύρος εφέ εμφάνισης του animated logo"), revealing Layer 0 (.video-hero-bg) live behind it.
 */

// Exact horizontal boundaries of the 8 glyphs (S | O1 | M | E | . | H | O2 | W)
// in the 2020 x 294 coordinate space of LETTER_DEFS (SomeHowWordmark.jsx):
const DST_GLYPH_SPLITS = [0, 241, 505, 846, 1069, 1163, 1427, 1691, 2020];
const ALIGNED_PAD_X = 80;
const ALIGNED_PAD_Y = 64;
const ALIGNED_CANVAS_W = 2020 + ALIGNED_PAD_X * 2;
const ALIGNED_CANVAS_H = 294 + ALIGNED_PAD_Y * 2;

function detectLogoBoundingBox(imgData, iw, ih) {
  const data = imgData.data;
  const rowSums = new Float64Array(ih);
  const colSums = new Float64Array(iw);

  for (let y = 0; y < ih; y++) {
    let rSum = 0;
    const rowOffset = y * iw * 4;
    for (let x = 0; x < iw; x++) {
      const idx = rowOffset + x * 4;
      const lum = Math.max(data[idx], data[idx + 1], data[idx + 2]);
      if (lum > 38) {
        rSum += lum;
        colSums[x] += lum;
      }
    }
    rowSums[y] = rSum;
  }

  let maxRow = 0;
  for (let y = 0; y < ih; y++) if (rowSums[y] > maxRow) maxRow = rowSums[y];
  let maxCol = 0;
  for (let x = 0; x < iw; x++) if (colSums[x] > maxCol) maxCol = colSums[x];

  const rowThresh = maxRow * 0.14;
  const colThresh = maxCol * 0.10;

  let minY = Math.floor(ih * 0.25);
  let maxY = Math.floor(ih * 0.75);
  for (let y = 0; y < ih; y++) {
    if (rowSums[y] > rowThresh) {
      minY = y;
      break;
    }
  }
  for (let y = ih - 1; y >= 0; y--) {
    if (rowSums[y] > rowThresh) {
      maxY = y;
      break;
    }
  }

  let minX = Math.floor(iw * 0.06);
  let maxX = Math.floor(iw * 0.94);
  for (let x = 0; x < iw; x++) {
    if (colSums[x] > colThresh) {
      minX = x;
      break;
    }
  }
  for (let x = iw - 1; x >= 0; x--) {
    if (colSums[x] > colThresh) {
      maxX = x;
      break;
    }
  }

  return {
    x: minX,
    y: minY,
    w: Math.max(1, maxX - minX),
    h: Math.max(1, maxY - minY),
  };
}

/**
 * Finds the horizontal X column of minimum brightness (valley between two adjacent 3D glyphs)
 * inside normalized bbox X-range [uMin, uMax] and normalized bbox Y-range [vMin, vMax].
 */
function findGlyphValleyX(data, iw, ih, bbox, uMin, uMax, vMin, vMax) {
  const xStart = Math.max(0, Math.min(iw - 1, Math.round(bbox.x + uMin * bbox.w)));
  const xEnd = Math.max(xStart, Math.min(iw - 1, Math.round(bbox.x + uMax * bbox.w)));
  const yStart = Math.max(0, Math.min(ih - 1, Math.round(bbox.y + vMin * bbox.h)));
  const yEnd = Math.max(yStart, Math.min(ih - 1, Math.round(bbox.y + vMax * bbox.h)));

  const len = xEnd - xStart + 1;
  const raw = new Float64Array(len);

  for (let i = 0; i < len; i++) {
    const x = xStart + i;
    let sum = 0;
    for (let y = yStart; y <= yEnd; y++) {
      const p = (y * iw + x) * 4;
      const m = Math.max(data[p], data[p + 1], data[p + 2]);
      if (m > 20) sum += m;
    }
    raw[i] = sum;
  }

  let bestX = Math.round((xStart + xEnd) * 0.5);
  let bestVal = Infinity;
  for (let i = 0; i < len; i++) {
    let acc = 0;
    let count = 0;
    for (let k = -2; k <= 2; k++) {
      const idx = i + k;
      if (idx >= 0 && idx < len) {
        acc += raw[idx];
        count++;
      }
    }
    const avg = acc / Math.max(1, count);
    if (avg < bestVal) {
      bestVal = avg;
      bestX = xStart + i;
    }
  }
  return bestX;
}

/**
 * Prepares an unclipped, alpha-matted, per-glyph 1:1 aligned canvas for each 3D luxury SOME.HOW render:
 * 1. Detects the 7 inter-glyph valleys (S | O1 | M | E | . | H | O2 | W) in the 3D render.
 * 2. Runs a topological BFS flood-fill from the 4 outer image borders + the exact detected centers of
 *    O1 and O2 inner holes + the gap above the period '.', clearing the #000000 studio backdrop to
 *    transparent (alpha = 0) with a soft 2px edge feather while keeping 100% of internal shadows/creases
 *    and outer 3D details (fur hairs, balloon valves, disco flares, yellow spheres) opaque.
 * 3. Maps each of the 8 3D glyphs onto a normalized (2020 + 2*PAD_X) x (294 + 2*PAD_Y) canvas so every
 *    single 3D glyph and both 'O' holes align 1:1 with the static white SOME.HOW logo on top.
 */
function prepare3DLogoAsset(img) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;

  const rawCanvas = document.createElement('canvas');
  rawCanvas.width = iw;
  rawCanvas.height = ih;
  const rawCtx = rawCanvas.getContext('2d', { willReadFrequently: true });
  rawCtx.drawImage(img, 0, 0, iw, ih);

  const imgData = rawCtx.getImageData(0, 0, iw, ih);
  const data = imgData.data;
  const bbox = detectLogoBoundingBox(imgData, iw, ih);

  // Detect the 7 inter-glyph valleys in the 3D render (S | O1 | M | E | . | H | O2 | W)
  const gap1 = findGlyphValleyX(data, iw, ih, bbox, 0.105, 0.142, 0.10, 0.90); // S | O1
  const gap2 = findGlyphValleyX(data, iw, ih, bbox, 0.222, 0.262, 0.10, 0.90); // O1 | M
  const gap3 = findGlyphValleyX(data, iw, ih, bbox, 0.398, 0.438, 0.10, 0.90); // M | E
  const gap4 = findGlyphValleyX(data, iw, ih, bbox, 0.495, 0.538, 0.72, 0.96); // E | .
  const gap5 = findGlyphValleyX(data, iw, ih, bbox, 0.555, 0.595, 0.72, 0.96); // . | H
  const gap6 = findGlyphValleyX(data, iw, ih, bbox, 0.688, 0.728, 0.10, 0.90); // H | O2
  const gap7 = findGlyphValleyX(data, iw, ih, bbox, 0.810, 0.852, 0.10, 0.90); // O2 | W

  const totalPixels = iw * ih;
  const visited = new Uint8Array(totalPixels);
  const queue = new Int32Array(totalPixels);
  let head = 0;
  let tail = 0;

  const BG_THRESHOLD = 42;

  const tryPush = (x, y) => {
    if (x < 0 || x >= iw || y < 0 || y >= ih) return;
    const idx = y * iw + x;
    if (visited[idx]) return;
    const p = idx * 4;
    const maxC = Math.max(data[p], data[p + 1], data[p + 2]);
    if (maxC <= BG_THRESHOLD) {
      visited[idx] = 1;
      queue[tail++] = idx;
    }
  };

  // Seed outer borders
  for (let x = 0; x < iw; x++) {
    tryPush(x, 0);
    tryPush(x, ih - 1);
  }
  for (let y = 0; y < ih; y++) {
    tryPush(0, y);
    tryPush(iw - 1, y);
  }

  // Seed inner counter holes of O1 ([gap1..gap2]) and O2 ([gap6..gap7]) using their exact detected centers
  const o1CenterX = Math.round((gap1 + gap2) * 0.5);
  const o2CenterX = Math.round((gap6 + gap7) * 0.5);
  const dotGapX = Math.round((gap4 + gap5) * 0.5);

  for (let vFrac = 0.26; vFrac <= 0.74; vFrac += 0.025) {
    const cy = Math.round(bbox.y + bbox.h * vFrac);
    for (let dx = -16; dx <= 16; dx += 2) {
      tryPush(o1CenterX + dx, cy);
      tryPush(o2CenterX + dx, cy);
    }
  }
  // Also seed the empty space above the period '.' between E and H
  for (let vFrac = 0.10; vFrac <= 0.65; vFrac += 0.04) {
    const cy = Math.round(bbox.y + bbox.h * vFrac);
    for (let dx = -12; dx <= 12; dx += 4) {
      tryPush(dotGapX + dx, cy);
    }
  }

  while (head < tail) {
    const idx = queue[head++];
    const x = idx % iw;
    const y = (idx - x) / iw;
    if (x > 0) tryPush(x - 1, y);
    if (x + 1 < iw) tryPush(x + 1, y);
    if (y > 0) tryPush(x, y - 1);
    if (y + 1 < ih) tryPush(x, y + 1);
  }

  // Clear background pixels to transparent and feather 2px boundary of 3D letters
  for (let i = 0; i < totalPixels; i++) {
    if (visited[i]) {
      data[i * 4 + 3] = 0;
    }
  }

  for (let y = 1; y < ih - 1; y++) {
    for (let x = 1; x < iw - 1; x++) {
      const idx = y * iw + x;
      if (visited[idx]) continue;
      let bgNeighbors = 0;
      if (visited[idx - 1]) bgNeighbors++;
      if (visited[idx + 1]) bgNeighbors++;
      if (visited[idx - iw]) bgNeighbors++;
      if (visited[idx + iw]) bgNeighbors++;
      if (visited[idx - iw - 1]) bgNeighbors++;
      if (visited[idx - iw + 1]) bgNeighbors++;
      if (visited[idx + iw - 1]) bgNeighbors++;
      if (visited[idx + iw + 1]) bgNeighbors++;

      if (bgNeighbors > 0) {
        const p = idx * 4;
        const maxC = Math.max(data[p], data[p + 1], data[p + 2]);
        const lumAlpha = Math.min(1.0, Math.max(0.15, (maxC - 12) / 48));
        const neighborFactor = 1.0 - bgNeighbors * 0.075;
        data[p + 3] = Math.round(255 * Math.min(1.0, lumAlpha * neighborFactor));
      }
    }
  }

  rawCtx.putImageData(imgData, 0, 0);

  // Build the per-glyph 1:1 aligned canvas (2020 x 294 core + unclipped outer padding ALIGNED_PAD_X / ALIGNED_PAD_Y)
  const alignedCanvas = document.createElement('canvas');
  alignedCanvas.width = ALIGNED_CANVAS_W;
  alignedCanvas.height = ALIGNED_CANVAS_H;
  const alignedCtx = alignedCanvas.getContext('2d');
  alignedCtx.imageSmoothingEnabled = true;
  alignedCtx.imageSmoothingQuality = 'high';

  const srcSplits = [
    bbox.x,
    gap1,
    gap2,
    gap3,
    gap4,
    gap5,
    gap6,
    gap7,
    bbox.x + bbox.w,
  ];

  const scaleY = 294 / bbox.h;
  const srcTopPad = Math.min(bbox.y, Math.round(ALIGNED_PAD_Y / scaleY));
  const srcBotPad = Math.min(ih - (bbox.y + bbox.h), Math.round(ALIGNED_PAD_Y / scaleY));
  const sy = bbox.y - srcTopPad;
  const sh = bbox.h + srcTopPad + srcBotPad;
  const dy = ALIGNED_PAD_Y - srcTopPad * scaleY;
  const dh = sh * scaleY;

  // Draw left unclipped margin before 'S' (preserves left fur hairs / disco flares)
  const firstScaleX = (DST_GLYPH_SPLITS[1] - DST_GLYPH_SPLITS[0]) / Math.max(1, srcSplits[1] - srcSplits[0]);
  const srcLeftPad = Math.min(srcSplits[0], Math.round(ALIGNED_PAD_X / firstScaleX));
  if (srcLeftPad > 0) {
    const dwLeft = srcLeftPad * firstScaleX;
    alignedCtx.drawImage(
      rawCanvas,
      srcSplits[0] - srcLeftPad,
      sy,
      srcLeftPad,
      sh,
      ALIGNED_PAD_X - dwLeft,
      dy,
      dwLeft,
      dh
    );
  }

  // Draw each of the 8 glyphs (S, O1, M, E, ., H, O2, W) mapped 1:1 to DST_GLYPH_SPLITS
  for (let k = 0; k < 8; k++) {
    const sx = srcSplits[k];
    const sw = Math.max(1, srcSplits[k + 1] - srcSplits[k]);
    const dx = ALIGNED_PAD_X + DST_GLYPH_SPLITS[k];
    const dw = DST_GLYPH_SPLITS[k + 1] - DST_GLYPH_SPLITS[k];
    alignedCtx.drawImage(rawCanvas, sx, sy, sw, sh, dx, dy, dw, dh);
  }

  // Draw right unclipped margin after 'W' (preserves right fur hairs / disco flares)
  const lastScaleX = (DST_GLYPH_SPLITS[8] - DST_GLYPH_SPLITS[7]) / Math.max(1, srcSplits[8] - srcSplits[7]);
  const srcRightPad = Math.min(iw - srcSplits[8], Math.round(ALIGNED_PAD_X / lastScaleX));
  if (srcRightPad > 0) {
    const dwRight = srcRightPad * lastScaleX;
    alignedCtx.drawImage(
      rawCanvas,
      srcSplits[8],
      sy,
      srcRightPad,
      sh,
      ALIGNED_PAD_X + 2020,
      dy,
      dwRight,
      dh
    );
  }

  return {
    matteCanvas: alignedCanvas,
    iw: ALIGNED_CANVAS_W,
    ih: ALIGNED_CANVAS_H,
    bbox: {
      x: ALIGNED_PAD_X,
      y: ALIGNED_PAD_Y,
      w: 2020,
      h: 294,
    },
  };
}

// Exact Vertex & Fragment Shaders from noth.in's cA fluid mask class (nothin-main.js lines 3972-4105)
const BASE_VERT = `
  precision highp float;
  attribute vec2 aPosition;
  varying vec2 vUv;
  void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

// Advection shader with explicit bilinear interpolation (bilerp) for both velocity and source textures
const ADVECTION_FRAG = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform vec2 uVelTexelSize;
  uniform vec2 uSourceTexelSize;
  uniform float uDt;
  uniform float uDissipation;

  vec4 bilerp(sampler2D sam, vec2 uv, vec2 tsize) {
    vec2 st = uv / tsize - 0.5;
    vec2 iuv = floor(st);
    vec2 fuv = fract(st);
    vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
    vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
    vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
    vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
    return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
  }

  void main() {
    vec2 vel = bilerp(uVelocity, vUv, uVelTexelSize).xy;
    vec2 coord = vUv - uDt * vel * uVelTexelSize;
    gl_FragColor = uDissipation * bilerp(uSource, coord, uSourceTexelSize);
  }
`;

const SPLAT_FRAG = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTarget;
  uniform float uAspectRatio;
  uniform vec2 uPoint;
  uniform vec3 uColor;
  uniform float uRadius;
  uniform float uMaxClamp;
  void main() {
    vec2 p = vUv - uPoint.xy;
    p.x *= uAspectRatio;
    vec3 splat = exp(-dot(p, p) / uRadius) * uColor;
    vec3 base = texture2D(uTarget, vUv).xyz;
    vec3 res = base + splat;
    if (uMaxClamp > 0.0) {
      res = min(res, vec3(uMaxClamp));
    }
    gl_FragColor = vec4(res, 1.0);
  }
`;

const CURL_FRAG = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform vec2 uTexelSize;
  void main() {
    float L = texture2D(uVelocity, vUv - vec2(uTexelSize.x, 0.0)).y;
    float R = texture2D(uVelocity, vUv + vec2(uTexelSize.x, 0.0)).y;
    float T = texture2D(uVelocity, vUv + vec2(0.0, uTexelSize.y)).x;
    float B = texture2D(uVelocity, vUv - vec2(0.0, uTexelSize.y)).x;
    float vorticity = R - L - T + B;
    gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
  }
`;

const VORTICITY_FRAG = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform sampler2D uCurl;
  uniform vec2 uTexelSize;
  uniform float uCurlStrength;
  uniform float uDt;
  void main() {
    float L = texture2D(uCurl, vUv - vec2(uTexelSize.x, 0.0)).x;
    float R = texture2D(uCurl, vUv + vec2(uTexelSize.x, 0.0)).x;
    float T = texture2D(uCurl, vUv + vec2(0.0, uTexelSize.y)).x;
    float B = texture2D(uCurl, vUv - vec2(0.0, uTexelSize.y)).x;
    float C = texture2D(uCurl, vUv).x;
    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    force /= length(force) + 0.0001;
    force *= uCurlStrength * C;
    force.y *= -1.0;
    vec2 vel = texture2D(uVelocity, vUv).xy;
    gl_FragColor = vec4(vel + force * uDt, 0.0, 1.0);
  }
`;

const DIVERGENCE_FRAG = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform vec2 uTexelSize;
  void main() {
    float L = texture2D(uVelocity, vUv - vec2(uTexelSize.x, 0.0)).x;
    float R = texture2D(uVelocity, vUv + vec2(uTexelSize.x, 0.0)).x;
    float T = texture2D(uVelocity, vUv + vec2(0.0, uTexelSize.y)).y;
    float B = texture2D(uVelocity, vUv - vec2(0.0, uTexelSize.y)).y;
    vec2 C = texture2D(uVelocity, vUv).xy;
    if (vUv.x - uTexelSize.x < 0.0) L = -C.x;
    if (vUv.x + uTexelSize.x > 1.0) R = -C.x;
    if (vUv.y - uTexelSize.y < 0.0) B = -C.y;
    if (vUv.y + uTexelSize.y > 1.0) T = -C.y;
    float div = 0.5 * (R - L + T - B);
    gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
  }
`;

const PRESSURE_FRAG = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;
  uniform vec2 uTexelSize;
  void main() {
    float L = texture2D(uPressure, vUv - vec2(uTexelSize.x, 0.0)).x;
    float R = texture2D(uPressure, vUv + vec2(uTexelSize.x, 0.0)).x;
    float T = texture2D(uPressure, vUv + vec2(0.0, uTexelSize.y)).x;
    float B = texture2D(uPressure, vUv - vec2(0.0, uTexelSize.y)).x;
    float C = texture2D(uDivergence, vUv).x;
    float pressure = (L + R + B + T - C) * 0.25;
    gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
  }
`;

const GRADIENT_SUB_FRAG = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uPressure;
  uniform sampler2D uVelocity;
  uniform vec2 uTexelSize;
  void main() {
    float L = texture2D(uPressure, vUv - vec2(uTexelSize.x, 0.0)).x;
    float R = texture2D(uPressure, vUv + vec2(uTexelSize.x, 0.0)).x;
    float T = texture2D(uPressure, vUv + vec2(0.0, uTexelSize.y)).x;
    float B = texture2D(uPressure, vUv - vec2(0.0, uTexelSize.y)).x;
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity.xy -= vec2(R - L, T - B);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`;

// Exact rA composite shader from noth.in (nothin-main.js line 4087) with smooth bilerp + 9-tap tent filter:
// - Where mask == 0.0 (no cursor movement), outputs baseColor (alpha = 1.0, 100% opaque static white logo).
// - Where mask > 0.0 (cursor fluid trail), mixes toward vec4(0.0, 0.0, 0.0, 0.0) (transparent!),
//   revealing the live .video-hero-bg layer underneath!
const COMPOSITE_FRAG = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uBaseTexture;
  uniform sampler2D uDye;
  uniform vec2 uDyeTexelSize;
  uniform float uRevealSize;
  uniform float uEdgeSoftness;
  uniform float uEdgeWidth;

  float sampleDyeBilerp(vec2 uv) {
    vec2 st = uv / uDyeTexelSize - 0.5;
    vec2 iuv = floor(st);
    vec2 fuv = fract(st);
    float a = texture2D(uDye, (iuv + vec2(0.5, 0.5)) * uDyeTexelSize).r;
    float b = texture2D(uDye, (iuv + vec2(1.5, 0.5)) * uDyeTexelSize).r;
    float c = texture2D(uDye, (iuv + vec2(0.5, 1.5)) * uDyeTexelSize).r;
    float d = texture2D(uDye, (iuv + vec2(1.5, 1.5)) * uDyeTexelSize).r;
    return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
  }

  void main() {
    vec2 flippedUv = vec2(vUv.x, 1.0 - vUv.y);
    vec4 baseColor = texture2D(uBaseTexture, flippedUv);

    // 9-point smooth Gaussian/tent filter over bilerp samples for razor-clean metaball contour
    vec2 d = uDyeTexelSize * 0.85;
    float c0 = sampleDyeBilerp(vUv) * 4.0;
    float c1 = (
      sampleDyeBilerp(vUv + vec2(d.x, 0.0)) +
      sampleDyeBilerp(vUv - vec2(d.x, 0.0)) +
      sampleDyeBilerp(vUv + vec2(0.0, d.y)) +
      sampleDyeBilerp(vUv - vec2(0.0, d.y))
    ) * 2.0;
    float c2 =
      sampleDyeBilerp(vUv + vec2(d.x, d.y)) +
      sampleDyeBilerp(vUv + vec2(-d.x, d.y)) +
      sampleDyeBilerp(vUv + vec2(d.x, -d.y)) +
      sampleDyeBilerp(vUv + vec2(-d.x, -d.y));
    float dye = (c0 + c1 + c2) / 16.0;

    float raw = dye * uRevealSize;
    float mask = clamp(smoothstep(uEdgeSoftness, uEdgeSoftness + uEdgeWidth, raw), 0.0, 1.0);

    gl_FragColor = mix(baseColor, vec4(0.0, 0.0, 0.0, 0.0), mask);
  }
`;

// Tuned Navier-Stokes fluid settings matching noth.in's organic liquid metaball reveal
const SIM_SETTINGS = {
  simResolution: 256,
  dyeResolution: 256,
  velocityDissipation: 0.955,
  dyeDissipation: 0.978,
  pressureIterations: 20,
  curlStrength: 14.0,
  splatRadius: 0.0022,
  splatForce: 4600,
  revealSize: 2.6,
  edgeSoftness: 0.28,
  edgeWidth: 0.14,
};

export default function FluidHeroCanvas() {
  const videoBgCanvasRef = useRef(null);
  const maskCanvasRef = useRef(null);

  useEffect(() => {
    const videoBgCanvas = videoBgCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!videoBgCanvas || !maskCanvas) return;

    const bgCtx = videoBgCanvas.getContext('2d');
    const gl =
      maskCanvas.getContext('webgl2', {
        alpha: true,
        premultipliedAlpha: false,
        antialias: false,
        depth: false,
        stencil: false,
      }) ||
      maskCanvas.getContext('webgl', {
        alpha: true,
        premultipliedAlpha: false,
        antialias: false,
        depth: false,
        stencil: false,
      });

    if (!gl || !bgCtx) return;

    const isWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
    let halfFloatTexType = gl.UNSIGNED_BYTE;
    let rgbaInternalFormat = gl.RGBA;
    let canLinearFilter = false;

    if (isWebGL2) {
      gl.getExtension('EXT_color_buffer_float');
      gl.getExtension('OES_texture_float_linear');
      rgbaInternalFormat = gl.RGBA16F;
      halfFloatTexType = gl.HALF_FLOAT;
      canLinearFilter = true; // WebGL2 natively supports gl.LINEAR on RGBA16F / HALF_FLOAT
    } else {
      const hf = gl.getExtension('OES_texture_half_float');
      const hfLinear = gl.getExtension('OES_texture_half_float_linear');
      if (hf) halfFloatTexType = hf.HALF_FLOAT_OES;
      canLinearFilter = !!hfLinear;
    }

    const compileShader = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };

    const createProgram = (fragSource) => {
      const vs = compileShader(gl.VERTEX_SHADER, BASE_VERT);
      const fs = compileShader(gl.FRAGMENT_SHADER, fragSource);
      const prog = gl.createProgram();
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.bindAttribLocation(prog, 0, 'aPosition');
      gl.linkProgram(prog);
      const uniforms = {};
      const count = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < count; i++) {
        const info = gl.getActiveUniform(prog, i);
        uniforms[info.name] = gl.getUniformLocation(prog, info.name);
      }
      return { prog, uniforms };
    };

    const splatProg = createProgram(SPLAT_FRAG);
    const curlProg = createProgram(CURL_FRAG);
    const vorticityProg = createProgram(VORTICITY_FRAG);
    const divergenceProg = createProgram(DIVERGENCE_FRAG);
    const pressureProg = createProgram(PRESSURE_FRAG);
    const gradSubProg = createProgram(GRADIENT_SUB_FRAG);
    const advectionProg = createProgram(ADVECTION_FRAG);
    const compositeProg = createProgram(COMPOSITE_FRAG);

    const quadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const createFBO = (w, h, filter = gl.NEAREST) => {
      gl.activeTexture(gl.TEXTURE0);
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, rgbaInternalFormat, w, h, 0, gl.RGBA, halfFloatTexType, null);

      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      }
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return { tex, fbo, width: w, height: h };
    };

    const createDoubleFBO = (w, h, filter = gl.NEAREST) => {
      let fbo1 = createFBO(w, h, filter);
      let fbo2 = createFBO(w, h, filter);
      return {
        get read() {
          return fbo1;
        },
        get write() {
          return fbo2;
        },
        swap() {
          const tmp = fbo1;
          fbo1 = fbo2;
          fbo2 = tmp;
        },
      };
    };

    const simRes = SIM_SETTINGS.simResolution;
    const dyeRes = SIM_SETTINGS.dyeResolution;
    const texFilter = canLinearFilter ? gl.LINEAR : gl.NEAREST;
    const velocity = createDoubleFBO(simRes, simRes, texFilter);
    const dye = createDoubleFBO(dyeRes, dyeRes, texFilter);
    const pressure = createDoubleFBO(simRes, simRes, gl.NEAREST);
    const curlFBO = createFBO(simRes, simRes, gl.NEAREST);
    const divergenceFBO = createFBO(simRes, simRes, gl.NEAREST);

    const blit = (targetFBO) => {
      if (targetFBO) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, targetFBO.fbo);
        gl.viewport(0, 0, targetFBO.width, targetFBO.height);
      } else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, maskCanvas.width, maskCanvas.height);
      }
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const baseCanvas = document.createElement('canvas');
    const baseCtx = baseCanvas.getContext('2d');

    gl.activeTexture(gl.TEXTURE0);
    const baseTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, baseTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const loadedAssets = new Array(HERO_3D_LOGOS.length).fill(null);

    // Measure the exact DOM bounding rectangle of .nothin-hero-svg (matching pA() in nothin-main.js)
    const getHeroLogoRect = (w, h) => {
      const sectionEl = maskCanvas.closest('.section-w');
      const svgEl = sectionEl ? sectionEl.querySelector('.nothin-hero-svg') : null;
      if (sectionEl && svgEl) {
        const sRect = sectionEl.getBoundingClientRect();
        const lRect = svgEl.getBoundingClientRect();
        if (sRect.width > 0 && sRect.height > 0 && lRect.width > 0 && lRect.height > 0) {
          const sx = w / sRect.width;
          const sy = h / sRect.height;
          const rw = lRect.width * sx;
          const rh = lRect.height * sy;
          return {
            x: (lRect.left - sRect.left) * sx,
            y: (lRect.top - sRect.top) * sy,
            w: rw,
            h: rh,
            scaleX: rw / 2020,
            scaleY: rh / 294,
          };
        }
      }
      return computeHeroLogoTransform(w, h);
    };

    const drawArchitecturalBackground = (ctx, w, h) => {
      const grad = ctx.createRadialGradient(
        w * 0.5,
        h * 0.25,
        10,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.85
      );
      grad.addColorStop(0, '#131318');
      grad.addColorStop(1, '#08080b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 12; i++) {
        const x = Math.round((w / 12) * i) + 0.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let j = 1; j < 8; j++) {
        const y = Math.round((h / 8) * j) + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    };

    // Bake Layer 1 (uBaseTexture on .mask-reveal-canvas):
    // Opaque dark architectural background + static classic white SOME.HOW logo at exact DOM coordinates
    const renderBaseLayerToCanvas = (w, h) => {
      baseCanvas.width = w;
      baseCanvas.height = h;
      drawArchitecturalBackground(baseCtx, w, h);

      const rect = getHeroLogoRect(w, h);

      baseCtx.save();
      baseCtx.translate(rect.x, rect.y);
      baseCtx.scale(rect.scaleX, rect.scaleY);
      baseCtx.fillStyle = '#ffffff';
      LETTER_DEFS.forEach((l) => {
        const p = new Path2D(l.d);
        baseCtx.fill(p);
      });
      baseCtx.restore();

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, baseTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, baseCanvas);
    };

    // Draw a single UNCLIPPED, per-glyph 1:1 aligned 3D luxury SOME.HOW asset
    const drawAligned3DLogo = (ctx, asset, rect, alpha, breathScaleX, breathScaleY) => {
      if (!asset || alpha <= 0.001) return;
      const { matteCanvas, bbox, iw, ih } = asset;

      const cx = rect.x + rect.w * 0.5;
      const cy = rect.y + rect.h * 0.5;

      const targetW = rect.w * breathScaleX;
      const targetH = rect.h * breathScaleY;
      const targetX = cx - targetW * 0.5;
      const targetY = cy - targetH * 0.5;

      const scaleX = targetW / bbox.w;
      const scaleY = targetH / bbox.h;

      const drawX = targetX - bbox.x * scaleX;
      const drawY = targetY - bbox.y * scaleY;
      const drawW = iw * scaleX;
      const drawH = ih * scaleY;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.drawImage(matteCanvas, 0, 0, iw, ih, drawX, drawY, drawW, drawH);
      ctx.restore();
    };

    // Render Layer 0 (.video-hero-bg, z-index: 0) continuously at 60fps:
    // Smoothly develops, inflates, and morphs through the 6 unclipped 3D luxury SOME.HOW logos
    // (Pink Fur -> Silver Foil -> Yellow Bubbles -> Disco Mirrorball -> Inflating Silver Balloon -> 24K Gold Balloon)
    const renderBackgroundVideoFrame = (now) => {
      const w = videoBgCanvas.width;
      const h = videoBgCanvas.height;
      if (w === 0 || h === 0) return;

      drawArchitecturalBackground(bgCtx, w, h);

      const availableIndices = [];
      for (let i = 0; i < loadedAssets.length; i++) {
        if (loadedAssets[i]) availableIndices.push(i);
      }
      if (availableIndices.length === 0) return;

      const rect = getHeroLogoRect(w, h);
      const timeSec = now * 0.001;

      // Each 3D luxury logo develops over a 1050ms cycle (580ms hold + 470ms 3D inflation/morph transition)
      const cycleMs = 1050;
      const holdMs = 580;
      const morphMs = cycleMs - holdMs;

      const cycleCount = Math.floor(now / cycleMs);
      const cycleElapsed = now % cycleMs;

      const currSlot = cycleCount % availableIndices.length;
      const nextSlot = (cycleCount + 1) % availableIndices.length;
      const currIdx = availableIndices[currSlot];
      const nextIdx = availableIndices[nextSlot];

      const currAsset = loadedAssets[currIdx];
      const nextAsset = loadedAssets[nextIdx];

      const currPulse = HERO_3D_LOGOS[currIdx]?.inflatePulse ?? 0.018;
      const nextPulse = HERO_3D_LOGOS[nextIdx]?.inflatePulse ?? 0.018;

      // Continuous 60fps 3D pneumatic inflation & breathing motion ("ασημί μπαλόνι που φουσκώνει")
      const breathX = 1.0 + currPulse * 0.45 * Math.sin(timeSec * 4.2);
      const breathY = 1.0 + currPulse * 0.65 * Math.sin(timeSec * 4.2 - 0.4);

      if (cycleElapsed <= holdMs || currIdx === nextIdx) {
        drawAligned3DLogo(bgCtx, currAsset, rect, 1.0, breathX, breathY);
      } else {
        const rawT = (cycleElapsed - holdMs) / morphMs;
        // Smooth S-curve development easing
        const t = rawT * rawT * (3.0 - 2.0 * rawT);

        // Outgoing 3D logo gently settles while incoming 3D logo inflates from 0.96 -> 1.015 -> 1.00
        const outScaleX = breathX * (1.0 - 0.025 * t);
        const outScaleY = breathY * (1.0 - 0.025 * t);

        const swell = Math.sin(t * Math.PI) * 0.022;
        const inBreathX = 1.0 + nextPulse * 0.45 * Math.sin(timeSec * 4.2);
        const inBreathY = 1.0 + nextPulse * 0.65 * Math.sin(timeSec * 4.2 - 0.4);
        const inScaleX = inBreathX * (0.96 + 0.04 * t + swell);
        const inScaleY = inBreathY * (0.96 + 0.04 * t + swell * 1.15);

        drawAligned3DLogo(bgCtx, currAsset, rect, 1.0 - t * 0.85, outScaleX, outScaleY);
        drawAligned3DLogo(bgCtx, nextAsset, rect, t, inScaleX, inScaleY);
      }
    };

    const syncSize = (force = false) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(window.innerWidth * dpr));
      const h = Math.max(1, Math.floor(window.innerHeight * dpr));
      if (force || maskCanvas.width !== w || maskCanvas.height !== h) {
        maskCanvas.width = w;
        maskCanvas.height = h;
        videoBgCanvas.width = w;
        videoBgCanvas.height = h;
        renderBaseLayerToCanvas(w, h);
        renderBackgroundVideoFrame(performance.now());
      }
    };

    syncSize(true);
    const onResize = () => syncSize(false);
    window.addEventListener('resize', onResize);

    // Preload all 6 luxury 3D typographic renders & prepare their alpha-matted, per-glyph 1:1 aligned canvases
    HERO_3D_LOGOS.forEach((item, idx) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        loadedAssets[idx] = prepare3DLogoAsset(img);
        renderBackgroundVideoFrame(performance.now());
      };
      img.src = item.src;
    });

    const splat = (x, y, dx, dy, dyeStrength = 0.65) => {
      const aspect = maskCanvas.width / Math.max(maskCanvas.height, 1);

      gl.useProgram(splatProg.prog);
      gl.uniform1i(splatProg.uniforms.uTarget, 0);
      gl.uniform1f(splatProg.uniforms.uAspectRatio, aspect);
      gl.uniform2f(splatProg.uniforms.uPoint, x, y);
      gl.uniform1f(splatProg.uniforms.uRadius, SIM_SETTINGS.splatRadius);
      gl.uniform3f(splatProg.uniforms.uColor, dx, dy, 0.0);
      gl.uniform1f(splatProg.uniforms.uMaxClamp, 0.0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
      blit(velocity.write);
      velocity.swap();

      gl.uniform1i(splatProg.uniforms.uTarget, 0);
      gl.uniform3f(splatProg.uniforms.uColor, dyeStrength, dyeStrength, dyeStrength);
      gl.uniform1f(splatProg.uniforms.uMaxClamp, 1.15);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, dye.read.tex);
      blit(dye.write);
      dye.swap();
    };

    // Pointer tracking — ZERO auto-splats on load ("η διαφάνεια δεν συμβαίνει αν δεν περάσεις από πάνω")
    const pointer = { x: 0.5, y: 0.5, lastX: 0.5, lastY: 0.5, initialized: false };

    const onPointerMove = (e) => {
      const rect = maskCanvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      // Only trigger when cursor is inside the Hero section
      if (
        e.clientY < rect.top ||
        e.clientY > rect.bottom ||
        e.clientX < rect.left ||
        e.clientX > rect.right
      ) {
        pointer.initialized = false;
        return;
      }

      const nx = (e.clientX - rect.left) / rect.width;
      const ny = 1.0 - (e.clientY - rect.top) / rect.height;

      if (!pointer.initialized) {
        pointer.lastX = nx;
        pointer.lastY = ny;
        pointer.x = nx;
        pointer.y = ny;
        pointer.initialized = true;
        return;
      }

      const diffX = nx - pointer.lastX;
      const diffY = ny - pointer.lastY;
      const dist = Math.hypot(diffX, diffY);

      if (dist > 0.0002) {
        // Interpolate along segment so cursor movements create a continuous, controlled liquid reveal window
        const steps = Math.min(8, Math.max(1, Math.ceil(dist / 0.015)));
        const stepDx = (diffX / steps) * SIM_SETTINGS.splatForce;
        const stepDy = (diffY / steps) * SIM_SETTINGS.splatForce;

        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
          const sx = pointer.lastX + diffX * t;
          const sy = pointer.lastY + diffY * t;
          splat(sx, sy, stepDx, stepDy, 0.72);
        }
      }

      pointer.lastX = nx;
      pointer.lastY = ny;
      pointer.x = nx;
      pointer.y = ny;
    };

    const onTouchMove = (e) => {
      if (e.touches && e.touches.length > 0) {
        onPointerMove(e.touches[0]);
      }
    };

    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    let rafId = null;
    let lastTime = performance.now();

    const step = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;

      // 1. Update Layer 0 (.video-hero-bg) 60fps 3D luxury logo animation in the background
      renderBackgroundVideoFrame(now);

      const simTexel = 1.0 / simRes;
      const dyeTexel = 1.0 / dyeRes;

      // 2. Navier-Stokes Fluid Step on Layer 1 (.mask-reveal-canvas, exact cA.update() from noth.in)
      gl.useProgram(curlProg.prog);
      gl.uniform2f(curlProg.uniforms.uTexelSize, simTexel, simTexel);
      gl.uniform1i(curlProg.uniforms.uVelocity, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
      blit(curlFBO);

      gl.useProgram(vorticityProg.prog);
      gl.uniform2f(vorticityProg.uniforms.uTexelSize, simTexel, simTexel);
      gl.uniform1i(vorticityProg.uniforms.uVelocity, 0);
      gl.uniform1i(vorticityProg.uniforms.uCurl, 1);
      gl.uniform1f(vorticityProg.uniforms.uCurlStrength, SIM_SETTINGS.curlStrength);
      gl.uniform1f(vorticityProg.uniforms.uDt, dt);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, curlFBO.tex);
      blit(velocity.write);
      velocity.swap();

      gl.useProgram(divergenceProg.prog);
      gl.uniform2f(divergenceProg.uniforms.uTexelSize, simTexel, simTexel);
      gl.uniform1i(divergenceProg.uniforms.uVelocity, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
      blit(divergenceFBO);

      // Clear pressure before Jacobi iterations (exact match to noth.in's cA.update)
      gl.bindFramebuffer(gl.FRAMEBUFFER, pressure.read.fbo);
      gl.viewport(0, 0, pressure.read.width, pressure.read.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(pressureProg.prog);
      gl.uniform2f(pressureProg.uniforms.uTexelSize, simTexel, simTexel);
      gl.uniform1i(pressureProg.uniforms.uDivergence, 1);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, divergenceFBO.tex);

      for (let i = 0; i < SIM_SETTINGS.pressureIterations; i++) {
        gl.uniform1i(pressureProg.uniforms.uPressure, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, pressure.read.tex);
        blit(pressure.write);
        pressure.swap();
      }

      gl.useProgram(gradSubProg.prog);
      gl.uniform2f(gradSubProg.uniforms.uTexelSize, simTexel, simTexel);
      gl.uniform1i(gradSubProg.uniforms.uPressure, 0);
      gl.uniform1i(gradSubProg.uniforms.uVelocity, 1);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, pressure.read.tex);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
      blit(velocity.write);
      velocity.swap();

      gl.useProgram(advectionProg.prog);
      gl.uniform2f(advectionProg.uniforms.uVelTexelSize, simTexel, simTexel);
      gl.uniform2f(advectionProg.uniforms.uSourceTexelSize, simTexel, simTexel);
      gl.uniform1i(advectionProg.uniforms.uVelocity, 0);
      gl.uniform1i(advectionProg.uniforms.uSource, 0);
      gl.uniform1f(advectionProg.uniforms.uDt, dt);
      gl.uniform1f(advectionProg.uniforms.uDissipation, SIM_SETTINGS.velocityDissipation);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
      blit(velocity.write);
      velocity.swap();

      gl.uniform2f(advectionProg.uniforms.uVelTexelSize, simTexel, simTexel);
      gl.uniform2f(advectionProg.uniforms.uSourceTexelSize, dyeTexel, dyeTexel);
      gl.uniform1i(advectionProg.uniforms.uVelocity, 0);
      gl.uniform1i(advectionProg.uniforms.uSource, 1);
      gl.uniform1f(advectionProg.uniforms.uDissipation, SIM_SETTINGS.dyeDissipation);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, dye.read.tex);
      blit(dye.write);
      dye.swap();

      // 3. Final Composite on .mask-reveal-canvas (z-index: 1):
      // Mixes opaque static white base logo (uBaseTexture) with rgba(0,0,0,0) transparency where cursor passes
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, maskCanvas.width, maskCanvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(compositeProg.prog);
      gl.uniform1i(compositeProg.uniforms.uBaseTexture, 0);
      gl.uniform1i(compositeProg.uniforms.uDye, 1);
      gl.uniform2f(compositeProg.uniforms.uDyeTexelSize, dyeTexel, dyeTexel);
      gl.uniform1f(compositeProg.uniforms.uRevealSize, SIM_SETTINGS.revealSize);
      gl.uniform1f(compositeProg.uniforms.uEdgeSoftness, SIM_SETTINGS.edgeSoftness);
      gl.uniform1f(compositeProg.uniforms.uEdgeWidth, SIM_SETTINGS.edgeWidth);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, baseTex);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, dye.read.tex);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  return (
    <>
      <canvas ref={videoBgCanvasRef} className="video-hero-bg" />
      <canvas ref={maskCanvasRef} className="mask-reveal-canvas" />
    </>
  );
}
