// ── SCRIPT DATA ───────────────────────────────────────────────────────────────
// Ported from the original HTML IDE simulator
// Each step maps to a Remotion frame range

export type ScriptStep =
  | { a: "type"; t: string; speed: number; out?: Partial<PreviewState> }
  | { a: "wait"; ms: number }
  | { a: "move"; o: number }
  | { a: "enter"; ind: number }
  | { a: "ide_enter"; ind: number }
  | { a: "callout"; text: string };

export interface PreviewState {
  text: string;
  fs: number;
  fw: number;
  color: string;
  ls: number;
}

export const INITIAL_PREVIEW: PreviewState = {
  text: "",
  fs: 16,
  fw: 400,
  color: "#e6edf3",
  ls: 0,
};

export const SCRIPT: ScriptStep[] = [
  { a: "type", t: "Text()", speed: 90 },
  { a: "wait", ms: 500 },
  { a: "move", o: -1 },
  { a: "wait", ms: 300 },
  { a: "ide_enter", ind: 2 },
  { a: "wait", ms: 400 },
  { a: "type", t: "'مرحباً بالعالم',", speed: 80, out: { text: "مرحباً بالعالم" } },
  { a: "callout", text: "النص المعروض" },
  { a: "wait", ms: 500 },
  { a: "enter", ind: 2 },
  { a: "type", t: "style: TextStyle()", speed: 80 },
  { a: "wait", ms: 400 },
  { a: "move", o: -1 },
  { a: "wait", ms: 300 },
  { a: "ide_enter", ind: 4 },
  { a: "wait", ms: 400 },
  { a: "type", t: "fontSize: 24,", speed: 80, out: { fs: 24 } },
  { a: "callout", text: "حجم الخط" },
  { a: "wait", ms: 500 },
  { a: "enter", ind: 4 },
  { a: "type", t: "fontWeight: FontWeight.bold,", speed: 80, out: { fw: 700 } },
  { a: "callout", text: "سُمك الخط" },
  { a: "wait", ms: 500 },
  { a: "enter", ind: 4 },
  { a: "type", t: "color: Colors.deepPurple,", speed: 80, out: { color: "#7c3aed" } },
  { a: "callout", text: "لون النص" },
  { a: "wait", ms: 500 },
  { a: "enter", ind: 4 },
  { a: "type", t: "letterSpacing: 1.2,", speed: 80, out: { ls: 1.2 } },
  { a: "callout", text: "المسافة بين الحروف" },
  { a: "wait", ms: 800 },
  { a: "move", o: 1 },
  { a: "wait", ms: 300 },
  { a: "move", o: 1 },
];

// ── TIMELINE BUILDER ──────────────────────────────────────────────────────────
// Convert script steps → cumulative ms timestamps (same logic as HTML)

export interface StepTiming {
  step: ScriptStep;
  startMs: number;
  endMs: number;
  /** for 'type' steps: char-by-char timestamps */
  charTimestamps?: number[];
}

export function buildTimeline(script: ScriptStep[]): StepTiming[] {
  const timeline: StepTiming[] = [];
  let cursor = 0;

  for (const step of script) {
    let duration = 0;
    const charTimestamps: number[] = [];

    if (step.a === "type") {
      // Each char takes `speed` ms
      for (let i = 0; i < step.t.length; i++) {
        charTimestamps.push(cursor + i * step.speed);
      }
      duration = step.t.length * step.speed;
    } else if (step.a === "wait") {
      duration = step.ms;
    } else {
      // move, enter, ide_enter, callout — 300ms
      duration = 300;
    }

    timeline.push({
      step,
      startMs: cursor,
      endMs: cursor + duration,
      charTimestamps: step.a === "type" ? charTimestamps : undefined,
    });

    cursor += duration;
  }

  return timeline;
}

export const SCRIPT_TIMELINE = buildTimeline(SCRIPT);
export const SCRIPT_DURATION_MS = SCRIPT_TIMELINE[SCRIPT_TIMELINE.length - 1].endMs;

// ── FRAME-BASED QUERY ─────────────────────────────────────────────────────────
// Given a ms timestamp in the code scene, resolve the current code string
// and preview state (same stateful logic as the HTML engine)

export function resolveStateAtMs(ms: number): {
  code: string;
  preview: PreviewState;
  callouts: Array<{ text: string; line: number }>;
} {
  let rawCode = "";
  let cursorIdx = 0;
  let preview: PreviewState = { ...INITIAL_PREVIEW };
  const callouts: Array<{ text: string; line: number }> = [];

  for (const entry of SCRIPT_TIMELINE) {
    if (entry.startMs > ms) break;

    const step = entry.step;

    if (step.a === "type" && entry.charTimestamps) {
      // How many chars have been typed by `ms`?
      let charsTyped = 0;
      for (const ct of entry.charTimestamps) {
        if (ct <= ms) charsTyped++;
        else break;
      }
      const chunk = step.t.slice(0, charsTyped);
      rawCode = rawCode.slice(0, cursorIdx) + chunk + rawCode.slice(cursorIdx);
      cursorIdx += charsTyped;
      if (entry.endMs <= ms && step.out) {
        preview = { ...preview, ...step.out };
      }
    } else if (step.a === "move" && entry.endMs <= ms) {
      cursorIdx += step.o;
    } else if (step.a === "ide_enter" && entry.endMs <= ms) {
      const before = rawCode.slice(0, cursorIdx);
      const after = rawCode.slice(cursorIdx);
      const spaces = " ".repeat(step.ind);
      const spacesEnd = " ".repeat(step.ind - 2);
      rawCode = before + "\n" + spaces + "\n" + spacesEnd + after;
      cursorIdx += 1 + step.ind;
    } else if (step.a === "enter" && entry.endMs <= ms) {
      const before = rawCode.slice(0, cursorIdx);
      const after = rawCode.slice(cursorIdx);
      const spaces = " ".repeat(step.ind);
      rawCode = before + "\n" + spaces + after;
      cursorIdx += 1 + step.ind;
    } else if (step.a === "callout" && entry.endMs <= ms) {
      const currentLine = rawCode.slice(0, cursorIdx).split("\n").length - 1;
      callouts.push({ text: step.text, line: currentLine });
    }
  }

  return { code: rawCode, preview, callouts };
}
