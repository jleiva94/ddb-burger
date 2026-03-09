import React, { useState } from 'react'
import { supabase, isConfigured } from '../lib/supabase.js'
import { BtnGold, Input } from '../components/UI.jsx'

export default function Login({ onLogin }) {
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]  = useState(false)
  const [error, setError]      = useState('')

  const handle = async () => {
    setError('')
    setLoading(true)
    try {
      if (isConfigured) {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) throw err
        onLogin()
      } else {
        // Demo mode
        if (email === 'admin' && password === 'ddb2024') {
          onLogin()
        } else {
          throw new Error('Usuario o contraseña incorrectos')
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{ fontSize: 64, marginBottom: 8 }}>🍔</div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 42,
            fontWeight: 700,
            color: 'var(--gold)',
            letterSpacing: 2,
          }}>
            DDB
          </div>
          <div style={{
            fontSize: 12,
            color: 'var(--gold)',
            letterSpacing: 3,
            textTransform: 'uppercase',
            marginTop: 4,
          }}>
            Domador de Bajones · Talca
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 10 }}>
            Sistema de Control de Ventas
          </div>
        </div>

        {/* Form */}
        <div style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: 24,
        }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 7 }}>
              {isConfigured ? 'Email' : 'Usuario'}
            </div>
            <Input
              type={isConfigured ? 'email' : 'text'}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={isConfigured ? 'admin@ddbburger.cl' : 'admin'}
              autoComplete="username"
              onKeyDown={e => e.key === 'Enter' && handle()}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 7 }}>
              Contraseña
            </div>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              onKeyDown={e => e.key === 'Enter' && handle()}
            />
          </div>

          {error && (
            <div style={{
              background: '#3d0a0a',
              border: '1px solid var(--red)',
              borderRadius: 8,
              padding: '10px 14px',
              color: 'var(--red)',
              fontSize: 13,
              marginBottom: 16,
            }}>
              ⚠️ {error}
            </div>
          )}

          <BtnGold onClick={handle} loading={loading}>
            Ingresar
          </BtnGold>

          {!isConfigured && (
            <div style={{
              textAlign: 'center',
              marginTop: 14,
              fontSize: 11,
              color: 'var(--text3)',
              padding: '10px',
              background: 'var(--bg3)',
              borderRadius: 8,
            }}>
              🧪 Modo demo — admin / ddb2024
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
