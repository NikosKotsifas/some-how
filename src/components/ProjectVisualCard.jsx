import React from 'react';

/**
 * High-craft bespoke visual artwork for each Some.how case study card,
 * rendered with crisp SVG + CSS kinetic motion in our Swiss Editorial +
 * Acid Lime (#D4FF00) + International Orange (#FF3B00) palette.
 */
export function ProjectVisualCard({ work }) {
  const { livePreviewType, accent, palette, number, category, metrics } = work;

  return (
    <div
      className="project-visual-surface"
      style={{
        background: `radial-gradient(circle at 22% 18%, ${palette[1]} 0%, ${palette[0]} 78%)`
      }}
    >
      {/* Top technical HUD bar inside the project vignette */}
      <div className="pv-hud-top">
        <span className="pv-hud-index">SYS // {number}</span>
        <span className="pv-hud-cat">{category}</span>
        <span className="pv-hud-dot" style={{ backgroundColor: accent }} />
      </div>

      {/* Center bespoke architectural graphic per project */}
      <div className="pv-graphic-stage">
        {livePreviewType === 'telemetry' && (
          <svg viewBox="0 0 600 400" className="pv-svg">
            <defs>
              <radialGradient id="globeGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={accent} stopOpacity="0.28" />
                <stop offset="100%" stopColor={accent} stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="300" cy="200" r="150" fill="url(#globeGlow)" />
            <circle
              cx="300"
              cy="200"
              r="125"
              stroke="rgba(244,241,234,0.22)"
              strokeWidth="1.2"
              fill="none"
            />
            <ellipse
              cx="300"
              cy="200"
              rx="125"
              ry="48"
              stroke={accent}
              strokeWidth="1.5"
              strokeDasharray="6 6"
              fill="none"
              className="pv-spin-slow"
            />
            <ellipse
              cx="300"
              cy="200"
              rx="52"
              ry="125"
              stroke="rgba(244,241,234,0.35)"
              strokeWidth="1.2"
              fill="none"
            />
            <path
              d="M140 240 Q 300 90 460 180"
              stroke="#FF3B00"
              strokeWidth="2.5"
              fill="none"
            />
            <circle cx="140" cy="240" r="6" fill="#FF3B00" />
            <circle cx="460" cy="180" r="7" fill={accent} />
            <circle cx="305" cy="152" r="5" fill="#F4F1EA" />
            <rect
              x="44"
              y="290"
              width="190"
              height="68"
              rx="8"
              fill="rgba(13,13,13,0.78)"
              stroke="rgba(244,241,234,0.16)"
            />
            <text x="60" y="318" fill={accent} fontSize="11" fontFamily="IBM Plex Mono">
              AGENT_DISPATCH: ACTIVE
            </text>
            <text x="60" y="340" fill="#F4F1EA" fontSize="13" fontFamily="IBM Plex Mono">
              ROUTE_OPT: +94.2%
            </text>
          </svg>
        )}

        {livePreviewType === 'shader' && (
          <svg viewBox="0 0 600 400" className="pv-svg">
            <defs>
              <linearGradient id="shaderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF3B00" />
                <stop offset="55%" stopColor="#FF7A00" />
                <stop offset="100%" stopColor="#D4FF00" />
              </linearGradient>
            </defs>
            <circle cx="250" cy="195" r="115" fill="url(#shaderGrad)" opacity="0.88" />
            <circle
              cx="355"
              cy="195"
              r="115"
              stroke="#F4F1EA"
              strokeWidth="2"
              fill="rgba(13,13,13,0.45)"
            />
            <path
              d="M90 310 C 200 220, 400 350, 510 140"
              stroke="#D4FF00"
              strokeWidth="3"
              fill="none"
            />
            <text x="205" y="205" fill="#F4F1EA" fontSize="28" fontWeight="700" letterSpacing="-1">
              GLSL // 60FPS
            </text>
          </svg>
        )}

        {livePreviewType === 'ledger' && (
          <svg viewBox="0 0 600 400" className="pv-svg">
            <g stroke="rgba(244,241,234,0.12)" strokeWidth="1">
              <line x1="60" y1="90" x2="540" y2="90" />
              <line x1="60" y1="150" x2="540" y2="150" />
              <line x1="60" y1="210" x2="540" y2="210" />
              <line x1="60" y1="270" x2="540" y2="270" />
            </g>
            <polyline
              points="60,260 150,220 230,235 320,145 410,165 510,85"
              fill="none"
              stroke="#D4FF00"
              strokeWidth="3.5"
            />
            <polyline
              points="60,295 160,275 260,240 350,210 440,185 510,155"
              fill="none"
              stroke="#FF3B00"
              strokeWidth="2"
              strokeDasharray="5 5"
            />
            <circle cx="510" cy="85" r="8" fill="#D4FF00" />
            <rect
              x="60"
              y="72"
              width="195"
              height="62"
              rx="6"
              fill="rgba(13,13,13,0.85)"
              stroke="rgba(212,255,0,0.4)"
            />
            <text x="76" y="98" fill="#9A9A94" fontSize="10" fontFamily="IBM Plex Mono">
              TREASURY LIQUIDITY
            </text>
            <text x="76" y="120" fill="#F4F1EA" fontSize="18" fontFamily="IBM Plex Mono">
              $4,820,910,400
            </text>
          </svg>
        )}

        {livePreviewType === 'graph' && (
          <svg viewBox="0 0 600 400" className="pv-svg">
            <g stroke="rgba(212,255,0,0.32)" strokeWidth="1.5">
              <line x1="300" y1="190" x2="170" y2="110" />
              <line x1="300" y1="190" x2="430" y2="115" />
              <line x1="300" y1="190" x2="185" y2="285" />
              <line x1="300" y1="190" x2="435" y2="275" />
              <line x1="170" y1="110" x2="430" y2="115" />
              <line x1="185" y1="285" x2="435" y2="275" />
            </g>
            <circle cx="300" cy="190" r="24" fill="#D4FF00" />
            <circle cx="170" cy="110" r="12" fill="#FF3B00" />
            <circle cx="430" cy="115" r="14" fill="#F4F1EA" />
            <circle cx="185" cy="285" r="14" fill="#F4F1EA" />
            <circle cx="435" cy="275" r="12" fill="#FF3B00" />
            <text x="276" y="194" fill="#0D0D0D" fontSize="11" fontWeight="700" fontFamily="IBM Plex Mono">
              RAG
            </text>
          </svg>
        )}

        {livePreviewType === 'parametric' && (
          <svg viewBox="0 0 600 400" className="pv-svg">
            <g transform="translate(300, 195)">
              <polygon
                points="0,-120 110,-60 110,60 0,120 -110,60 -110,-60"
                stroke="#FF3B00"
                strokeWidth="2.5"
                fill="rgba(255,59,0,0.12)"
              />
              <polygon
                points="0,-80 74,-40 74,40 0,80 -74,40 -74,-40"
                stroke="#D4FF00"
                strokeWidth="2"
                fill="none"
              />
              <line x1="0" y1="-120" x2="0" y2="120" stroke="rgba(244,241,234,0.35)" />
              <line x1="-110" y1="-60" x2="110" y2="60" stroke="rgba(244,241,234,0.35)" />
              <line x1="-110" y1="60" x2="110" y2="-60" stroke="rgba(244,241,234,0.35)" />
            </g>
          </svg>
        )}

        {livePreviewType === 'terminal' && (
          <svg viewBox="0 0 600 400" className="pv-svg">
            <rect
              x="70"
              y="70"
              width="460"
              height="250"
              rx="12"
              fill="rgba(9,10,12,0.92)"
              stroke="rgba(244,241,234,0.2)"
            />
            <circle cx="96" cy="96" r="5" fill="#FF3B00" />
            <circle cx="114" cy="96" r="5" fill="#D4FF00" />
            <circle cx="132" cy="96" r="5" fill="#F4F1EA" />
            <text x="96" y="142" fill="#9A9A94" fontSize="13" fontFamily="IBM Plex Mono">
              $ chronos watch --cluster prod-eu-01
            </text>
            <text x="96" y="174" fill="#FF3B00" fontSize="13" fontFamily="IBM Plex Mono">
              ! ANOMALY DETECTED: p99 spike on auth-service
            </text>
            <text x="96" y="206" fill="#D4FF00" fontSize="13" fontFamily="IBM Plex Mono">
              ✓ Root cause isolated: commit 8f3a29c (pool limit)
            </text>
            <text x="96" y="238" fill="#F4F1EA" fontSize="13" fontFamily="IBM Plex Mono">
              ✓ Autonomous rollback PR #412 verified &amp; merged (1.4s)
            </text>
            <rect x="96" y="262" width="140" height="28" rx="14" fill="#D4FF00" />
            <text x="114" y="280" fill="#0D0D0D" fontSize="11" fontWeight="700" fontFamily="IBM Plex Mono">
              MTTR: -78.4%
            </text>
          </svg>
        )}
      </div>

      {/* Bottom metric pills inside the card */}
      <div className="pv-metrics-row">
        {metrics.map((m, idx) => (
          <span key={idx} className="pv-metric-pill">
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}
