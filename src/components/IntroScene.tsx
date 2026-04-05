import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";

const COLORS = {
  accent: "#00d4ff",
  accentAlt: "#7c3aed",
  accentPink: "#ec4899",
  text: "#e6edf3",
  dim: "#8b949e",
  type: "#79c0ff",
  keyword: "#ff7b72",
  number: "#ffa657",
  method: "#d2a8ff",
};

interface IntroProp {
  label: string;
  colorClass: "kw" | "ty" | "nm" | "mt";
}

const PROPS: IntroProp[] = [
  { label: "Text", colorClass: "kw" },
  { label: "TextStyle", colorClass: "ty" },
  { label: "fontSize", colorClass: "nm" },
  { label: "bold", colorClass: "mt" },
];

const propColor = (c: "kw" | "ty" | "nm" | "mt") => {
  if (c === "kw") return { color: COLORS.keyword, border: "rgba(255,123,114,.35)", bg: "rgba(255,123,114,.08)" };
  if (c === "ty") return { color: COLORS.type, border: "rgba(121,192,255,.35)", bg: "rgba(121,192,255,.08)" };
  if (c === "nm") return { color: COLORS.number, border: "rgba(255,166,87,.35)", bg: "rgba(255,166,87,.08)" };
  return { color: COLORS.method, border: "rgba(210,168,255,.35)", bg: "rgba(210,168,255,.08)" };
};

// Timing: each element fades in at a staggered delay (in frames at 30fps)
// HTML original: [150,300,450,700,900,1100] ms → /33.33 frames
const STAGGER_FRAMES = [4, 9, 13, 21, 27, 33];

export const IntroScene: React.FC<{ progress: number }> = ({ progress }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = (delayFrames: number) =>
    interpolate(frame, [delayFrames, delayFrames + 12], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  const slideUp = (delayFrames: number) =>
    interpolate(frame, [delayFrames, delayFrames + 14], [10, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
        padding: "40px 28px",
        opacity: progress,
        fontFamily: "'Cairo', sans-serif",
      }}
    >
      {/* FLUTTER BASICS tag */}
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          letterSpacing: "0.15em",
          color: COLORS.accent,
          border: `1px solid rgba(0,212,255,.4)`,
          background: "linear-gradient(135deg, rgba(0,212,255,.12), rgba(124,58,237,.06))",
          padding: "6px 16px",
          borderRadius: 24,
          marginBottom: 18,
          opacity: fadeIn(STAGGER_FRAMES[0]),
          transform: `translateY(${slideUp(STAGGER_FRAMES[0])}px)`,
          fontWeight: 600,
          backdropFilter: "blur(8px)",
        }}
      >
        FLUTTER BASICS
      </div>

      {/* 01 */}
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          color: COLORS.dim,
          letterSpacing: "0.1em",
          marginBottom: 8,
          opacity: fadeIn(STAGGER_FRAMES[1]),
        }}
      >
        01
      </div>

      {/* Text Widget title */}
      <div
        style={{
          fontFamily: "'Cairo', sans-serif",
          fontSize: 60,
          fontWeight: 900,
          color: COLORS.text,
          lineHeight: 1,
          textAlign: "center",
          direction: "ltr",
          opacity: fadeIn(STAGGER_FRAMES[2]),
          transform: `translateY(${slideUp(STAGGER_FRAMES[2])}px) scale(${interpolate(
            frame,
            [STAGGER_FRAMES[2], STAGGER_FRAMES[2] + 14],
            [0.94, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          )})`,
          marginBottom: 10,
          letterSpacing: "-0.02em",
        }}
      >
        <span
          style={{
            background: `linear-gradient(135deg, ${COLORS.type} 0%, ${COLORS.accent} 50%, ${COLORS.accentAlt} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Text
        </span>{" "}
        <span style={{ color: COLORS.text, WebkitTextFillColor: COLORS.text }}>Widget</span>
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontFamily: "'Cairo', sans-serif",
          fontSize: 14,
          color: COLORS.dim,
          direction: "rtl",
          opacity: fadeIn(STAGGER_FRAMES[3]),
          marginBottom: 32,
        }}
      >
        ازاي تعرض نص في التطبيق
      </div>

      {/* Divider */}
      <div
        style={{
          width: 40,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${COLORS.accent}, transparent)`,
          opacity: fadeIn(STAGGER_FRAMES[4]) * 0.6,
          marginBottom: 28,
        }}
      />

      {/* Props chips */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          justifyContent: "center",
          opacity: fadeIn(STAGGER_FRAMES[5]),
          transform: `translateY(${slideUp(STAGGER_FRAMES[5])}px)`,
        }}
      >
        {PROPS.map((p) => {
          const c = propColor(p.colorClass);
          return (
            <div
              key={p.label}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                padding: "4px 12px",
                borderRadius: 20,
                border: `1px solid ${c.border}`,
                background: c.bg,
                color: c.color,
                fontWeight: 500,
              }}
            >
              {p.label}
            </div>
          );
        })}
      </div>
    </div>
  );
};
