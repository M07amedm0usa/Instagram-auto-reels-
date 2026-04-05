// ─────────────────────────────────────────────────────────────────────────────
// Engine.ts  –  Timeline builder & Dart syntax highlighter
// ─────────────────────────────────────────────────────────────────────────────

// ── Types ────────────────────────────────────────────────────────────────────

export interface OutputState {
  text: string;
  fs: number;
  fw: number;
  color: string;
  ls: number;
}

export interface CalloutEntry {
  text: string;
  line: number;
  timeAdded: number;
}

/** A single snapshot pushed into the TIMELINE array. */
export interface TimelineFrame {
  time: number;
  code: string;
  cursor: number;
  callouts: CalloutEntry[];
  output: OutputState;
}

// ── Script step DSL types ────────────────────────────────────────────────────

export interface StepSync    { sync: number }
export interface StepType    { type: string; out?: Partial<OutputState>; audio?: string }
export interface StepError   { error: string; fix: string; out?: Partial<OutputState>; audio?: string }
export interface StepCallout { callout: string; audio?: string }
export interface StepMove    { move: number }
export interface StepEnter   { enter: number }
export interface StepWait    { wait: number }

/**
 * A resolved audio cue: the mp3 filename + exact ms offset from
 * the very beginning of the video (includes the intro offset).
 * Built by buildTimeline(), consumed by FlutterLesson as <Audio startFrom>.
 */
export interface AudioCue {
  /** filename inside src/assets/, e.g. "step_01.mp3" */
  file: string;
  /**
   * Absolute video time in ms when this clip must start.
   * = CODE_START_OFFSET_MS + scriptTime
   */
  startMs: number;
}

export type ScriptStep =
  | StepSync
  | StepType
  | StepError
  | StepCallout
  | StepMove
  | StepEnter
  | StepWait;

export interface LessonIntro {
  tag: string;
  number: string;
  title: string;       // may contain HTML (e.g. <span>Text</span>)
  subtitle: string;
  props: { text: string; type: string }[];
}

export interface LessonOutro {
  title: string;       // may contain HTML
  doc: string;
  next: string;        // may contain HTML
}

export interface LessonData {
  intro: LessonIntro;
  outro: LessonOutro;
  script: ScriptStep[];
}

// ── Timeline build result ─────────────────────────────────────────────────────

export interface TimelineResult {
  timeline: TimelineFrame[];
  /** All audio cues extracted from script steps, ready for <Audio startFrom> */
  audioCues: AudioCue[];
  totalScriptDuration: number;
}

// ── Type-guards ───────────────────────────────────────────────────────────────

function isSync    (s: ScriptStep): s is StepSync    { return 'sync'    in s; }
function isType    (s: ScriptStep): s is StepType    { return 'type'    in s; }
function isError   (s: ScriptStep): s is StepError   { return 'error'   in s; }
function isCallout (s: ScriptStep): s is StepCallout { return 'callout' in s; }
function isMove    (s: ScriptStep): s is StepMove    { return 'move'    in s; }
function isEnter   (s: ScriptStep): s is StepEnter   { return 'enter'   in s; }
function isWait    (s: ScriptStep): s is StepWait    { return 'wait'    in s; }

// ── 1. Syntax Highlighter ─────────────────────────────────────────────────────

/**
 * FIX 4: DART_KEYWORDS and DART_TOKEN_REGEX are module-scope constants —
 * built exactly once at load time, not rebuilt on every highlightDart() call.
 * String.prototype.replace resets a global RegExp's lastIndex before running,
 * so reusing a compiled /g regex across calls is safe.
 */
const DART_KEYWORDS =
  'void|return|final|const|var|class|extends|implements|import|export|' +
  'new|this|super|null|async|await|if|else|for|while|do|switch|case|' +
  'break|continue|default|try|catch|finally|throw|in|is|as|late|required';

const DART_TOKEN_REGEX = new RegExp(
  '(%%CURSOR%%)' +
  '|(§ERR§.*?§ENDERR§)' +
  '|(\\/\\/.*)' +
  "|('(?:[^'\\\\]|\\\\.)*'|\"(?:[^\"\\\\]|\\\\.)*\")" +
  '|(\\b(?:' + DART_KEYWORDS + ')\\b)' +
  '|(\\b(?:\\d+(?:\\.\\d+)?|true|false)\\b)' +
  '|([A-Z][a-zA-Z0-9_]*\\b)' +
  '|\\.([a-z][a-zA-Z0-9_]*)\\b' +
  '|([a-z][a-zA-Z0-9_]*)(?=:)',
  'g',
);

/**
 * Single-pass regex highlighter for Dart code snippets.
 * Returns an HTML string with <span> tags for each token type.
 * The special placeholder %%CURSOR%% is preserved untouched so the caller
 * can inject the blinking cursor element after the fact.
 */
export function highlightDart(code: string): string {
  // Escape HTML first (but preserve our internal markers)
  const h = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // Defensive reset — replace() already does this, but makes intent explicit
  DART_TOKEN_REGEX.lastIndex = 0;
  return h.replace(
    DART_TOKEN_REGEX,
    (
      match,
      grpCursor,   // 1 – %%CURSOR%%
      grpError,    // 2 – §ERR§…§ENDERR§
      grpComment,  // 3 – // comment
      grpString,   // 4 – 'string' | "string"
      grpKeyword,  // 5 – Dart keyword
      grpNumber,   // 6 – number | true | false
      grpClass,    // 7 – UpperCamelCase
      grpMethod,   // 8 – .methodName
      grpKey,      // 9 – namedArg:
    ) => {
      if (grpCursor)  return match; // keep placeholder intact
      if (grpError) {
        const pureText = match.replace('§ERR§', '').replace('§ENDERR§', '');
        return `<span class="squiggly-error">${pureText}</span>`;
      }
      if (grpComment) return `<span style="color:var(--comment);font-style:italic">${match}</span>`;
      if (grpString)  return `<span style="color:var(--string)">${match}</span>`;
      if (grpKeyword) return `<span style="color:var(--keyword)">${match}</span>`;
      if (grpNumber)  return `<span style="color:var(--number)">${match}</span>`;
      if (grpClass)   return `<span style="color:var(--type)">${match}</span>`;
      if (grpMethod)  return `.<span style="color:var(--method)">${grpMethod}</span>`;
      if (grpKey)     return `<span style="color:#e6edf3">${match}</span>`;
      return match;
    },
  );
}

// ── 2. Audio offset constant ──────────────────────────────────────────────────

/**
 * FIX 5: Module-level constant — single source of truth for the
 * video-start → script-clock-start offset.
 *
 *   codeIn      = 2800 ms  (from computeSceneTiming)
 *   CODE_FADE_MS =  400 ms  (CodeScene fade-in before script clock starts:
 *                            scriptTime = t - codeIn - 400)
 *   ─────────────────────────────────────────────────────────
 *   CODE_START_OFFSET_MS = 3200 ms
 *
 * buildTimeline no longer calls computeSceneTiming(0) just to read codeIn.
 * If either constant changes, update them here and both stay in sync.
 */
const CODE_FADE_MS          = 400;
export const CODE_START_OFFSET_MS = 2800 + CODE_FADE_MS; // 3200 ms

/**
 * FIX 1: ERR_OPEN_LEN = length of the OPENING error marker only ('§ERR§' = 5).
 *
 * The visual cursor must sit AFTER §ERR§ + the typed text, but BEFORE §ENDERR§,
 * so that %%CURSOR%% is injected *inside* the squiggly-error <span>.
 *
 * Old code used 13 = len('§ERR§') + len('§ENDERR§'), which pushed the cursor
 * 8 characters past the end of the error text — placing the blinking cursor
 * after the closing bracket of the span (invisible / wrong position).
 */
const ERR_OPEN_LEN = 5; // '§ERR§'.length  ← NOT combined with §ENDERR§

// ── 3. Timeline Builder ───────────────────────────────────────────────────────

/**
 * Processes the lesson script DSL and returns an array of TimelineFrame
 * snapshots plus the total duration of the coding animation in ms.
 *
 * Deterministic pure function — identical input always produces identical
 * output.  Call it once at component mount time and cache the result.
 */
export function buildTimeline(lesson: LessonData): TimelineResult {
  const timeline:  TimelineFrame[] = [];
  const audioCues: AudioCue[]      = [];

  let currentTime = 0;
  let code        = '';
  let cursor      = 0;
  let callouts:   CalloutEntry[] = [];
  let output:     OutputState = { text: '', fs: 16, fw: 400, color: '#e6edf3', ls: 0 };

  /** Push a snapshot of current state into the timeline. */
  const push = () =>
    timeline.push({
      time: currentTime,
      code,
      cursor,
      callouts: [...callouts],
      output: { ...output },
    });

  /**
   * Register an audio cue using the module-level CODE_START_OFFSET_MS.
   * Audio is registered BEFORE advancing currentTime so the clip starts
   * exactly when the first character of the step appears on screen.
   */
  const addAudio = (file: string) =>
    audioCues.push({ file, startMs: CODE_START_OFFSET_MS + currentTime });

  for (const step of lesson.script) {

    // ── sync ──────────────────────────────────────────────────────────────────
    if (isSync(step)) {
      if (currentTime < step.sync) currentTime = step.sync;
      continue;
    }

    // ── type ──────────────────────────────────────────────────────────────────
    if (isType(step)) {
      if (step.audio) addAudio(step.audio);
      for (const char of step.type) {
        code = code.slice(0, cursor) + char + code.slice(cursor);
        cursor++;
        currentTime += 50;
        push();
      }
      if (step.out) {
        output = { ...output, ...step.out };
        push();
      }
      continue;
    }

    // ── error / fix ───────────────────────────────────────────────────────────
    if (isError(step)) {
      if (step.audio) addAudio(step.audio);

      // Type the wrong chars — cursor is INSIDE the error span (FIX 1)
      let errorStr = '';
      for (const char of step.error) {
        errorStr += char;
        const tempCode =
          code.slice(0, cursor) +
          `§ERR§${errorStr}§ENDERR§` +
          code.slice(cursor);
        currentTime += 60;
        timeline.push({
          time:     currentTime,
          code:     tempCode,
          cursor:   cursor + ERR_OPEN_LEN + errorStr.length, // FIX 1
          callouts: [...callouts],
          output:   { ...output },
        });
      }

      // Pause so the squiggly line is visible
      currentTime += 600;
      const fullErrCode =
        code.slice(0, cursor) +
        `§ERR§${step.error}§ENDERR§` +
        code.slice(cursor);
      timeline.push({
        time:     currentTime,
        code:     fullErrCode,
        cursor:   cursor + ERR_OPEN_LEN + step.error.length, // FIX 1
        callouts: [...callouts],
        output:   { ...output },
      });

      // Erase the wrong chars quickly
      for (let i = 0; i < step.error.length; i++) {
        errorStr = errorStr.slice(0, -1);
        const tempCode =
          errorStr.length > 0
            ? code.slice(0, cursor) + `§ERR§${errorStr}§ENDERR§` + code.slice(cursor)
            : code;
        currentTime += 40;
        timeline.push({
          time:     currentTime,
          code:     tempCode,
          cursor:   cursor + (errorStr.length > 0 ? ERR_OPEN_LEN + errorStr.length : 0), // FIX 1
          callouts: [...callouts],
          output:   { ...output },
        });
      }
      currentTime += 200;

      // Type the correct fix
      for (const char of step.fix) {
        code = code.slice(0, cursor) + char + code.slice(cursor);
        cursor++;
        currentTime += 60;
        push();
      }
      if (step.out) {
        output = { ...output, ...step.out };
        push();
      }
      continue;
    }

    // ── callout ───────────────────────────────────────────────────────────────
    if (isCallout(step)) {
      if (step.audio) addAudio(step.audio);
      const lineIndex = code.slice(0, cursor).split('\n').length - 1;
      callouts = [
        ...callouts,
        { text: step.callout, line: lineIndex, timeAdded: currentTime },
      ];
      push();
      continue;
    }

    // ── move ──────────────────────────────────────────────────────────────────
    if (isMove(step)) {
      // Clamp cursor so it never goes below 0 or past the end of the code string.
      // An out-of-bounds cursor causes code.slice(0, cursor) to return '' or the
      // full string, producing a wrong active-line highlight and misplaced cursor.
      cursor      = Math.max(0, Math.min(code.length, cursor + step.move));
      currentTime += 150;
      push();
      continue;
    }

    // ── enter (newline + indent) ──────────────────────────────────────────────
    if (isEnter(step)) {
      const sp         = ' '.repeat(step.enter);
      const isIndented = code.slice(cursor).startsWith(')');
      if (isIndented) {
        // Inserts: '\n' + sp(enter) + '\n' + spEnd(enter-2)
        // Cursor must land AFTER the second '\n' and its indent so the active
        // line highlight targets the inner body line, not the closing-paren line.
        // Advancement: 1 ('\n') + enter (sp) + 1 ('\n') = 2 + enter chars.
        const spEnd = ' '.repeat(Math.max(0, step.enter - 2));
        code    = code.slice(0, cursor) + '\n' + sp + '\n' + spEnd + code.slice(cursor);
        cursor += 2 + step.enter; // skip '\n' + sp + '\n' → lands on inner indent
      } else {
        code    = code.slice(0, cursor) + '\n' + sp + code.slice(cursor);
        cursor += 1 + step.enter;
      }
      currentTime += 150;
      push();
      continue;
    }

    // ── wait ──────────────────────────────────────────────────────────────────
    if (isWait(step)) {
      currentTime += step.wait;
      push();
      continue;
    }
  }

  return { timeline, audioCues, totalScriptDuration: currentTime };
}

// ── 4. Scene Timing Helper ────────────────────────────────────────────────────

export interface SceneTiming {
  introFade:  number;
  codeIn:     number;
  codeEnd:    number;
  outroIn:    number;
  totalDuration: number;
}

export function computeSceneTiming(totalScriptDuration: number): SceneTiming {
  const introFade = 2500;
  const codeIn    = 2800;
  const codeEnd   = codeIn + totalScriptDuration + 800;
  const outroIn   = codeEnd + 800;
  return {
    introFade,
    codeIn,
    codeEnd,
    outroIn,
    totalDuration: outroIn + 2500,
  };
}

// ── 5. Utility ────────────────────────────────────────────────────────────────

export const clamp   = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const easeOut = (t: number) => 1 - (1 - t) ** 3;

/** Convert a Remotion frame number to milliseconds. */
export const frameToMs = (frame: number, fps: number) => (frame / fps) * 1000;

/**
 * Binary-search the latest TIMELINE entry whose `time` ≤ scriptTime.
 * O(log n) — safe to call on every Remotion frame.
 */
export function findCurrentState(
  timeline: TimelineFrame[],
  scriptTime: number,
): TimelineFrame {
  return timeline[findCurrentIndex(timeline, scriptTime)];
}

/**
 * Binary-search version that returns the array INDEX instead of the frame
 * object.  Used by FlutterLesson so useMemo can depend on a stable number,
 * not an object reference (which is a new pointer on every call).
 */
export function findCurrentIndex(
  timeline: TimelineFrame[],
  scriptTime: number,
): number {
  if (timeline.length === 0) return 0;
  let lo = 0;
  let hi = timeline.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (timeline[mid].time <= scriptTime) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return lo;
}
