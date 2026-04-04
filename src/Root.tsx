// ─────────────────────────────────────────────────────────────────────────────
// Root.tsx  v3 — Remotion composition entry point
//
// Fixes from v2:
//   • React explicitly imported.
//   • TIMING and stepDurationMs/scriptDurationMs imported from lessonData.ts
//     (single source of truth — no local duplicates).
//   • calculateMetadata handles missing lesson gracefully with defaultLesson.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { Composition } from 'remotion';
import { FlutterLesson, FlutterLessonProps } from './FlutterLesson';
import {
  defaultLesson,
  LessonData,
  TIMING,
  scriptDurationMs,
} from './lessonData';

const FPS = 30;

// ─── DURATION HELPERS ────────────────────────────────────────────────────────
function totalFrames(lesson: LessonData): number {
  const scriptMs  = scriptDurationMs(lesson.script);
  const codeEndMs = TIMING.CODE_TYPING + scriptMs + 800;
  const outroInMs = codeEndMs + 1200;
  const totalMs   = outroInMs + 2500;
  return Math.ceil((totalMs / 1000) * FPS);
}

function calcOutroStartFrame(lesson: LessonData): number {
  const scriptMs  = scriptDurationMs(lesson.script);
  const codeEndMs = TIMING.CODE_TYPING + scriptMs + 800;
  const outroInMs = codeEndMs + 1200;
  return Math.ceil((outroInMs / 1000) * FPS);
}

// ─── ROOT ────────────────────────────────────────────────────────────────────
export const RemotionRoot: React.FC = () => {
  const lesson = defaultLesson;

  const defaultProps: FlutterLessonProps = {
    lesson,
    outroStartFrame: calcOutroStartFrame(lesson),
  };

  return (
    <Composition
      id="FlutterLesson"
      component={FlutterLesson}
      durationInFrames={totalFrames(lesson)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={defaultProps}
      calculateMetadata={async ({ props }) => {
        // props comes in as the raw JSON from --props.
        // If n8n sends { lesson: {...} }, we pick it up here.
        const rawProps = props as Partial<FlutterLessonProps>;
        const l        = rawProps.lesson ?? lesson;

        return {
          durationInFrames: totalFrames(l),
          props: {
            lesson:          l,
            outroStartFrame: calcOutroStartFrame(l),
          } satisfies FlutterLessonProps,
        };
      }}
    />
  );
};
