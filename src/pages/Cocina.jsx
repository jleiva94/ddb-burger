import React, { useState, useEffect, useCallback } from 'react'
import { loadTodayOrders, updateOrderStatus, deleteOrder } from '../lib/data.js'
import { fmtCLP, timeLabel } from '../lib/utils.js'

export default function CocinaPage({ db, setDB, standalone = false }) {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [lastSync, setLastSync] = useState(null)
  const [flash, setFlash]     = useState(null) // order id that just arrived

  // ── Fetch orders ─────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const fresh = await loadTodayOrders()
      setOrders(prev => {
        // detect new orders to flash
        const prevIds = new Set(prev.map(o => o.id))
        const newOne  = fresh.find(o => !prevIds.has(o.id) && o.status === 'pending')
        if (newOne) setFlash(newOne.id)
        return fresh
      })
      setLastSync(new Date())
    } catch (e) {
      console.error('Error fetching orders:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load + polling every 8 seconds
  useEffect(() => {
    fetchOrders()
    const interval = setInterval(() => fetchOrders(true), 8000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  // Clear flash after 3s
  useEffect(() => {
    if (flash) { const t = setTimeout(() => setFlash(null), 3000); return () => clearTimeout(t) }
  }, [flash])

  const pending = orders.filter(o => o.status === 'pending')
  const done    = orders.filter(o => o.status === 'ready')

  const markReady = async (orderId) => {
    // optimistic update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'ready' } : o))
    try {
      const newDB = await updateOrderStatus(db, orderId, 'ready')
      if (setDB) setDB(newDB)
    } catch (e) { fetchOrders(true) }
  }

  const markPending = async (orderId) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'pending' } : o))
    try {
      const newDB = await updateOrderStatus(db, orderId, 'pending')
      if (setDB) setDB(newDB)
    } catch (e) { fetchOrders(true) }
  }

  const removeOrder = async (orderId) => {
    setOrders(prev => prev.filter(o => o.id !== orderId))
    try {
      const newDB = await deleteOrder(db, orderId)
      if (setDB) setDB(newDB)
    } catch (e) { fetchOrders(true) }
  }

  const orderTotal = (order) =>
    (order.items || []).reduce((sum, item) => {
      const ex = (item.extras || []).reduce((a, e) => a + e.qty * e.unit_price, 0)
      return sum + item.qty * item.unit_price + ex
    }, 0)

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: standalone ? '100vh' : undefined,
      background: 'var(--bg)',
      color: 'var(--text)',
    }}>
      {/* Header */}
      <div style={{
        background: 'var(--bg1)',
        borderBottom: '3px solid var(--gold)',
        padding: '14px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 26 }}>👨‍🍳</span>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--gold)' }}>
              Cocina DDB
            </div>
            <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 1 }}>
              {pending.length} pendiente{pending.length !== 1 ? 's' : ''} · {done.length} listo{done.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {lastSync && (
            <div style={{ fontSize: 10, color: 'var(--text3)', textAlign: 'right' }}>
              Actualizado<br />{lastSync.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          )}
          <button onClick={() => fetchOrders()} style={{
            background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8,
            color: 'var(--text)', padding: '8px 12px', cursor: 'pointer', fontSize: 16,
          }}>
            🔄
          </button>
        </div>
      </div>

      {loading && orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>Cargando comandas...</div>
      ) : (
        <div style={{ padding: '16px 12px 100px', maxWidth: 900, margin: '0 auto' }}>

          {/* PENDIENTES */}
          <div style={{ marginBottom: 8 }}>
            <div style={{
              fontSize: 11, fontWeight: 800, color: 'var(--orange)', textTransform: 'uppercase',
              letterSpacing: 2, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ background: 'var(--orange)', color: '#0d0d0d', borderRadius: 20, padding: '2px 10px' }}>
                {pending.length}
              </span>
              Pendientes
            </div>

            {pending.length === 0 && (
              <div style={{
                textAlign: 'center', padding: '30px 20px',
                border: '2px dashed var(--border)', borderRadius: 14,
                color: 'var(--text3)', fontSize: 14, marginBottom: 16,
              }}>
                🟢 Sin pedidos pendientes
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {pending.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  total={orderTotal(order)}
                  isNew={flash === order.id}
                  onReady={() => markReady(order.id)}
                  onDelete={() => removeOrder(order.id)}
                  statusLabel="✅ Marcar listo"
                  statusColor="var(--green)"
                />
              ))}
            </div>
          </div>

          {/* LISTOS */}
          {done.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{
                fontSize: 11, fontWeight: 800, color: 'var(--green)', textTransform: 'uppercase',
                letterSpacing: 2, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ background: 'var(--green)', color: '#0d0d0d', borderRadius: 20, padding: '2px 10px' }}>
                  {done.length}
                </span>
                Listos
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, opacity: 0.7 }}>
                {done.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    total={orderTotal(order)}
                    onReady={() => markPending(order.id)}
                    onDelete={() => removeOrder(order.id)}
                    statusLabel="↩ Volver a pendiente"
                    statusColor="var(--orange)"
                    done
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── ORDER CARD ───────────────────────────────────────────────────────────────
function OrderCard({ order, total, isNew, onReady, onDelete, statusLabel, statusColor, done }) {
  const elapsed = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000)

  return (
    <div style={{
      background: done ? 'var(--bg1)' : 'var(--bg2, #1a1a1a)',
      border: `2px solid ${isNew ? 'var(--gold)' : done ? 'var(--border)' : 'var(--orange)'}`,
      borderRadius: 14,
      overflow: 'hidden',
      transition: 'border-color 0.3s',
      animation: isNew ? 'pulse 0.6s ease' : undefined,
    }}>
      {/* Card header */}
      <div style={{
        background: done ? 'var(--bg3)' : '#1f1200',
        padding: '10px 14px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: `1px solid ${done ? 'var(--border)' : '#3a2000'}`,
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: done ? 'var(--text2)' : 'var(--gold)' }}>
            {order.customer_name || 'Sin nombre'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text3)' }}>
            {timeLabel(order.created_at)} · hace {elapsed < 1 ? 'menos de 1 min' : `${elapsed} min`}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 800, color: done ? 'var(--text2)' : 'var(--gold)', fontSize: 16 }}>{fmtCLP(total)}</div>
          {!done && elapsed > 10 && (
            <div style={{ fontSize: 10, color: 'var(--red)', fontWeight: 700 }}>⚠ {elapsed} min</div>
          )}
        </div>
      </div>

      {/* Items */}
      <div style={{ padding: '10px 14px' }}>
        {(order.items || []).map((item, idx) => (
          <div key={idx} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>
              <span style={{
                background: done ? 'var(--bg3)' : 'var(--orange)',
                color: done ? 'var(--text3)' : '#0d0d0d',
                borderRadius: 6, padding: '1px 7px', marginRight: 6, fontSize: 12,
              }}>
                {item.qty}×
              </span>
              {item.product_name?.replace('DDB ', '')}
              <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 4, fontWeight: 400 }}>
                {item.variant_label}
              </span>
            </div>
            {(item.extras || []).map((ex, i) => (
              <div key={i} style={{ fontSize: 12, color: 'var(--text3)', paddingLeft: 26, marginTop: 2 }}>
                + {ex.qty}× {ex.extra_name}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ padding: '0 14px 12px', display: 'flex', gap: 8 }}>
        <button onClick={onReady} style={{
          flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
          background: statusColor, color: '#0d0d0d',
          fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, cursor: 'pointer',
        }}>
          {statusLabel}
        </button>
        <button onClick={() => { if (confirm('¿Eliminar esta comanda?')) onDelete() }} style={{
          padding: '10px 12px', borderRadius: 10,
          border: '1px solid var(--border)', background: 'var(--bg3)',
          color: 'var(--text3)', cursor: 'pointer', fontSize: 14,
        }}>
          🗑
        </button>
      </div>
    </div>
  )
}
