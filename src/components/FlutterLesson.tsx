// ─────────────────────────────────────────────────────────────────────────────
// FlutterLesson.tsx
// Declarative Remotion component — replaces the requestAnimationFrame loop.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, Audio, staticFile } from 'remotion';
import './style.css';

import {
  buildTimeline,
  computeSceneTiming,
  highlightDart,
  findCurrentState,
  clamp,
  easeOut,
  frameToMs,
  type LessonData,
  type TimelineFrame,
  type CalloutEntry,
} from '../engine/Engine';

// ── Props ─────────────────────────────────────────────────────────────────────

export interface FlutterLessonProps {
  lesson: LessonData;
  /** Path relative to the Remotion public/ folder, e.g. "voiceover.mp3" */
  voiceover?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const LINE_HEIGHT_PX = 10.5 * 2.2; // matches CSS: font-size 10.5px × line-height 2.2

// Stagger thresholds (ms) for intro element appearance
const INTRO_STAGGER_MS = [150, 300, 450, 700, 900, 1100] as const;

// ── Sub-components ────────────────────────────────────────────────────────────

/** Blinking typing cursor — rendered inline inside code HTML. */
const TypingCursor: React.FC = () => (
  <span className="typing-cursor" />
);

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
  const age           = scriptTime - cb.timeAdded;
  const appearProg    = clamp(age / 400, 0, 1);
  const eased         = easeOut(appearProg);
  const topPos        = cb.line * LINE_HEIGHT_PX + LINE_HEIGHT_PX / 2;

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

const IntroScene: React.FC<IntroSceneProps> = ({ lesson, t, introFade }) => {
  const inP     = clamp(t / 400, 0, 1);
  const fadeOut = easeOut(1 - clamp((t - introFade) / 500, 0, 1));
  const opacity =
    t < introFade
      ? easeOut(inP)
      : t < introFade + 600
      ? fadeOut
      : 0;

  const on = (threshold: number) => t > threshold;

  return (
    <div id="sIntro" style={{ opacity }}>
      <div className={`i-tag${on(INTRO_STAGGER_MS[0]) ? ' on' : ''}`}>
        {lesson.intro.tag}
      </div>
      <div className={`i-number${on(INTRO_STAGGER_MS[1]) ? ' on' : ''}`}>
        {lesson.intro.number}
      </div>
      <div
        className={`i-title${on(INTRO_STAGGER_MS[2]) ? ' on' : ''}`}
        dangerouslySetInnerHTML={{ __html: lesson.intro.title }}
      />
      <div className={`i-sub${on(INTRO_STAGGER_MS[3]) ? ' on' : ''}`}>
        {lesson.intro.subtitle}
      </div>
      <div className={`i-divider${on(INTRO_STAGGER_MS[4]) ? ' on' : ''}`} />
      <div className={`i-props${on(INTRO_STAGGER_MS[5]) ? ' on' : ''}`}>
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

  const scriptTime    = t - codeIn - 400;
  const showContent   = scriptTime >= 0 && timeline.length > 0;
  const currentState  = showContent ? findCurrentState(timeline, scriptTime) : null;

  // Build highlighted HTML lines
  const renderedLines = useMemo(() => {
    if (!currentState) return [];

    const codeToCursor  = currentState.code.slice(0, currentState.cursor);
    const currentLineIdx = codeToCursor.split('\n').length - 1;

    // Inject the cursor placeholder, then highlight
    const withCursor =
      currentState.code.slice(0, currentState.cursor) +
      '%%CURSOR%%' +
      currentState.code.slice(currentState.cursor);

    const highlighted = highlightDart(withCursor).replace(
      '%%CURSOR%%',
      '<span class="typing-cursor"></span>',
    );

    return highlighted.split('\n').map((lineHtml, i) => ({
      html:   lineHtml,
      active: i === currentLineIdx,
    }));
  }, [currentState]);

  // Output preview styles
  const previewStyle: React.CSSProperties = currentState
    ? {
        fontSize:      (currentState.output.fs ?? 16) + 'px',
        fontWeight:    currentState.output.fw ?? 400,
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
                <Callout key={`${cb.text}-${i}`} cb={cb} scriptTime={scriptTime} />
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
  const { timeline, totalScriptDuration } = useMemo(
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
      {/* Voiceover audio — Remotion will sync this with the frame clock */}
      {voiceover && (
        <Audio src={staticFile(voiceover)} />
      )}

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
