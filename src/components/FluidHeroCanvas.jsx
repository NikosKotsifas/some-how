import React, { useEffect, useRef } from 'react';
import { HERO_3D_LOGOS } from '../data/studioData';
import { LETTER_DEFS } from './SomeHowWordmark';

// Exact GLSL shaders from noth.in's Navier-Stokes WebGL Fluid Reveal (cA)
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
    vec2 p = vUv - uPoint;
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
    float len = length(force) + 0.0001;
    force = force / len * uCurlStrength * C;
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity += force * uDt;
    gl_FragColor = vec4(velocity, 0.0, 1.0);
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

// Composite shader: mixes uBaseTexture (crisp vector SOME.HOW on dark architectural grid)
// with uRevealTexture (rapidly cycling 12 3D SOME.HOW illustrations in the back)
const COMPOSITE_FRAG = `
  precision highp float;
  uniform sampler2D uBaseTexture;
  uniform sampler2D uRevealTexture;
  uniform sampler2D uDye;
  uniform float uRevealSize;
  uniform float uEdgeSoftness;
  uniform float uEdgeWidth;
  varying vec2 vUv;
  void main() {
    float dye = texture2D(uDye, vUv).r;
    vec2 flippedUv = vec2(vUv.x, 1.0 - vUv.y);
    vec4 baseColor = texture2D(uBaseTexture, flippedUv);
    vec4 revealColor = texture2D(uRevealTexture, flippedUv);
    float raw = dye * uRevealSize;
    float mask = smoothstep(uEdgeSoftness, uEdgeSoftness + uEdgeWidth, raw);
    mask = clamp(mask, 0.0, 1.0);
    gl_FragColor = mix(baseColor, revealColor, mask);
  }
`;

// Exact simulation settings from noth.in's sA object
const SIM_SETTINGS = {
  simResolution: 256,
  dyeResolution: 512,
  velocityDissipation: 0.962,
  dyeDissipation: 0.986,
  pressureIterations: 20,
  curlStrength: 0.0,
  splatRadius: 0.00012,
  splatForce: 5900,
  revealSize: 3.9,
  edgeSoftness: 0.5,
  edgeWidth: 0.015,
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

    // Fullscreen quad
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

      // Fallback to UNSIGNED_BYTE if float FBO is incomplete on older GPUs
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

    // Offscreen 2D canvases for uBaseTexture (Front Vector Logo) & uRevealTexture (Back Rapid-Cycling 3D Logos)
    const baseCanvas = document.createElement('canvas');
    const baseCtx = baseCanvas.getContext('2d');
    const revealCanvas = document.createElement('canvas');
    const revealCtx = revealCanvas.getContext('2d');

    const createImageTex = () => {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return tex;
    };

    const baseTex = createImageTex();
    const revealTex = createImageTex();

    // Draw the Front Layer (dark/grey architectural grid + monumental crisp white vector SOME.HOW wordmark)
    const renderBaseLayerToCanvas = (w, h) => {
      baseCanvas.width = w;
      baseCanvas.height = h;

      // 1. Dark/charcoal Hero surface
      const grad = baseCtx.createRadialGradient(w * 0.5, h * 0.25, 10, w * 0.5, h * 0.5, Math.max(w, h) * 0.85);
      grad.addColorStop(0, '#141419');
      grad.addColorStop(1, '#09090c');
      baseCtx.fillStyle = grad;
      baseCtx.fillRect(0, 0, w, h);

      // 2. Subtle architectural grid lines baked into the hero surface
      baseCtx.strokeStyle = 'rgba(255, 255, 255, 0.055)';
      baseCtx.lineWidth = 1;
      for (let i = 1; i < 12; i++) {
        const x = Math.round((w / 12) * i) + 0.5;
        baseCtx.beginPath();
        baseCtx.moveTo(x, 0);
        baseCtx.lineTo(x, h);
        baseCtx.stroke();
      }
      for (let j = 1; j < 8; j++) {
        const y = Math.round((h / 8) * j) + 0.5;
        baseCtx.beginPath();
        baseCtx.moveTo(0, y);
        baseCtx.lineTo(w, y);
        baseCtx.stroke();
      }

      // 3. Monumental White Vector SOME.HOW Wordmark (matching .nothin-hero-svg)
      // Align with the exact position & scale of the 3D SOME.HOW illustrations in the back
      const padX = w * 0.025;
      const availW = w - padX * 2;
      const svgW = 2020;
      const svgH = 294;
      const scale = availW / svgW;
      const drawnH = svgH * scale;
      // Place in the lower-middle hero band so it aligns 1:1 with the 3D renders
      const offsetY = h * 0.61 - drawnH * 0.5;

      baseCtx.save();
      baseCtx.translate(padX, offsetY);
      baseCtx.scale(scale, scale);
      baseCtx.fillStyle = '#ffffff';
      LETTER_DEFS.forEach((l) => {
        const p = new Path2D(l.d);
        baseCtx.fill(p);
      });
      baseCtx.restore();

      gl.bindTexture(gl.TEXTURE_2D, baseTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, baseCanvas);
    };

    // Draw the Back Layer (current frame of the 12 rapidly cycling 3D SOME.HOW renders)
    const renderRevealLayerToCanvas = (w, h, img) => {
      if (!img || !img.complete || !img.naturalWidth) return;
      if (revealCanvas.width !== w || revealCanvas.height !== h) {
        revealCanvas.width = w;
        revealCanvas.height = h;
      }
      revealCtx.fillStyle = '#000000';
      revealCtx.fillRect(0, 0, w, h);

      const imgAspect = img.naturalWidth / img.naturalHeight;
      const drawW = w * 1.01;
      const drawH = drawW / imgAspect;
      const drawX = (w - drawW) * 0.5;
      const drawY = h * 0.61 - drawH * 0.5;
      revealCtx.drawImage(img, drawX, drawY, drawW, drawH);

      gl.bindTexture(gl.TEXTURE_2D, revealTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, revealCanvas);
    };

    // Preload all 12 photorealistic 3D SOME.HOW illustrations
    const loadedImgs = [];
    HERO_3D_LOGOS.forEach((item, idx) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        loadedImgs[idx] = img;
        if (idx === 0) {
          renderRevealLayerToCanvas(canvas.width, canvas.height, img);
        }
      };
      img.src = item.src;
    });

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(window.innerWidth * dpr));
      const h = Math.max(1, Math.round(window.innerHeight * dpr));
      canvas.width = w;
      canvas.height = h;
      renderBaseLayerToCanvas(w, h);
      const firstImg = loadedImgs.find(Boolean);
      if (firstImg) renderRevealLayerToCanvas(w, h, firstImg);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Mouse / Touch fluid splat state
    const mouse = { x: 0.5, y: 0.4, prevX: 0.5, prevY: 0.4, moved: false, lastUserMoveTime: 0 };

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left) / rect.width;
      mouse.y = 1.0 - (e.clientY - rect.top) / rect.height;
      mouse.moved = true;
      mouse.lastUserMoveTime = performance.now();
    };

    const onTouchMove = (e) => {
      if (!e.touches.length) return;
      const t = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      mouse.x = (t.clientX - rect.left) / rect.width;
      mouse.y = 1.0 - (t.clientY - rect.top) / rect.height;
      mouse.moved = true;
      mouse.lastUserMoveTime = performance.now();
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    const splat = (x, y, dx, dy, radius = SIM_SETTINGS.splatRadius) => {
      const aspect = canvas.width / Math.max(1, canvas.height);
      gl.useProgram(splatProg.prog);
      gl.uniform1f(splatProg.uniforms.uAspectRatio, aspect);
      gl.uniform2f(splatProg.uniforms.uPoint, x, y);
      gl.uniform1f(splatProg.uniforms.uRadius, radius);

      // 1. Splat velocity
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
      gl.uniform1i(splatProg.uniforms.uTarget, 0);
      gl.uniform3f(
        splatProg.uniforms.uColor,
        dx * SIM_SETTINGS.splatForce,
        dy * SIM_SETTINGS.splatForce,
        0.0
      );
      blit(velocity.write);
      velocity.swap();

      // 2. Splat dye
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, dye.read.tex);
      gl.uniform1i(splatProg.uniforms.uTarget, 0);
      gl.uniform3f(splatProg.uniforms.uColor, 1.0, 1.0, 1.0);
      blit(dye.write);
      dye.swap();
    };

    // Rapid-fire background 3D logo loop (cycles through all 12 3D SOME.HOW illustrations at ~7fps, matching nothin-sharp-high.mp4)
    let currentLogoFrame = 0;
    let lastFrameSwitch = performance.now();
    const FRAME_INTERVAL_MS = 145;

    // Autonomous fluid wave when cursor is idle so the 3D design changes are always visible on the logo
    let autoAngle = 0;

    let rafId;
    const animate = (now) => {
      rafId = requestAnimationFrame(animate);

      // 1. Advance the 3D SOME.HOW illustration in the back every 145ms
      if (now - lastFrameSwitch >= FRAME_INTERVAL_MS) {
        const validImgs = loadedImgs.filter(Boolean);
        if (validImgs.length > 0) {
          currentLogoFrame = (currentLogoFrame + 1) % validImgs.length;
          renderRevealLayerToCanvas(canvas.width, canvas.height, validImgs[currentLogoFrame]);
        }
        lastFrameSwitch = now;
      }

      // 2. Apply user cursor splat
      if (mouse.moved) {
        const dx = mouse.x - mouse.prevX;
        const dy = mouse.y - mouse.prevY;
        if (Math.hypot(dx, dy) > 0.0001) {
          splat(mouse.x, mouse.y, dx, dy, SIM_SETTINGS.splatRadius);
        }
        mouse.prevX = mouse.x;
        mouse.prevY = mouse.y;
        mouse.moved = false;
      } else if (now - mouse.lastUserMoveTime > 1200) {
        // Gentle autonomous fluid stream across the SOME.HOW wordmark when mouse is idle
        autoAngle += 0.038;
        const ax = 0.5 + Math.sin(autoAngle) * 0.36;
        const ay = 0.39 + Math.cos(autoAngle * 2.1) * 0.08;
        const adx = Math.cos(autoAngle) * 0.012;
        const ady = -Math.sin(autoAngle * 2.1) * 0.006;
        splat(ax, ay, adx, ady, SIM_SETTINGS.splatRadius * 1.45);
      }

      // 3. Curl pass
      gl.useProgram(curlProg.prog);
      gl.uniform2f(curlProg.uniforms.uTexelSize, 1.0 / simRes, 1.0 / simRes);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
      gl.uniform1i(curlProg.uniforms.uVelocity, 0);
      blit(curlFBO);

      // 4. Vorticity pass
      gl.useProgram(vorticityProg.prog);
      gl.uniform2f(vorticityProg.uniforms.uTexelSize, 1.0 / simRes, 1.0 / simRes);
      gl.uniform1f(vorticityProg.uniforms.uCurlStrength, SIM_SETTINGS.curlStrength);
      gl.uniform1f(vorticityProg.uniforms.uDt, 0.016);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
      gl.uniform1i(vorticityProg.uniforms.uVelocity, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, curlFBO.tex);
      gl.uniform1i(vorticityProg.uniforms.uCurl, 1);
      blit(velocity.write);
      velocity.swap();

      // 5. Advect velocity
      gl.useProgram(advectionProg.prog);
      gl.uniform2f(advectionProg.uniforms.uTexelSize, 1.0 / simRes, 1.0 / simRes);
      gl.uniform1f(advectionProg.uniforms.uDt, 1.0);
      gl.uniform1f(advectionProg.uniforms.uDissipation, SIM_SETTINGS.velocityDissipation);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
      gl.uniform1i(advectionProg.uniforms.uVelocity, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
      gl.uniform1i(advectionProg.uniforms.uSource, 1);
      blit(velocity.write);
      velocity.swap();

      // 6. Advect dye
      gl.uniform2f(advectionProg.uniforms.uTexelSize, 1.0 / dyeRes, 1.0 / dyeRes);
      gl.uniform1f(advectionProg.uniforms.uDissipation, SIM_SETTINGS.dyeDissipation);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
      gl.uniform1i(advectionProg.uniforms.uVelocity, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, dye.read.tex);
      gl.uniform1i(advectionProg.uniforms.uSource, 1);
      blit(dye.write);
      dye.swap();

      // 7. Divergence pass
      gl.useProgram(divergenceProg.prog);
      gl.uniform2f(divergenceProg.uniforms.uTexelSize, 1.0 / simRes, 1.0 / simRes);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
      gl.uniform1i(divergenceProg.uniforms.uVelocity, 0);
      blit(divergenceFBO);

      // 8. Clear pressure & run 20 Jacobi iterations
      gl.bindFramebuffer(gl.FRAMEBUFFER, pressure.read.fbo);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(pressureProg.prog);
      gl.uniform2f(pressureProg.uniforms.uTexelSize, 1.0 / simRes, 1.0 / simRes);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, divergenceFBO.tex);
      gl.uniform1i(pressureProg.uniforms.uDivergence, 1);

      for (let i = 0; i < SIM_SETTINGS.pressureIterations; i++) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, pressure.read.tex);
        gl.uniform1i(pressureProg.uniforms.uPressure, 0);
        blit(pressure.write);
        pressure.swap();
      }

      // 9. Subtract pressure gradient from velocity
      gl.useProgram(gradSubProg.prog);
      gl.uniform2f(gradSubProg.uniforms.uTexelSize, 1.0 / simRes, 1.0 / simRes);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, pressure.read.tex);
      gl.uniform1i(gradSubProg.uniforms.uPressure, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
      gl.uniform1i(gradSubProg.uniforms.uVelocity, 1);
      blit(velocity.write);
      velocity.swap();

      // 10. Final Composite: Front Vector SOME.HOW mixed with Back Rapid-Cycling 3D SOME.HOW via Fluid Dye Mask
      gl.useProgram(compositeProg.prog);
      gl.uniform1f(compositeProg.uniforms.uRevealSize, SIM_SETTINGS.revealSize);
      gl.uniform1f(compositeProg.uniforms.uEdgeSoftness, SIM_SETTINGS.edgeSoftness);
      gl.uniform1f(compositeProg.uniforms.uEdgeWidth, SIM_SETTINGS.edgeWidth);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, baseTex);
      gl.uniform1i(compositeProg.uniforms.uBaseTexture, 0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, revealTex);
      gl.uniform1i(compositeProg.uniforms.uRevealTexture, 1);

      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, dye.read.tex);
      gl.uniform1i(compositeProg.uniforms.uDye, 2);

      blit(null);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  return (
    <div className="fluid-hero-bg-layer">
      <canvas ref={canvasRef} className="mask-reveal-canvas fluid-hero-canvas" />
    </div>
  );
}
