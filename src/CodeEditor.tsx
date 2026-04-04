// ─────────────────────────────────────────────────────────────────────────────
// CodeEditor.tsx — Remotion Typing Engine
// All animation is driven EXCLUSIVELY by useCurrentFrame() + useVideoConfig().
// NO setTimeout / setInterval / requestAnimationFrame.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { LessonData, OutputState, StepType } from './lessonData';

// ─── CSS VARIABLES (inlined so no external stylesheet needed) ─────────────────
const CSS_VARS = {
  bg:          '#0a0e14',
  surface2:    '#161b22',
  surface3:    '#1c2128',
  border2:     '#30363d',
  accent:      '#00d4ff',
  accentWarm:  '#f59e0b',
  keyword:     '#ff7b72',
  type_:       '#79c0ff',
  string_:     '#a5d6ff',
  method:      '#d2a8ff',
  number_:     '#ffa657',
  text:        '#e6edf3',
  dim:         '#8b949e',
};

// ─── SYNTAX HIGHLIGHTER (ported from vanilla JS) ──────────────────────────────
function highlight(code: string): string {
  let h = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  h = h
    .replace(/'([^']*)('|$)/g,            `§STR§'$1$2§END§`)
    .replace(/(\b\d+(\.\d+)?\b)/g,        '§NUM§$1§END§')
    .replace(/\b(Text|TextStyle|FontWeight|Colors|Container|BoxDecoration|BorderRadius|EdgeInsets)\b/g,
                                           '§TYP§$1§END§')
    .replace(/\.(bold|deepPurple|blue|circular|all|only)\b/g,
                                           '.§MTH§$1§END§')
    .replace(/\b([a-zA-Z_]+)(?=:)/g,      '§KEY§$1§END§');

  h = h
    .replace(/§STR§/g,  `<span style="color:${CSS_VARS.string_}">`)
    .replace(/§NUM§/g,  `<span style="color:${CSS_VARS.number_}">`)
    .replace(/§TYP§/g,  `<span style="color:${CSS_VARS.type_}">`)
    .replace(/§MTH§/g,  `<span style="color:${CSS_VARS.method}">`)
    .replace(/§KEY§/g,  `<span style="color:${CSS_VARS.text}">`)
    .replace(/§END§/g,  '</span>');

  return h;
}

// ─── STEP DURATION CALCULATOR ─────────────────────────────────────────────────
function stepDurationMs(step: StepType): number {
  switch (step.a) {
    case 'type':     return step.t.length * (step.speed ?? 80);
    case 'wait':     return step.ms;
    case 'move':     return 200;
    case 'enter':    return 200;
    case 'ide_enter':return 200;
    case 'callout':  return 0;   // callouts are instant (no duration of their own)
    default:         return 0;
  }
}

// ─── TYPING ENGINE (pure functional, frame-driven) ────────────────────────────
interface EngineState {
  rawCode:    string;
  cursorIdx:  number;
  output:     OutputState;
  callouts:   Array<{ text: string; line: number }>;
}

function computeStateAtMs(script: StepType[], initialOutput: OutputState, elapsedMs: number): EngineState {
  let rawCode   = '';
  let cursorIdx = 0;
  let output    = { ...initialOutput };
  const callouts: Array<{ text: string; line: number }> = [];

  let remainingMs = elapsedMs;

  for (const step of script) {
    if (remainingMs <= 0) break;
    const dur = stepDurationMs(step);

    if (step.a === 'type') {
      const charsTyped = Math.min(
        step.t.length,
        Math.ceil(remainingMs / (step.speed ?? 80)),
      );
      const chars = step.t.slice(0, charsTyped);
      rawCode   = rawCode.slice(0, cursorIdx) + chars + rawCode.slice(cursorIdx);
      cursorIdx += charsTyped;

      // Apply output change only when this step is fully complete
      if (step.out && charsTyped >= step.t.length) {
        output = { ...output, ...step.out };
      }

      remainingMs -= dur;

    } else if (step.a === 'callout') {
      // Callouts are zero-duration — they appear the moment the step is reached
      const currentLine = rawCode.slice(0, cursorIdx).split('\n').length - 1;
      callouts.push({ text: step.text, line: currentLine });
      // remainingMs unchanged (no time consumed)

    } else if (step.a === 'wait') {
      remainingMs -= dur;

    } else if (step.a === 'move') {
      if (remainingMs >= dur) {
        cursorIdx += step.o;
        cursorIdx = Math.max(0, Math.min(cursorIdx, rawCode.length));
      }
      remainingMs -= dur;

    } else if (step.a === 'ide_enter') {
      if (remainingMs >= dur) {
        const before   = rawCode.slice(0, cursorIdx);
        const after    = rawCode.slice(cursorIdx);
        const spaces   = ' '.repeat(step.ind);
        const endSpaces = ' '.repeat(Math.max(0, step.ind - 2));
        rawCode   = before + '\n' + spaces + '\n' + endSpaces + after;
        cursorIdx += 1 + step.ind;
      }
      remainingMs -= dur;

    } else if (step.a === 'enter') {
      if (remainingMs >= dur) {
        const before = rawCode.slice(0, cursorIdx);
        const after  = rawCode.slice(cursorIdx);
        const spaces = ' '.repeat(step.ind);
        rawCode   = before + '\n' + spaces + after;
        cursorIdx += 1 + step.ind;
      }
      remainingMs -= dur;
    }
  }

  return { rawCode, cursorIdx, output, callouts };
}

// ─── LINE HEIGHT CONSTANT (matches CSS font-size 22 × line-height 1.9) ──────
const FONT_SIZE_PX   = 22;
const LINE_HEIGHT_PX = FONT_SIZE_PX * 1.9; // 41.8 px

// ─── PROPS ────────────────────────────────────────────────────────────────────
interface CodeEditorProps {
  lesson: LessonData;
  /** Frame at which the typing animation starts (absolute, from composition start) */
  startFrame: number;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export const CodeEditor: React.FC<CodeEditorProps> = ({ lesson, startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Convert frames → ms elapsed since typing started
  const elapsedMs = Math.max(0, ((frame - startFrame) / fps) * 1000);

  const { rawCode, cursorIdx, output, callouts } = computeStateAtMs(
    lesson.script,
    lesson.initialOutput,
    elapsedMs,
  );

  // ── Build highlighted HTML with cursor ──────────────────────────────────────
  const withCursor =
    rawCode.slice(0, cursorIdx) + '%%CURSOR%%' + rawCode.slice(cursorIdx);
  let highlighted = highlight(withCursor);
  highlighted = highlighted.replace(
    '%%CURSOR%%',
    `<span style="display:inline-block;width:3px;height:26px;background:${CSS_VARS.accent};` +
    `vertical-align:middle;margin-bottom:-2px;box-shadow:0 0 6px ${CSS_VARS.accent};` +
    // Remotion renders a single frame snapshot, so we keep the cursor always visible
    `opacity:${Math.floor(elapsedMs / 500) % 2 === 0 ? 1 : 0.15};"></span>`,
  );

  const lines    = highlighted.split('\n');
  const codeHtml = lines.map(l => `<div style="${codeLine}">${l || '&nbsp;'}</div>`).join('');

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={editorWin}>
      {/* Mac window chrome */}
      <div style={chromBar}>
        <div style={{ ...dot, background: '#ff5f57' }} />
        <div style={{ ...dot, background: '#febc2e' }} />
        <div style={{ ...dot, background: '#28c840' }} />
      </div>

      {/* Editor body */}
      <div style={ewBody}>
        {/* Callouts layer */}
        <div style={calloutsLayer}>
          {callouts.map((cb, i) => (
            <div
              key={i}
              style={{
                ...calloutChip,
                top: cb.line * LINE_HEIGHT_PX + LINE_HEIGHT_PX / 2,
              }}
            >
              {cb.text}
            </div>
          ))}
        </div>

        {/* Code lines */}
        <div
          dangerouslySetInnerHTML={{ __html: codeHtml }}
        />
      </div>

      {/* Output preview */}
      <div style={previewWrap}>
        <div style={previewLabel}>▸ OUTPUT</div>
        <div style={previewBox}>
          <span
            style={{
              fontFamily:    "'Cairo', sans-serif",
              fontSize:      output.fs * 2,
              fontWeight:    output.fw,
              color:         output.color,
              // letterSpacing على العربي بيكسر الحروف — بنضرب في 0 عشان نلغيه
              letterSpacing: 0,
              direction:     'rtl',
              textAlign:     'center',
              wordSpacing:   output.ls * 8 + 'px', // نعوض بـ wordSpacing بدل letterSpacing
            }}
          >
            {output.text || ''}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── INLINE STYLES ────────────────────────────────────────────────────────────
const editorWin: React.CSSProperties = {
  borderRadius:    16,
  overflow:        'hidden',
  border:          `1px solid ${CSS_VARS.border2}`,
  background:      `linear-gradient(135deg, ${CSS_VARS.surface2}, ${CSS_VARS.surface3})`,
  display:         'flex',
  flexDirection:   'column',
  // NO flex:1 — grows with content
  boxShadow:       '0 8px 24px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.05)',
};

const chromBar: React.CSSProperties = {
  background:    'linear-gradient(90deg, #1a1e26, #161b22)',
  padding:       '14px 20px',
  display:       'flex',
  alignItems:    'center',
  gap:           12,
  borderBottom:  `1px solid ${CSS_VARS.border2}`,
};

const dot: React.CSSProperties = {
  width:        16,
  height:       16,
  borderRadius: '50%',
  boxShadow:    '0 1px 3px rgba(0,0,0,.3)',
};

const ewBody: React.CSSProperties = {
  background:  CSS_VARS.surface2,
  padding:     '24px 32px',
  direction:   'ltr',
  fontSize:    FONT_SIZE_PX,
  position:    'relative',
  // height grows with code lines automatically
};

const codeLine =
  `font-family:'JetBrains Mono',monospace;font-size:${FONT_SIZE_PX}px;line-height:1.9;letter-spacing:.01em;` +
  `color:${CSS_VARS.text};white-space:pre-wrap;display:block;min-height:${LINE_HEIGHT_PX}px;position:relative;`;

const calloutsLayer: React.CSSProperties = {
  position:      'absolute',
  top:           12,
  right:         16,
  left:          16,
  bottom:        12,
  pointerEvents: 'none',
  zIndex:        10,
};

const calloutChip: React.CSSProperties = {
  position:     'absolute',
  right:        0,
  background:   `linear-gradient(135deg, ${CSS_VARS.accentWarm}, #f87316)`,
  color:        '#0a0e14',
  fontSize:     16,
  fontWeight:   800,
  padding:      '6px 20px',
  borderRadius: 32,
  whiteSpace:   'nowrap',
  boxShadow:    '0 4px 12px rgba(245,158,11,.35)',
  fontFamily:   "'Cairo', sans-serif",
  direction:    'rtl',
  transform:    'translateY(-50%)',
};

const previewWrap: React.CSSProperties = {
  borderRadius: 16,
  border:       `1px solid ${CSS_VARS.border2}`,
  background:   'linear-gradient(135deg, rgba(124,58,237,.15), rgba(0,212,255,.08))',
  display:      'flex',
  flexDirection:'column',
  gap:          10,
  padding:      20,
  boxShadow:    '0 8px 24px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.05)',
};

const previewLabel: React.CSSProperties = {
  color:         CSS_VARS.accent,
  fontSize:      16,
  fontFamily:    "'JetBrains Mono', monospace",
  letterSpacing: '.15em',
  fontWeight:    600,
};

const previewBox: React.CSSProperties = {
  background:     'linear-gradient(135deg, rgba(124,58,237,.08), rgba(0,212,255,.04))',
  border:         '1px solid rgba(0,212,255,.2)',
  borderRadius:   12,
  padding:        '24px 32px',
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'center',
};
