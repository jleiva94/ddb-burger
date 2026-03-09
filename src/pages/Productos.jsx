import React, { useState } from 'react'
import { saveProduct, deleteProduct, uid, calcVariantCost } from '../lib/data.js'
import { fmtCLP } from '../lib/utils.js'
import { Card, Label, Input, BtnGold, BtnSm, SectionTitle, Badge, EmptyState, Toast } from '../components/UI.jsx'

export default function ProductosPage({ db, setDB }) {
  const [mode, setMode]   = useState('list')
  const [sel, setSel]     = useState(null)
  const [toast, setToast] = useState(false)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(false), 2200) }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return
    const newDB = await deleteProduct(db, id)
    setDB(newDB)
    showToast('Producto eliminado')
  }

  if (mode !== 'list') return (
    <ProductoForm
      db={db} setDB={setDB}
      initial={sel} isNew={mode === 'new'}
      onDone={(msg) => { setMode('list'); if (msg) showToast(msg) }}
    />
  )

  return (
    <div className="page-enter" style={{ padding: '20px 16px 120px', maxWidth: 480, margin: '0 auto' }}>
      <Toast msg={toast} visible={!!toast} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--gold)', margin: 0 }}>
          Productos
        </h2>
        <BtnSm gold onClick={() => { setSel(null); setMode('new') }}>+ Nuevo</BtnSm>
      </div>

      {db.products.length === 0 && <EmptyState icon="🍔" title="Sin productos" sub="Agrega tu primer producto" />}

      {db.products.map(p => {
        // Show cost breakdown per variant
        return (
          <Card key={p.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600 }}>{p.name}</div>
            </div>

            {/* Variant cost table */}
            <div style={{ background: 'var(--bg1)', borderRadius: 8, overflow: 'hidden', marginBottom: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '6px 10px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase' }}>Variante</span>
                <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, textAlign: 'right' }}>Precio</span>
                <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, textAlign: 'right' }}>Costo</span>
                <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, textAlign: 'right' }}>Margen</span>
              </div>
              {p.variants.map(v => {
                const cost   = calcVariantCost(p, v.id, db.ingredients)
                const margin = v.price ? ((v.price - cost) / v.price * 100) : 0
                return (
                  <div key={v.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '7px 10px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{v.label}</span>
                    <span style={{ fontSize: 13, textAlign: 'right', color: 'var(--gold)' }}>{fmtCLP(v.price)}</span>
                    <span style={{ fontSize: 13, textAlign: 'right', color: 'var(--text2)' }}>{fmtCLP(cost)}</span>
                    <span style={{ fontSize: 13, textAlign: 'right', color: margin > 55 ? 'var(--green)' : 'var(--orange)', fontWeight: 700 }}>
                      {margin.toFixed(0)}%
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Ingredients summary */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
              {Object.entries(p.ingredient_quantities || {}).map(([iid, qty]) => {
                const ing = db.ingredients.find(i => i.id === iid)
                if (!ing) return null
                // Check if this ingredient has overrides
                const hasOverride = Object.values(p.variant_overrides || {}).some(ov => ov[iid] !== undefined)
                return (
                  <span key={iid} style={{
                    background: hasOverride ? 'var(--gold-bg)' : 'var(--bg1)',
                    border: hasOverride ? '1px solid var(--gold)' : 'none',
                    borderRadius: 20, padding: '3px 10px', fontSize: 11,
                    color: hasOverride ? 'var(--gold)' : 'var(--text3)',
                  }}>
                    {ing.name}{qty > 1 ? ` x${qty}` : ''}{hasOverride ? ' *' : ''}
                  </span>
                )
              })}
              {Object.values(p.variant_overrides||{}).some(ov=>Object.keys(ov).length>0) && (
                <span style={{ fontSize: 10, color: 'var(--text3)', alignSelf: 'center' }}>* varía por variante</span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <BtnSm onClick={() => { setSel(p); setMode('edit') }}>✏️ Editar</BtnSm>
              <BtnSm danger onClick={() => handleDelete(p.id)}>🗑 Eliminar</BtnSm>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

// ─── FORM ─────────────────────────────────────────────────────────────────────
function ProductoForm({ db, setDB, initial, isNew, onDone }) {
  const [name, setName]       = useState(initial?.name || '')
  const [variants, setVariants] = useState(
    initial?.variants?.length
      ? initial.variants
      : [{ id: uid(), label: 'Simple', price: '' }, { id: uid(), label: 'Doble', price: '' }]
  )
  // ingredient_quantities: { iid: baseQty }
  const [ingQtys, setIngQtys] = useState(initial?.ingredient_quantities || {})
  // variant_overrides: { variantId: { iid: qty } }
  const [varOverrides, setVarOverrides] = useState(initial?.variant_overrides || {})
  const [saving, setSaving] = useState(false)
  const [showOverrides, setShowOverrides] = useState(false)

  // Ingredients that have non-zero base qty
  const activeIngs = db.ingredients.filter(ing => (ingQtys[ing.id] || 0) > 0)

  const setBaseQty = (iid, val) => {
    const qty = parseInt(val) || 0
    setIngQtys(prev => qty > 0 ? { ...prev, [iid]: qty } : Object.fromEntries(Object.entries(prev).filter(([k]) => k !== iid)))
  }

  const setOverrideQty = (variantId, iid, val) => {
    const qty = parseInt(val) || 0
    setVarOverrides(prev => {
      const cur = { ...prev[variantId] }
      if (qty > 0) cur[iid] = qty
      else delete cur[iid]
      return { ...prev, [variantId]: cur }
    })
  }

  // Preview cost per variant
  const previewCost = (variantId) => {
    const baseQtys   = ingQtys
    const overrides  = varOverrides[variantId] || {}
    const effective  = { ...baseQtys, ...overrides }
    return Object.entries(effective).reduce((sum, [iid, qty]) => {
      const ing = db.ingredients.find(i => i.id === iid)
      return sum + (ing?.cost || 0) * qty
    }, 0)
  }

  const handleSave = async () => {
    if (!name.trim()) return alert('Ingresa un nombre para el producto')
    if (variants.some(v => !v.label.trim())) return alert('Todas las variantes necesitan un nombre')
    setSaving(true)
    try {
      const product = {
        id: initial?.id || uid(),
        name: name.trim(),
        variants: variants.map(v => ({ ...v, price: parseInt(v.price) || 0 })),
        ingredient_quantities: ingQtys,
        variant_overrides: varOverrides,
      }
      const newDB = await saveProduct(db, product, isNew)
      setDB(newDB)
      onDone(isNew ? 'Producto creado ✓' : 'Producto actualizado ✓')
    } catch (e) {
      alert('Error al guardar: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-enter" style={{ padding: '20px 16px 120px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--gold)', margin: 0 }}>
          {isNew ? 'Nuevo Producto' : 'Editar Producto'}
        </h2>
        <BtnSm onClick={() => onDone()}>← Volver</BtnSm>
      </div>

      {/* Name */}
      <Card>
        <Label style={{ marginBottom: 8 }}>Nombre del producto</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: DDB Especial" />
      </Card>

      {/* Variants */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <SectionTitle style={{ margin: 0 }}>Variantes y precios</SectionTitle>
          <BtnSm onClick={() => setVariants([...variants, { id: uid(), label: '', price: '' }])}>+ Agregar</BtnSm>
        </div>
        {variants.map((v, i) => {
          const cost   = previewCost(v.id)
          const margin = parseInt(v.price) && cost ? (((parseInt(v.price)||0) - cost) / (parseInt(v.price)||1) * 100) : null
          return (
            <div key={v.id} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                <Input
                  value={v.label}
                  onChange={e => setVariants(variants.map((x,j) => j===i ? {...x, label: e.target.value} : x))}
                  placeholder="Nombre (ej: Doble)"
                  style={{ flex: 1 }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg3)', borderRadius: 8, padding: '0 10px', border: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--gold)', fontSize: 14 }}>$</span>
                  <input type="number" value={v.price}
                    onChange={e => setVariants(variants.map((x,j) => j===i ? {...x, price: e.target.value} : x))}
                    placeholder="Precio"
                    style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 15, width: 90, padding: '10px 0' }} />
                </div>
                {variants.length > 1 && <BtnSm danger onClick={() => setVariants(variants.filter((_,j)=>j!==i))}>✕</BtnSm>}
              </div>
              {cost > 0 && (
                <div style={{ fontSize: 11, color: 'var(--text3)', paddingLeft: 4 }}>
                  Costo estimado: <strong style={{ color: 'var(--text2)' }}>{fmtCLP(cost)}</strong>
                  {margin !== null && (
                    <span style={{ marginLeft: 8, color: margin > 55 ? 'var(--green)' : 'var(--orange)', fontWeight: 700 }}>
                      · {margin.toFixed(0)}% margen
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </Card>

      {/* Base ingredient quantities */}
      <Card>
        <SectionTitle>Ingredientes — cantidad base (aplica a todas las variantes)</SectionTitle>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>
          Ingresa la cantidad de cada ingrediente. Deja en 0 para no incluirlo.
        </div>
        {db.ingredients.map(ing => {
          const qty = ingQtys[ing.id] || 0
          return (
            <div key={ing.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: qty > 0 ? 'var(--text)' : 'var(--text3)' }}>{ing.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{fmtCLP(ing.cost)} c/u</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button onClick={() => setBaseQty(ing.id, Math.max(0, qty-1))}
                  style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text)', cursor: 'pointer', fontSize: 16 }}>
                  −
                </button>
                <div style={{ width: 36, textAlign: 'center', fontWeight: 700, fontSize: 16, color: qty > 0 ? 'var(--gold)' : 'var(--text3)' }}>
                  {qty}
                </div>
                <button onClick={() => setBaseQty(ing.id, qty+1)}
                  style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text)', cursor: 'pointer', fontSize: 16 }}>
                  +
                </button>
              </div>
              {qty > 0 && <div style={{ fontSize: 11, color: 'var(--text3)', width: 60, textAlign: 'right' }}>{fmtCLP(ing.cost * qty)}</div>}
            </div>
          )
        })}
      </Card>

      {/* Per-variant overrides — only show if there are active ingredients */}
      {activeIngs.length > 0 && variants.length > 1 && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <SectionTitle style={{ margin: 0 }}>Cantidades por variante (opcional)</SectionTitle>
            <BtnSm onClick={() => setShowOverrides(!showOverrides)}>
              {showOverrides ? 'Ocultar' : 'Configurar'}
            </BtnSm>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: showOverrides ? 14 : 0 }}>
            Úsalo para ingredientes que cambian según la variante — por ejemplo, Carne x1/x2/x3 para Simple/Doble/Triple.
          </div>

          {showOverrides && activeIngs.map(ing => (
            <div key={ing.id} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>
                {ing.name} <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(base: {ingQtys[ing.id] || 0})</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {variants.map(v => {
                  const overrideQty = varOverrides[v.id]?.[ing.id]
                  const displayQty  = overrideQty !== undefined ? overrideQty : (ingQtys[ing.id] || 0)
                  const isOverridden = overrideQty !== undefined
                  return (
                    <div key={v.id} style={{ flex: 1, minWidth: 80, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: isOverridden ? 'var(--gold)' : 'var(--text3)', marginBottom: 4, fontWeight: isOverridden ? 700 : 400 }}>
                        {v.label || `Var ${variants.indexOf(v)+1}`}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <button onClick={() => setOverrideQty(v.id, ing.id, Math.max(0, displayQty-1))}
                          style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text)', cursor: 'pointer' }}>
                          −
                        </button>
                        <div style={{ width: 28, textAlign: 'center', fontWeight: 700, color: isOverridden ? 'var(--gold)' : 'var(--text2)' }}>
                          {displayQty}
                        </div>
                        <button onClick={() => setOverrideQty(v.id, ing.id, displayQty+1)}
                          style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text)', cursor: 'pointer' }}>
                          +
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </Card>
      )}

      <BtnGold onClick={handleSave} loading={saving}>
        💾 {isNew ? 'Crear producto' : 'Guardar cambios'}
      </BtnGold>
    </div>
  )
}
