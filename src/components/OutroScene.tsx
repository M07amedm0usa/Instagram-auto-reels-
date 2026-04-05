import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

const COLORS = {
  accent: "#00d4ff",
  text: "#e6edf3",
  dim: "#8b949e",
};

export const OutroScene: React.FC<{ opacity: number }> = ({ opacity }) => {
  const frame = useCurrentFrame();

  // Pulse animation for the badge ✦
  const scale = 1 + 0.1 * Math.sin((frame / 30) * Math.PI * 2 * 0.5);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        zIndex: 5,
        opacity,
        padding: "40px 28px",
      }}
    >
      {/* Badge */}
      <div style={{ fontSize: 40, transform: `scale(${scale})` }}>✦</div>

      {/* Title */}
      <div
        style={{
          fontFamily: "'Cairo', sans-serif",
          fontSize: 46,
          fontWeight: 900,
          color: COLORS.text,
          textAlign: "center",
          direction: "rtl",
          lineHeight: 1.3,
          letterSpacing: "-0.01em",
        }}
      >
        جرب الكود
        <br />
        بنفسك!
      </div>

      {/* URL */}
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: COLORS.dim,
        }}
      >
        flutter.dev/docs
      </div>

      {/* Next episode */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 8,
          fontFamily: "'Cairo', sans-serif",
          fontSize: 12,
          color: COLORS.accent,
          direction: "rtl",
        }}
      >
        <span>↩</span>
        <span>الجزء الجاي: Container</span>
      </div>
    </div>
  );
};
