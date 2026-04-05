// ─────────────────────────────────────────────────────────────────────────────
// Root.tsx  –  Remotion entry point
//
// Registers the <FlutterLesson /> composition in 1080×1920 (Instagram Reels)
// format.  The lesson JSON is supplied as defaultProps so the n8n pipeline
// can override any field via Remotion's --props CLI flag or the API.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useMemo } from 'react';
import { Composition, useCurrentFrame, useVideoConfig } from 'remotion';
import { FlutterLesson, type FlutterLessonProps } from './components/FlutterLesson';

import {
  buildTimeline,
  computeSceneTiming,
  type LessonData,
} from './engine/Engine';

// Default lesson data — matches lesson_01.json exactly.
// The n8n pipeline can pass a different JSON at render time via --props.
import defaultLesson from './data/lesson_01.json';

// ── Duration Calculator ───────────────────────────────────────────────────────
// Remotion needs `durationInFrames` at registration time.
// We run the timeline builder once here (outside any component) to compute it.

function calcDurationFrames(lesson: LessonData, fps: number): number {
  const { totalScriptDuration } = buildTimeline(lesson);
  const { totalDuration }       = computeSceneTiming(totalScriptDuration);
  // totalDuration is in ms — convert to frames and add a 1-second safety margin
  return Math.ceil((totalDuration / 1000) * fps) + fps;
}

// ── FPS & Resolution Constants ────────────────────────────────────────────────
const FPS    = 30;
const WIDTH  = 1080;
const HEIGHT = 1920;

// Scale factor: the phone mock was designed at 380×680.
// We scale it up to fill the 1080×1920 canvas while keeping proportions.
const PHONE_MOCK_W    = 380;
const SCALE           = WIDTH / PHONE_MOCK_W;   // ≈ 2.84×

// ── Wrapper that applies the full-screen scale transform ───────────────────────

const ScaledLesson: React.FC<FlutterLessonProps> = (props) => (
  <div
    style={{
      width:           WIDTH,
      height:          HEIGHT,
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      background:      '#050810',   // deep navy — matches the reel background
      overflow:        'hidden',
    }}
  >
    <div style={{ transform: `scale(${SCALE})`, transformOrigin: 'center center' }}>
      <FlutterLesson {...props} />
    </div>
  </div>
);

// ── Root ──────────────────────────────────────────────────────────────────────

export const RemotionRoot: React.FC = () => {
  const lesson = defaultLesson as LessonData;
  const durationInFrames = calcDurationFrames(lesson, FPS);

  const defaultProps: FlutterLessonProps = {
    lesson,
    voiceover: 'voiceover.mp3',   // resolved by Remotion's staticFile() helper
  };

  return (
    <>
      {/*
        ── Flutter Lesson Composition ──────────────────────────────────────────
        id          : used by the Remotion CLI / render API to target this comp
        component   : the scaled wrapper around FlutterLesson
        durationInFrames : computed dynamically from the lesson script length
        fps         : 30 fps → smooth for short-form social video
        width/height: 1080×1920 (9:16 vertical — Instagram Reels standard)
        defaultProps: full lesson JSON — override at render time for each lesson
      */}
      <Composition
        id="FlutterLesson"
        component={ScaledLesson}
        durationInFrames={durationInFrames}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={defaultProps}
        // calculateMetadata lets us recompute duration if --props changes the script
        calculateMetadata={async ({ props }) => {
          const frames = calcDurationFrames(props.lesson, FPS);
          return { durationInFrames: frames };
        }}
      />
    </>
  );
};
