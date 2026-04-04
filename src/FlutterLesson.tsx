// ─────────────────────────────────────────────────────────────────────────────
// FlutterLesson.tsx  v3.1 (Reviewed & Patched - Safe Zones & Fallbacks added)
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill, // تم إضافتها للحفاظ على الـ Safe Zones
} from 'remotion';
import { LessonData, TIMING } from './lessonData';
import { CodeEditor } from './CodeEditor';

// ─── EASING ──────────────────────────────────────────────────────────────────
const easeOut  = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp01  = (v: number) => Math.max(0, Math.min(1, v));

// ─── PARTICLES (deterministic) ───────────────────────────────────────────────
const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  x:       (i * 137.508) % 1080,
  y:       (i * 97.3)    % 1920,
  vx:      (i % 3 === 0 ? 1 : -1) * (0.08 + (i % 5) * 0.035),
  vy:      (i % 2 === 0 ? 1 : -1) * (0.06 + (i % 4) * 0.025),
  color:   ['#00d4ff','#7c3aed','#f59e0b','#79c0ff','#ec4899'][i % 5],
  baseOp:  0.05 + (i % 4) * 0.025,
  size:    1 + (i % 4) * 0.7,
}));

// ─── PROP TOKEN COLORS ────────────────────────────────────────────────────────
const PROP_COLORS: Record<string, React.CSSProperties> = {
  kw:  { color: '#ff7b72', borderColor: 'rgba(255,123,114,.35)', background: 'rgba(255,123,114,.08)' },
  ty:  { color: '#79c0ff', borderColor: 'rgba(121,192,255,.35)', background: 'rgba(121,192,255,.08)' },
  nm:  { color: '#ffa657', borderColor: 'rgba(255,166,87,.35)',  background: 'rgba(255,166,87,.08)'  },
  mt:  { color: '#d2a8ff', borderColor: 'rgba(210,168,255,.35)', background: 'rgba(210,168,255,.08)' },
  str: { color: '#a5d6ff', borderColor: 'rgba(165,214,255,.35)', background: 'rgba(165,214,255,.08)' },
};

// ─── PROPS ───────────────────────────────────────────────────────────────────
export interface FlutterLessonProps {
  lesson:          LessonData;
  outroStartFrame: number;
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export const FlutterLesson: React.FC<FlutterLessonProps> = ({ lesson, outroStartFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;

  // ── Intro opacity ──────────────────────────────────────────────────────
  const introOpacity = (() => {
    if (ms < 400)                    return easeOut(clamp01(ms / 400));
    if (ms < TIMING.INTRO_FADE_OUT)  return 1;
    return easeOut(clamp01(1 - (ms - TIMING.INTRO_FADE_OUT) / 500));
  })();

  // ── Code scene opacity ─────────────────────────────────────────────────
  const outroMs    = (outroStartFrame / fps) * 1000;
  const codeOpacity = (() => {
    if (ms < TIMING.CODE_IN) return 0;
    const fadeIn = easeOut(clamp01((ms - TIMING.CODE_IN) / 400));
    if (ms < outroMs - 300)  return fadeIn;
    return fadeIn * easeOut(clamp01(1 - (ms - (outroMs - 300)) / 400));
  })();

  // ── Outro opacity ──────────────────────────────────────────────────────
  const outroOpacity = ms >= outroMs
    ? easeOut(clamp01((ms - outroMs) / 600))
    : 0;

  const propDelays = [150, 300, 450, 650, 850, 1050];

  const particleEls = PARTICLES.map((p, i) => {
    const x   = ((p.x + p.vx * frame) % 1080 + 1080) % 1080;
    const y   = ((p.y + p.vy * frame) % 1920 + 1920) % 1920;
    const pulse = 0.5 + 0.5 * Math.sin((ms * 0.0012) + p.x * 0.01);
    return (
      <div key={i} style={{
        position:     'absolute',
        width:        p.size,
        height:       p.size,
        borderRadius: '50%',
        background:   p.color,
        left:         x,
        top:          y,
        opacity:      p.baseOp * pulse * clamp01(ms / 500),
        filter:       'blur(0.5px)',
        pointerEvents:'none',
      }} />
    );
  });

  // استخراج آمن لبيانات الـ Outro عشان ميحصلش Crash مع JSON قديم
  const outroBadge = lesson.outro.badge || '💡';
  const outroTitle = lesson.outro.title || lesson.outro.docLink || 'Flutter Documentation';
  const outroSub = lesson.outro.subtitle || 'Learn more at flutter.dev';
  const outroNext = lesson.outro.nextLesson || lesson.outro.nextVideo || 'Next Video';

  return (
    // استخدام AbsoluteFill لعمل خلفية فاتحة تحيط بالموبايل وتوفر أبعاد آمنة
    <AbsoluteFill style={{ backgroundColor: '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ ...phoneOuter, transform: 'scale(0.92)' }}>
        
        {/* Notch */}
        <div style={notch}>
          <div style={notchCam} />
          <div style={notchMic} />
        </div>

        <div style={screen}>
          {/* Global particle layer */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
            {particleEls}
          </div>

          {/* ── INTRO ─────────────────────────────────────────────────────── */}
          <div style={{ ...sIntro, opacity: introOpacity }}>
            <div style={{
              ...iTag,
              opacity:   ms > propDelays[0] ? 1 : 0,
              transform: ms > propDelays[0] ? 'translateY(0)' : 'translateY(8px)',
            }}>
              {lesson.intro.tag}
            </div>

            <div style={{ ...iNumber, opacity: ms > propDelays[1] ? 1 : 0 }}>
              {lesson.intro.number}
            </div>

            <div style={{
              ...iTitle,
              opacity:   ms > propDelays[2] ? 1 : 0,
              transform: ms > propDelays[2] ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.94)',
            }}>
              {/* تصليح: استخدام dangerouslySetInnerHTML عشان أكواد الـ span في الداتا تتقرأ كـ ألوان */}
              <span style={iTitleGradient} dangerouslySetInnerHTML={{ __html: lesson.intro.title }} />
              {lesson.intro.titleSuffix}
            </div>

            <div style={{ ...iSub, opacity: ms > propDelays[3] ? 1 : 0 }}>
              {lesson.intro.subtitle}
            </div>

            <div style={{ ...iDivider, opacity: ms > propDelays[4] ? 0.6 : 0 }} />

            <div style={{
              ...iProps,
              opacity:   ms > propDelays[5] ? 1 : 0,
              transform: ms > propDelays[5] ? 'translateY(0)' : 'translateY(8px)',
            }}>
              {lesson.intro.props.map((p: any, i) => {
                // معالج ذكي يفهم الـ type أو الـ class القديم (ip-kw)
                const propType = p.type || (p.class ? p.class.replace('ip-', '') : 'nm');
                return (
                  <div key={i} style={{ ...iProp, ...(PROP_COLORS[propType] ?? PROP_COLORS.nm) }}>
                    {p.label}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── CODE SCENE ────────────────────────────────────────────────── */}
          <div style={{ ...sCode, opacity: codeOpacity, pointerEvents: 'none' }}>
            <div style={codeSection}>
              <div style={codeLabel}>▸ CODE</div>
              <CodeEditor
                lesson={lesson}
                startFrame={Math.round((TIMING.CODE_TYPING / 1000) * fps)}
              />
            </div>
          </div>

          {/* ── OUTRO ─────────────────────────────────────────────────────── */}
          <div style={{ ...sOutro, opacity: outroOpacity }}>
            <div style={ouBadge}>{outroBadge}</div>
            <div style={ouTitle}>
              {outroTitle.split('\n').map((line: string, i: number) => (
                <React.Fragment key={i}>{line}{i === 0 && <br />}</React.Fragment>
              ))}
            </div>
            <div style={ouSub}>{outroSub}</div>
            <div style={ouNext}>
              <span>↩</span>
              <span>{outroNext}</span>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const phoneOuter: React.CSSProperties = {
  width:        1080,
  height:       1920,
  position:     'relative',
  borderRadius: 120,
  background:   'linear-gradient(145deg, #1a1f2e, #0d1117)',
  border:       '3px solid #2a3040',
  boxShadow: [
    '0 0 0 2px #0a0d14',
    '0 100px 300px rgba(0,0,0,.95)', // الظل هيظهر شياكته على الخلفية الفاتحة
    '0 0 200px rgba(0,212,255,.08)',
    'inset 0 2px 0 rgba(255,255,255,.08)',
    'inset 0 -2px 4px rgba(0,0,0,.5)',
  ].join(', '),
  overflow: 'hidden',
};

const notch: React.CSSProperties = {
  position:       'absolute',
  top:            0,
  left:           '50%',
  transform:      'translateX(-50%)',
  width:          240,
  height:         56,
  background:     '#080c10',
  borderRadius:   '0 0 40px 40px',
  zIndex:         20,
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'center',
  gap:            12,
  boxShadow:      '0 4px 16px rgba(0,0,0,.5)',
};

const notchCam: React.CSSProperties = {
  width: 16, height: 16, borderRadius: '50%',
  background: '#1a1f2e', border: '2px solid #2a3040',
};
const notchMic: React.CSSProperties = {
  width: 64, height: 8, borderRadius: 8, background: '#1a1f2e',
};

const screen: React.CSSProperties = {
  position:     'absolute',
  inset:        0,
  borderRadius: 118,
  overflow:     'hidden',
  background:   '#0a0e14',
};

const sceneBase: React.CSSProperties = {
  position:      'absolute',
  inset:         0,
  display:       'flex',
  flexDirection: 'column',
  zIndex:        5,
};

const sIntro: React.CSSProperties = {
  ...sceneBase,
  alignItems:     'center',
  justifyContent: 'center',
  padding:        '80px 56px',
  gap:            0,
};

const sCode: React.CSSProperties = {
  ...sceneBase,
  padding:        '70px 44px 110px 44px',
  justifyContent: 'center',
  alignItems:     'stretch',
};

const sOutro: React.CSSProperties = {
  ...sceneBase,
  alignItems:     'center',
  justifyContent: 'center',
  gap:            32,
  padding:        '80px 56px',
};

const codeSection: React.CSSProperties = {
  display:       'flex',
  flexDirection: 'column',
  gap:           20,
};

const codeLabel: React.CSSProperties = {
  color:         '#00d4ff',
  fontSize:      28,
  fontFamily:    "'JetBrains Mono', monospace",
  letterSpacing: '.15em',
  fontWeight:    600,
};

// Intro elements
const iTag: React.CSSProperties = {
  fontFamily:     "'JetBrains Mono', monospace",
  fontSize:       18,
  letterSpacing:  '.15em',
  color:          '#00d4ff',
  border:         '1px solid rgba(0,212,255,.4)',
  background:     'linear-gradient(135deg, rgba(0,212,255,.12), rgba(124,58,237,.06))',
  padding:        '12px 32px',
  borderRadius:   48,
  marginBottom:   36,
  fontWeight:     600,
  backdropFilter: 'blur(8px)',
  transition:     'opacity .5s, transform .5s cubic-bezier(.34,1.3,.64,1)',
};

const iNumber: React.CSSProperties = {
  fontFamily:    "'JetBrains Mono', monospace",
  fontSize:      20,
  color:         '#8b949e',
  letterSpacing: '.1em',
  marginBottom:  16,
  transition:    'opacity .4s',
};

const iTitle: React.CSSProperties = {
  fontFamily:    "'Cairo', sans-serif",
  fontSize:      112,
  fontWeight:    900,
  color:         '#e6edf3',
  lineHeight:    1,
  textAlign:     'center',
  letterSpacing: '-.02em',
  marginBottom:  20,
  transition:    'opacity .6s, transform .6s cubic-bezier(.34,1.3,.64,1)',
};

const iTitleGradient: React.CSSProperties = {
  background:           'linear-gradient(135deg, #79c0ff 0%, #00d4ff 50%, #7c3aed 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor:  'transparent',
};

const iSub: React.CSSProperties = {
  fontFamily:   "'Cairo', sans-serif",
  fontSize:     28,
  color:        '#8b949e',
  direction:    'rtl',
  marginBottom: 64,
  transition:   'opacity .5s',
};

const iDivider: React.CSSProperties = {
  width:        80,
  height:       2,
  background:   'linear-gradient(90deg, transparent, #00d4ff, transparent)',
  marginBottom: 56,
  transition:   'opacity .5s',
};

const iProps: React.CSSProperties = {
  display:        'flex',
  flexWrap:       'wrap',
  gap:            16,
  justifyContent: 'center',
  transition:     'opacity .5s, transform .5s',
};

const iProp: React.CSSProperties = {
  fontFamily:    "'JetBrains Mono', monospace",
  fontSize:      18,
  padding:       '8px 24px',
  borderRadius:  40,
  border:        '1px solid',
  fontWeight:    500,
};

// Outro elements
const ouBadge: React.CSSProperties = { fontSize: 80 };

const ouTitle: React.CSSProperties = {
  fontFamily:    "'Cairo', sans-serif",
  fontSize:      92,
  fontWeight:    900,
  color:         '#e6edf3',
  textAlign:     'center',
  direction:     'rtl',
  lineHeight:    1.3,
  letterSpacing: '-.01em',
};

const ouSub: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize:   22,
  color:      '#8b949e',
};

const ouNext: React.CSSProperties = {
  display:    'flex',
  alignItems: 'center',
  gap:        16,
  marginTop:  16,
  fontFamily: "'Cairo', sans-serif",
  fontSize:   24,
  color:      '#00d4ff',
};
