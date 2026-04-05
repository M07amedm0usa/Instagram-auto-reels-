// ─────────────────────────────────────────────────────────────────────────────
// Root.tsx  –  Remotion entry point
//
// Registers the <FlutterLesson /> composition in 1080×1920 (Instagram Reels)
// format.  The lesson JSON is supplied as defaultProps so the n8n pipeline
// can override any field via Remotion's --props CLI flag or the API.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { AbsoluteFill, Composition } from 'remotion';
import { loadFont as loadCairo }      from '@remotion/google-fonts/Cairo';
import { loadFont as loadJetBrains }  from '@remotion/google-fonts/JetBrainsMono';
import { FlutterLesson, type FlutterLessonProps } from './components/FlutterLesson';

import {
  buildTimeline,
  computeSceneTiming,
  type LessonData,
} from './engine/Engine';

// Default lesson data — matches lesson_01.json exactly.
// The n8n pipeline can pass a different JSON at render time via --props.
import defaultLesson from './data/lesson_01.json';

// ── FIX #5: Load fonts via @remotion/google-fonts ────────────────────────────
// This is the only Remotion-correct approach — it ensures both fonts are fully
// downloaded before frame 0 renders, both in Studio preview and CI headless
// Chrome.  A bare @import url('fonts.googleapis.com/...') in CSS is not
// guaranteed to resolve before the first frame snapshot is taken.
loadCairo();
loadJetBrains();

// ── Duration Calculator ───────────────────────────────────────────────────────

function calcDurationFrames(lesson: LessonData, fps: number): number {
  const { totalScriptDuration } = buildTimeline(lesson);
  const { totalDuration }       = computeSceneTiming(totalScriptDuration);
  // 3-second tail so late audio cues always have room to finish playing.
  return Math.ceil((totalDuration / 1000) * fps) + fps * 3;
}

// ── FPS & Resolution Constants ────────────────────────────────────────────────
const FPS    = 30;
const WIDTH  = 1080;
const HEIGHT = 1920;

// Scale factor: the phone mock was designed at 380×680.
// FIX Issue 1: Scale to HEIGHT (not WIDTH) so the phone fits the 1920px canvas exactly.
// WIDTH / PHONE_MOCK_W = 2.8421 → scaled height = 1932px → clips bottom 12.6px.
// HEIGHT / PHONE_MOCK_H = 2.8235 → scaled height = 1920px → perfect fit.
// The scaled width = 1072.9px (3.5px navy gap each side — invisible on screen).
const PHONE_MOCK_H = 680;
const SCALE        = HEIGHT / PHONE_MOCK_H; // 2.8235 — fits height exactly, no clipping

// ── FIX #4: Pre-compute default duration at module load time ──────────────────
// buildTimeline is O(n) and deterministic. Running it once here (for the
// default lesson) avoids a second call inside RemotionRoot's useMemo AND a
// third call inside calculateMetadata for the same lesson.  When --props
// injects a *different* lesson at render time, calculateMetadata still calls
// calcDurationFrames — that's the only case where a fresh build is required.
const DEFAULT_DURATION_FRAMES = (() => {
  if (!( defaultLesson as LessonData)?.script) return FPS * 10;
  return calcDurationFrames(defaultLesson as LessonData, FPS);
})();

// ── FIX #2: AbsoluteFill replaces the manual width/height div ─────────────────
// Remotion expects the root element of a composition to fill the entire canvas.
// Without AbsoluteFill, Studio thumbnails and --frames still exports can render
// the phone floating in the top-left of a white void instead of being centered.
const ScaledLesson: React.FC<FlutterLessonProps> = (props) => (
  <AbsoluteFill
    style={{
      background:     '#050810',  // deep navy — matches the reel background
      alignItems:     'center',
      justifyContent: 'center',
      overflow:       'hidden',
    }}
  >
    <div style={{ transform: `scale(${SCALE})`, transformOrigin: 'center center' }}>
      <FlutterLesson {...props} />
    </div>
  </AbsoluteFill>
);

// ── Root ──────────────────────────────────────────────────────────────────────

export const RemotionRoot: React.FC = () => {
  // FIX #4: use the pre-computed constant — no useMemo or buildTimeline call needed here.
  const durationInFrames = DEFAULT_DURATION_FRAMES;

  const defaultProps: FlutterLessonProps = {
    lesson:    defaultLesson as LessonData,
    voiceover: 'voiceover.mp3', // resolved by Remotion's staticFile() helper
  };

  return (
    <>
      {/*
        ── Flutter Lesson Composition ──────────────────────────────────────────
        id               : used by the Remotion CLI / render API to target this comp
        component        : ScaledLesson — centres the 380×680 phone in the 1080×1920 canvas
        durationInFrames : computed dynamically from the lesson script length
        fps              : 30 fps → smooth for short-form social video
        width/height     : 1080×1920 (9:16 vertical — Instagram Reels standard)
        defaultProps     : full lesson JSON — override at render time for each lesson
      */}
      <Composition
        id="FlutterLesson"
        component={ScaledLesson}
        durationInFrames={durationInFrames}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={defaultProps}
        // FIX 6: calculateMetadata recomputes duration when --props changes the
        // script, with a null guard so a missing lesson key returns a fallback
        // instead of crashing the render worker.
        calculateMetadata={async ({ props }) => {
          if (!props?.lesson?.script) return { durationInFrames: FPS * 10 };
          const frames = calcDurationFrames(props.lesson, FPS);
          return { durationInFrames: frames };
        }}
      />
    </>
  );
};
