// ─────────────────────────────────────────────────────────────────────────────
// lessonData.ts  v2
// Supports two output preview modes via lesson.outputType:
//   'text'   — Arabic/English text (default, e.g. Text widget)
//   'visual' — colored box that changes shape/color (e.g. Container widget)
// ─────────────────────────────────────────────────────────────────────────────

export type StepType =
  | { a: 'type';      t: string; speed?: number; out?: Partial<OutputState> }
  | { a: 'callout';   text: string }
  | { a: 'wait';      ms: number }
  | { a: 'move';      o: number }
  | { a: 'enter';     ind: number }
  | { a: 'ide_enter'; ind: number };

export interface OutputState {
  // ── text mode ──
  text:   string;
  fs:     number;   // fontSize (multiplied ×2 when rendered)
  fw:     number;   // fontWeight
  color:  string;
  ls:     number;   // letterSpacing em (converted to wordSpacing for Arabic)
  // ── visual mode ──
  boxW?:   number;  // container width px
  boxH?:   number;  // container height px
  radius?: number;  // border-radius px
  shadow?: number;  // box-shadow blur radius px
}

export interface IntroProp {
  label: string;
  type:  'kw' | 'ty' | 'nm' | 'mt';
}

export interface LessonData {
  intro: {
    tag:         string;
    number:      string;
    title:       string;
    titleSuffix: string;
    subtitle:    string;
    props:       IntroProp[];
  };
  outro: {
    badge:      string;
    title:      string;
    subtitle:   string;
    nextLesson: string;
  };
  initialOutput: OutputState;
  /** Controls which output preview renderer is used */
  outputType?: 'text' | 'visual';
  script: StepType[];
}

// ─── 01 · Text Widget ─────────────────────────────────────────────────────────
export const textWidgetLesson: LessonData = {
  outputType: 'text',
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
  initialOutput: { text: '', fs: 16, fw: 400, color: '#e6edf3', ls: 0 },
  script: [
    { a: 'type',      t: 'Text()',                        speed: 90 },
    { a: 'wait',      ms: 500 },
    { a: 'move',      o: -1 },
    { a: 'wait',      ms: 300 },
    { a: 'ide_enter', ind: 2 },
    { a: 'wait',      ms: 400 },
    { a: 'type',      t: "'مرحباً بالعالم',",             speed: 80, out: { text: 'مرحباً بالعالم' } },
    { a: 'callout',   text: 'النص المعروض' },
    { a: 'wait',      ms: 500 },
    { a: 'enter',     ind: 2 },
    { a: 'type',      t: 'style: TextStyle()',             speed: 80 },
    { a: 'wait',      ms: 400 },
    { a: 'move',      o: -1 },
    { a: 'wait',      ms: 300 },
    { a: 'ide_enter', ind: 4 },
    { a: 'wait',      ms: 400 },
    { a: 'type',      t: 'fontSize: 24,',                 speed: 80, out: { fs: 24 } },
    { a: 'callout',   text: 'حجم الخط' },
    { a: 'wait',      ms: 500 },
    { a: 'enter',     ind: 4 },
    { a: 'type',      t: 'fontWeight: FontWeight.bold,',  speed: 80, out: { fw: 700 } },
    { a: 'callout',   text: 'سُمك الخط' },
    { a: 'wait',      ms: 500 },
    { a: 'enter',     ind: 4 },
    { a: 'type',      t: 'color: Colors.deepPurple,',     speed: 80, out: { color: '#7c3aed' } },
    { a: 'callout',   text: 'لون النص' },
    { a: 'wait',      ms: 800 },
    { a: 'move',      o: 1 },
    { a: 'wait',      ms: 300 },
    { a: 'move',      o: 1 },
  ],
};

// ─── 02 · Container Widget ────────────────────────────────────────────────────
export const containerWidgetLesson: LessonData = {
  outputType: 'visual',
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
  initialOutput: {
    text: '', fs: 16, fw: 400, color: '#1e293b', ls: 0,
    boxW: 200, boxH: 100, radius: 8, shadow: 0,
  },
  script: [
    { a: 'type',      t: 'Container()',                                   speed: 90 },
    { a: 'wait',      ms: 500 },
    { a: 'move',      o: -1 },
    { a: 'wait',      ms: 300 },
    { a: 'ide_enter', ind: 2 },
    { a: 'wait',      ms: 400 },
    { a: 'type',      t: 'width: 200,',                                   speed: 80, out: { boxW: 200 } },
    { a: 'callout',   text: 'العرض بالـ px' },
    { a: 'wait',      ms: 500 },
    { a: 'enter',     ind: 2 },
    { a: 'type',      t: 'height: 100,',                                  speed: 80, out: { boxH: 100 } },
    { a: 'callout',   text: 'الارتفاع بالـ px' },
    { a: 'wait',      ms: 500 },
    { a: 'enter',     ind: 2 },
    { a: 'type',      t: 'decoration: BoxDecoration()',                   speed: 80 },
    { a: 'wait',      ms: 400 },
    { a: 'move',      o: -1 },
    { a: 'wait',      ms: 300 },
    { a: 'ide_enter', ind: 4 },
    { a: 'wait',      ms: 400 },
    { a: 'type',      t: 'color: Colors.blue,',                           speed: 80, out: { color: '#1a73e8' } },
    { a: 'callout',   text: 'لون الخلفية' },
    { a: 'wait',      ms: 500 },
    { a: 'enter',     ind: 4 },
    { a: 'type',      t: 'borderRadius: BorderRadius.circular(16),',      speed: 70, out: { radius: 16 } },
    { a: 'callout',   text: 'زوايا دائرية' },
    { a: 'wait',      ms: 500 },
    { a: 'enter',     ind: 4 },
    { a: 'type',      t: 'boxShadow: [BoxShadow(blurRadius: 12)],',      speed: 70, out: { shadow: 12 } },
    { a: 'callout',   text: 'ظل تحت الـ Container' },
    { a: 'wait',      ms: 800 },
    { a: 'move',      o: 1 },
    { a: 'wait',      ms: 300 },
    { a: 'move',      o: 1 },
  ],
};

// ── Active lesson (change this to switch in Remotion Studio) ──────────────────
export const defaultLesson = containerWidgetLesson;
