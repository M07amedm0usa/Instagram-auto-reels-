// ─────────────────────────────────────────────────────────────────────────────
// FlutterLesson.tsx — Main composition: Phone frame + Intro + Code + Outro
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from 'remotion';
import { LessonData } from './lessonData';
import { CodeEditor } from './CodeEditor';

// ─── TIMING (ms) ─────────────────────────────────────────────────────────────
export const TIMING = {
  INTRO_FADE_OUT: 2800,   // intro starts fading at this ms mark
  CODE_IN:        3000,   // code scene starts fading in
  CODE_TYPING:    3400,   // typing engine starts (after fade completes)
  // codeEnd and outroIn are calculated dynamically in Root based on script length
};

// ─── EASING HELPER ───────────────────────────────────────────────────────────
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

interface FlutterLessonProps {
  lesson:    LessonData;
  /** Absolute frame when the outro should begin */
  outroStartFrame: number;
}

// ─── PARTICLES (deterministic, no randomness) ─────────────────────────────────
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  x:    (i * 137.508) % 380,          // golden-angle distribution
  y:    (i * 97.3)   % 680,
  vx:   (i % 3 === 0 ? 1 : -1) * (0.1 + (i % 5) * 0.04),
  vy:   (i % 2 === 0 ? 1 : -1) * (0.08 + (i % 4) * 0.035),
  color: ['#00d4ff','#7c3aed','#f59e0b','#79c0ff','#ec4899'][i % 5],
  baseOp: 0.08 + (i % 4) * 0.04,
  size:  0.8 + (i % 4) * 0.6,
}));

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export const FlutterLesson: React.FC<FlutterLessonProps> = ({ lesson, outroStartFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;

  // ── Intro opacity ────────────────────────────────────────────────────────
  const introOpacity = (() => {
    if (ms < 400)             return easeOut(ms / 400);
    if (ms < TIMING.INTRO_FADE_OUT) return 1;
    return easeOut(1 - Math.min((ms - TIMING.INTRO_FADE_OUT) / 500, 1));
  })();

  // ── Prop badge reveal delays ──────────────────────────────────────────────
  const propDelays = [150, 300, 450, 700, 900, 1100];

  // ── Code scene opacity ───────────────────────────────────────────────────
  const outroMs = (outroStartFrame / fps) * 1000;
  const codeOpacity = (() => {
    if (ms < TIMING.CODE_IN) return 0;
    const fadeIn  = easeOut(Math.min((ms - TIMING.CODE_IN) / 400, 1));
    if (ms < outroMs - 300)  return fadeIn;
    return fadeIn * easeOut(1 - Math.min((ms - (outroMs - 300)) / 400, 1));
  })();

  // ── Outro opacity ────────────────────────────────────────────────────────
  const outroOpacity = ms >= outroMs
    ? easeOut(Math.min((ms - outroMs) / 600, 1))
    : 0;

  // ── Particle positions (deterministic frame-based movement) ───────────────
  const particleEls = PARTICLES.map((p, i) => {
    const t = frame;
    const x = ((p.x + p.vx * t) % 380 + 380) % 380;
    const y = ((p.y + p.vy * t) % 680 + 680) % 680;
    const pulse = 0.5 + 0.5 * Math.sin((ms * 0.0012) + p.x * 0.01);
    const opacity = p.baseOp * pulse * Math.min(ms / 500, 1);
    return (
      <div
        key={i}
        style={{
          position:     'absolute',
          width:        p.size,
          height:       p.size,
          borderRadius: '50%',
          background:   p.color,
          left:         x,
          top:          y,
          opacity,
          filter:       'blur(0.5px)',
          pointerEvents:'none',
        }}
      />
    );
  });

  return (
    // ── Outer phone frame ──────────────────────────────────────────────────
    <div style={phoneOuter}>
      {/* Notch */}
      <div style={notch}>
        <div style={notchCam} />
        <div style={notchMic} />
      </div>

      <div style={screen}>
        {/* Particles */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          {particleEls}
        </div>

        {/* ── INTRO SCENE ───────────────────────────────────────────────── */}
        <div style={{ ...sIntro, opacity: introOpacity }}>
          {/* Tag */}
          <div style={{
            ...iTag,
            opacity:   ms > propDelays[0] ? 1 : 0,
            transform: ms > propDelays[0] ? 'translateY(0)' : 'translateY(8px)',
          }}>
            {lesson.intro.tag}
          </div>

          {/* Number */}
          <div style={{ ...iNumber, opacity: ms > propDelays[1] ? 1 : 0 }}>
            {lesson.intro.number}
          </div>

          {/* Title */}
          <div style={{
            ...iTitle,
            opacity:   ms > propDelays[2] ? 1 : 0,
            transform: ms > propDelays[2] ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.94)',
          }}>
            <span style={iTitleSpan}>{lesson.intro.title}</span>
            {lesson.intro.titleSuffix}
          </div>

          {/* Subtitle */}
          <div style={{ ...iSub, opacity: ms > propDelays[3] ? 1 : 0 }}>
            {lesson.intro.subtitle}
          </div>

          {/* Divider */}
          <div style={{ ...iDivider, opacity: ms > propDelays[4] ? 0.6 : 0 }} />

          {/* Prop badges */}
          <div style={{
            ...iProps,
            opacity:   ms > propDelays[5] ? 1 : 0,
            transform: ms > propDelays[5] ? 'translateY(0)' : 'translateY(8px)',
          }}>
            {lesson.intro.props.map((p, i) => (
              <div key={i} style={{ ...iProp, ...iPropType[p.type] }}>
                {p.label}
              </div>
            ))}
          </div>
        </div>

        {/* ── CODE SCENE ────────────────────────────────────────────────── */}
        <div style={{ ...sCode, opacity: codeOpacity, pointerEvents: 'none' }}>
          <div style={codeSection}>
            <div style={codeLabel}>▸ CODE</div>
            <CodeEditor lesson={lesson} startFrame={Math.round((TIMING.CODE_TYPING / 1000) * fps)} />
          </div>
        </div>

        {/* ── OUTRO SCENE ───────────────────────────────────────────────── */}
        <div style={{ ...sOutro, opacity: outroOpacity }}>
          <div style={ouBadge}>{lesson.outro.badge}</div>
          <div style={ouTitle}>
            {lesson.outro.title.split('\n').map((line, i) => (
              <React.Fragment key={i}>{line}{i === 0 && <br />}</React.Fragment>
            ))}
          </div>
          <div style={ouSub}>{lesson.outro.subtitle}</div>
          <div style={ouNext}>
            <span>↩</span>
            <span>{lesson.outro.nextLesson}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── INLINE STYLES ────────────────────────────────────────────────────────────
const phoneOuter: React.CSSProperties = {
  width:        1080,
  height:       1920,
  position:     'relative',
  borderRadius: 120,
  background:   'linear-gradient(145deg, #1a1f2e, #0d1117)',
  border:       '3px solid #2a3040',
  boxShadow: [
    '0 0 0 2px #0a0d14',
    '0 100px 300px rgba(0,0,0,.95)',
    '0 0 200px rgba(0,212,255,.08)',
    'inset 0 2px 0 rgba(255,255,255,.08)',
    'inset 0 -2px 4px rgba(0,0,0,.5)',
  ].join(', '),
  overflow:     'hidden',
};

const notch: React.CSSProperties = {
  position:        'absolute',
  top:             0,
  left:            '50%',
  transform:       'translateX(-50%)',
  width:           240,
  height:          56,
  background:      '#080c10',
  borderRadius:    '0 0 40px 40px',
  zIndex:          20,
  display:         'flex',
  alignItems:      'center',
  justifyContent:  'center',
  gap:             12,
  boxShadow:       '0 4px 16px rgba(0,0,0,.5)',
};

const notchCam: React.CSSProperties = { width: 16, height: 16, borderRadius: '50%', background: '#1a1f2e', border: '2px solid #2a3040' };
const notchMic: React.CSSProperties = { width: 64, height: 8,  borderRadius: 8,    background: '#1a1f2e' };

const screen: React.CSSProperties = {
  position:     'absolute',
  inset:        0,
  borderRadius: 118,
  overflow:     'hidden',
  background:   '#0a0e14',
};

// Shared scene base
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
  perspective:    2400,
};

const sCode: React.CSSProperties = {
  ...sceneBase,
  padding: 20,
  gap:     16,
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
  gap:           16,
  flex:          1,
  overflow:      'hidden',
};

const codeLabel: React.CSSProperties = {
  color:         '#00d4ff',
  fontSize:      16,
  fontFamily:    "'JetBrains Mono', monospace",
  letterSpacing: '.15em',
  fontWeight:    600,
};

// ── Intro elements ─────────────────────────────────────────────────────────────
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
  transition:     'all .5s cubic-bezier(.34,1.3,.64,1)',
  fontWeight:     600,
  backdropFilter: 'blur(8px)',
};

const iNumber: React.CSSProperties = {
  fontFamily:    "'JetBrains Mono', monospace",
  fontSize:      20,
  color:         '#8b949e',
  letterSpacing: '.1em',
  marginBottom:  16,
  transition:    'opacity .4s .1s',
};

const iTitle: React.CSSProperties = {
  fontFamily:    "'Cairo', sans-serif",
  fontSize:      120,
  fontWeight:    900,
  color:         '#e6edf3',
  lineHeight:    1,
  textAlign:     'center',
  direction:     'ltr',
  transition:    'all .6s .15s cubic-bezier(.34,1.3,.64,1)',
  marginBottom:  20,
  letterSpacing: '-.02em',
};

const iTitleSpan: React.CSSProperties = {
  background:            'linear-gradient(135deg, #79c0ff 0%, #00d4ff 50%, #7c3aed 100%)',
  WebkitBackgroundClip:  'text',
  WebkitTextFillColor:   'transparent',
};

const iSub: React.CSSProperties = {
  fontFamily:   "'Cairo', sans-serif",
  fontSize:     28,
  color:        '#8b949e',
  direction:    'rtl',
  transition:   'opacity .5s .35s',
  marginBottom: 64,
};

const iDivider: React.CSSProperties = {
  width:        80,
  height:       2,
  background:   'linear-gradient(90deg, transparent, #00d4ff, transparent)',
  transition:   'all .5s .5s',
  marginBottom: 56,
};

const iProps: React.CSSProperties = {
  display:        'flex',
  flexWrap:       'wrap',
  gap:            16,
  justifyContent: 'center',
  transition:     'all .5s',
};

const iProp: React.CSSProperties = {
  fontFamily:    "'JetBrains Mono', monospace",
  fontSize:      18,
  padding:       '8px 24px',
  borderRadius:  40,
  border:        '1px solid',
  fontWeight:    500,
};

const iPropType: Record<string, React.CSSProperties> = {
  kw: { color: '#ff7b72', borderColor: 'rgba(255,123,114,.35)', background: 'rgba(255,123,114,.08)' },
  ty: { color: '#79c0ff', borderColor: 'rgba(121,192,255,.35)', background: 'rgba(121,192,255,.08)' },
  nm: { color: '#ffa657', borderColor: 'rgba(255,166,87,.35)',  background: 'rgba(255,166,87,.08)'  },
  mt: { color: '#d2a8ff', borderColor: 'rgba(210,168,255,.35)', background: 'rgba(210,168,255,.08)' },
};

// ── Outro elements ─────────────────────────────────────────────────────────────
const ouBadge: React.CSSProperties = {
  fontSize: 80,
};

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
