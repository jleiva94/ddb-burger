import React from 'react'

export function Card({ children, accent, style }) {
  return (
    <div style={{
      background: 'var(--bg2)',
      border: `1px solid ${accent ? 'var(--gold)' : 'var(--border)'}`,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      ...style,
    }}>
      {children}
    </div>
  )
}

export function Label({ children, style }) {
  return (
    <div style={{
      fontSize: 11,
      fontWeight: 700,
      color: 'var(--text3)',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      ...style,
    }}>
      {children}
    </div>
  )
}

export function Input({ style, ...props }) {
  return (
    <input
      style={{
        width: '100%',
        background: 'var(--bg3)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '10px 12px',
        color: 'var(--text)',
        fontSize: 15,
        outline: 'none',
        boxSizing: 'border-box',
        transition: 'border-color 0.15s',
        ...style,
      }}
      onFocus={e => e.target.style.borderColor = 'var(--gold)'}
      onBlur={e => e.target.style.borderColor = 'var(--border)'}
      {...props}
    />
  )
}

export function NumInput({ style, ...props }) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min="0"
      style={{
        width: '100%',
        background: 'var(--bg3)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '10px 8px',
        color: 'var(--text)',
        fontSize: 20,
        fontWeight: 700,
        textAlign: 'center',
        outline: 'none',
        boxSizing: 'border-box',
        transition: 'border-color 0.15s',
        ...style,
      }}
      onFocus={e => e.target.style.borderColor = 'var(--gold)'}
      onBlur={e => e.target.style.borderColor = 'var(--border)'}
      {...props}
    />
  )
}

export function BtnGold({ children, style, loading, ...props }) {
  return (
    <button
      style={{
        width: '100%',
        padding: '15px 20px',
        background: 'var(--gold)',
        color: '#0d0d0d',
        border: 'none',
        borderRadius: 12,
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: 17,
        letterSpacing: 0.5,
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.7 : 1,
        transition: 'transform 0.1s, opacity 0.1s',
        ...style,
      }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      {...props}
    >
      {loading ? '⏳ Cargando...' : children}
    </button>
  )
}

export function BtnSm({ children, danger, gold, style, ...props }) {
  return (
    <button
      style={{
        padding: '7px 14px',
        borderRadius: 8,
        border: danger ? '1px solid var(--red)' : '1px solid var(--border)',
        cursor: 'pointer',
        fontFamily: 'var(--font-body)',
        fontWeight: 600,
        fontSize: 13,
        background: gold ? 'var(--gold)' : 'var(--bg3)',
        color: danger ? 'var(--red)' : gold ? '#0d0d0d' : 'var(--text2)',
        transition: 'opacity 0.1s',
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  )
}

export function Badge({ children, color = 'var(--gold)' }) {
  return (
    <span style={{
      background: color + '22',
      color,
      borderRadius: 6,
      padding: '2px 9px',
      fontSize: 12,
      fontWeight: 700,
    }}>
      {children}
    </span>
  )
}

export function Divider({ style }) {
  return <div style={{ height: 1, background: 'var(--border)', margin: '14px 0', ...style }} />
}

export function SectionTitle({ children }) {
  return (
    <div style={{
      color: 'var(--gold)',
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: 0.5,
      marginBottom: 12,
      fontFamily: 'var(--font-display)',
    }}>
      {children}
    </div>
  )
}

export function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: accent ? 'var(--gold)' : 'var(--bg2)',
      borderRadius: 12,
      padding: '14px 16px',
      flex: 1,
      minWidth: 120,
    }}>
      <div style={{ fontSize: 11, color: accent ? '#5a3800' : 'var(--text3)', fontWeight: 700, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 900, color: accent ? '#0d0d0d' : 'var(--text)', fontFamily: 'var(--font-display)' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: accent ? '#7a4800' : 'var(--text3)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export function ProgressBar({ value, max, color = 'var(--gold)' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div style={{ background: 'var(--bg1)', borderRadius: 6, height: 7, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 6, transition: 'width 0.4s ease' }} />
    </div>
  )
}

export function StepIndicator({ current, total }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 20, marginTop: 4 }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{
          flex: 1,
          height: 3,
          borderRadius: 2,
          background: i < current ? 'var(--gold)' : 'var(--border)',
          transition: 'background 0.2s',
        }} />
      ))}
    </div>
  )
}

export function Toast({ msg, visible }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 90,
      left: '50%',
      transform: `translateX(-50%) translateY(${visible ? 0 : 20}px)`,
      opacity: visible ? 1 : 0,
      transition: 'all 0.3s ease',
      background: '#27ae60',
      color: '#fff',
      padding: '12px 24px',
      borderRadius: 30,
      fontWeight: 700,
      fontSize: 14,
      zIndex: 200,
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
    }}>
      ✅ {msg}
    </div>
  )
}

export function EmptyState({ icon, title, sub }) {
  return (
    <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text3)' }}>
      <div style={{ fontSize: 52, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text2)', marginBottom: 6 }}>{title}</div>
      {sub && <div style={{ fontSize: 13 }}>{sub}</div>}
    </div>
  )
}
