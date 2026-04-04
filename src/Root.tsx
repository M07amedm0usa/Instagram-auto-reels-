// ─────────────────────────────────────────────────────────────────────────────
// Root.tsx — Remotion composition entry point
// Calculates total duration dynamically from the script, then registers the
// Composition. All data flows in via inputProps for n8n automation.
// ─────────────────────────────────────────────────────────────────────────────
import { Composition } from 'remotion';
import { FlutterLesson, TIMING } from './FlutterLesson';
import { defaultLesson, LessonData, StepType } from './lessonData';

const FPS = 30;

// ─── SCRIPT DURATION CALCULATOR ───────────────────────────────────────────────
function scriptDurationMs(script: StepType[]): number {
  return script.reduce((total, step) => {
    switch (step.a) {
      case 'type':      return total + step.t.length * (step.speed ?? 80);
      case 'wait':      return total + step.ms;
      case 'move':      return total + 200;
      case 'enter':     return total + 200;
      case 'ide_enter': return total + 200;
      case 'callout':   return total;           // zero duration
      default:          return total;
    }
  }, 0);
}

// ─── COMPOSITION DURATION ─────────────────────────────────────────────────────
function totalFrames(lesson: LessonData): number {
  const scriptMs  = scriptDurationMs(lesson.script);
  const codeEndMs = TIMING.CODE_TYPING + scriptMs + 800;
  const outroInMs = codeEndMs + 1200;
  const totalMs   = outroInMs + 2500;        // outro holds for 2.5 s
  return Math.ceil((totalMs / 1000) * FPS);
}

function outroStartFrame(lesson: LessonData): number {
  const scriptMs  = scriptDurationMs(lesson.script);
  const codeEndMs = TIMING.CODE_TYPING + scriptMs + 800;
  const outroInMs = codeEndMs + 1200;
  return Math.ceil((outroInMs / 1000) * FPS);
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export const RemotionRoot: React.FC = () => {
  // Use the default lesson for the Remotion Studio preview.
  // When rendering via CLI / n8n, pass --props '{"lesson": {...}}' to override.
  const lesson = defaultLesson;

  return (
    <Composition
      id="FlutterLesson"
      component={FlutterLesson}
      durationInFrames={totalFrames(lesson)}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{
        lesson,
        outroStartFrame: outroStartFrame(lesson),
      }}
      // calculateMetadata lets the CLI / n8n pass a different lesson and get the
      // correct duration automatically — no need to hard-code frame counts.
      calculateMetadata={async ({ props }) => {
        const l = (props as { lesson: LessonData }).lesson ?? lesson;
        return {
          durationInFrames: totalFrames(l),
          props: {
            ...props,
            outroStartFrame: outroStartFrame(l),
          },
        };
      }}
    />
  );
};
