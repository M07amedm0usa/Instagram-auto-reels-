// ─────────────────────────────────────────────────────────────────────────────
// Engine.ts  –  Timeline builder & Dart syntax highlighter
// Ported from the vanilla HTML/JS animation loop into pure TypeScript.
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
export interface StepType    { type: string; out?: Partial<OutputState> }
export interface StepError   { error: string; fix: string; out?: Partial<OutputState> }
export interface StepCallout { callout: string }
export interface StepMove    { move: number }
export interface StepEnter   { enter: number }
export interface StepWait    { wait: number }

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
 * Single-pass regex highlighter for Dart code snippets.
 * Returns an HTML string with <span> tags for each token type.
 * The special placeholder %%CURSOR%% is preserved untouched so the caller
 * can inject the blinking cursor element after the fact.
 */
export function highlightDart(code: string): string {
  // Escape HTML first (but preserve our internal markers)
  let h = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const tokenRegex =
    /(%%CURSOR%%)|(§ERR§.*?§ENDERR§)|(\/\/.*)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|(\b(?:\d+(?:\.\d+)?|true|false)\b)|([A-Z][a-zA-Z0-9_]*\b)|\.([a-z][a-zA-Z0-9_]*)\b|([a-z][a-zA-Z0-9_]*)(?=:)/g;

  return h.replace(
    tokenRegex,
    (
      match,
      grpCursor,   // 1 – %%CURSOR%%
      grpError,    // 2 – §ERR§…§ENDERR§
      grpComment,  // 3 – // comment
      grpString,   // 4 – 'string' | "string"
      grpNumber,   // 5 – number | true | false
      grpClass,    // 6 – UpperCamelCase
      grpMethod,   // 7 – .methodName
      grpKey,      // 8 – namedArg:
    ) => {
      if (grpCursor)  return match;                                                                   // keep placeholder intact
      if (grpError) {
        const pureText = match.replace('§ERR§', '').replace('§ENDERR§', '');
        return `<span class="squiggly-error">${pureText}</span>`;
      }
      if (grpComment) return `<span style="color:var(--comment);font-style:italic">${match}</span>`;
      if (grpString)  return `<span style="color:var(--string)">${match}</span>`;
      if (grpNumber)  return `<span style="color:var(--number)">${match}</span>`;
      if (grpClass)   return `<span style="color:var(--type)">${match}</span>`;
      if (grpMethod)  return `.<span style="color:var(--method)">${grpMethod}</span>`;
      if (grpKey)     return `<span style="color:#e6edf3">${match}</span>`;
      return match;
    },
  );
}

// ── 2. Timeline Builder ───────────────────────────────────────────────────────

/**
 * Processes the lesson script DSL and returns an array of TimelineFrame
 * snapshots plus the total duration of the coding animation in ms.
 *
 * This is a deterministic, pure function – identical input always produces
 * identical output.  Call it once at module load / component mount time and
 * cache the result.
 */
export function buildTimeline(lesson: LessonData): TimelineResult {
  const timeline: TimelineFrame[] = [];

  let currentTime = 0;
  let code        = '';
  let cursor      = 0;
  let callouts:   CalloutEntry[] = [];
  let output:     OutputState = { text: '', fs: 16, fw: 400, color: '#e6edf3', ls: 0 };

  /** Convenience: push a snapshot of the current state */
  const push = () =>
    timeline.push({
      time: currentTime,
      code,
      cursor,
      callouts: [...callouts],
      output: { ...output },
    });

  for (const step of lesson.script) {

    // ── sync ──────────────────────────────────────────────────────────────────
    if (isSync(step)) {
      if (currentTime < step.sync) currentTime = step.sync;
      continue;
    }

    // ── type ──────────────────────────────────────────────────────────────────
    if (isType(step)) {
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
      // Type the wrong characters with the error marker
      let errorStr = '';
      for (const char of step.error) {
        errorStr += char;
        const tempCode =
          code.slice(0, cursor) +
          `§ERR§${errorStr}§ENDERR§` +
          code.slice(cursor);
        currentTime += 60;
        timeline.push({
          time: currentTime,
          code: tempCode,
          cursor: cursor + 17 + errorStr.length,
          callouts: [...callouts],
          output: { ...output },
        });
      }

      // Pause so the squiggly line is visible
      currentTime += 600;
      const fullErrCode =
        code.slice(0, cursor) +
        `§ERR§${step.error}§ENDERR§` +
        code.slice(cursor);
      timeline.push({
        time: currentTime,
        code: fullErrCode,
        cursor: cursor + 17 + step.error.length,
        callouts: [...callouts],
        output: { ...output },
      });

      // Erase the wrong characters quickly
      for (let i = 0; i < step.error.length; i++) {
        errorStr = errorStr.slice(0, -1);
        const tempCode =
          errorStr.length > 0
            ? code.slice(0, cursor) + `§ERR§${errorStr}§ENDERR§` + code.slice(cursor)
            : code;
        currentTime += 40;
        timeline.push({
          time: currentTime,
          code: tempCode,
          cursor: cursor + (errorStr.length > 0 ? 17 + errorStr.length : 0),
          callouts: [...callouts],
          output: { ...output },
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
      cursor    += step.move;
      currentTime += 150;
      push();
      continue;
    }

    // ── enter (newline + indent) ──────────────────────────────────────────────
    if (isEnter(step)) {
      const sp         = ' '.repeat(step.enter);
      const isIndented = code.slice(cursor).startsWith(')');
      if (isIndented) {
        const spEnd = ' '.repeat(Math.max(0, step.enter - 2));
        code   = code.slice(0, cursor) + '\n' + sp + '\n' + spEnd + code.slice(cursor);
      } else {
        code   = code.slice(0, cursor) + '\n' + sp + code.slice(cursor);
      }
      cursor      += 1 + step.enter;
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

  return { timeline, totalScriptDuration: currentTime };
}

// ── 3. Scene Timing Helper ────────────────────────────────────────────────────

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

// ── 4. Utility ────────────────────────────────────────────────────────────────

export const clamp  = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const easeOut = (t: number) => 1 - (1 - t) ** 3;

/** Convert a Remotion frame number to milliseconds. */
export const frameToMs = (frame: number, fps: number) => (frame / fps) * 1000;

/** Binary-search the latest TIMELINE entry whose `time` ≤ scriptTime. */
export function findCurrentState(
  timeline: TimelineFrame[],
  scriptTime: number,
): TimelineFrame {
  for (let i = timeline.length - 1; i >= 0; i--) {
    if (timeline[i].time <= scriptTime) return timeline[i];
  }
  return timeline[0];
}
