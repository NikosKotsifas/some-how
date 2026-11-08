import React, { useEffect, useRef } from 'react';
import { HERO_3D_LOGOS } from '../data/studioData';
import { LETTER_DEFS } from './SomeHowWordmark';

// Shared 1:1 coordinate transform used by BOTH the classic white SOME.HOW base logo
// AND every 3D luxury typographic render so all of them have the exact same size and position.
export function computeHeroLogoTransform(w, h) {
  const padX = w * 0.025;
  const availW = w - padX * 2;
  const scale = availW / 2020;
  const drawnH = 294 * scale;
  const offsetY = h * 0.61 - drawnH * 0.5;
  return { padX, availW, scale, drawnH, offsetY };
}

// Detects the tight typographic bounding box [x, y, w, h] of the "SOME.HOW" letters inside a 16:9 3D render
function detectTypographyBBox(img) {
  const aw = 512;
  const ah = 288;
  const c = document.createElement('canvas');
  c.width = aw;
  c.height = ah;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, aw, ah);
  const data = ctx.getImageData(0, 0, aw, ah).data;

  const rowCounts = new Float32Array(ah);
  const colCounts = new Float32Array(aw);

  for (let y = 0; y < ah; y++) {
    let rSum = 0;
    const rowOff = y * aw * 4;
    for (let x = 0; x < aw; x++) {
      const idx = rowOff + x * 4;
      const lum = Math.max(data[idx], data[idx + 1], data[idx + 2]);
      if (lum > 36) {
        rSum += 1;
        colCounts[x] += 1;
      }
    }
    rowCounts[y] = rSum;
  }

  let maxRow = 0;
  for (let y = 0; y < ah; y++) if (rowCounts[y] > maxRow) maxRow = rowCounts[y];
  let maxCol = 0;
  for (let x = 0; x < aw; x++) if (colCounts[x] > maxCol) maxCol = colCounts[x];

  const rowThresh = Math.max(8, maxRow * 0.18);
  const colThresh = Math.max(5, maxCol * 0.14);

  let minY = 0;
  while (minY < ah && rowCounts[minY] < rowThresh) minY++;
  let maxY = ah - 1;
  while (maxY > minY && rowCounts[maxY] < rowThresh) maxY--;

  let minX = 0;
  while (minX < aw && colCounts[minX] < colThresh) minX++;
  let maxX = aw - 1;
  while (maxX > minX && colCounts[maxX] < colThresh) maxX--;

  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;

  return {
    x: (minX / aw) * iw,
    y: (minY / ah) * ih,
    w: Math.max(1, ((maxX - minX + 1) / aw) * iw),
    h: Math.max(1, ((maxY - minY + 1) / ah) * ih),
  };
}

const BASE_VERT = `
  precision highp float;
  attribute vec2 aPosition;
  varying vec2 vUv;
  void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const SPLAT_FRAG = `
  precision highp float;
  uniform sampler2D uTarget;
  uniform float uAspectRatio;
  uniform vec2 uPoint;
  uniform vec3 uColor;
  uniform float uRadius;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv - uPoint.xy;
    p.x *= uAspectRatio;
    vec3 splat = exp(-dot(p, p) / uRadius) * uColor;
    vec3 base = texture2D(uTarget, vUv).xyz;
    gl_FragColor = vec4(base + splat, 1.0);
  }
`;

const CURL_FRAG = `
  precision highp float;
  uniform sampler2D uVelocity;
  uniform vec2 uTexelSize;
  varying vec2 vUv;
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
  uniform sampler2D uVelocity;
  uniform sampler2D uCurl;
  uniform vec2 uTexelSize;
  uniform float uCurlStrength;
  uniform float uDt;
  varying vec2 vUv;
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
  uniform sampler2D uVelocity;
  uniform vec2 uTexelSize;
  varying vec2 vUv;
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
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;
  uniform vec2 uTexelSize;
  varying vec2 vUv;
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
  uniform sampler2D uPressure;
  uniform sampler2D uVelocity;
  uniform vec2 uTexelSize;
  varying vec2 vUv;
  void main() {
    float L = texture2D(uPressure, vUv - vec2(uTexelSize.x, 0.0)).x;
    float R = texture2D(uPressure, vUv + vec2(uTexelSize.x, 0.0)).x;
    float T = texture2D(uPressure, vUv + vec2(0.0, uTexelSize.y)).x;
    float B = texture2D(uPressure, vUv - vec2(0.0, uTexelSize.y)).x;
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity -= vec2(R - L, T - B) * 0.5;
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`;

const ADVECTION_FRAG = `
  precision highp float;
  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform vec2 uTexelSize;
  uniform float uDt;
  uniform float uDissipation;
  varying vec2 vUv;
  void main() {
    vec2 coord = vUv - uDt * texture2D(uVelocity, vUv).xy * uTexelSize;
    gl_FragColor = uDissipation * texture2D(uSource, coord);
  }
`;

// Composite fragment shader:
// - Shows the 100% pure classic white SOME.HOW base logo (uBaseTexture) everywhere by default.
// - ONLY inside the localized cursor fluid brush (mask), reveals the 1:1 size-matched 3D luxury typography
//   (uRevealTexture) with a subtle 3D inflation/breathing pulse around the cursor wake.
const COMPOSITE_FRAG = `
  precision highp float;
  uniform sampler2D uBaseTexture;
  uniform sampler2D uRevealTexture;
  uniform sampler2D uDye;
  uniform sampler2D uVelocity;
  uniform vec2 uPointer;
  uniform float uTime;
  uniform float uInflatePulse;
  uniform float uRevealSize;
  uniform float uEdgeSoftness;
  uniform float uEdgeWidth;
  varying vec2 vUv;

  void main() {
    vec2 flippedUv = vec2(vUv.x, 1.0 - vUv.y);
    vec4 baseColor = texture2D(uBaseTexture, flippedUv);

    float dye = texture2D(uDye, vUv).r;
    float raw = dye * uRevealSize;
    float mask = clamp(smoothstep(uEdgeSoftness, uEdgeSoftness + uEdgeWidth, raw), 0.0, 1.0);

    // Subtle 3D inflation/swell effect inside the fluid lens (makes the silver balloon & bubbles visibly puff)
    vec2 pointerFlipped = vec2(uPointer.x, 1.0 - uPointer.y);
    vec2 toCursor = flippedUv - pointerFlipped;
    float distSq = dot(toCursor, toCursor);
    float swell = exp(-distSq * 24.0) * uInflatePulse * (0.65 + 0.35 * sin(uTime * 8.0));
    vec2 vel = texture2D(uVelocity, vUv).xy;
    vec2 inflatedUv = clamp(flippedUv - toCursor * swell - vel * 0.00025 * mask, 0.0, 1.0);

    vec4 revealColor = texture2D(uRevealTexture, inflatedUv);
    gl_FragColor = mix(baseColor, revealColor, mask);
  }
`;

// Focused, localized fluid cursor brush ("με μικρότερο εύρος εφέ εμφάνισης του animated logo"):
// Reveals a clean ~180px lens along the cursor path while keeping the rest of the white base logo untouched.
const SIM_SETTINGS = {
  simResolution: 256,
  dyeResolution: 512,
  velocityDissipation: 0.955,
  dyeDissipation: 0.981,
  pressureIterations: 18,
  curlStrength: 15.0,
  splatRadius: 0.00024,
  splatForce: 5200,
  revealSize: 3.5,
  edgeSoftness: 0.24,
  edgeWidth: 0.14,
};

export default function FluidHeroCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false }) ||
      canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false });

    if (!gl) return;

    const isWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
    let halfFloatTexType = gl.UNSIGNED_BYTE;
    let rgbaInternalFormat = gl.RGBA;

    if (isWebGL2) {
      gl.getExtension('EXT_color_buffer_float');
      gl.getExtension('OES_texture_float_linear');
      rgbaInternalFormat = gl.RGBA16F;
      halfFloatTexType = gl.HALF_FLOAT;
    } else {
      const hf = gl.getExtension('OES_texture_half_float');
      gl.getExtension('OES_texture_half_float_linear');
      if (hf) halfFloatTexType = hf.HALF_FLOAT_OES;
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

    const createFBO = (w, h, filter = gl.LINEAR) => {
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

    const createDoubleFBO = (w, h, filter = gl.LINEAR) => {
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
    const velocity = createDoubleFBO(simRes, simRes, gl.LINEAR);
    const dye = createDoubleFBO(dyeRes, dyeRes, gl.LINEAR);
    const pressure = createDoubleFBO(simRes, simRes, gl.NEAREST);
    const curlFBO = createFBO(simRes, simRes, gl.NEAREST);
    const divergenceFBO = createFBO(simRes, simRes, gl.NEAREST);

    const blit = (targetFBO) => {
      if (targetFBO) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, targetFBO.fbo);
        gl.viewport(0, 0, targetFBO.width, targetFBO.height);
      } else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const baseCanvas = document.createElement('canvas');
    const baseCtx = baseCanvas.getContext('2d');
    const revealCanvas = document.createElement('canvas');
    const revealCtx = revealCanvas.getContext('2d');

    const createImageTex = () => {
      gl.activeTexture(gl.TEXTURE0);
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return tex;
    };

    const baseTex = createImageTex();
    const revealTextures = HERO_3D_LOGOS.map(() => createImageTex());
    const loadedEntries = new Array(HERO_3D_LOGOS.length).fill(null);

    const drawArchitecturalBackground = (ctx, w, h) => {
      const grad = ctx.createRadialGradient(w * 0.5, h * 0.25, 10, w * 0.5, h * 0.5, Math.max(w, h) * 0.85);
      grad.addColorStop(0, '#141419');
      grad.addColorStop(1, '#09090c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.055)';
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

    // 1. Render Classic Pure White (#ffffff) SOME.HOW Base Logo
    const renderBaseLayerToCanvas = (w, h) => {
      baseCanvas.width = w;
      baseCanvas.height = h;
      drawArchitecturalBackground(baseCtx, w, h);

      const { padX, scale, offsetY } = computeHeroLogoTransform(w, h);

      baseCtx.save();
      baseCtx.translate(padX, offsetY);
      baseCtx.scale(scale, scale);
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

    // 2. Render 3D Luxury Typographic Image into its WebGL Texture locked 1:1 to the Classic White Base Logo:
    // - Maps [bbox.x, bbox.y, bbox.w, bbox.h] of the 3D render onto [targetX, targetY, targetW, targetH]
    // - Clips strictly to LETTER_DEFS so the outer size & kerning match the white base logo 100.0%
    // - Uses 'lighten' multi-offset texture dilation inside the clip so #000000 gaps from the JPEG
    //   NEVER punch black holes into the white letters, filling 100% of every letter with the 3D material!
    const renderSingleRevealTexture = (idx, w, h) => {
      const entry = loadedEntries[idx];
      if (!entry || !entry.img) return;
      const { img, bbox } = entry;

      revealCanvas.width = w;
      revealCanvas.height = h;
      drawArchitecturalBackground(revealCtx, w, h);

      const { padX: targetX, availW: targetW, scale, drawnH: targetH, offsetY: targetY } = computeHeroLogoTransform(w, h);

      const combinedPath = new Path2D();
      LETTER_DEFS.forEach((l) => {
        combinedPath.addPath(new Path2D(l.d));
      });

      const scaleX = targetW / bbox.w;
      const scaleY = targetH / bbox.h;
      const drawX = targetX - bbox.x * scaleX;
      const drawY = targetY - bbox.y * scaleY;
      const drawW = (img.naturalWidth || img.width) * scaleX;
      const drawH = (img.naturalHeight || img.height) * scaleY;

      // Clip to the exact 1:1 LETTER_DEFS geometry of the classic white base logo
      revealCtx.save();
      revealCtx.translate(targetX, targetY);
      revealCtx.scale(scale, scale);
      revealCtx.clip(combinedPath);
      revealCtx.setTransform(1, 0, 0, 1, 0, 0);

      // Dark base inside the letters before 'lighten' multi-pass texture fill
      revealCtx.fillStyle = '#08080b';
      revealCtx.fillRect(targetX, targetY, targetW, targetH);

      // Multi-offset 'lighten' passes ensure 100% of the LETTER_DEFS stems are filled with the 3D texture
      // (pink fur, silver foil, yellow bubbles, disco tiles, inflating silver balloon) with ZERO black holes!
      revealCtx.globalCompositeOperation = 'lighten';
      const stepX = Math.round(28 * scale);
      const stepY = Math.round(18 * scale);
      const offsets = [
        [-stepX * 2, 0],
        [stepX * 2, 0],
        [-stepX, -stepY],
        [stepX, -stepY],
        [-stepX, stepY],
        [stepX, stepY],
        [-stepX, 0],
        [stepX, 0],
        [0, -stepY],
        [0, stepY],
        [0, 0],
      ];
      for (const [ox, oy] of offsets) {
        revealCtx.drawImage(img, drawX + ox, drawY + oy, drawW, drawH);
      }

      // Add subtle 3D studio pillow contour along the exact LETTER_DEFS boundary so each letter
      // has organic 3D rounded depth & specular rim lighting inside its 1:1 silhouette
      revealCtx.translate(targetX, targetY);
      revealCtx.scale(scale, scale);
      revealCtx.lineJoin = 'round';
      revealCtx.lineCap = 'round';

      revealCtx.globalCompositeOperation = 'multiply';
      revealCtx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
      revealCtx.lineWidth = 20;
      revealCtx.stroke(combinedPath);

      revealCtx.globalCompositeOperation = 'screen';
      revealCtx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
      revealCtx.lineWidth = 7;
      revealCtx.stroke(combinedPath);

      revealCtx.restore();

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, revealTextures[idx]);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, revealCanvas);
    };

    const syncSize = (force = false) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(window.innerWidth * dpr));
      const h = Math.max(1, Math.floor(window.innerHeight * dpr));
      if (force || canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        renderBaseLayerToCanvas(w, h);
        for (let i = 0; i < HERO_3D_LOGOS.length; i++) {
          if (loadedEntries[i]) renderSingleRevealTexture(i, w, h);
        }
      }
    };

    syncSize(true);
    const onResize = () => syncSize(false);
    window.addEventListener('resize', onResize);

    // Preload all 11 luxury 3D typographic renders & compute their 1:1 typography bounding boxes
    HERO_3D_LOGOS.forEach((item, idx) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        const bbox = detectTypographyBBox(img);
        loadedEntries[idx] = { img, bbox };
        renderSingleRevealTexture(idx, canvas.width, canvas.height);
      };
      img.src = item.src;
    });

    const splat = (x, y, dx, dy) => {
      const aspect = canvas.width / Math.max(canvas.height, 1);

      gl.useProgram(splatProg.prog);
      gl.uniform1i(splatProg.uniforms.uTarget, 0);
      gl.uniform1f(splatProg.uniforms.uAspectRatio, aspect);
      gl.uniform2f(splatProg.uniforms.uPoint, x, y);
      gl.uniform1f(splatProg.uniforms.uRadius, SIM_SETTINGS.splatRadius);
      gl.uniform3f(splatProg.uniforms.uColor, dx, dy, 0.0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
      blit(velocity.write);
      velocity.swap();

      gl.uniform1i(splatProg.uniforms.uTarget, 0);
      gl.uniform3f(splatProg.uniforms.uColor, 0.95, 0.95, 0.95);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, dye.read.tex);
      blit(dye.write);
      dye.swap();
    };

    const pointer = { x: 0.5, y: 0.5, lastX: 0.5, lastY: 0.5, initialized: false };

    const onPointerMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / Math.max(rect.width, 1);
      const ny = 1.0 - (e.clientY - rect.top) / Math.max(rect.height, 1);

      if (!pointer.initialized) {
        pointer.lastX = nx;
        pointer.lastY = ny;
        pointer.initialized = true;
      }

      const dx = (nx - pointer.lastX) * SIM_SETTINGS.splatForce;
      const dy = (ny - pointer.lastY) * SIM_SETTINGS.splatForce;
      pointer.lastX = nx;
      pointer.lastY = ny;
      pointer.x = nx;
      pointer.y = ny;

      if (Math.abs(dx) > 0.005 || Math.abs(dy) > 0.005) {
        splat(nx, ny, dx, dy);
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });

    let rafId = null;
    let lastTime = performance.now();
    let activeIdx = 0;
    let lastCycleTime = performance.now();

    const step = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;

      // Rapidly cycle through the 11 luxury 3D typographic renders (145ms per frame)
      if (now - lastCycleTime > 145) {
        let next = (activeIdx + 1) % HERO_3D_LOGOS.length;
        for (let tries = 0; tries < HERO_3D_LOGOS.length; tries++) {
          const candidate = (activeIdx + 1 + tries) % HERO_3D_LOGOS.length;
          if (loadedEntries[candidate]) {
            next = candidate;
            break;
          }
        }
        activeIdx = next;
        lastCycleTime = now;
      }

      const simTexel = 1.0 / simRes;
      const dyeTexel = 1.0 / dyeRes;

      // 1. Curl
      gl.useProgram(curlProg.prog);
      gl.uniform2f(curlProg.uniforms.uTexelSize, simTexel, simTexel);
      gl.uniform1i(curlProg.uniforms.uVelocity, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
      blit(curlFBO);

      // 2. Vorticity confinement
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

      // 3. Divergence
      gl.useProgram(divergenceProg.prog);
      gl.uniform2f(divergenceProg.uniforms.uTexelSize, simTexel, simTexel);
      gl.uniform1i(divergenceProg.uniforms.uVelocity, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
      blit(divergenceFBO);

      // 4. Pressure Jacobi iterations
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

      // 5. Subtract pressure gradient
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

      // 6. Advect velocity
      gl.useProgram(advectionProg.prog);
      gl.uniform2f(advectionProg.uniforms.uTexelSize, simTexel, simTexel);
      gl.uniform1i(advectionProg.uniforms.uVelocity, 0);
      gl.uniform1i(advectionProg.uniforms.uSource, 0);
      gl.uniform1f(advectionProg.uniforms.uDt, dt);
      gl.uniform1f(advectionProg.uniforms.uDissipation, SIM_SETTINGS.velocityDissipation);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
      blit(velocity.write);
      velocity.swap();

      // 7. Advect dye
      gl.uniform2f(advectionProg.uniforms.uTexelSize, dyeTexel, dyeTexel);
      gl.uniform1i(advectionProg.uniforms.uVelocity, 0);
      gl.uniform1i(advectionProg.uniforms.uSource, 1);
      gl.uniform1f(advectionProg.uniforms.uDissipation, SIM_SETTINGS.dyeDissipation);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, dye.read.tex);
      blit(dye.write);
      dye.swap();

      // 8. Final Composite: Classic White Base Logo + Localized Cursor Fluid Reveal of 1:1 3D Typography
      gl.useProgram(compositeProg.prog);
      gl.uniform1i(compositeProg.uniforms.uBaseTexture, 0);
      gl.uniform1i(compositeProg.uniforms.uRevealTexture, 1);
      gl.uniform1i(compositeProg.uniforms.uDye, 2);
      gl.uniform1i(compositeProg.uniforms.uVelocity, 3);
      gl.uniform2f(compositeProg.uniforms.uPointer, pointer.x, pointer.y);
      gl.uniform1f(compositeProg.uniforms.uTime, now * 0.001);
      gl.uniform1f(
        compositeProg.uniforms.uInflatePulse,
        HERO_3D_LOGOS[activeIdx]?.inflatePulse ?? 0.015
      );
      gl.uniform1f(compositeProg.uniforms.uRevealSize, SIM_SETTINGS.revealSize);
      gl.uniform1f(compositeProg.uniforms.uEdgeSoftness, SIM_SETTINGS.edgeSoftness);
      gl.uniform1f(compositeProg.uniforms.uEdgeWidth, SIM_SETTINGS.edgeWidth);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, baseTex);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(
        gl.TEXTURE_2D,
        loadedEntries[activeIdx] ? revealTextures[activeIdx] : baseTex
      );
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, dye.read.tex);
      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);

      blit(null);

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, []);

  return (
    <div className="fluid-hero-bg-layer">
      <canvas ref={canvasRef} className="fluid-hero-canvas" />
    </div>
  );
}
