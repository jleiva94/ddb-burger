import React, { useState, useMemo } from 'react'
import { createOrder, uid } from '../lib/data.js'
import { fmtCLP } from '../lib/utils.js'
import { Card, Input, BtnGold, BtnSm, SectionTitle, Toast } from '../components/UI.jsx'

function Steps({ step }) {
  const steps = ['Cliente', 'Productos', 'Extras', 'Confirmar']
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700,
              background: i < step ? 'var(--green)' : i === step ? 'var(--gold)' : 'var(--bg3)',
              color: i <= step ? '#0d0d0d' : 'var(--text3)',
            }}>
              {i < step ? '✓' : i + 1}
            </div>
            <div style={{ fontSize: 9, color: i === step ? 'var(--gold)' : 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {s}
            </div>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 2, background: i < step ? 'var(--green)' : 'var(--bg3)', marginBottom: 16 }} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

export default function NuevaComandaPage({ db, setDB }) {
  const [step, setStep]         = useState(0)
  const [customerName, setName] = useState('')
  const [items, setItems]       = useState([])
  const [toast, setToast]       = useState(false)
  const [saving, setSaving]     = useState(false)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(false), 2500) }

  // Active promos indexed by variant_id for quick lookup
  const promosByVariant = useMemo(() => {
    const map = {}
    ;(db.promos || []).filter(p => p.active).forEach(p => {
      if (!map[p.variant_id]) map[p.variant_id] = []
      map[p.variant_id].push(p)
    })
    return map
  }, [db.promos])

  // ── STEP 0: Cliente ──────────────────────────────────────────────────────
  const Step0 = () => (
    <Card>
      <SectionTitle>¿A nombre de quién va el pedido?</SectionTitle>
      <Input
        value={customerName}
        onChange={e => setName(e.target.value)}
        placeholder="Nombre o mesa (ej: Juan, Mesa 3)"
        autoFocus
        onKeyDown={e => e.key === 'Enter' && setStep(1)}
      />
      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text3)' }}>Opcional — puedes dejarlo en blanco</div>
      <BtnGold style={{ marginTop: 16 }} onClick={() => setStep(1)}>Siguiente →</BtnGold>
    </Card>
  )

  // ── STEP 1: Productos ────────────────────────────────────────────────────
  const Step1 = () => {
    const addVariant = (product, variant) => {
      setItems(prev => {
        // Check if this variant already exists without a promo applied
        const existing = prev.find(i => i.variant_id === variant.id && !i.promo_id)
        if (existing) {
          return prev.map(i =>
            i.id === existing.id ? { ...i, qty: i.qty + 1 } : i
          )
        }
        return [...prev, {
          id: uid(),
          product_id: product.id,
          variant_id: variant.id,
          product_name: product.name,
          variant_label: variant.label,
          qty: 1,
          unit_price: variant.price,
          original_unit_price: variant.price,
          promo_id: null,
          promo_name: null,
          extras: {},
        }]
      })
    }

    const applyPromo = (product, variant, promo) => {
      // Add a new item group specifically for this promo
      setItems(prev => [...prev, {
        id: uid(),
        product_id: product.id,
        variant_id: variant.id,
        product_name: product.name,
        variant_label: variant.label,
        qty: promo.qty,
        // unit_price is promo_price / qty so total = promo_price
        unit_price: Math.round(promo.promo_price / promo.qty),
        original_unit_price: variant.price,
        promo_id: promo.id,
        promo_name: promo.name,
        extras: {},
      }])
    }

    const removeItem   = (id) => setItems(prev => prev.filter(i => i.id !== id))
    const changeQty    = (id, delta) => setItems(prev =>
      prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i)
    )

    return (
      <>
        {/* Active promos banner */}
        {Object.keys(promosByVariant).length > 0 && (
          <div style={{
            background: '#1a0d00', border: '1px solid var(--orange)',
            borderRadius: 12, padding: '10px 14px', marginBottom: 12,
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              🏷 Promos activas
            </div>
            {Object.values(promosByVariant).flat().map(promo => {
              // Find product/variant for this promo
              let pName = '', vLabel = ''
              db.products.forEach(p => p.variants.forEach(v => {
                if (v.id === promo.variant_id) { pName = p.name.replace('DDB ',''); vLabel = v.label }
              }))
              return (
                <div key={promo.id} style={{ fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: 'var(--gold)' }}>{promo.name}</span>
                  <span style={{ color: 'var(--text3)', marginLeft: 6 }}>
                    {promo.qty}× {pName} {vLabel} = {fmtCLP(promo.promo_price)}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        <Card>
          <SectionTitle>Selecciona productos</SectionTitle>
          {db.products.map(p => (
            <div key={p.id} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', marginBottom: 6 }}>
                {p.name.replace('DDB ', '')}
              </div>
              {p.variants.map(v => {
                const varPromos = promosByVariant[v.id] || []
                return (
                  <div key={v.id} style={{ marginBottom: 6 }}>
                    {/* Normal variant button */}
                    <button onClick={() => addVariant(p, v)} style={{
                      padding: '8px 14px', borderRadius: 20, cursor: 'pointer', marginRight: 6, marginBottom: 4,
                      background: 'var(--bg3)', border: '1px solid var(--border)',
                      color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: 12,
                    }}>
                      {v.label} <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{fmtCLP(v.price)}</span>
                    </button>
                    {/* Promo buttons for this variant */}
                    {varPromos.map(promo => (
                      <button key={promo.id} onClick={() => applyPromo(p, v, promo)} style={{
                        padding: '8px 14px', borderRadius: 20, cursor: 'pointer', marginRight: 6, marginBottom: 4,
                        background: '#1a0d00', border: '1px solid var(--orange)',
                        color: 'var(--orange)', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700,
                      }}>
                        🏷 {promo.name} <span style={{ color: 'var(--gold)' }}>{fmtCLP(promo.promo_price)}</span>
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </Card>

        {items.length > 0 && (
          <Card>
            <SectionTitle>Pedido actual</SectionTitle>
            {items.map(item => (
              <ItemRow
                key={item.id}
                item={item}
                onRemove={() => removeItem(item.id)}
                onQtyChange={(delta) => changeQty(item.id, delta)}
                onPriceChange={(newUnitPrice) =>
                  setItems(prev => prev.map(i => i.id === item.id
                    ? { ...i, unit_price: newUnitPrice, promo_id: null, promo_name: 'Precio manual' }
                    : i
                  ))
                }
              />
            ))}
            <div style={{ paddingTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--gold)' }}>
                Total: {fmtCLP(items.reduce((s, i) => s + i.qty * i.unit_price, 0))}
              </div>
            </div>
          </Card>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <BtnSm onClick={() => setStep(0)}>← Volver</BtnSm>
          <BtnGold disabled={items.length === 0} onClick={() => setStep(2)} style={{ flex: 1 }}>
            Siguiente → {items.length > 0 && `(${items.reduce((a,i)=>a+i.qty,0)} items)`}
          </BtnGold>
        </div>
      </>
    )
  }

  // ── STEP 2: Extras ───────────────────────────────────────────────────────
  const Step2 = () => {
    const setExtra = (itemId, extraId, extraName, extraPrice, delta) => {
      setItems(prev => prev.map(item => {
        if (item.id !== itemId) return item
        const cur = item.extras[extraId] || { extra_id: extraId, extra_name: extraName, qty: 0, unit_price: extraPrice }
        const newQty = Math.max(0, cur.qty + delta)
        const newExtras = { ...item.extras }
        if (newQty === 0) delete newExtras[extraId]
        else newExtras[extraId] = { ...cur, qty: newQty }
        return { ...item, extras: newExtras }
      }))
    }

    return (
      <>
        <Card>
          <SectionTitle>Extras por ítem</SectionTitle>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>
            Toca + para agregar extras a cada producto del pedido
          </div>
          {items.map((item, idx) => (
            <div key={item.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: idx < items.length-1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                {item.qty > 1 && (
                  <span style={{ background: 'var(--gold)', color: '#0d0d0d', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>
                    {item.qty}×
                  </span>
                )}
                {item.product_name.replace('DDB ','')} {item.variant_label}
                {item.promo_name && (
                  <span style={{ fontSize: 10, background: '#1a0d00', color: 'var(--orange)', border: '1px solid var(--orange)', borderRadius: 10, padding: '1px 7px' }}>
                    {item.promo_name}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {db.extras.map(ex => {
                  const cur = item.extras[ex.id]?.qty || 0
                  return (
                    <div key={ex.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontSize: 13 }}>{ex.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 6 }}>{fmtCLP(ex.price)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={() => setExtra(item.id, ex.id, ex.name, ex.price, -1)} style={qBtn}>−</button>
                        <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center', color: cur > 0 ? 'var(--gold)' : 'var(--text3)' }}>{cur}</span>
                        <button onClick={() => setExtra(item.id, ex.id, ex.name, ex.price, +1)} style={qBtn}>+</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </Card>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <BtnSm onClick={() => setStep(1)}>← Volver</BtnSm>
          <BtnGold onClick={() => setStep(3)} style={{ flex: 1 }}>Revisar pedido →</BtnGold>
        </div>
      </>
    )
  }

  // ── STEP 3: Confirmar ────────────────────────────────────────────────────
  const Step3 = () => {
    const total = items.reduce((sum, item) => {
      const extrasTotal = Object.values(item.extras).reduce((a, ex) => a + ex.qty * ex.unit_price, 0)
      return sum + item.qty * item.unit_price + extrasTotal
    }, 0)
    const savedTotal = items.reduce((sum, item) => {
      if (!item.promo_id && item.promo_name !== 'Precio manual') return sum
      const originalTotal = item.qty * item.original_unit_price
      const chargedTotal  = item.qty * item.unit_price
      return sum + (originalTotal - chargedTotal)
    }, 0)

    const handleConfirm = async () => {
      setSaving(true)
      try {
        const order = {
          customer_name: customerName.trim(),
          items: items.map(item => ({
            product_id: item.product_id,
            variant_id: item.variant_id,
            product_name: item.product_name,
            variant_label: item.variant_label,
            qty: item.qty,
            unit_price: item.unit_price,
            original_unit_price: item.original_unit_price,
            promo_id: item.promo_id,
            promo_name: item.promo_name,
            extras: Object.values(item.extras),
          })),
        }
        const newDB = await createOrder(db, order)
        setDB(newDB)
        showToast('¡Comanda enviada a cocina! 🍔')
        setStep(0); setName(''); setItems([])
      } catch (e) {
        alert('Error al guardar: ' + e.message)
      } finally {
        setSaving(false)
      }
    }

    return (
      <>
        <Card accent>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: savedTotal > 0 ? 8 : 0 }}>
            <div>
              <div style={{ fontSize: 11, color: '#7a4800', textTransform: 'uppercase', letterSpacing: 1 }}>Comanda para</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#0d0d0d' }}>
                {customerName.trim() || 'Sin nombre'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: '#0d0d0d' }}>
                {fmtCLP(total)}
              </div>
              {savedTotal > 0 && (
                <div style={{ fontSize: 11, color: '#0d4a1f', fontWeight: 700 }}>
                  🏷 Ahorro: {fmtCLP(savedTotal)}
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <SectionTitle>Detalle del pedido</SectionTitle>
          {items.map(item => {
            const extrasArr   = Object.values(item.extras)
            const itemTotal   = item.qty * item.unit_price + extrasArr.reduce((a, ex) => a + ex.qty * ex.unit_price, 0)
            const hasDiscount = item.unit_price !== item.original_unit_price
            return (
              <div key={item.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{item.qty}× </span>
                      <span style={{ fontSize: 14 }}>{item.product_name.replace('DDB ','')}</span>
                      <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 4 }}>{item.variant_label}</span>
                    </div>
                    {item.promo_name && (
                      <div style={{ fontSize: 11, color: 'var(--orange)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                        🏷 {item.promo_name}
                        {hasDiscount && (
                          <span style={{ textDecoration: 'line-through', color: 'var(--text3)', marginLeft: 4 }}>
                            {fmtCLP(item.qty * item.original_unit_price)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--gold)', marginLeft: 8 }}>{fmtCLP(itemTotal)}</span>
                </div>
                {extrasArr.map(ex => (
                  <div key={ex.extra_id} style={{ fontSize: 12, color: 'var(--text3)', paddingLeft: 20, marginTop: 2 }}>
                    + {ex.qty}× {ex.extra_name} <span style={{ color: 'var(--gold)' }}>{fmtCLP(ex.qty * ex.unit_price)}</span>
                  </div>
                ))}
              </div>
            )
          })}
        </Card>

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <BtnSm onClick={() => setStep(2)}>← Volver</BtnSm>
          <BtnGold onClick={handleConfirm} loading={saving} style={{ flex: 1 }}>🍔 Enviar a cocina</BtnGold>
        </div>
      </>
    )
  }

  return (
    <div className="page-enter" style={{ padding: '20px 16px 120px', maxWidth: 480, margin: '0 auto' }}>
      <Toast msg={toast} visible={!!toast} />
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--gold)', margin: '0 0 16px' }}>
        Nueva Comanda
      </h2>
      <Steps step={step} />
      {step === 0 && <Step0 />}
      {step === 1 && <Step1 />}
      {step === 2 && <Step2 />}
      {step === 3 && <Step3 />}
    </div>
  )
}

// ─── ITEM ROW with inline price editor ───────────────────────────────────────
function ItemRow({ item, onRemove, onQtyChange, onPriceChange }) {
  const [editing, setEditing]   = useState(false)
  const [tempPrice, setTempPrice] = useState('')

  const startEdit = () => {
    // Price editing works on total (unit_price * qty), feels more natural
    setTempPrice(String(item.unit_price * item.qty))
    setEditing(true)
  }

  const confirmEdit = () => {
    const total   = parseInt(tempPrice) || 0
    const perUnit = item.qty > 0 ? Math.round(total / item.qty) : total
    onPriceChange(perUnit)
    setEditing(false)
  }

  const totalPrice = item.unit_price * item.qty
  const hasDiscount = item.unit_price !== item.original_unit_price

  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        {/* Left: name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {item.product_name.replace('DDB ','')}
            <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 400 }}>{item.variant_label}</span>
            {item.promo_name && (
              <span style={{ fontSize: 10, background: '#1a0d00', color: 'var(--orange)', border: '1px solid var(--orange)', borderRadius: 10, padding: '1px 7px' }}>
                {item.promo_name}
              </span>
            )}
          </div>
          {/* Price display / editor */}
          {editing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>$</span>
              <input
                type="number"
                value={tempPrice}
                onChange={e => setTempPrice(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && confirmEdit()}
                autoFocus
                style={{
                  width: 100, background: 'var(--bg3)', border: '1px solid var(--gold)',
                  borderRadius: 6, color: 'var(--gold)', fontSize: 14, fontWeight: 700,
                  padding: '4px 8px', outline: 'none',
                }}
              />
              <button onClick={confirmEdit} style={{ ...qBtn, background: 'var(--gold)', color: '#0d0d0d', border: 'none', fontWeight: 700 }}>✓</button>
              <button onClick={() => setEditing(false)} style={{ ...qBtn, fontSize: 12 }}>✕</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)' }}>
                {fmtCLP(totalPrice)}
              </span>
              {hasDiscount && (
                <span style={{ fontSize: 11, textDecoration: 'line-through', color: 'var(--text3)' }}>
                  {fmtCLP(item.original_unit_price * item.qty)}
                </span>
              )}
              {/* Edit price button */}
              <button onClick={startEdit} title="Cambiar precio" style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, color: 'var(--text3)', padding: '0 2px',
                lineHeight: 1,
              }}>
                ✏️
              </button>
            </div>
          )}
        </div>

        {/* Right: qty controls + remove */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <button onClick={() => onQtyChange(-1)} style={qBtn}>−</button>
          <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
          <button onClick={() => onQtyChange(+1)} style={qBtn}>+</button>
          <button onClick={onRemove} style={{ ...qBtn, color: 'var(--red)', border: '1px solid var(--red)' }}>✕</button>
        </div>
      </div>
    </div>
  )
}

const qBtn = {
  width: 30, height: 30, borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--bg3)', color: 'var(--text)',
  cursor: 'pointer', fontSize: 16,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}
