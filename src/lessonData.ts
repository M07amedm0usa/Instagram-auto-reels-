// ─────────────────────────────────────────────────────────────────────────────
// lessonData.ts  v3 — Widget-agnostic, fully dynamic schema
//
// Design goals:
//   1. Any Flutter widget can be described via LessonData — no hardcoded widget logic.
//   2. The output preview is driven by a generic "PreviewNode" tree, not by
//      switch-cases on widget names.
//   3. All timing constants are co-located here so Root.tsx and CodeEditor.tsx
//      share a single source of truth.
// ─────────────────────────────────────────────────────────────────────────────

// ─── TIMING ──────────────────────────────────────────────────────────────────
/** All timing values in milliseconds. Import from here — never hardcode. */
export const TIMING = {
  INTRO_FADE_OUT: 2800,   // intro starts fading at this ms mark
  CODE_IN:        3000,   // code scene starts fading in
  CODE_TYPING:    3400,   // typing engine starts (after code fade completes)
} as const;

// ─── SCRIPT STEPS ────────────────────────────────────────────────────────────
export type StepType =
  | { a: 'type';      t: string; speed?: number; out?: Partial<PreviewState> }
  | { a: 'callout';   text: string }
  | { a: 'wait';      ms: number }
  | { a: 'move';      o: number }
  | { a: 'enter';     ind: number }
  | { a: 'ide_enter'; ind: number }
  | { a: 'delete';    n: number };            // ← new: delete n chars before cursor

// ─── STEP DURATION (single source of truth) ──────────────────────────────────
export function stepDurationMs(step: StepType): number {
  switch (step.a) {
    case 'type':      return step.t.length * (step.speed ?? 80);
    case 'wait':      return step.ms;
    case 'move':
    case 'enter':
    case 'ide_enter': return 200;
    case 'delete':    return step.n * 40;
    case 'callout':   return 0;
    default:          return 0;
  }
}

export function scriptDurationMs(script: StepType[]): number {
  return script.reduce((acc, s) => acc + stepDurationMs(s), 0);
}

// ─── PREVIEW STATE ────────────────────────────────────────────────────────────
/**
 * PreviewState is a flat bag of visual properties.
 * The preview renderer reads whatever is set and ignores the rest.
 * This means ANY widget can be previewed — just set the right fields.
 *
 * Conventions:
 *   text / textColor / fontSize / fontWeight — text content & style
 *   bg                                       — background color
 *   w / h                                    — dimensions (px)
 *   radius                                   — border-radius (px)
 *   shadow                                   — box-shadow elevation (0–30)
 *   padding                                  — inner padding (px)
 *   borderColor / borderWidth                — border
 *   opacity                                  — 0–1
 *   children                                 — nested PreviewNodes (Row/Column etc.)
 *   layout                                   — 'row' | 'column' | 'stack'
 *   mainAxis / crossAxis                     — flex alignment keywords
 *   gap                                      — gap between children (px)
 *   icon                                     — emoji or unicode glyph
 *   iconColor                                — icon color
 *   iconSize                                 — icon size (px)
 *   imgUrl                                   — background image URL
 *   progress                                 — 0–1 for LinearProgressIndicator etc.
 *   progressColor                            — progress bar fill color
 */
export interface PreviewState {
  // ── text ──
  text?:        string;
  textColor?:   string;
  fontSize?:    number;
  fontWeight?:  number;
  textAlign?:   'left' | 'center' | 'right';
  // ── box ──
  bg?:          string;
  w?:           number;
  h?:           number;
  radius?:      number;
  shadow?:      number;
  padding?:     number;
  // ── border ──
  borderColor?: string;
  borderWidth?: number;
  // ── misc ──
  opacity?:     number;
  // ── layout ──
  layout?:      'row' | 'column' | 'stack';
  mainAxis?:    string;
  crossAxis?:   string;
  gap?:         number;
  // ── icon ──
  icon?:        string;
  iconColor?:   string;
  iconSize?:    number;
  // ── image ──
  imgUrl?:      string;
  // ── progress ──
  progress?:    number;
  progressColor?: string;
  // ── children ──
  children?:    PreviewNode[];
}

/** A node in the preview tree. Matches a single Flutter widget conceptually. */
export interface PreviewNode extends PreviewState {
  key?: string;   // optional stable key for React
}

// ─── INTRO ────────────────────────────────────────────────────────────────────
export interface IntroProp {
  label: string;
  type:  'kw' | 'ty' | 'nm' | 'mt' | 'str';   // added 'str' for string props
}

export interface LessonIntro {
  tag:         string;   // e.g. "FLUTTER BASICS"
  number:      string;   // e.g. "01"
  title:       string;   // gradient part of the heading
  titleSuffix: string;   // plain part after gradient
  subtitle:    string;   // Arabic subtitle
  props:       IntroProp[];
}

// ─── OUTRO ───────────────────────────────────────────────────────────────────
export interface LessonOutro {
  badge:      string;
  title:      string;   // supports \n for line breaks
  subtitle:   string;
  nextLesson: string;
}

// ─── LESSON ──────────────────────────────────────────────────────────────────
export interface LessonData {
  intro:         LessonIntro;
  outro:         LessonOutro;
  initialPreview: PreviewState;   // starting state of the preview panel
  script:        StepType[];
}

// ─────────────────────────────────────────────────────────────────────────────
// SAMPLE LESSONS
// These are defaults used in Remotion Studio.
// In production, n8n sends the full LessonData as JSON via --props.
// ─────────────────────────────────────────────────────────────────────────────

// ─── 01 · Text Widget ────────────────────────────────────────────────────────
export const textWidgetLesson: LessonData = {
  intro: {
    tag:         'FLUTTER BASICS',
    number:      '01',
    title:       'Text',
    titleSuffix: ' Widget',
    subtitle:    'ازاي تعرض نص في التطبيق',
    props: [
      { label: 'Text',      type: 'kw' },
      { label: 'TextStyle', type: 'ty' },
      { label: 'fontSize',  type: 'nm' },
      { label: 'bold',      type: 'mt' },
    ],
  },
  outro: {
    badge:      '✦',
    title:      'جرب الكود\nبنفسك!',
    subtitle:   'flutter.dev/docs',
    nextLesson: 'الجزء الجاي: Container',
  },
  initialPreview: { text: '', fontSize: 16, fontWeight: 400, textColor: '#e6edf3' },
  script: [
    { a: 'type',      t: 'Text()',                        speed: 90 },
    { a: 'wait',      ms: 500 },
    { a: 'move',      o: -1 },
    { a: 'ide_enter', ind: 2 },
    { a: 'type',      t: "'مرحباً بالعالم',",             speed: 80, out: { text: 'مرحباً بالعالم' } },
    { a: 'callout',   text: 'النص المعروض' },
    { a: 'wait',      ms: 500 },
    { a: 'enter',     ind: 2 },
    { a: 'type',      t: 'style: TextStyle()',             speed: 80 },
    { a: 'move',      o: -1 },
    { a: 'ide_enter', ind: 4 },
    { a: 'type',      t: 'fontSize: 24,',                 speed: 80, out: { fontSize: 24 } },
    { a: 'callout',   text: 'حجم الخط' },
    { a: 'wait',      ms: 500 },
    { a: 'enter',     ind: 4 },
    { a: 'type',      t: 'fontWeight: FontWeight.bold,',  speed: 80, out: { fontWeight: 700 } },
    { a: 'callout',   text: 'سُمك الخط' },
    { a: 'wait',      ms: 500 },
    { a: 'enter',     ind: 4 },
    { a: 'type',      t: 'color: Colors.deepPurple,',     speed: 80, out: { textColor: '#7c3aed' } },
    { a: 'callout',   text: 'لون النص' },
    { a: 'wait',      ms: 800 },
  ],
};

// ─── 02 · Container Widget ───────────────────────────────────────────────────
export const containerWidgetLesson: LessonData = {
  intro: {
    tag:         'FLUTTER BASICS',
    number:      '02',
    title:       'Container',
    titleSuffix: ' Widget',
    subtitle:    'ازاي تغلف وتنسق الـ Widgets',
    props: [
      { label: 'Container',     type: 'kw' },
      { label: 'BoxDecoration', type: 'ty' },
      { label: 'padding',       type: 'nm' },
      { label: 'decoration',    type: 'mt' },
    ],
  },
  outro: {
    badge:      '✦',
    title:      'جرب الكود\nبنفسك!',
    subtitle:   'flutter.dev/docs',
    nextLesson: 'الجزء الجاي: Row & Column',
  },
  initialPreview: { bg: '#1e293b', w: 200, h: 100, radius: 8, shadow: 0 },
  script: [
    { a: 'type',      t: 'Container()',                               speed: 90 },
    { a: 'move',      o: -1 },
    { a: 'ide_enter', ind: 2 },
    { a: 'type',      t: 'width: 200,',                               speed: 80, out: { w: 200 } },
    { a: 'callout',   text: 'العرض بالـ px' },
    { a: 'wait',      ms: 500 },
    { a: 'enter',     ind: 2 },
    { a: 'type',      t: 'height: 100,',                              speed: 80, out: { h: 100 } },
    { a: 'callout',   text: 'الارتفاع بالـ px' },
    { a: 'wait',      ms: 500 },
    { a: 'enter',     ind: 2 },
    { a: 'type',      t: 'decoration: BoxDecoration()',               speed: 80 },
    { a: 'move',      o: -1 },
    { a: 'ide_enter', ind: 4 },
    { a: 'type',      t: 'color: Colors.blue,',                       speed: 80, out: { bg: '#1a73e8' } },
    { a: 'callout',   text: 'لون الخلفية' },
    { a: 'wait',      ms: 500 },
    { a: 'enter',     ind: 4 },
    { a: 'type',      t: 'borderRadius: BorderRadius.circular(16),',  speed: 70, out: { radius: 16 } },
    { a: 'callout',   text: 'زوايا دائرية' },
    { a: 'wait',      ms: 500 },
    { a: 'enter',     ind: 4 },
    { a: 'type',      t: 'boxShadow: [BoxShadow(blurRadius: 12)],',  speed: 70, out: { shadow: 12 } },
    { a: 'callout',   text: 'ظل تحت الـ Container' },
    { a: 'wait',      ms: 800 },
  ],
};

// ─── 03 · Row Widget (demonstrates layout children) ──────────────────────────
export const rowWidgetLesson: LessonData = {
  intro: {
    tag:         'FLUTTER BASICS',
    number:      '03',
    title:       'Row',
    titleSuffix: ' Widget',
    subtitle:    'ازاي ترص الـ Widgets جنب بعض',
    props: [
      { label: 'Row',             type: 'kw' },
      { label: 'MainAxisAlignment', type: 'ty' },
      { label: 'children',        type: 'nm' },
      { label: 'spaceEvenly',     type: 'mt' },
    ],
  },
  outro: {
    badge:      '✦',
    title:      'جرب الكود\nبنفسك!',
    subtitle:   'flutter.dev/docs',
    nextLesson: 'الجزء الجاي: Column',
  },
  initialPreview: {
    layout: 'row', mainAxis: 'flex-start', gap: 8,
    children: [],
  },
  script: [
    { a: 'type',      t: 'Row()',                                        speed: 90 },
    { a: 'move',      o: -1 },
    { a: 'ide_enter', ind: 2 },
    { a: 'type',      t: 'mainAxisAlignment: MainAxisAlignment.start,',  speed: 65,
      out: { mainAxis: 'flex-start' } },
    { a: 'callout',   text: 'ترتيب المحور الأفقي' },
    { a: 'wait',      ms: 600 },
    { a: 'enter',     ind: 2 },
    { a: 'type',      t: 'children: [',                                  speed: 80 },
    { a: 'enter',     ind: 4 },
    { a: 'type',      t: "Icon(Icons.star, color: Colors.amber),",       speed: 65,
      out: { children: [{ icon: '⭐', iconColor: '#f59e0b', iconSize: 32 }] } },
    { a: 'callout',   text: 'أيقونة نجمة' },
    { a: 'wait',      ms: 500 },
    { a: 'enter',     ind: 4 },
    { a: 'type',      t: "Icon(Icons.star, color: Colors.amber),",       speed: 65,
      out: {
        children: [
          { icon: '⭐', iconColor: '#f59e0b', iconSize: 32 },
          { icon: '⭐', iconColor: '#f59e0b', iconSize: 32 },
        ],
      } },
    { a: 'enter',     ind: 4 },
    { a: 'type',      t: "Icon(Icons.star, color: Colors.amber),",       speed: 65,
      out: {
        mainAxis: 'space-evenly',
        children: [
          { icon: '⭐', iconColor: '#f59e0b', iconSize: 32 },
          { icon: '⭐', iconColor: '#f59e0b', iconSize: 32 },
          { icon: '⭐', iconColor: '#f59e0b', iconSize: 32 },
        ],
      } },
    { a: 'callout',   text: 'spaceEvenly' },
    { a: 'wait',      ms: 800 },
  ],
};

// ─── 04 · LinearProgressIndicator ────────────────────────────────────────────
export const progressLesson: LessonData = {
  intro: {
    tag:         'FLUTTER BASICS',
    number:      '04',
    title:       'Progress',
    titleSuffix: 'Indicator',
    subtitle:    'شريط التقدم في Flutter',
    props: [
      { label: 'LinearProgressIndicator', type: 'kw' },
      { label: 'value',                   type: 'nm' },
      { label: 'color',                   type: 'mt' },
      { label: 'backgroundColor',         type: 'ty' },
    ],
  },
  outro: {
    badge:      '✦',
    title:      'جرب الكود\nبنفسك!',
    subtitle:   'flutter.dev/docs',
    nextLesson: 'الجزء الجاي: TextField',
  },
  initialPreview: { progress: 0, progressColor: '#00d4ff', bg: '#1e293b', w: 280, h: 8, radius: 4 },
  script: [
    { a: 'type',      t: 'LinearProgressIndicator()',            speed: 60 },
    { a: 'move',      o: -1 },
    { a: 'ide_enter', ind: 2 },
    { a: 'type',      t: 'value: 0.65,',                        speed: 80, out: { progress: 0.65 } },
    { a: 'callout',   text: '65% مكتمل' },
    { a: 'wait',      ms: 600 },
    { a: 'enter',     ind: 2 },
    { a: 'type',      t: 'color: Colors.cyan,',                 speed: 80, out: { progressColor: '#00d4ff' } },
    { a: 'callout',   text: 'لون الشريط' },
    { a: 'wait',      ms: 500 },
    { a: 'enter',     ind: 2 },
    { a: 'type',      t: 'backgroundColor: Colors.grey[800],',  speed: 70, out: { bg: '#374151' } },
    { a: 'callout',   text: 'لون الخلفية' },
    { a: 'wait',      ms: 800 },
    { a: 'enter',     ind: 2 },
    { a: 'type',      t: 'minHeight: 8,',                       speed: 80, out: { h: 8 } },
    { a: 'callout',   text: 'ارتفاع الشريط' },
    { a: 'wait',      ms: 800 },
  ],
};

// ── Active default (Remotion Studio preview) ──────────────────────────────────
export const defaultLesson: LessonData = containerWidgetLesson;
