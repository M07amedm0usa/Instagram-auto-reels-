// ─────────────────────────────────────────────────────────────────────────────
// lessonData.ts — Flutter Widget Lesson Data (Container Widget example)
// Input shape consumed by FlutterLesson.tsx via inputProps
// ─────────────────────────────────────────────────────────────────────────────

export type StepType =
  | { a: 'type';     t: string; speed?: number; out?: Partial<OutputState> }
  | { a: 'callout';  text: string }
  | { a: 'wait';     ms: number }
  | { a: 'move';     o: number }
  | { a: 'enter';    ind: number }
  | { a: 'ide_enter'; ind: number };

export interface OutputState {
  text:  string;
  fs:    number;   // fontSize px
  fw:    number;   // fontWeight
  color: string;
  ls:    number;   // letterSpacing em
}

export interface IntroProp {
  label: string;
  type:  'kw' | 'ty' | 'nm' | 'mt';
}

export interface LessonData {
  /** Intro slide content */
  intro: {
    tag:     string;   // e.g. "FLUTTER BASICS"
    number:  string;   // e.g. "01"
    title:   string;   // e.g. "Text"
    titleSuffix: string; // e.g. " Widget"
    subtitle: string;
    props:   IntroProp[];
  };
  /** Outro slide content */
  outro: {
    badge:    string;
    title:    string;
    subtitle: string;
    nextLesson: string;
  };
  /** Starting state of the output preview */
  initialOutput: OutputState;
  /** Typing engine script */
  script: StepType[];
}

// ─── Text Widget lesson (the original demo) ───────────────────────────────────
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
  initialOutput: { text: '', fs: 16, fw: 400, color: '#e6edf3', ls: 0 },
  script: [
    { a: 'type',     t: 'Text()',                           speed: 90 },
    { a: 'wait',     ms: 500 },
    { a: 'move',     o: -1 },
    { a: 'wait',     ms: 300 },
    { a: 'ide_enter', ind: 2 },
    { a: 'wait',     ms: 400 },
    { a: 'type',     t: "'مرحباً بالعالم',",               speed: 80, out: { text: 'مرحباً بالعالم' } },
    { a: 'callout',  text: 'النص المعروض' },
    { a: 'wait',     ms: 500 },
    { a: 'enter',    ind: 2 },
    { a: 'type',     t: 'style: TextStyle()',               speed: 80 },
    { a: 'wait',     ms: 400 },
    { a: 'move',     o: -1 },
    { a: 'wait',     ms: 300 },
    { a: 'ide_enter', ind: 4 },
    { a: 'wait',     ms: 400 },
    { a: 'type',     t: 'fontSize: 24,',                   speed: 80, out: { fs: 24 } },
    { a: 'callout',  text: 'حجم الخط' },
    { a: 'wait',     ms: 500 },
    { a: 'enter',    ind: 4 },
    { a: 'type',     t: 'fontWeight: FontWeight.bold,',    speed: 80, out: { fw: 700 } },
    { a: 'callout',  text: 'سُمك الخط' },
    { a: 'wait',     ms: 500 },
    { a: 'enter',    ind: 4 },
    { a: 'type',     t: 'color: Colors.deepPurple,',       speed: 80, out: { color: '#7c3aed' } },
    { a: 'callout',  text: 'لون النص' },
    { a: 'wait',     ms: 500 },
    { a: 'enter',    ind: 4 },
    { a: 'type',     t: 'letterSpacing: 1.2,',             speed: 80, out: { ls: 1.2 } },
    { a: 'callout',  text: 'المسافة بين الحروف' },
    { a: 'wait',     ms: 800 },
    { a: 'move',     o: 1 },
    { a: 'wait',     ms: 300 },
    { a: 'move',     o: 1 },
  ],
};

// ─── Container Widget lesson ───────────────────────────────────────────────────
export const containerWidgetLesson: LessonData = {
  intro: {
    tag:         'FLUTTER BASICS',
    number:      '02',
    title:       'Container',
    titleSuffix: ' Widget',
    subtitle:    'ازاي تتحكم في الشكل والحجم',
    props: [
      { label: 'Container',  type: 'kw' },
      { label: 'BoxDecoration', type: 'ty' },
      { label: 'padding',    type: 'nm' },
      { label: 'borderRadius', type: 'mt' },
    ],
  },
  outro: {
    badge:      '✦',
    title:      'جرب الكود\nبنفسك!',
    subtitle:   'flutter.dev/docs',
    nextLesson: 'الجزء الجاي: Row & Column',
  },
  initialOutput: { text: 'Container', fs: 14, fw: 400, color: '#e6edf3', ls: 0 },
  script: [
    { a: 'type',     t: 'Container()',                     speed: 90 },
    { a: 'wait',     ms: 500 },
    { a: 'move',     o: -1 },
    { a: 'wait',     ms: 300 },
    { a: 'ide_enter', ind: 2 },
    { a: 'wait',     ms: 400 },
    { a: 'type',     t: 'width: 200,',                    speed: 80, out: { fs: 16 } },
    { a: 'callout',  text: 'العرض بالـ px' },
    { a: 'wait',     ms: 500 },
    { a: 'enter',    ind: 2 },
    { a: 'type',     t: 'height: 120,',                   speed: 80 },
    { a: 'callout',  text: 'الارتفاع بالـ px' },
    { a: 'wait',     ms: 500 },
    { a: 'enter',    ind: 2 },
    { a: 'type',     t: 'decoration: BoxDecoration()',    speed: 80 },
    { a: 'wait',     ms: 400 },
    { a: 'move',     o: -1 },
    { a: 'wait',     ms: 300 },
    { a: 'ide_enter', ind: 4 },
    { a: 'wait',     ms: 400 },
    { a: 'type',     t: 'color: Colors.blue,',           speed: 80, out: { color: '#1a73e8' } },
    { a: 'callout',  text: 'لون الخلفية' },
    { a: 'wait',     ms: 500 },
    { a: 'enter',    ind: 4 },
    { a: 'type',     t: 'borderRadius: BorderRadius.circular(16),', speed: 70, out: { ls: 0.5 } },
    { a: 'callout',  text: 'زوايا دائرية' },
    { a: 'wait',     ms: 800 },
    { a: 'move',     o: 1 },
    { a: 'wait',     ms: 300 },
    { a: 'move',     o: 1 },
  ],
};

// Default export — swap this to change the active lesson
export const defaultLesson = textWidgetLesson;
    
