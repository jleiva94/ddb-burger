import React, { useState, useEffect } from 'react'
import { supabase, isConfigured } from './lib/supabase.js'
import { loadAll } from './lib/data.js'

import Login        from './pages/Login.jsx'
import NuevaComanda from './pages/NuevaComanda.jsx'
import Cocina       from './pages/Cocina.jsx'
import Dashboard    from './pages/Dashboard.jsx'
import Productos    from './pages/Productos.jsx'
import Ajustes      from './pages/Ajustes.jsx'
import NavBar       from './components/NavBar.jsx'

export default function App() {
  const [authed,  setAuthed]  = useState(false)
  const [loading, setLoading] = useState(true)
  const [db,      setDB]      = useState(null)
  const [view,    setView]    = useState('comanda')

  useEffect(() => {
    if (isConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) { setAuthed(true); fetchData() }
        else setLoading(false)
      })
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN')  { setAuthed(true); fetchData() }
        if (event === 'SIGNED_OUT') { setAuthed(false); setDB(null) }
      })
      return () => subscription.unsubscribe()
    } else {
      const demo = localStorage.getItem('ddb_auth_demo')
      if (demo === 'true') { setAuthed(true); fetchData() }
      else setLoading(false)
    }
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try { setDB(await loadAll()) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleLogin = () => {
    if (!isConfigured) localStorage.setItem('ddb_auth_demo', 'true')
    setAuthed(true); fetchData()
  }

  const handleLogout = async () => {
    if (isConfigured) await supabase.auth.signOut()
    else localStorage.removeItem('ddb_auth_demo')
    setAuthed(false); setDB(null)
  }

  if (loading) return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
    }}>
      <div style={{ fontSize: 52 }}>🍔</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--gold)', letterSpacing: 2 }}>DDB</div>
      <div style={{ fontSize: 13, color: 'var(--text3)' }}>Cargando...</div>
    </div>
  )

  if (!authed) return <Login onLogin={handleLogin} />

  if (!db) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--red)', fontSize: 14 }}>Error cargando datos</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Header */}
      <header style={{
        background: 'var(--bg1)',
        borderBottom: '2px solid var(--gold)',
        padding: '12px 18px',
        display: 'flex', alignItems: 'center', gap: 12,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <span style={{ fontSize: 24 }}>🍔</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--gold)', letterSpacing: 1 }}>
            DDB Burger
          </div>
          <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 2, textTransform: 'uppercase' }}>
            Domador de Bajones · Talca
          </div>
        </div>

        {/* Cocina shortcut button */}
        <button
          onClick={() => setView('cocina')}
          style={{
            background: view === 'cocina' ? 'var(--orange)' : 'var(--bg3)',
            border: '1px solid var(--orange)',
            borderRadius: 8, color: view === 'cocina' ? '#0d0d0d' : 'var(--orange)',
            padding: '6px 11px', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700,
          }}
        >
          👨‍🍳 Cocina
        </button>

        <button
          onClick={handleLogout}
          style={{
            background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8,
            color: 'var(--text2)', padding: '7px 13px', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
          }}
        >
          Salir
        </button>
      </header>

      {/* Pages */}
      <div style={{ maxWidth: view === 'cocina' ? 960 : 480, margin: '0 auto' }}>
        {view === 'comanda'   && <NuevaComanda db={db} setDB={setDB} />}
        {view === 'cocina'    && <Cocina       db={db} setDB={setDB} />}
        {view === 'dashboard' && <Dashboard    db={db} />}
        {view === 'productos' && <Productos    db={db} setDB={setDB} />}
        {view === 'ajustes'   && <Ajustes      db={db} setDB={setDB} />}
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <NavBar view={view} setView={setView} />
      </div>
    </div>
  )
}
