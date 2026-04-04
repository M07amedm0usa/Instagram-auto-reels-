// ─────────────────────────────────────────────────────────────────────────────
// CodeEditor.tsx — Remotion Typing Engine  v2
// Frame-driven only — NO setTimeout / setInterval / requestAnimationFrame.
// Supports two output preview modes:
//   • 'text'   — shows Arabic/English text (Text widget)
//   • 'visual' — shows a colored box with border-radius (Container widget)
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { LessonData, OutputState, StepType } from './lessonData';

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  bg:       '#0a0e14',
  surface2: '#161b22',
  surface3: '#1c2128',
  border:   '#30363d',
  accent:   '#00d4ff',
  warm:     '#f59e0b',
  string_:  '#a5d6ff',
  type_:    '#79c0ff',
  method:   '#d2a8ff',
  number_:  '#ffa657',
  text:     '#e6edf3',
  dim:      '#8b949e',
};

const FONT_SIZE_PX   = 22;
const LINE_HEIGHT_PX = FONT_SIZE_PX * 1.9; // 41.8 px

// ─── SYNTAX HIGHLIGHTER ───────────────────────────────────────────────────────
function highlight(code: string): string {
  let h = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  h = h
    .replace(/'([^']*)('|$)/g, `§STR§'$1$2§END§`)
    .replace(/(\b\d+(\.\d+)?\b)/g, '§NUM§$1§END§')
    .replace(
      /\b(Text|TextStyle|FontWeight|Colors|Container|BoxDecoration|BorderRadius|EdgeInsets|BoxShadow|Row|Column|Scaffold|AppBar|Padding|Center|SizedBox|Stack|Expanded|Flexible|ListView|GestureDetector|Icon|Icons|Image|ClipRRect|Align|Wrap)\b/g,
      '§TYP§$1§END§',
    )
    .replace(
      /\.(bold|w\d{3}|deepPurple|blue|red|green|orange|pink|teal|amber|circular|all|only|symmetric|fromLTRB|lerp|zero)\b/g,
      '.§MTH§$1§END§',
    )
    .replace(/\b([a-zA-Z_]+)(?=:)/g, '§KEY§$1§END§');

  return h
    .replace(/§STR§/g, `<span style="color:${T.string_}">`)
    .replace(/§NUM§/g, `<span style="color:${T.number_}">`)
    .replace(/§TYP§/g, `<span style="color:${T.type_}">`)
    .replace(/§MTH§/g, `<span style="color:${T.method}">`)
    .replace(/§KEY§/g, `<span style="color:${T.text}">`)
    .replace(/§END§/g, '</span>');
}

// ─── STEP DURATION ────────────────────────────────────────────────────────────
function stepDurationMs(step: StepType): number {
  switch (step.a) {
    case 'type':      return step.t.length * (step.speed ?? 80);
    case 'wait':      return step.ms;
    case 'move':
    case 'enter':
    case 'ide_enter': return 200;
    case 'callout':   return 0;
    default:          return 0;
  }
}

// ─── TYPING ENGINE ────────────────────────────────────────────────────────────
interface EngineState {
  rawCode:   string;
  cursorIdx: number;
  output:    OutputState;
  callouts:  { text: string; line: number }[];
}

function computeStateAtMs(
  script: StepType[],
  initialOutput: OutputState,
  elapsedMs: number,
): EngineState {
  let rawCode   = '';
  let cursorIdx = 0;
  let output    = { ...initialOutput };
  const callouts: { text: string; line: number }[] = [];
  let rem = elapsedMs;

  for (const step of script) {
    if (rem <= 0) break;
    const dur = stepDurationMs(step);

    if (step.a === 'type') {
      const typed = Math.min(step.t.length, Math.ceil(rem / (step.speed ?? 80)));
      rawCode   = rawCode.slice(0, cursorIdx) + step.t.slice(0, typed) + rawCode.slice(cursorIdx);
      cursorIdx += typed;
      if (step.out && typed >= step.t.length) output = { ...output, ...step.out };
      rem -= dur;

    } else if (step.a === 'callout') {
      const line = rawCode.slice(0, cursorIdx).split('\n').length - 1;
      callouts.push({ text: step.text, line });

    } else if (step.a === 'wait') {
      rem -= dur;

    } else if (step.a === 'move') {
      if (rem >= dur) cursorIdx = Math.max(0, Math.min(cursorIdx + step.o, rawCode.length));
      rem -= dur;

    } else if (step.a === 'ide_enter') {
      if (rem >= dur) {
        const before = rawCode.slice(0, cursorIdx);
        const after  = rawCode.slice(cursorIdx);
        const sp     = ' '.repeat(step.ind);
        const spEnd  = ' '.repeat(Math.max(0, step.ind - 2));
        rawCode   = before + '\n' + sp + '\n' + spEnd + after;
        cursorIdx += 1 + step.ind;
      }
      rem -= dur;

    } else if (step.a === 'enter') {
      if (rem >= dur) {
        rawCode   = rawCode.slice(0, cursorIdx) + '\n' + ' '.repeat(step.ind) + rawCode.slice(cursorIdx);
        cursorIdx += 1 + step.ind;
      }
      rem -= dur;
    }
  }

  return { rawCode, cursorIdx, output, callouts };
}

// ─── PROPS ────────────────────────────────────────────────────────────────────
interface CodeEditorProps {
  lesson: LessonData;
  startFrame: number;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export const CodeEditor: React.FC<CodeEditorProps> = ({ lesson, startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const elapsedMs = Math.max(0, ((frame - startFrame) / fps) * 1000);

  const { rawCode, cursorIdx, output, callouts } = computeStateAtMs(
    lesson.script,
    lesson.initialOutput,
    elapsedMs,
  );

  // Cursor blink every 500ms
  const cursorOpacity = Math.floor(elapsedMs / 500) % 2 === 0 ? 1 : 0.1;
  const cursor =
    `<span style="display:inline-block;width:3px;height:26px;` +
    `background:${T.accent};vertical-align:middle;margin-bottom:-2px;` +
    `box-shadow:0 0 8px ${T.accent};opacity:${cursorOpacity};"></span>`;

  const codeHtml = highlight(
    rawCode.slice(0, cursorIdx) + '%%CUR%%' + rawCode.slice(cursorIdx),
  )
    .replace('%%CUR%%', cursor)
    .split('\n')
    .map(l => `<div style="${codeLineStyle}">${l || '&nbsp;'}</div>`)
    .join('');

  const outputType = lesson.outputType ?? 'text';

  return (
    <div style={editorWin}>

      {/* Mac chrome */}
      <div style={chromBar}>
        <div style={{ ...dot, background: '#ff5f57' }} />
        <div style={{ ...dot, background: '#febc2e' }} />
        <div style={{ ...dot, background: '#28c840' }} />
      </div>

      {/* Code body */}
      <div style={ewBody}>
        <div style={calloutsLayer}>
          {callouts.map((cb, i) => (
            <div key={i} style={{ ...chip, top: cb.line * LINE_HEIGHT_PX + LINE_HEIGHT_PX / 2 }}>
              {cb.text}
            </div>
          ))}
        </div>
        <div dangerouslySetInnerHTML={{ __html: codeHtml }} />
      </div>

      {/* Output preview */}
      <div style={previewWrap}>
        <div style={previewLabel}>▸ OUTPUT</div>
        <div style={previewBox}>

          {/* ── TEXT mode (e.g. Text widget) ── */}
          {outputType === 'text' && (
            <span style={{
              fontFamily:  "'Cairo', sans-serif",
              fontSize:    output.fs * 2,
              fontWeight:  output.fw,
              color:       output.color,
              letterSpacing: 0,
              direction:   'rtl',
              textAlign:   'center',
              wordSpacing: output.ls * 8 + 'px',
            }}>
              {output.text || ''}
            </span>
          )}

          {/* ── VISUAL mode (e.g. Container widget) ── */}
          {outputType === 'visual' && (
            <div style={{
              width:         output.boxW ?? 200,
              height:        output.boxH ?? 100,
              background:    output.color !== '#e6edf3' ? output.color : '#1e293b',
              borderRadius:  output.radius ?? 8,
              boxShadow:     output.shadow
                ? `0 ${output.shadow}px ${output.shadow * 2}px rgba(0,0,0,0.5)`
                : 'none',
              display:       'flex',
              alignItems:    'center',
              justifyContent:'center',
              border:        '2px solid rgba(255,255,255,0.08)',
            }}>
              {output.text ? (
                <span style={{
                  fontFamily: "'Cairo', sans-serif",
                  fontSize:   Math.max(output.fs, 16),
                  fontWeight: output.fw,
                  color:      '#ffffff',
                  direction:  'rtl',
                }}>
                  {output.text}
                </span>
              ) : null}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const editorWin: React.CSSProperties = {
  borderRadius:  16,
  overflow:      'hidden',
  border:        `1px solid ${T.border}`,
  background:    `linear-gradient(135deg, ${T.surface2}, ${T.surface3})`,
  display:       'flex',
  flexDirection: 'column',
  boxShadow:     '0 8px 32px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.05)',
};

const chromBar: React.CSSProperties = {
  background:   'linear-gradient(90deg, #1a1e26, #161b22)',
  padding:      '14px 20px',
  display:      'flex',
  alignItems:   'center',
  gap:          12,
  borderBottom: `1px solid ${T.border}`,
};

const dot: React.CSSProperties = {
  width: 16, height: 16, borderRadius: '50%',
  boxShadow: '0 1px 4px rgba(0,0,0,.4)',
};

const ewBody: React.CSSProperties = {
  background: T.surface2,
  padding:    '24px 32px',
  direction:  'ltr',
  fontSize:   FONT_SIZE_PX,
  position:   'relative',
};

const codeLineStyle =
  `font-family:'JetBrains Mono',monospace;` +
  `font-size:${FONT_SIZE_PX}px;` +
  `line-height:1.9;` +
  `letter-spacing:.01em;` +
  `color:${T.text};` +
  `white-space:pre-wrap;` +
  `display:block;` +
  `min-height:${LINE_HEIGHT_PX}px;` +
  `position:relative;`;

const calloutsLayer: React.CSSProperties = {
  position:      'absolute',
  top:           24,
  right:         32,
  left:          32,
  bottom:        24,
  pointerEvents: 'none',
  zIndex:        10,
};

const chip: React.CSSProperties = {
  position:     'absolute',
  right:        0,
  background:   `linear-gradient(135deg, ${T.warm}, #f87316)`,
  color:        '#0a0e14',
  fontSize:     16,
  fontWeight:   800,
  padding:      '6px 20px',
  borderRadius: 32,
  whiteSpace:   'nowrap',
  boxShadow:    '0 4px 16px rgba(245,158,11,.4)',
  fontFamily:   "'Cairo', sans-serif",
  direction:    'rtl',
  transform:    'translateY(-50%)',
};

const previewWrap: React.CSSProperties = {
  borderRadius:  16,
  border:        `1px solid ${T.border}`,
  background:    'linear-gradient(135deg, rgba(124,58,237,.15), rgba(0,212,255,.08))',
  display:       'flex',
  flexDirection: 'column',
  gap:           10,
  padding:       20,
  boxShadow:     '0 8px 24px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.05)',
};

const previewLabel: React.CSSProperties = {
  color:         T.accent,
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
  minHeight:      100,
};
