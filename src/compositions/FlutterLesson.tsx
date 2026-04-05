import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { IntroScene } from "../components/IntroScene";
import { CodeScene } from "../components/CodeScene";
import { OutroScene } from "../components/OutroScene";
import { Particles } from "../components/Particles";
import { SCRIPT_DURATION_MS } from "../script";

// ── TIMING (ms) — mirrors the HTML EXACTLY ─────────────────────────────────
const T = {
  introFade: 2800,
  codeIn: 3000,
  get codeEnd() { return this.codeIn + SCRIPT_DURATION_MS + 800; },
  get outroIn() { return this.codeEnd + 1200; },
};
export const TOTAL_MS = T.outroIn + 2500;

// ── Video constants ──────────────────────────────────────────────────────────
// 1080×1920 portrait, 30fps — same as your Remotion Reels setup
export const VIDEO_WIDTH = 1080;
export const VIDEO_HEIGHT = 1920;
export const VIDEO_FPS = 30;
export const VIDEO_DURATION_FRAMES = Math.ceil((TOTAL_MS / 1000) * VIDEO_FPS);

// ── Helpers ───────────────────────────────────────────────────────────────────
function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }
function easeOut(t: number) { return 1 - Math.pow(1 - t, 3); }

function lerp(t: number, a: number, b: number) {
  return a + clamp01(t) * (b - a);
}

// ── Phone frame dimensions (scaled to video resolution) ───────────────────────
// Original HTML phone: 380×680px in a 380px container
// Scale factor to fill 1080px width with some margin
const PHONE_SCALE = (VIDEO_WIDTH * 0.85) / 380;
const PHONE_W = 380 * PHONE_SCALE;
const PHONE_H = 680 * PHONE_SCALE;

// ── Composition ───────────────────────────────────────────────────────────────
export const FlutterLesson: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const tMs = (frame / fps) * 1000;

  // ── Intro opacity (same as HTML tick logic) ──────────────────────────────
  const introOpacity = useMemo(() => {
    if (tMs < T.introFade) {
      const inP = clamp01(tMs / 400);
      return easeOut(inP);
    }
    if (tMs <= T.introFade + 600) {
      return easeOut(1 - clamp01((tMs - T.introFade) / 500));
    }
    return 0;
  }, [tMs]);

  // ── Code scene opacity ───────────────────────────────────────────────────
  const codeOpacity = useMemo(() => {
    if (tMs < T.codeIn) return 0;
    if (tMs >= T.outroIn) {
      return easeOut(1 - clamp01((tMs - T.outroIn) / 400));
    }
    return easeOut(clamp01((tMs - T.codeIn) / 400));
  }, [tMs]);

  // How many ms into the code scene we are (for script state)
  const codeMs = Math.max(0, tMs - T.codeIn - 400 /* script starts after fade */);

  // ── Outro opacity ────────────────────────────────────────────────────────
  const outroOpacity = useMemo(() => {
    if (tMs < T.outroIn) return 0;
    return easeOut(clamp01((tMs - T.outroIn) / 600));
  }, [tMs]);

  return (
    <div
      style={{
        width: VIDEO_WIDTH,
        height: VIDEO_HEIGHT,
        background: "linear-gradient(135deg, #0a0e14 0%, #050709 50%, #0a0e14 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Cairo', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient radial gradients (body::before from HTML) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 20% 50%, rgba(0,212,255,.05) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(124,58,237,.03) 0%, transparent 50%)",
          pointerEvents: "none",
        }}
      />

      {/* ── Phone outer ─────────────────────────────────────────────────────── */}
      <div
        style={{
          width: PHONE_W,
          height: PHONE_H,
          position: "relative",
          borderRadius: 50 * PHONE_SCALE,
          background: "linear-gradient(145deg, #1a1f2e, #0d1117)",
          border: "1.5px solid #2a3040",
          boxShadow:
            "0 0 0 1px #0a0d14, 0 50px 150px rgba(0,0,0,.95), 0 0 100px rgba(0,212,255,.08), inset 0 1px 0 rgba(255,255,255,.08), inset 0 -1px 2px rgba(0,0,0,.5)",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {/* Notch */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 120 * PHONE_SCALE,
            height: 28 * PHONE_SCALE,
            background: "#080c10",
            borderRadius: `0 0 ${20 * PHONE_SCALE}px ${20 * PHONE_SCALE}px`,
            zIndex: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6 * PHONE_SCALE,
            boxShadow: "0 2px 8px rgba(0,0,0,.5)",
          }}
        >
          <div
            style={{
              width: 8 * PHONE_SCALE,
              height: 8 * PHONE_SCALE,
              borderRadius: "50%",
              background: "#1a1f2e",
              border: "1px solid #2a3040",
            }}
          />
          <div
            style={{
              width: 32 * PHONE_SCALE,
              height: 4 * PHONE_SCALE,
              borderRadius: 4 * PHONE_SCALE,
              background: "#1a1f2e",
            }}
          />
        </div>

        {/* Screen */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 49 * PHONE_SCALE,
            overflow: "hidden",
            background: "#0a0e14",
          }}
        >
          {/* Particles */}
          <Particles width={PHONE_W} height={PHONE_H} />

          {/* Canvas — scaled internally so sub-components use original px values */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: `scale(${PHONE_SCALE})`,
              transformOrigin: "top left",
              width: 380,
              height: 680,
            }}
          >
            {/* Intro */}
            <IntroScene progress={introOpacity} />

            {/* Code */}
            <CodeScene opacity={codeOpacity} codeMs={codeMs} />

            {/* Outro */}
            <OutroScene opacity={outroOpacity} />
          </div>
        </div>
      </div>
    </div>
  );
};
