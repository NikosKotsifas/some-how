import React, { useEffect, useRef, useState } from 'react';
import { LETTER_DEFS } from './SomeHowWordmark';

export const LUXURY_HERO_EDITIONS = [
  {
    id: 'liquid-mercury',
    index: 0,
    code: '01',
    label: 'Liquid Mercury Platinum',
    shortLabel: '01 // Liquid Mercury',
  },
  {
    id: 'titanium-gold',
    index: 1,
    code: '02',
    label: '24K Champagne Gold & Titanium',
    shortLabel: '02 // 24K Gold & Titanium',
  },
  {
    id: 'obsidian-mylar',
    index: 2,
    code: '03',
    label: 'Obsidian Mylar Sculpture',
    shortLabel: '03 // Obsidian Mylar',
  },
  {
    id: 'smoked-crystal',
    index: 3,
    code: '04',
    label: 'Smoked Crystal & Dichroic Prism',
    shortLabel: '04 // Smoked Crystal',
  },
  {
    id: 'anodized-cobalt',
    index: 4,
    code: '05',
    label: 'Anodized Cobalt & CNC Platinum',
    shortLabel: '05 // Anodized Cobalt',
  },
  {
    id: 'basalt-ember',
    index: 5,
    code: '06',
    label: 'Volcanic Basalt & Molten Amber',
    shortLabel: '06 // Basalt & Amber',
  },
  {
    id: 'nero-marble',
    index: 6,
    code: '07',
    label: 'Nero Marquina & Rose Bronze',
    shortLabel: '07 // Marble & Bronze',
  },
  {
    id: 'forged-carbon',
    index: 7,
    code: '08',
    label: 'Forged Carbon & Laser Chrono',
    shortLabel: '08 // Forged Carbon',
  },
];

// Single source of truth for the SOME.HOW Hero Logo bounding box & scale.
// Both the Base White Logo (uBaseTexture) and the 3D Animated Reveal Logo (uLogoDataTex)
// use this exact transform and LETTER_DEFS so they are 100.00% identical in size and position.
function computeHeroLogoTransform(w, h) {
  const padX = w * 0.025;
  const availW = w - padX * 2;
  const svgW = 2020;
  const svgH = 294;
  const scale = availW / svgW;
  const drawnH = svgH * scale;
  const offsetY = h * 0.61 - drawnH * 0.5;
  return { padX, availW, svgW, svgH, scale, drawnH, offsetY };
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

// Real-Time 60fps Ray-Traced Studio Softbox & Luxury Architectural Material Shader.
// Guaranteed 1:1 identical size with the base SOME.HOW logo because every material is rendered
// strictly inside uLogoDataTex.r (generated from LETTER_DEFS with the exact same transform).
const COMPOSITE_FRAG = `
  precision highp float;
  uniform sampler2D uBaseTexture;
  uniform sampler2D uLogoDataTex;
  uniform sampler2D uEnvTexture;
  uniform sampler2D uDye;
  uniform sampler2D uVelocity;
  uniform vec2 uLogoTexel;
  uniform float uTime;
  uniform float uRevealSize;
  uniform float uEdgeSoftness;
  uniform float uEdgeWidth;
  uniform float uMatIndexA;
  uniform float uMatIndexB;
  uniform float uMatMix;
  varying vec2 vUv;

  // High-contrast architectural studio softbox horizon reflection (gives unmistakable 3D chrome/metal depth)
  float studioSoftboxEnv(vec3 N, vec2 uv, float t, float wordProgress) {
    vec3 V = vec3(0.0, 0.0, 1.0);
    vec3 R = reflect(-V, N);
    float phase = wordProgress * 3.14159 - t * 1.35;
    // Primary overhead studio softbox bar
    float horizon = R.y * 2.4 + R.x * 0.85 + sin(phase + R.x * 3.0) * 0.28;
    float box1 = smoothstep(0.04, 0.24, horizon) * (1.0 - smoothstep(0.52, 0.78, horizon));
    // Secondary crisp rim softbox
    float box2 = smoothstep(-0.68, -0.52, horizon) * (1.0 - smoothstep(-0.32, -0.15, horizon));
    // Flowing liquid caustic wave
    float caustic = pow(0.5 + 0.5 * sin(uv.x * 24.0 + N.x * 7.5 - t * 2.2 + N.y * 5.5), 3.0);
    return clamp(box1 * 0.95 + box2 * 0.65 + caustic * 0.38, 0.0, 1.0);
  }

  vec3 evaluateLuxuryMaterial(
    int mode,
    vec2 uv,
    vec3 N,
    float hCenter,
    float chamfer,
    float wordProgress,
    vec2 fluidVel,
    vec3 envSample,
    float t
  ) {
    vec3 V = vec3(0.0, 0.0, 1.0);
    vec3 L1 = normalize(vec3(sin(t * 1.1 + wordProgress * 2.0) * 0.7, 0.62, 0.78));
    vec3 L2 = normalize(vec3(-0.65, -0.48 + cos(t * 0.85) * 0.3, 0.72));

    float diff1 = max(dot(N, L1), 0.0);
    float diff2 = max(dot(N, L2), 0.0);
    float specSharp = pow(max(dot(reflect(-L1, N), V), 0.0), 64.0);
    float specBroad = pow(max(dot(reflect(-L2, N), V), 0.0), 14.0);
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.3);

    float softbox = studioSoftboxEnv(N, uv, t, wordProgress);
    float envLum = dot(envSample, vec3(0.299, 0.587, 0.114));
    float mirrorReflect = clamp(mix(softbox, envLum, 0.32), 0.0, 1.0);

    // 01: LIQUID MERCURY PLATINUM (High-contrast mirror chrome & molten silver)
    if (mode == 0) {
      vec3 obsidianShadow = vec3(0.04, 0.045, 0.06);
      vec3 gunmetalMid = vec3(0.38, 0.42, 0.48);
      vec3 purePlatinum = vec3(0.98, 0.99, 1.0);
      float mercuryRipple = 0.5 + 0.5 * sin(uv.x * 34.0 + N.x * 9.0 - t * 2.6 + N.y * 7.0);
      float mVal = clamp(mirrorReflect * 0.72 + mercuryRipple * 0.28, 0.0, 1.0);
      vec3 col = mix(obsidianShadow, gunmetalMid, smoothstep(0.08, 0.48, mVal));
      col = mix(col, purePlatinum, smoothstep(0.46, 0.82, mVal));
      col += purePlatinum * (specSharp * 1.35 + chamfer * 0.55);
      col += vec3(0.84, 0.90, 1.0) * fresnel * 0.7;
      return col;
    }

    // 02: 24K CHAMPAGNE GOLD & BRUSHED TITANIUM (Warm luxury gold bevels + brushed dark titanium)
    if (mode == 1) {
      float brush = 0.5 + 0.5 * sin(uv.y * 860.0 + N.x * 10.0);
      vec3 darkTitanium = vec3(0.09, 0.095, 0.11) + brush * 0.04;
      vec3 warmBronze = vec3(0.52, 0.35, 0.14);
      vec3 champagneGold = vec3(0.98, 0.82, 0.52);
      vec3 brightGoldSpec = vec3(1.0, 0.95, 0.78);

      float goldBevel = clamp(chamfer * 0.9 + fresnel * 0.8 + mirrorReflect * 0.65, 0.0, 1.0);
      vec3 goldShade = mix(warmBronze, champagneGold, smoothstep(0.2, 0.78, mirrorReflect + diff1 * 0.4));
      vec3 col = mix(darkTitanium, goldShade, goldBevel * 0.92);
      col += brightGoldSpec * (specSharp * 1.3 + chamfer * 0.45);
      return col;
    }

    // 03: OBSIDIAN MYLAR SCULPTURE (Inflated high-gloss black mylar pillow with radial tension creases)
    if (mode == 2) {
      // Radial mylar balloon seam creases along the 3D bevel
      float creaseAngle = atan(N.y, N.x);
      float mylarCreases = pow(0.5 + 0.5 * sin(creaseAngle * 14.0 + hCenter * 12.0 - t * 1.2), 4.0);
      vec3 deepObsidian = vec3(0.025, 0.025, 0.035);
      vec3 slateSheen = vec3(0.22, 0.24, 0.29);
      vec3 studioWhite = vec3(0.98, 0.99, 1.0);

      float pillowLight = clamp(softbox * 0.75 + mylarCreases * (1.0 - hCenter) * 0.55, 0.0, 1.0);
      vec3 col = mix(deepObsidian, slateSheen, smoothstep(0.15, 0.55, pillowLight + diff1 * 0.3));
      col = mix(col, studioWhite, smoothstep(0.66, 0.92, pillowLight));
      col += studioWhite * (specSharp * 1.45 + chamfer * 0.35);
      return col;
    }

    // 04: SMOKED CRYSTAL & DICHROIC PRISM (Architectural smoked glass + optical dispersion)
    if (mode == 3) {
      vec3 crystalBase = vec3(0.06, 0.07, 0.10);
      float dispR = studioSoftboxEnv(normalize(N + vec3(0.14, 0.04, 0.0)), uv, t, wordProgress);
      float dispG = softbox;
      float dispB = studioSoftboxEnv(normalize(N - vec3(0.14, 0.04, 0.0)), uv, t, wordProgress);
      vec3 prism = vec3(dispR * 1.05, dispG * 0.92, dispB * 1.15);

      vec3 col = mix(crystalBase, prism * vec3(0.92, 0.88, 1.0), 0.72 * fresnel + 0.42 * diff1);
      col += vec3(0.78, 0.88, 1.0) * smoothstep(0.5, 0.95, hCenter) * 0.32;
      col += vec3(1.0, 0.94, 1.0) * (specSharp * 1.35 + chamfer * 0.6);
      return col;
    }

    // 05: ANODIZED COBALT & CNC PLATINUM (PVD royal cobalt aluminum + glowing platinum contour rings)
    if (mode == 4) {
      vec3 midnightCobalt = vec3(0.03, 0.09, 0.28);
      vec3 electricCobalt = vec3(0.14, 0.42, 0.96);
      vec3 platinum = vec3(0.92, 0.96, 1.0);
      float cncRings = smoothstep(0.76, 0.96, sin(hCenter * 28.0 - t * 2.8));

      vec3 col = mix(midnightCobalt, electricCobalt, smoothstep(0.1, 0.75, mirrorReflect * 0.65 + diff1 * 0.5));
      col = mix(col, platinum, cncRings * 0.48 + chamfer * 0.6);
      col += platinum * (specSharp * 1.25 + fresnel * 0.6);
      return col;
    }

    // 06: VOLCANIC BASALT & MOLTEN AMBER (Architectural dark basalt + glowing fireplace-ember veins)
    if (mode == 5) {
      float basaltGrain = 0.5 + 0.5 * sin(uv.x * 380.0) * cos(uv.y * 380.0);
      vec3 basalt = vec3(0.07, 0.065, 0.065) + basaltGrain * 0.035;
      vec3 copperBronze = vec3(0.82, 0.42, 0.16);
      vec3 moltenEmber = vec3(1.0, 0.68, 0.28);

      float veinWave = pow(0.5 + 0.5 * sin(wordProgress * 14.0 - t * 2.2 + N.x * 5.0 - N.y * 4.0), 2.5);
      vec3 col = mix(basalt, copperBronze, diff1 * 0.55 + fresnel * 0.7 + mirrorReflect * 0.35);
      col += moltenEmber * (chamfer * 0.8 + veinWave * (1.0 - hCenter * 0.5) * 0.65 + specBroad * 0.45);
      col += vec3(1.0, 0.90, 0.72) * specSharp * 1.1;
      return col;
    }

    // 07: NERO MARQUINA MARBLE & ROSE BRONZE (Italian architectural black marble + warm rose-gold veins)
    if (mode == 6) {
      float veinCoord = uv.x * 18.0 + uv.y * 11.0 + sin(uv.x * 26.0 - uv.y * 19.0 + t * 0.4) * 1.6;
      float marbleVein = pow(smoothstep(0.82, 0.99, abs(sin(veinCoord))), 2.0);
      vec3 neroMarble = vec3(0.055, 0.055, 0.065);
      vec3 roseBronze = vec3(0.88, 0.64, 0.52);
      vec3 warmAlabaster = vec3(0.98, 0.92, 0.86);

      vec3 col = mix(neroMarble, warmAlabaster, marbleVein * 0.75);
      col = mix(col, roseBronze, chamfer * 0.78 + fresnel * 0.62 + mirrorReflect * 0.38);
      col += warmAlabaster * (specSharp * 1.25 + specBroad * 0.35);
      return col;
    }

    // 08: FORGED CARBON & LASER CHRONO (Diagonal carbon weave + scanning white optical telemetry beam)
    float weave = step(0.0, sin((uv.x * 460.0 + uv.y * 460.0)) * sin((uv.x * 460.0 - uv.y * 460.0)));
    vec3 carbonDark = vec3(0.05, 0.055, 0.065);
    vec3 carbonLight = vec3(0.20, 0.22, 0.25);
    vec3 carbonCol = mix(carbonDark, carbonLight, weave * (0.4 + diff1 * 0.6));
    float scanPos = fract(t * 0.36);
    float scanBeam = exp(-pow((wordProgress - scanPos) * 8.5, 2.0));
    vec3 col = carbonCol + vec3(0.80, 0.85, 0.92) * (mirrorReflect * 0.45 + chamfer * 0.55 + fresnel * 0.55);
    col += vec3(0.98, 0.99, 1.0) * (specSharp * 1.2 + scanBeam * 0.85);
    return col;
  }

  void main() {
    vec2 flippedUv = vec2(vUv.x, 1.0 - vUv.y);
    vec4 baseColor = texture2D(uBaseTexture, flippedUv);
    vec4 logoData = texture2D(uLogoDataTex, flippedUv);

    float logoMask = logoData.r;
    float hCenter = logoData.g;
    float chamfer = logoData.b;
    float wordProgress = logoData.a;

    // Fluid mask calculation
    float dye = texture2D(uDye, vUv).r;
    float raw = dye * uRevealSize;
    float fluidMask = clamp(smoothstep(uEdgeSoftness, uEdgeSoftness + uEdgeWidth, raw), 0.0, 1.0);
    float fluidHalo = clamp(smoothstep(0.04, uEdgeSoftness + 0.22, raw), 0.0, 1.0);
    float edgeRim = fluidMask * (1.0 - fluidMask) * 4.0;

    // Compute silky-smooth multi-scale 3D surface normal from the Gaussian-blurred LETTER_DEFS pillow heightfield
    vec2 s1 = uLogoTexel * 3.5;
    vec2 s2 = uLogoTexel * 8.0;
    float hL1 = texture2D(uLogoDataTex, flippedUv - vec2(s1.x, 0.0)).g;
    float hR1 = texture2D(uLogoDataTex, flippedUv + vec2(s1.x, 0.0)).g;
    float hD1 = texture2D(uLogoDataTex, flippedUv - vec2(0.0, s1.y)).g;
    float hU1 = texture2D(uLogoDataTex, flippedUv + vec2(0.0, s1.y)).g;

    float hL2 = texture2D(uLogoDataTex, flippedUv - vec2(s2.x, 0.0)).g;
    float hR2 = texture2D(uLogoDataTex, flippedUv + vec2(s2.x, 0.0)).g;
    float hD2 = texture2D(uLogoDataTex, flippedUv - vec2(0.0, s2.y)).g;
    float hU2 = texture2D(uLogoDataTex, flippedUv + vec2(0.0, s2.y)).g;

    vec2 gradSmooth = vec2((hR1 - hL1) * 0.45 + (hR2 - hL2) * 0.55, (hU1 - hD1) * 0.45 + (hU2 - hD2) * 0.55);
    vec2 fluidVel = texture2D(uVelocity, vUv).xy;
    float liquidWave = sin(flippedUv.x * 18.0 - uTime * 1.8 + flippedUv.y * 9.0) * 0.04;
    vec2 dH = gradSmooth * 5.2 + fluidVel * 0.28 + vec2(liquidWave, -liquidWave * 0.7);
    vec3 N = normalize(vec3(-dH.x, -dH.y, 1.0));

    vec2 envUv = clamp(flippedUv * 0.7 + 0.15 + N.xy * 0.2 + fluidVel * 0.04, 0.02, 0.98);
    vec3 envSample = texture2D(uEnvTexture, envUv).rgb;

    int modeA = int(floor(uMatIndexA + 0.5));
    int modeB = int(floor(uMatIndexB + 0.5));
    vec3 matA = evaluateLuxuryMaterial(modeA, flippedUv, N, hCenter, chamfer, wordProgress, fluidVel, envSample, uTime);
    vec3 matB = evaluateLuxuryMaterial(modeB, flippedUv, N, hCenter, chamfer, wordProgress, fluidVel, envSample, uTime);
    vec3 luxuryLetterCol = mix(matA, matB, smoothstep(0.0, 1.0, uMatMix));

    // Specular diamond refraction glint along the fluid boundary inside the letters
    luxuryLetterCol += vec3(0.96, 0.98, 1.0) * edgeRim * 0.48;

    // Subtle architectural studio sheen on the base white logo underneath
    float baseSheen = exp(-pow((wordProgress - fract(uTime * 0.15)) * 4.2, 2.0));
    vec3 elevatedBaseLetter = mix(
      baseColor.rgb,
      vec3(0.94, 0.95, 0.99) + vec3(0.06) * baseSheen - vec3(0.06) * (1.0 - hCenter),
      logoMask * 0.35
    );

    // 100% 1:1 Size & Silhouette Lock:
    // The animated 3D luxury materials appear strictly inside logoMask (exact LETTER_DEFS geometry),
    // so the animated logo and the base white logo underneath have the exact same size!
    float activeLetterReveal = clamp(fluidMask + fluidHalo * 0.36, 0.0, 1.0);
    vec3 finalLetterCol = mix(elevatedBaseLetter, luxuryLetterCol, activeLetterReveal);

    // Subtle ambient studio reflection on the dark architectural grid behind the letters
    vec3 bgAccent = mix(baseColor.rgb, baseColor.rgb + luxuryLetterCol * 0.05, fluidHalo * 0.45);

    vec3 finalCol = mix(bgAccent, finalLetterCol, logoMask);
    gl_FragColor = vec4(finalCol, 1.0);
  }
`;

const SIM_SETTINGS = {
  simResolution: 256,
  dyeResolution: 512,
  velocityDissipation: 0.972,
  dyeDissipation: 0.991,
  pressureIterations: 20,
  curlStrength: 18.0,
  splatRadius: 0.00028,
  splatForce: 5800,
  revealSize: 4.5,
  edgeSoftness: 0.32,
  edgeWidth: 0.16,
};

export default function FluidHeroCanvas() {
  const canvasRef = useRef(null);
  const [activeEdition, setActiveEdition] = useState(0);
  const [autoCycle, setAutoCycle] = useState(true);
  const stateRef = useRef({
    activeEdition: 0,
    prevEdition: 0,
    transitionStart: 0,
    autoCycle: true,
  });

  const handleSelectEdition = (idx) => {
    const st = stateRef.current;
    st.prevEdition = st.activeEdition;
    st.activeEdition = idx;
    st.transitionStart = performance.now();
    st.autoCycle = false;
    setActiveEdition(idx);
    setAutoCycle(false);
  };

  const handleToggleAuto = () => {
    const next = !stateRef.current.autoCycle;
    stateRef.current.autoCycle = next;
    setAutoCycle(next);
  };

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
    const logoDataCanvas = document.createElement('canvas');
    const logoDataCtx = logoDataCanvas.getContext('2d', { willReadFrequently: true });

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
    const logoDataTex = createImageTex();
    const envTex = createImageTex();

    const envImg = new Image();
    envImg.decoding = 'async';
    envImg.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, envTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, envImg);
    };
    envImg.src = 'somehow-assets/hero-09.jpg';

    // 1. Render Base Layer (dark architectural grid + monumental crisp white vector SOME.HOW wordmark)
    const renderBaseLayerToCanvas = (w, h) => {
      baseCanvas.width = w;
      baseCanvas.height = h;

      const grad = baseCtx.createRadialGradient(w * 0.5, h * 0.25, 10, w * 0.5, h * 0.5, Math.max(w, h) * 0.85);
      grad.addColorStop(0, '#141419');
      grad.addColorStop(1, '#09090c');
      baseCtx.fillStyle = grad;
      baseCtx.fillRect(0, 0, w, h);

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

      gl.bindTexture(gl.TEXTURE_2D, baseTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, baseCanvas);
    };

    // 2. Render Exact 1:1 3D Sculptural Geometry & Bevel Map (uLogoDataTex)
    // Uses the EXACT same computeHeroLogoTransform(w, h) and LETTER_DEFS paths as renderBaseLayerToCanvas
    const renderLogoDataToCanvas = (w, h) => {
      logoDataCanvas.width = w;
      logoDataCanvas.height = h;
      const { padX, availW, scale, offsetY } = computeHeroLogoTransform(w, h);

      const combinedPath = new Path2D();
      LETTER_DEFS.forEach((l) => {
        combinedPath.addPath(new Path2D(l.d));
      });

      // Offscreen pass A: Exact 1:1 crisp silhouette (Red channel)
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = w;
      maskCanvas.height = h;
      const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
      maskCtx.save();
      maskCtx.translate(padX, offsetY);
      maskCtx.scale(scale, scale);
      maskCtx.fillStyle = '#ffffff';
      maskCtx.fill(combinedPath);
      maskCtx.restore();

      // Offscreen pass B: Silky-Smooth Gaussian-Filtered 3D Sculptural Pillow Heightfield (Green channel)
      const rawHeightCanvas = document.createElement('canvas');
      rawHeightCanvas.width = w;
      rawHeightCanvas.height = h;
      const rawHeightCtx = rawHeightCanvas.getContext('2d');
      rawHeightCtx.fillStyle = '#000000';
      rawHeightCtx.fillRect(0, 0, w, h);
      rawHeightCtx.save();
      rawHeightCtx.translate(padX, offsetY);
      rawHeightCtx.scale(scale, scale);
      rawHeightCtx.clip(combinedPath);
      rawHeightCtx.fillStyle = '#ffffff';
      rawHeightCtx.fill(combinedPath);
      rawHeightCtx.lineJoin = 'round';
      rawHeightCtx.lineCap = 'round';
      const steps = 28;
      for (let s = steps; s >= 1; s--) {
        const lw = (s / steps) * 76;
        rawHeightCtx.strokeStyle = 'rgba(0, 0, 0, 0.085)';
        rawHeightCtx.lineWidth = lw;
        rawHeightCtx.stroke(combinedPath);
      }
      rawHeightCtx.restore();

      const heightCanvas = document.createElement('canvas');
      heightCanvas.width = w;
      heightCanvas.height = h;
      const heightCtx = heightCanvas.getContext('2d', { willReadFrequently: true });
      const blurPx = Math.max(6, Math.round(16 * scale));
      heightCtx.filter = `blur(${blurPx}px)`;
      heightCtx.drawImage(rawHeightCanvas, 0, 0);
      heightCtx.filter = 'none';

      // Offscreen pass C: Smooth Optical Rim Specular Ring (Blue channel)
      const rawChamferCanvas = document.createElement('canvas');
      rawChamferCanvas.width = w;
      rawChamferCanvas.height = h;
      const rawChamferCtx = rawChamferCanvas.getContext('2d');
      rawChamferCtx.save();
      rawChamferCtx.translate(padX, offsetY);
      rawChamferCtx.scale(scale, scale);
      rawChamferCtx.clip(combinedPath);
      rawChamferCtx.lineJoin = 'round';
      rawChamferCtx.lineCap = 'round';
      rawChamferCtx.strokeStyle = '#ffffff';
      rawChamferCtx.lineWidth = 22;
      rawChamferCtx.stroke(combinedPath);
      rawChamferCtx.strokeStyle = '#000000';
      rawChamferCtx.lineWidth = 12;
      rawChamferCtx.stroke(combinedPath);
      rawChamferCtx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      rawChamferCtx.lineWidth = 4;
      rawChamferCtx.stroke(combinedPath);
      rawChamferCtx.restore();

      const chamferCanvas = document.createElement('canvas');
      chamferCanvas.width = w;
      chamferCanvas.height = h;
      const chamferCtx = chamferCanvas.getContext('2d', { willReadFrequently: true });
      const chamferBlurPx = Math.max(2, Math.round(4.5 * scale));
      chamferCtx.filter = `blur(${chamferBlurPx}px)`;
      chamferCtx.drawImage(rawChamferCanvas, 0, 0);
      chamferCtx.filter = 'none';

      const maskData = maskCtx.getImageData(0, 0, w, h).data;
      const heightData = heightCtx.getImageData(0, 0, w, h).data;
      const chamferData = chamferCtx.getImageData(0, 0, w, h).data;
      const outImg = logoDataCtx.createImageData(w, h);
      const out = outImg.data;

      const totalPixels = w * h;
      for (let i = 0; i < totalPixels; i++) {
        const idx4 = i * 4;
        const x = i % w;
        const wordProg = Math.max(0, Math.min(255, Math.round(((x - padX) / Math.max(1, availW)) * 255)));
        out[idx4] = maskData[idx4]; // R: Exact 1:1 silhouette mask
        out[idx4 + 1] = heightData[idx4]; // G: Smooth 3D bevel heightfield
        out[idx4 + 2] = chamferData[idx4]; // B: Machined inner chamfer ring
        out[idx4 + 3] = wordProg; // A: Horizontal wordmark progress (0..255)
      }

      logoDataCtx.putImageData(outImg, 0, 0);
      gl.bindTexture(gl.TEXTURE_2D, logoDataTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, logoDataCanvas);
    };

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(window.innerWidth * dpr));
      const h = Math.max(1, Math.round(window.innerHeight * dpr));
      canvas.width = w;
      canvas.height = h;
      renderBaseLayerToCanvas(w, h);
      renderLogoDataToCanvas(w, h);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const mouse = { x: 0.5, y: 0.39, prevX: 0.5, prevY: 0.39, moved: false, lastUserMoveTime: 0 };

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

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, dye.read.tex);
      gl.uniform1i(splatProg.uniforms.uTarget, 0);
      gl.uniform3f(splatProg.uniforms.uColor, 1.0, 1.0, 1.0);
      blit(dye.write);
      dye.swap();
    };

    // Seed initial choreographed fluid sweeps across the exact SOME.HOW band (y = 0.39)
    for (let i = 0; i < 8; i++) {
      const sx = 0.08 + (i / 7) * 0.84;
      const sy = 0.39 + (i % 2 === 0 ? 0.02 : -0.02);
      splat(sx, sy, 0.022 * (i % 2 === 0 ? 1 : -1), 0.006, SIM_SETTINGS.splatRadius * 3.4);
    }

    // Kinetic studio cadence: cycles through all 8 luxury 3D editions every 560ms with a smooth 180ms morph
    const EDITION_CYCLE_MS = 560;
    const TRANSITION_DURATION_MS = 180;
    let lastCycleSwitch = performance.now();
    let autoPhase = 0;
    const startTime = performance.now();

    let rafId;
    const animate = (now) => {
      rafId = requestAnimationFrame(animate);
      const elapsedSec = (now - startTime) * 0.001;
      const st = stateRef.current;

      // Kinetic luxury material edition cycling
      if (st.autoCycle && now - lastCycleSwitch >= EDITION_CYCLE_MS) {
        st.prevEdition = st.activeEdition;
        st.activeEdition = (st.activeEdition + 1) % LUXURY_HERO_EDITIONS.length;
        st.transitionStart = now;
        lastCycleSwitch = now;
        setActiveEdition(st.activeEdition);
      }

      const mixProgress = Math.min(1.0, Math.max(0.0, (now - st.transitionStart) / TRANSITION_DURATION_MS));

      // Apply user cursor splat or 3-stream autonomous choreography across SOME.HOW
      if (mouse.moved) {
        const dx = mouse.x - mouse.prevX;
        const dy = mouse.y - mouse.prevY;
        if (Math.hypot(dx, dy) > 0.0001) {
          splat(mouse.x, mouse.y, dx, dy, SIM_SETTINGS.splatRadius * 1.35);
        }
        mouse.prevX = mouse.x;
        mouse.prevY = mouse.y;
        mouse.moved = false;
      } else if (now - mouse.lastUserMoveTime > 650) {
        autoPhase += 0.032;
        // Stream 1: Wide primary sweep across SOME.HOW
        const ax1 = 0.5 + Math.sin(autoPhase) * 0.44;
        const ay1 = 0.39 + Math.cos(autoPhase * 2.1) * 0.068;
        const adx1 = Math.cos(autoPhase) * 0.012;
        const ady1 = -Math.sin(autoPhase * 2.1) * 0.005;
        splat(ax1, ay1, adx1, ady1, SIM_SETTINGS.splatRadius * 2.6);

        // Stream 2: Counter-harmonic ribbon
        const ax2 = 0.5 - Math.sin(autoPhase * 0.82 + 1.5) * 0.43;
        const ay2 = 0.39 - Math.sin(autoPhase * 1.7) * 0.062;
        const adx2 = -Math.cos(autoPhase * 0.82 + 1.5) * 0.01;
        const ady2 = -Math.cos(autoPhase * 1.7) * 0.004;
        splat(ax2, ay2, adx2, ady2, SIM_SETTINGS.splatRadius * 2.3);
      }

      // Curl pass
      gl.useProgram(curlProg.prog);
      gl.uniform2f(curlProg.uniforms.uTexelSize, 1.0 / simRes, 1.0 / simRes);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
      gl.uniform1i(curlProg.uniforms.uVelocity, 0);
      blit(curlFBO);

      // Vorticity pass
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

      // Advect velocity
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

      // Advect dye
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

      // Divergence pass
      gl.useProgram(divergenceProg.prog);
      gl.uniform2f(divergenceProg.uniforms.uTexelSize, 1.0 / simRes, 1.0 / simRes);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
      gl.uniform1i(divergenceProg.uniforms.uVelocity, 0);
      blit(divergenceFBO);

      // Jacobi pressure solver
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

      // Subtract pressure gradient
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

      // Final Composite Pass: 100% 1:1 Logo Size Match + 60fps Luxury 3D Material Shader
      gl.useProgram(compositeProg.prog);
      gl.uniform1f(compositeProg.uniforms.uRevealSize, SIM_SETTINGS.revealSize);
      gl.uniform1f(compositeProg.uniforms.uEdgeSoftness, SIM_SETTINGS.edgeSoftness);
      gl.uniform1f(compositeProg.uniforms.uEdgeWidth, SIM_SETTINGS.edgeWidth);
      gl.uniform1f(compositeProg.uniforms.uTime, elapsedSec);
      gl.uniform2f(
        compositeProg.uniforms.uLogoTexel,
        1.0 / Math.max(1, canvas.width),
        1.0 / Math.max(1, canvas.height)
      );
      gl.uniform1f(compositeProg.uniforms.uMatIndexA, st.prevEdition);
      gl.uniform1f(compositeProg.uniforms.uMatIndexB, st.activeEdition);
      gl.uniform1f(compositeProg.uniforms.uMatMix, mixProgress);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, baseTex);
      gl.uniform1i(compositeProg.uniforms.uBaseTexture, 0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, logoDataTex);
      gl.uniform1i(compositeProg.uniforms.uLogoDataTex, 1);

      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, dye.read.tex);
      gl.uniform1i(compositeProg.uniforms.uDye, 2);

      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.tex);
      gl.uniform1i(compositeProg.uniforms.uVelocity, 3);

      gl.activeTexture(gl.TEXTURE4);
      gl.bindTexture(gl.TEXTURE_2D, envTex);
      gl.uniform1i(compositeProg.uniforms.uEnvTexture, 4);

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
      <div className="hero-3d-style-switcher" aria-label="3D Material Edition Selector">
        <div className="hero-style-chips-list">
          <button
            type="button"
            className={`hero-style-chip auto-chip ${autoCycle ? 'is-active' : ''}`}
            onClick={handleToggleAuto}
          >
            <span className="pulse-dot" />
            <span>{autoCycle ? 'AUTO MORPH // ON' : 'AUTO MORPH // PAUSED'}</span>
          </button>
          {LUXURY_HERO_EDITIONS.map((ed, idx) => (
            <button
              key={ed.id}
              type="button"
              className={`hero-style-chip ${activeEdition === idx ? 'is-active' : ''}`}
              onClick={() => handleSelectEdition(idx)}
            >
              <span>{ed.shortLabel}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
