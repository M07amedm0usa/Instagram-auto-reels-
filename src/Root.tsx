// ─────────────────────────────────────────────────────────────────────────────
// Root.tsx  v4 — Remotion composition entry point
//
// Fixes from v3:
//   • totalFrames / calcOutroStartFrame guard against undefined script.
//   • calculateMetadata validates lesson.script before using it —
//     prevents "Cannot read properties of undefined (reading 'reduce')"
//     when --props JSON is missing or malformed.
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

// ─── SAFE LESSON RESOLVER ────────────────────────────────────────────────────
// Remotion merges --props on top of defaultProps, so rawProps may be a
// partial object. We validate that lesson.script is a real array before use.
function resolveLesson(rawProps: Record<string, unknown>): LessonData {
  const candidate = rawProps.lesson as LessonData | undefined;
  if (candidate && Array.isArray(candidate.script) && candidate.script.length > 0) {
    return candidate;
  }
  // Fallback to compiled-in default — never crashes.
  return defaultLesson;
}

// ─── DURATION HELPERS ────────────────────────────────────────────────────────
function totalFrames(lesson: LessonData): number {
  // Guard: if script is somehow missing, return a safe minimum.
  if (!lesson?.script || !Array.isArray(lesson.script)) return 300;
  const scriptMs  = scriptDurationMs(lesson.script);
  const codeEndMs = TIMING.CODE_TYPING + scriptMs + 800;
  const outroInMs = codeEndMs + 1200;
  const totalMs   = outroInMs + 2500;
  return Math.ceil((totalMs / 1000) * FPS);
}

function calcOutroStartFrame(lesson: LessonData): number {
  if (!lesson?.script || !Array.isArray(lesson.script)) return 200;
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
        // props = defaultProps merged with whatever came from --props file.
        // resolveLesson validates before use — no more "reduce of undefined".
        const l = resolveLesson(props as Record<string, unknown>);

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
