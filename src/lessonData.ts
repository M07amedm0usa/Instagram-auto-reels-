// ─────────────────────────────────────────────────────────────────────────────
// lessonData.ts — Types, Constants, and Helper Functions (God Mode Enabled)
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';

export const TIMING = {
  INTRO_FADE_OUT: 2000,
  CODE_IN:        2400,
  CODE_TYPING:    3000,
};

// 🔥 The Universal Node Schema 🔥
export interface PreviewNode {
  id?: string;
  key?: string | number;
  
  // ── 1. God Mode Properties (New) ──
  style?: React.CSSProperties;       // يقبل أي كود CSS قياسي
  tag?: keyof JSX.IntrinsicElements; // 'div', 'span', 'img', الخ

  // ── 2. Legacy / Helper Properties ──
  layout?: 'row' | 'column';
  mainAxis?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  crossAxis?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  gap?: number | string;
  w?: number | string;
  h?: number | string;
  bg?: string;
  imgUrl?: string;
  radius?: number | string;
  shadow?: number;
  borderColor?: string;
  borderWidth?: number;
  padding?: number | string;
  opacity?: number;
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
  zIndex?: number;

  // Positioned properties (Stack)
  stackTop?: number | string;
  stackBottom?: number | string;
  stackLeft?: number | string;
  stackRight?: number | string;

  // Content
  text?: string;
  textColor?: string;
  fontSize?: number | string;
  fontWeight?: number | string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  
  icon?: string;
  iconSize?: number | string;
  iconColor?: string;

  progress?: number;
  progressColor?: string;

  children?: PreviewNode[];
}

export type PreviewState = PreviewNode;

// ── Script Steps ──
export type StepType =
  | { a: 'type'; t: string; speed?: number; out?: PreviewState }
  | { a: 'delete'; n: number; dur?: number; out?: PreviewState }
  | { a: 'callout'; text: string }
  | { a: 'wait'; ms: number }
  | { a: 'move'; o: number; dur?: number }
  | { a: 'ide_enter'; ind: number }
  | { a: 'enter'; ind: number };

export interface LessonData {
  lessonId: string;
  intro: {
    tag: string;
    number: string;
    title: string;
    titleSuffix?: string;
    subtitle: string;
    props: { label: string; type?: string; class?: string }[];
  };
  outro: {
    badge?: string;
    title?: string;
    docLink?: string;
    subtitle?: string;
    nextVideo?: string;
    nextLesson?: string;
  };
  initialPreview: PreviewState;
  script: StepType[];
}

// ── Timing Helper ──
export function stepDurationMs(step: StepType): number {
  switch (step.a) {
    case 'type':      return (step.t.length * (step.speed ?? 80));
    case 'delete':    return step.dur ?? 200;
    case 'wait':      return step.ms;
    case 'move':      return step.dur ?? 150;
    case 'ide_enter': return 300;
    case 'enter':     return 150;
    case 'callout':   return 0; // callouts happen instantly
    default:          return 0;
  }
}
// ── Default Fallback Lesson ──
export const defaultLesson: LessonData = {
  lessonId: "default_fallback",
  intro: {
    tag: "FLUTTER",
    number: "00",
    title: "Loading...",
    subtitle: "Please provide JSON data",
    props: []
  },
  outro: {
    badge: "✨",
    title: "Done",
    subtitle: "flutter.dev"
  },
  initialPreview: {
    style: { width: "100%", height: "100%", background: "#0a0e14" }
  },
  script: [
    { a: "wait", ms: 1000 } // خطوة وهمية عشان مايضربش Error
  ]
};
  
