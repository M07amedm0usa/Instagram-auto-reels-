// ─────────────────────────────────────────────────────────────────────────────
// FlutterLesson.tsx
// Declarative Remotion component — replaces the requestAnimationFrame loop.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, Audio, Sequence, staticFile } from 'remotion';
import './style.css';

import {
  buildTimeline,
  computeSceneTiming,
  highlightDart,
  findCurrentIndex,
  clamp,
  easeOut,
  frameToMs,
  type LessonData,
  type TimelineFrame,
  type CalloutEntry,
  type AudioCue,
} from '../engine/Engine';

// ── Props ─────────────────────────────────────────────────────────────────────

export interface FlutterLessonProps {
  lesson: LessonData;
  /** Path relative to the Remotion public/ folder, e.g. "voiceover.mp3" */
  voiceover?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const LINE_HEIGHT_PX = 10.5 * 2.2; // matches CSS: font-size 10.5px × line-height 2.2

// Stagger thresholds (ms) — when each intro element begins its appear animation
const INTRO_STAGGER_MS = [150, 300, 450, 700, 900, 1100] as const;

// Duration (ms) of each intro element's individual appear animation
const INTRO_APPEAR_DUR = 400;

// Cursor blink period (ms).  900 ms = ~27 frames at 30 fps — clearly visible
// without strobing.  On/off split is 50/50.
const CURSOR_BLINK_MS  = 900;

// ── Sub-components ────────────────────────────────────────────────────────────

/** A single highlighted code line with optional active (focus) class. */
const CodeLine: React.FC<{ html: string; active: boolean }> = ({ html, active }) => (
  <div
    className={`code-line${active ? ' active' : ''}`}
    // We trust our own highlightDart output — it never comes from user input
    dangerouslySetInnerHTML={{ __html: html }}
  />
);

/** Floating annotation badge positioned over the code editor. */
const Callout: React.FC<{ cb: CalloutEntry; scriptTime: number }> = ({ cb, scriptTime }) => {
  const age      = scriptTime - cb.timeAdded;
  const prog     = clamp(age / 400, 0, 1);
  const eased    = easeOut(prog);
  const topPos   = cb.line * LINE_HEIGHT_PX + LINE_HEIGHT_PX / 2;

  return (
    <div
      className="cb"
      style={{
        top:       topPos,
        opacity:   eased,
        transform: `translate(${15 * (1 - eased)}px, -50%)`,
      }}
    >
      {cb.text}
    </div>
  );
};

// ── Intro Scene ────────────────────────────────────────────────────────────────

interface IntroSceneProps {
  lesson: LessonData;
  t: number;
  introFade: number;
}

/**
 * FIX 2: All intro element animations are driven by the frame-accurate `t`
 * value from useCurrentFrame(), not by CSS transitions.
 *
 * CSS transitions are wall-clock-based.  Remotion renders each frame by
 * directly seeking the browser to that timestamp — the browser never
 * "plays through" the transition, so CSS transitions either snap to their
 * end state or freeze mid-way depending on timing.  The result is elements
 * that pop in instantly in the rendered video instead of sliding/fading.
 *
 * The fix interpolates opacity and transform inline using the same easeOut
 * helper already used everywhere else in this file, giving identical
 * frame-by-frame determinism as all other animations.
 */
const IntroScene: React.FC<IntroSceneProps> = ({ lesson, t, introFade }) => {
  // Overall scene fade in / fade out
  const inP     = clamp(t / 400, 0, 1);
  const fadeOut = easeOut(1 - clamp((t - introFade) / 500, 0, 1));
  const sceneOpacity =
    t < introFade
      ? easeOut(inP)
      : t < introFade + 600
      ? fadeOut
      : 0;

  /**
   * Returns a 0→1 progress value for an element whose appear animation
   * starts at `startMs` and lasts `dur` ms.
   */
  const appear = (startMs: number, dur = INTRO_APPEAR_DUR) =>
    easeOut(clamp((t - startMs) / dur, 0, 1));

  // Per-element progress values
  const tagP     = appear(INTRO_STAGGER_MS[0]);
  const numP     = appear(INTRO_STAGGER_MS[1]);
  const titleP   = appear(INTRO_STAGGER_MS[2], 500);
  const subP     = appear(INTRO_STAGGER_MS[3]);
  const divP     = appear(INTRO_STAGGER_MS[4]);
  const propsP   = appear(INTRO_STAGGER_MS[5]);

  return (
    <div id="sIntro" style={{ opacity: sceneOpacity }}>

      {/* Tag pill — slide up + fade */}
      <div
        className="i-tag"
        style={{
          opacity:   tagP,
          transform: `translateY(${8 * (1 - tagP)}px)`,
        }}
      >
        {lesson.intro.tag}
      </div>

      {/* Lesson number — fade only */}
      <div className="i-number" style={{ opacity: numP }}>
        {lesson.intro.number}
      </div>

      {/* Title — slide up + scale + fade */}
      <div
        className="i-title"
        style={{
          opacity:   titleP,
          transform: `translateY(${16 * (1 - titleP)}px) scale(${0.94 + 0.06 * titleP})`,
        }}
        dangerouslySetInnerHTML={{ __html: lesson.intro.title }}
      />

      {/* Subtitle — fade only */}
      <div className="i-sub" style={{ opacity: subP }}>
        {lesson.intro.subtitle}
      </div>

      {/* Divider — fade only */}
      <div className="i-divider" style={{ opacity: 0.6 * divP }} />

      {/* Props chips — slide up + fade */}
      <div
        className="i-props"
        style={{
          opacity:   propsP,
          transform: `translateY(${8 * (1 - propsP)}px)`,
        }}
      >
        {lesson.intro.props.map((p, i) => (
          <div key={i} className={`i-prop ${p.type}`}>
            {p.text}
          </div>
        ))}
      </div>

    </div>
  );
};

// ── Code Scene ────────────────────────────────────────────────────────────────

interface CodeSceneProps {
  t: number;
  codeIn: number;
  outroIn: number;
  timeline: TimelineFrame[];
}

const CodeScene: React.FC<CodeSceneProps> = ({ t, codeIn, outroIn, timeline }) => {
  const opacity =
    t < codeIn
      ? 0
      : t >= outroIn
      ? 0
      : easeOut(clamp((t - codeIn) / 400, 0, 1));

  const scriptTime  = t - codeIn - 400;
  const showContent = scriptTime >= 0 && timeline.length > 0;

  // Stable numeric index — useMemo below only reruns when the active timeline
  // entry actually changes, not on every Remotion frame tick.
  const currentIndex = showContent ? findCurrentIndex(timeline, scriptTime) : -1;
  const currentState = currentIndex >= 0 ? timeline[currentIndex] : null;

  /**
   * FIX 3: Cursor blink driven by frame-accurate `t`, not CSS animation.
   *
   * CSS @keyframes are wall-clock-based and non-deterministic in Remotion —
   * the blink phase at any given seek position depends on real elapsed time,
   * which varies by CPU speed and render conditions.  Driving it with
   * `t % CURSOR_BLINK_MS` makes the blink phase identical on every machine
   * and in every preview/render for the same frame number.
   *
   * The cursor opacity is injected into the HTML string inside useMemo, so
   * it recomputes both when the timeline entry changes AND when the blink
   * phase flips — cursorOn is a boolean that toggles every half-period.
   */
  const cursorOn = (t % CURSOR_BLINK_MS) < CURSOR_BLINK_MS / 2;

  // Build highlighted HTML lines — reruns only when entry or blink phase changes
  const renderedLines = useMemo(() => {
    // FIX #1: guard against null state OR an out-of-bounds index.
    // findCurrentIndex clamps to 0 on an empty timeline, but currentIndex
    // can be -1 (showContent === false) and timeline[−1] is undefined.
    if (!currentState || currentIndex < 0 || currentIndex >= timeline.length) return [];

    const codeToCursor   = currentState.code.slice(0, currentState.cursor);
    const currentLineIdx = codeToCursor.split('\n').length - 1;

    // Inject the cursor placeholder, then highlight
    const withCursor =
      currentState.code.slice(0, currentState.cursor) +
      '%%CURSOR%%' +
      currentState.code.slice(currentState.cursor);

    // FIX 3: inline opacity on the cursor span, controlled by cursorOn
    const cursorHtml = `<span class="typing-cursor" style="opacity:${cursorOn ? 1 : 0}"></span>`;
    const highlighted = highlightDart(withCursor).replace('%%CURSOR%%', cursorHtml);

    return highlighted.split('\n').map((lineHtml, i) => ({
      html:   lineHtml,
      active: i === currentLineIdx,
    }));
  }, [currentIndex, timeline, cursorOn]); // cursorOn added so blink rerenders

  // Output preview styles
  // NOTE: Use || not ?? for fs/fw because ?? only catches null/undefined — it
  // would pass 0 through, giving fontSize:'0px' (invisible) or fontWeight:0.
  // In practice Gemini never emits 0 for these fields, but || is the safe default.
  const previewStyle: React.CSSProperties = currentState
    ? {
        fontSize:      (currentState.output.fs || 16) + 'px',
        fontWeight:    currentState.output.fw || 400,
        color:         currentState.output.color ?? '#e6edf3',
        letterSpacing: (currentState.output.ls ?? 0) + 'em',
      }
    : {};

  return (
    <div id="sCode" style={{ opacity }}>
      <div className="code-section">
        <div className="code-label">▸ CODE</div>

        {/* ── Editor Window ── */}
        <div className="editor-win">
          <div className="ch">
            <div className="ch-dot" style={{ background: '#ff5f57' }} />
            <div className="ch-dot" style={{ background: '#febc2e' }} />
            <div className="ch-dot" style={{ background: '#28c840' }} />
          </div>
          <div className="ew-body">
            {/* Callouts layer */}
            <div id="calloutsLayer">
              {currentState?.callouts.map((cb, i) => (
                <Callout key={`callout-${cb.timeAdded}-${i}`} cb={cb} scriptTime={scriptTime} />
              ))}
            </div>

            {/* Code lines */}
            <div id="codeContainer">
              {renderedLines.map((line, i) => (
                <CodeLine key={i} html={line.html} active={line.active} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Output Preview ── */}
        <div className="preview-wrap">
          <div className="preview-label">▸ OUTPUT</div>
          <div className="preview-box">
            <span className="preview-text" style={previewStyle}>
              {currentState?.output.text ?? ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Outro Scene ────────────────────────────────────────────────────────────────

interface OutroSceneProps {
  lesson: LessonData;
  t: number;
  outroIn: number;
}

const OutroScene: React.FC<OutroSceneProps> = ({ lesson, t, outroIn }) => {
  const opacity =
    t >= outroIn ? easeOut(clamp((t - outroIn) / 600, 0, 1)) : 0;

  return (
    <div id="sOutro" style={{ opacity }}>
      <div className="ou-badge">✦</div>
      <div
        className="ou-title"
        dangerouslySetInnerHTML={{ __html: lesson.outro.title }}
      />
      <div className="ou-sub">{lesson.outro.doc}</div>
      <div
        className="ou-next"
        dangerouslySetInnerHTML={{ __html: lesson.outro.next }}
      />
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

export const FlutterLesson: React.FC<FlutterLessonProps> = ({
  lesson,
  voiceover,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Convert Remotion frame to milliseconds — replaces rAF `now - t0`
  const t = frameToMs(frame, fps);

  // Build timeline once (memoised — lesson data never changes at runtime)
  const { timeline, audioCues, totalScriptDuration } = useMemo(
    () => buildTimeline(lesson),
    [lesson],
  );

  // Scene timing derived from totalScriptDuration
  const { introFade, codeIn, outroIn } = useMemo(
    () => computeSceneTiming(totalScriptDuration),
    [totalScriptDuration],
  );

  return (
    <div className="phone-outer">

      {/*
        Audio tracks — two modes (MUTUALLY EXCLUSIVE):
        1. Legacy voiceover: a single MP3 starting at frame 0, used ONLY when
           the script has no per-step audio: fields (audioCues is empty).
           FIX #3: If audioCues is non-empty, this track is suppressed to
           prevent double audio.  The n8n pipeline should never set voiceover
           AND audio: fields simultaneously, but we enforce it here as a guard.
        2. Per-step cues from audioCues — each wrapped in a Remotion <Sequence>
           so it starts at exactly the right millisecond.
      */}
      {voiceover && audioCues.length === 0 && (
        <Audio src={staticFile(voiceover)} />
      )}

      {/*
        layout="none" removes the phantom <div> Remotion inserts around
        audio-only Sequences, keeping the DOM clean.

        durationInFrames strategy:
        - gapFrames     = frames until the next cue (prevents overlap for long clips).
        - MIN_CLIP_FRAMES = 300 frames (10s) — guarantees a TTS clip in a tight
          gap (e.g. a callout immediately followed by another step) is never
          hard-truncated at 4 frames before it finishes speaking.
        - Math.max(gapFrames, MIN_CLIP_FRAMES) gives each clip the larger window.
      */}
      {(() => {
        const MIN_CLIP_FRAMES = fps * 10; // 300 frames = 10s at 30fps
        return audioCues.map((cue, i) => {
          const fromFrame      = Math.round((cue.startMs / 1000) * fps);
          const nextCueMs      = audioCues[i + 1]?.startMs ?? cue.startMs + 10_000;
          const gapFrames      = Math.max(1, Math.floor(((nextCueMs - cue.startMs) / 1000) * fps));
          const durationFrames = Math.max(gapFrames, MIN_CLIP_FRAMES);
          return (
            <Sequence
              key={`${cue.file}-${i}`}
              from={fromFrame}
              durationInFrames={durationFrames}
              layout="none"
            >
              <Audio src={staticFile(cue.file)} />
            </Sequence>
          );
        });
      })()}

      {/* Notch */}
      <div className="notch">
        <div className="notch-cam" />
        <div className="notch-mic" />
      </div>

      {/* Screen */}
      <div className="screen">
        <div className="canvas">
          <IntroScene lesson={lesson} t={t} introFade={introFade} />
          <CodeScene  t={t} codeIn={codeIn} outroIn={outroIn} timeline={timeline} />
          <OutroScene lesson={lesson} t={t} outroIn={outroIn} />
        </div>
      </div>
    </div>
  );
};

export default FlutterLesson;
