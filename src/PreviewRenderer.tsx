// ─────────────────────────────────────────────────────────────────────────────
// PreviewRenderer.tsx — Generic, widget-agnostic output preview
//
// Reads a flat PreviewState and renders a visual approximation of whatever
// Flutter widget is being taught. No switch-cases on widget names.
// Adding support for a new widget = adding the right fields to PreviewState.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { PreviewNode, PreviewState } from './lessonData';

// ─────────────────────────────────────────────────────────────────────────────
// Single node renderer
// ─────────────────────────────────────────────────────────────────────────────
function renderNode(node: PreviewNode, depth = 0): React.ReactNode {
  const hasChildren = node.children && node.children.length > 0;
  const hasText     = node.text !== undefined && node.text !== '';
  const hasIcon     = node.icon !== undefined;
  const hasProgress = node.progress !== undefined;
  const hasImg      = node.imgUrl !== undefined;

  // ── Box styles ──────────────────────────────────────────────────────────
  const boxStyle: React.CSSProperties = {
    position:        'relative',
    display:         'flex',
    flexDirection:   node.layout === 'row' ? 'row' : 'column',
    justifyContent:  node.mainAxis  ?? 'center',
    alignItems:      node.crossAxis ?? 'center',
    gap:             node.gap ?? 0,
    width:           node.w  !== undefined ? node.w  : hasChildren ? '100%' : undefined,
    height:          node.h  !== undefined ? node.h  : undefined,
    minWidth:        (!node.w && !hasChildren) ? 40 : undefined,
    minHeight:       (!node.h && !hasProgress) ? 40 : undefined,
    background:      node.imgUrl
      ? `url(${node.imgUrl}) center/cover no-repeat`
      : node.bg ?? 'transparent',
    borderRadius:    node.radius    !== undefined ? node.radius : undefined,
    boxShadow:       node.shadow    !== undefined && node.shadow > 0
      ? `0 ${node.shadow}px ${node.shadow * 2}px rgba(0,0,0,0.55)`
      : undefined,
    border:          node.borderColor
      ? `${node.borderWidth ?? 1}px solid ${node.borderColor}`
      : undefined,
    padding:         node.padding   !== undefined ? node.padding : undefined,
    opacity:         node.opacity   !== undefined ? node.opacity : undefined,
    overflow:        'hidden',
    transition:      'all 0.35s cubic-bezier(0.4,0,0.2,1)',
    flexShrink:      0,
  };

  // ── Progress bar ────────────────────────────────────────────────────────
  if (hasProgress) {
    const pct = Math.max(0, Math.min(1, node.progress!)) * 100;
    return (
      <div style={{ width: node.w ?? 280, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{
          width:        '100%',
          height:       node.h ?? 8,
          borderRadius: node.radius ?? 4,
          background:   node.bg ?? '#374151',
          overflow:     'hidden',
          position:     'relative',
        }}>
          <div style={{
            position:     'absolute',
            left:         0, top: 0, bottom: 0,
            width:        `${pct}%`,
            background:   node.progressColor ?? '#00d4ff',
            borderRadius: node.radius ?? 4,
            boxShadow:    `0 0 12px ${node.progressColor ?? '#00d4ff'}88`,
            transition:   'width 0.5s cubic-bezier(0.4,0,0.2,1)',
          }} />
        </div>
        {/* percentage label */}
        <span style={{
          fontFamily:  "'JetBrains Mono', monospace",
          fontSize:    13,
          color:       node.progressColor ?? '#00d4ff',
          alignSelf:   'flex-end',
        }}>
          {Math.round(pct)}%
        </span>
      </div>
    );
  }

  // ── Icon-only node ──────────────────────────────────────────────────────
  if (hasIcon && !hasText && !hasChildren) {
    return (
      <span style={{
        fontSize:   node.iconSize ?? 28,
        color:      node.iconColor ?? '#e6edf3',
        lineHeight: 1,
        transition: 'all 0.3s',
        userSelect: 'none',
      }}>
        {node.icon}
      </span>
    );
  }

  // ── Container node (with optional text / icon / children) ───────────────
  return (
    <div style={boxStyle}>
      {hasIcon && (
        <span style={{
          fontSize:  node.iconSize ?? 24,
          color:     node.iconColor ?? '#e6edf3',
          lineHeight: 1,
          userSelect: 'none',
        }}>
          {node.icon}
        </span>
      )}
      {hasText && (
        <span style={{
          fontFamily:  "'Cairo', sans-serif",
          fontSize:    node.fontSize  ?? 18,
          fontWeight:  node.fontWeight ?? 400,
          color:       node.textColor ?? '#e6edf3',
          textAlign:   node.textAlign ?? 'center',
          direction:   'rtl',
          lineHeight:  1.4,
          transition:  'all 0.35s',
          wordBreak:   'break-word',
        }}>
          {node.text}
        </span>
      )}
      {hasChildren && node.children!.map((child, i) =>
        <React.Fragment key={child.key ?? i}>
          {renderNode(child, depth + 1)}
        </React.Fragment>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Public component
// ─────────────────────────────────────────────────────────────────────────────
interface PreviewRendererProps {
  state: PreviewState;
}

export const PreviewRenderer: React.FC<PreviewRendererProps> = ({ state }) => {
  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      width:          '100%',
      minHeight:      110,
      padding:        '16px 8px',
    }}>
      {renderNode(state as PreviewNode)}
    </div>
  );
};
