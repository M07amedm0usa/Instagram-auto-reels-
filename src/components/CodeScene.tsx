import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { resolveStateAtMs, SCRIPT_DURATION_MS } from "../script";
import { tokenizeLine, colorForType } from "../highlight";

const COLORS = {
  accent: "#00d4ff",
  accentAlt: "#7c3aed",
  accentWarm: "#f59e0b",
  text: "#e6edf3",
  dim: "#8b949e",
  bg: "#0a0e14",
  surface2: "#161b22",
  surface3: "#1c2128",
  border2: "#30363d",
};

interface CalloutProps {
  text: string;
  line: number;
  index: number;
}

const Callout: React.FC<CalloutProps> = ({ text, line, index }) => {
  const LINE_HEIGHT_PX = 10.5 * 2.2; // matches HTML: font-size 10.5px × line-height 2.2
  const topPx = line * LINE_HEIGHT_PX + LINE_HEIGHT_PX / 2;

  return (
    <div
      style={{
        position: "absolute",
        top: topPx,
        right: 0,
        transform: "translateY(-50%)",
        background: "linear-gradient(135deg, #f59e0b, #f87316)",
        color: "#0a0e14",
        fontSize: 7.5,
        fontWeight: 800,
        padding: "3px 10px",
        borderRadius: 16,
        whiteSpace: "nowrap",
        boxShadow: "0 4px 12px rgba(245,158,11,.35)",
        fontFamily: "'Cairo', sans-serif",
        direction: "rtl",
        zIndex: 10,
      }}
    >
      {text}
    </div>
  );
};

// ── Syntax-highlighted code line ──────────────────────────────────────────────
const CodeLine: React.FC<{ content: string; showCursor: boolean }> = ({
  content,
  showCursor,
}) => {
  const frame = useCurrentFrame();
  const cursorVisible = Math.floor(frame / 15) % 2 === 0; // blink every 15 frames

  const tokens = useMemo(() => tokenizeLine(content), [content]);

  return (
    <div
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        lineHeight: 2.2,
        letterSpacing: "0.01em",
        color: COLORS.text,
        whiteSpace: "pre-wrap",
        display: "block",
        minHeight: "2.2em",
        fontSize: 10.5,
      }}
    >
      {tokens.map((tok, i) => (
        <span key={i} style={{ color: colorForType(tok.type as any) }}>
          {tok.text}
        </span>
      ))}
      {showCursor && (
        <span
          style={{
            display: "inline-block",
            width: 2,
            height: 14,
            backgroundColor: cursorVisible ? COLORS.accent : "transparent",
            verticalAlign: "middle",
            marginBottom: -2,
            boxShadow: cursorVisible ? `0 0 6px ${COLORS.accent}` : "none",
          }}
        />
      )}
    </div>
  );
};

// ── Preview box ───────────────────────────────────────────────────────────────
const PreviewBox: React.FC<{
  text: string;
  fs: number;
  fw: number;
  color: string;
  ls: number;
}> = ({ text, fs, fw, color, ls }) => (
  <div
    style={{
      borderRadius: 10,
      overflow: "hidden",
      border: `1px solid ${COLORS.border2}`,
      background:
        "linear-gradient(135deg, rgba(124,58,237,.15), rgba(0,212,255,.08))",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      padding: 10,
      flex: 0.8,
      boxShadow: "0 8px 24px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.05)",
    }}
  >
    <div
      style={{
        color: COLORS.accent,
        fontSize: 8,
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: "0.15em",
        fontWeight: 600,
      }}
    >
      ▸ OUTPUT
    </div>
    <div
      style={{
        background:
          "linear-gradient(135deg, rgba(124,58,237,.08), rgba(0,212,255,.04))",
        border: "1px solid rgba(0,212,255,.2)",
        borderRadius: 8,
        padding: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
      }}
    >
      <span
        style={{
          fontFamily: "'Cairo', sans-serif",
          fontSize: fs,
          fontWeight: fw,
          color: color,
          direction: "rtl",
          transition: "all 0.2s ease",
          textAlign: "center",
          letterSpacing: `${ls}em`,
        }}
      >
        {text || ""}
      </span>
    </div>
  </div>
);

// ── Main Code Scene ───────────────────────────────────────────────────────────
export const CodeScene: React.FC<{ opacity: number; codeMs: number }> = ({
  opacity,
  codeMs,
}) => {
  const clampedMs = Math.max(0, Math.min(codeMs, SCRIPT_DURATION_MS));
  const { code, preview, callouts } = useMemo(
    () => resolveStateAtMs(clampedMs),
    [clampedMs]
  );

  const lines = code.split("\n");

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        zIndex: 5,
        opacity,
        padding: 10,
        gap: 8,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          flex: 1,
          overflow: "hidden",
        }}
      >
        {/* Code label */}
        <div
          style={{
            color: COLORS.accent,
            fontSize: 8,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.15em",
            fontWeight: 600,
          }}
        >
          ▸ CODE
        </div>

        {/* Editor window */}
        <div
          style={{
            borderRadius: 10,
            overflow: "hidden",
            border: `1px solid ${COLORS.border2}`,
            background: `linear-gradient(135deg, ${COLORS.surface2}, ${COLORS.surface3})`,
            display: "flex",
            flexDirection: "column",
            flex: 1.2,
            boxShadow:
              "0 8px 24px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.05)",
          }}
        >
          {/* Title bar (traffic lights) */}
          <div
            style={{
              background: "linear-gradient(90deg, #1a1e26, #161b22)",
              padding: "6px 10px",
              display: "flex",
              alignItems: "center",
              gap: 6,
              borderBottom: `1px solid ${COLORS.border2}`,
            }}
          >
            {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
              <div
                key={c}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: c,
                  boxShadow: "0 1px 3px rgba(0,0,0,.3)",
                }}
              />
            ))}
          </div>

          {/* Code body with callouts overlay */}
          <div
            style={{
              background: COLORS.surface2,
              padding: "12px 16px",
              overflow: "hidden",
              flex: 1,
              direction: "ltr",
              fontSize: 10.5,
              position: "relative",
            }}
          >
            {/* Callouts layer */}
            <div
              style={{
                position: "absolute",
                top: 12,
                right: 16,
                left: 16,
                bottom: 12,
                pointerEvents: "none",
                zIndex: 10,
              }}
            >
              {callouts.map((cb, i) => (
                <Callout key={i} text={cb.text} line={cb.line} index={i} />
              ))}
            </div>

            {/* Code lines */}
            <div>
              {lines.map((line, idx) => (
                <CodeLine
                  key={idx}
                  content={line}
                  showCursor={idx === lines.length - 1}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Preview box */}
        <PreviewBox
          text={preview.text}
          fs={preview.fs}
          fw={preview.fw}
          color={preview.color}
          ls={preview.ls}
        />
      </div>
    </div>
  );
};
