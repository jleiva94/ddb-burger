import React from 'react'

const tabs = [
  { id: 'comanda',   icon: '🍔', label: 'Comanda'   },
  { id: 'cocina',    icon: '👨‍🍳', label: 'Cocina'    },
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'productos', icon: '📋', label: 'Productos' },
  { id: 'ajustes',   icon: '⚙️', label: 'Ajustes'   },
]

export default function NavBar({ view, setView }) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'var(--bg1)',
      borderTop: '2px solid var(--gold)',
      display: 'flex',
      zIndex: 100,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {tabs.map(tab => {
        const active = view === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            style={{
              flex: 1, border: 'none', background: 'none',
              padding: '10px 4px 8px',
              cursor: 'pointer', display: 'flex',
              flexDirection: 'column', alignItems: 'center', gap: 2,
              transition: 'all 0.15s',
              borderTop: active ? '2px solid var(--gold)' : '2px solid transparent',
              marginTop: -2,
            }}
          >
            <span style={{ fontSize: 20 }}>{tab.icon}</span>
            <span style={{
              fontSize: 9, fontFamily: 'var(--font-body)',
              color: active ? 'var(--gold)' : 'var(--text3)',
              fontWeight: active ? 700 : 400,
              textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
