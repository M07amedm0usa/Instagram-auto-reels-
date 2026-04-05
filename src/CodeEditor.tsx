// ─────────────────────────────────────────────────────────────────────────────
// CodeEditor.tsx — Remotion Typing Engine  v3.1 (Final Patched Version)
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { LessonData, PreviewState, StepType, stepDurationMs } from './lessonData';
import { PreviewRenderer } from './PreviewRenderer';

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
  keyword_: '#ff7b72',
  text:     '#e6edf3',
  dim:      '#8b949e',
};

const FONT_SIZE_PX   = 22;
const LINE_HEIGHT_PX = FONT_SIZE_PX * 1.9;
const EW_BODY_PADDING_TOP = 20; // fixed padding

// ─── SYNTAX HIGHLIGHTER ───────────────────────────────────────────────────────
function highlight(code: string): string {
  let h = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  h = h
    .replace(/'([^'\\]|\\.)*('|$)/g, `§STR§$&§END§`)
    .replace(/\b(\d+(\.\d+)?)\b/g, '§NUM§$1§END§')
    .replace(
      /\b(var|final|const|return|class|extends|implements|mixin|with|if|else|for|while|switch|case|break|new|this|super|null|true|false|void|async|await|import|export|enum|abstract|static|late|required)\b/g,
      '§KW§$1§END§',
    )
    .replace(
      /\b([A-Z][a-zA-Z0-9]*)\b/g,
      '§TYP§$1§END§',
    )
    .replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)(?=\s*:)/g, '§KEY§$1§END§')
    .replace(/\.([a-zA-Z_][a-zA-Z0-9_]*)(?=\(|\[|,|\)|\s|$)/g, '.§MTH§$1§END§');

  return h
    .replace(/§STR§/g, `<span style="color:${T.string_}">`)
    .replace(/§NUM§/g, `<span style="color:${T.number_}">`)
    .replace(/§KW§/g,  `<span style="color:${T.keyword_}">`)
    .replace(/§TYP§/g, `<span style="color:${T.type_}">`)
    .replace(/§MTH§/g, `<span style="color:${T.method}">`)
    .replace(/KEY/g, `<span style="color:${T.text}">`)
    .replace(/§END§/g, '</span>');
}

// ─── ENGINE STATE ─────────────────────────────────────────────────────────────
interface EngineState {
  rawCode:   string;
  cursorIdx: number;
  preview:   PreviewState;
  callouts:  { text: string; line: number }[];
}

// ─── TYPING ENGINE ─────────────────────────────────────────────────────────────
function computeStateAtMs(
  script:         StepType[],
  initialPreview: PreviewState,
  elapsedMs:      number,
): EngineState {
  let rawCode   = '';
  let cursorIdx = 0;
  let preview   = { ...initialPreview };
  const callouts: { text: string; line: number }[] = [];
  let rem = elapsedMs;

  for (const step of script) {
    if (rem <= 0) break;
    const dur = stepDurationMs(step);

    switch (step.a) {
      case 'type': {
        const charMs  = step.speed ?? 80;
        const typed   = Math.min(step.t.length, Math.ceil(rem / charMs));
        rawCode       = rawCode.slice(0, cursorIdx) + step.t.slice(0, typed) + rawCode.slice(cursorIdx);
        cursorIdx    += typed;
        if (step.out && typed >= step.t.length) {
          preview = { ...preview, ...step.out };
        }
        rem -= dur;
        break;
      }

      case 'delete': {
        if (rem >= dur) {
          const n   = Math.min(step.n, cursorIdx);
          rawCode   = rawCode.slice(0, cursorIdx - n) + rawCode.slice(cursorIdx);
          cursorIdx -= n;
        }
        rem -= dur;
        break;
      }

      case 'callout': {
        const line = rawCode.slice(0, cursorIdx).split('\n').length - 1;
        callouts.push({ text: step.text, line });
        break;
      }

      case 'wait':
        rem -= dur;
        break;

      case 'move':
        if (rem >= dur) {
          cursorIdx = Math.max(0, Math.min(cursorIdx + step.o, rawCode.length));
        }
        rem -= dur;
        break;

      case 'ide_enter': {
        if (rem >= dur) {
          const before = rawCode.slice(0, cursorIdx);
          const after  = rawCode.slice(cursorIdx);
          const sp     = ' '.repeat(step.ind);
          const spEnd  = ' '.repeat(Math.max(0, step.ind - 2));
          rawCode   = before + '\n' + sp + '\n' + spEnd + after;
          cursorIdx += 1 + step.ind;
        }
        rem -= dur;
        break;
      }

      case 'enter': {
        if (rem >= dur) {
          rawCode   = rawCode.slice(0, cursorIdx) + '\n' + ' '.repeat(step.ind) + rawCode.slice(cursorIdx);
          cursorIdx += 1 + step.ind;
        }
        rem -= dur;
        break;
      }
    }
  }

  return { rawCode, cursorIdx, preview, callouts };
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
interface CodeEditorProps {
  lesson:     LessonData;
  startFrame: number;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ lesson, startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const elapsedMs = Math.max(0, ((frame - startFrame) / fps) * 1000);

  const { rawCode, cursorIdx, preview, callouts } = computeStateAtMs(
    lesson.script,
    lesson.initialPreview,
    elapsedMs,
  );

  const cursorVisible = Math.floor(elapsedMs / 500) % 2 === 0;
  const cursor =
    `<span style="display:inline-block;width:3px;height:${FONT_SIZE_PX + 4}px;` +
    `background:${T.accent};vertical-align:middle;margin-bottom:-2px;` +
    `box-shadow:0 0 8px ${T.accent};opacity:${cursorVisible ? 1 : 0.1};"></span>`;

  // Apply §CUR§ fix: استخدام §CUR§ ليكون محمي من دالة الـ Regex
  const codeWithCursor = rawCode.slice(0, cursorIdx) + '§CUR§' + rawCode.slice(cursorIdx);
  const codeHtml = highlight(codeWithCursor)
    .replace('§CUR§', cursor) // Apply §CUR§ fix
    .split('\n')
    .map(l => `<div style="${codeLineStyle}">${l || '&nbsp;'}</div>`)
    .join('');

  return (
    <div style={editorWin}>

      <div style={chromBar}>
        <div style={{ ...dot, background: '#ff5f57' }} />
        <div style={{ ...dot, background: '#febc2e' }} />
        <div style={{ ...dot, background: '#28c840' }} />
        <span style={chromTitle}>FlutterLesson.dart</span>
      </div>

      <div style={ewBody}>
        <div style={lineNumbers}>
          {rawCode.split('\n').map((_, i) => (
            <div key={i} style={lineNumStyle}>{i + 1}</div>
          ))}
        </div>

        <div style={{ position: 'relative', flex: 1 }}>
          {callouts.map((cb, i) => (
            // تم الحفاظ على تصحيح الـ vertical positioning
            <div key={i} style={{ ...chip, top: (cb.line * LINE_HEIGHT_PX) + (LINE_HEIGHT_PX / 2) + EW_BODY_PADDING_TOP }}>
              {cb.text}
            </div>
          ))}
          <div dangerouslySetInnerHTML={{ __html: codeHtml }} />
        </div>
      </div>

      <div style={previewWrap}>
        <div style={previewLabel}>▸ OUTPUT</div>
        <PreviewRenderer state={preview} />
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
  boxShadow:     '0 8px 32px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.05)',
};

const chromBar: React.CSSProperties = {
  background:   'linear-gradient(90deg, #1a1e26, #161b22)',
  padding:      '14px 20px',
  display:      'flex',
  alignItems:   'center',
  gap:          10,
  borderBottom: `1px solid ${T.border}`,
};

const chromTitle: React.CSSProperties = {
  fontFamily:    "'JetBrains Mono', monospace",
  fontSize:      14,
  color:         T.dim,
  marginLeft:    12,
  letterSpacing: '.03em',
};

const dot: React.CSSProperties = {
  width: 14, height: 14, borderRadius: '50%',
  boxShadow: '0 1px 4px rgba(0,0,0,.4)',
  flexShrink: 0,
};

const ewBody: React.CSSProperties = {
  background: T.surface2,
  padding:    `${EW_BODY_PADDING_TOP}px 24px 20px 0`, // تم الحفاظ على تصحيح الـ padding
  direction:  'ltr',
  fontSize:   FONT_SIZE_PX,
  display:    'flex',
  position:   'relative',
  minHeight:  80,
};

const lineNumbers: React.CSSProperties = {
  display:       'flex',
  flexDirection: 'column',
  alignItems:    'flex-end',
  padding:       '0 16px',
  minWidth:      52,
  userSelect:    'none',
};

const lineNumStyle: React.CSSProperties = {
  fontFamily:  "'JetBrains Mono', monospace",
  fontSize:    FONT_SIZE_PX - 4,
  color:       T.dim,
  lineHeight:  `${LINE_HEIGHT_PX}px`,
  minHeight:   LINE_HEIGHT_PX,
  opacity:     0.5,
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

const chip: React.CSSProperties = {
  position:     'absolute',
  right:        0,
  background:   `linear-gradient(135deg, ${T.warm}, #f87316)`,
  color:        '#0a0e14',
  fontSize:     15,
  fontWeight:   800,
  padding:      '5px 18px',
  borderRadius: 32,
  whiteSpace:   'nowrap',
  boxShadow:    '0 4px 16px rgba(245,158,11,.4)',
  fontFamily:   "'Cairo', sans-serif",
  direction:    'rtl',
  transform:    'translateY(-50%)',
  zIndex:       10,
};

const previewWrap: React.CSSProperties = {
  border:        `1px solid ${T.border}`,
  borderTop:     `1px solid ${T.border}`,
  background:    'linear-gradient(135deg, rgba(124,58,237,.12), rgba(0,212,255,.06))',
  display:       'flex',
  flexDirection: 'column',
  gap:           8,
  padding:       '16px 20px',
  boxShadow:     'inset 0 1px 0 rgba(255,255,255,.04)',
};

const previewLabel: React.CSSProperties = {
  color:         T.accent,
  fontSize:      14,
  fontFamily:    "'JetBrains Mono', monospace",
  letterSpacing: '.15em',
  fontWeight:    600,
};

