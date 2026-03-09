import React, { useState } from 'react'
import { saveIngredients, saveExtras, saveFixedCosts, savePromo, deletePromo, uid, totalFixedCostMonthly } from '../lib/data.js'
import { fmtCLP } from '../lib/utils.js'
import { isConfigured } from '../lib/supabase.js'
import { Card, Input, BtnGold, BtnSm, SectionTitle, Toast } from '../components/UI.jsx'

export default function AjustesPage({ db, setDB }) {
  const [tab, setTab]     = useState('ingredientes')
  const [toast, setToast] = useState(false)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(false), 2000) }

  const TabBtn = ({ id, label }) => (
    <button onClick={() => setTab(id)} style={{
      flex: 1, padding: '9px 4px',
      background: tab === id ? 'var(--gold)' : 'var(--bg3)',
      color: tab === id ? '#0d0d0d' : 'var(--text2)',
      border: 'none', borderRadius: 8, cursor: 'pointer',
      fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: 0.3,
    }}>
      {label}
    </button>
  )

  return (
    <div className="page-enter" style={{ padding: '20px 16px 120px', maxWidth: 480, margin: '0 auto' }}>
      <Toast msg={toast} visible={!!toast} />
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--gold)', margin: '0 0 16px' }}>
        Ajustes
      </h2>
      <div style={{ display: 'flex', gap: 5, marginBottom: 20 }}>
        <TabBtn id="ingredientes" label="Ingredientes" />
        <TabBtn id="extras"       label="Extras"       />
        <TabBtn id="promos"       label="Promos"       />
        <TabBtn id="gastosfijos"  label="GG Fijos"     />
        <TabBtn id="cuenta"       label="Cuenta"       />
      </div>

      {tab === 'ingredientes' && (
        <IngredientesTab
          items={db.ingredients}
          onSave={async (ings) => { const n = await saveIngredients(db, ings); setDB(n); showToast('Ingredientes guardados') }}
        />
      )}
      {tab === 'extras' && (
        <ExtrasTab
          items={db.extras}
          onSave={async (exts) => { const n = await saveExtras(db, exts); setDB(n); showToast('Extras guardados') }}
        />
      )}
      {tab === 'promos' && (
        <PromosTab
          db={db}
          onSave={async (promo, isNew) => { const n = await savePromo(db, promo, isNew); setDB(n); showToast(isNew ? 'Promo creada ✓' : 'Promo actualizada ✓') }}
          onDelete={async (id) => { const n = await deletePromo(db, id); setDB(n); showToast('Promo eliminada') }}
        />
      )}
      {tab === 'gastosfijos' && (
        <GastosFijosTab
          items={db.fixed_costs || []}
          onSave={async (fc) => { const n = await saveFixedCosts(db, fc); setDB(n); showToast('Gastos fijos guardados') }}
        />
      )}
      {tab === 'cuenta' && <CuentaTab />}
    </div>
  )
}

// ─── PROMOS ───────────────────────────────────────────────────────────────────
function PromosTab({ db, onSave, onDelete }) {
  const emptyForm = { id: '', name: '', variant_id: '', qty: 2, promo_price: '', active: true }
  const [form, setForm]       = useState(emptyForm)
  const [editing, setEditing] = useState(false)

  // Flat list of all variants for the selector
  const allVariants = db.products.flatMap(p =>
    p.variants.map(v => ({ variantId: v.id, label: `${p.name.replace('DDB ','')} ${v.label}`, price: v.price, productId: p.id }))
  )

  const startNew  = () => { setForm({ ...emptyForm, id: uid() }); setEditing(true) }
  const startEdit = (promo) => { setForm({ ...promo }); setEditing(true) }
  const cancel    = () => { setForm(emptyForm); setEditing(false) }

  const handleSave = async () => {
    if (!form.name.trim())    return alert('Ingresa un nombre para la promo')
    if (!form.variant_id)     return alert('Selecciona un producto')
    if (!form.promo_price)    return alert('Ingresa el precio de la promo')
    await onSave({ ...form, qty: parseInt(form.qty)||2, promo_price: parseInt(form.promo_price)||0 }, !editing || form.id === emptyForm.id)
    cancel()
  }

  const selectedVariant = allVariants.find(v => v.variantId === form.variant_id)
  const normalTotal     = selectedVariant ? selectedVariant.price * (parseInt(form.qty)||2) : 0
  const saving          = parseInt(form.promo_price) ? normalTotal - parseInt(form.promo_price) : 0

  return (
    <>
      {/* Existing promos list */}
      {(db.promos || []).length === 0 && !editing && (
        <Card>
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text3)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🏷</div>
            <div style={{ fontSize: 14 }}>Sin promos creadas</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Crea tu primera promoción</div>
          </div>
        </Card>
      )}

      {(db.promos || []).map(promo => {
        const v   = allVariants.find(x => x.variantId === promo.variant_id)
        const normP = v ? v.price * promo.qty : 0
        const disc  = normP - promo.promo_price
        return (
          <Card key={promo.id} style={{ opacity: promo.active ? 1 : 0.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: promo.active ? 'var(--gold)' : 'var(--text3)' }}>
                  {promo.name}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>
                  {promo.qty}× {v?.label || promo.variant_id}
                </div>
                <div style={{ fontSize: 13, marginTop: 4, display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, color: 'var(--gold)' }}>{fmtCLP(promo.promo_price)}</span>
                  {disc > 0 && (
                    <>
                      <span style={{ fontSize: 11, textDecoration: 'line-through', color: 'var(--text3)' }}>{fmtCLP(normP)}</span>
                      <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700 }}>−{fmtCLP(disc)}</span>
                    </>
                  )}
                </div>
              </div>
              {/* Active toggle */}
              <button
                onClick={() => onSave({ ...promo, active: !promo.active }, false)}
                style={{
                  padding: '5px 12px', borderRadius: 20, cursor: 'pointer', fontSize: 11, fontWeight: 700,
                  border: `1px solid ${promo.active ? 'var(--green)' : 'var(--border)'}`,
                  background: promo.active ? '#0d2e1a' : 'var(--bg3)',
                  color: promo.active ? 'var(--green)' : 'var(--text3)',
                }}
              >
                {promo.active ? '✅ Activa' : '⭕ Inactiva'}
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <BtnSm onClick={() => startEdit(promo)}>✏️ Editar</BtnSm>
              <BtnSm danger onClick={() => { if (confirm('¿Eliminar esta promo?')) onDelete(promo.id) }}>🗑 Eliminar</BtnSm>
            </div>
          </Card>
        )
      })}

      {/* Create / Edit form */}
      {editing ? (
        <Card>
          <SectionTitle>{form.id ? 'Editar promo' : 'Nueva promo'}</SectionTitle>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>Nombre de la promo</div>
            <Input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="Ej: 2 Cheese Simples" />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>Producto y variante</div>
            <select
              value={form.variant_id}
              onChange={e => setForm(f=>({...f,variant_id:e.target.value}))}
              style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 12px', color:'var(--text)', fontSize:14, fontFamily:'var(--font-body)', outline:'none' }}
            >
              <option value="">Seleccionar...</option>
              {allVariants.map(v => (
                <option key={v.variantId} value={v.variantId}>{v.label} — {fmtCLP(v.price)} c/u</option>
              ))}
            </select>
          </div>

          <div style={{ display:'flex', gap:10, marginBottom:12 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>Cantidad</div>
              <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--bg3)', borderRadius:8, border:'1px solid var(--border)', padding:'8px 12px' }}>
                <button onClick={()=>setForm(f=>({...f,qty:Math.max(2,f.qty-1)}))} style={smallBtn}>−</button>
                <span style={{ fontWeight:700, fontSize:18, minWidth:24, textAlign:'center', color:'var(--gold)' }}>{form.qty}</span>
                <button onClick={()=>setForm(f=>({...f,qty:f.qty+1}))} style={smallBtn}>+</button>
              </div>
            </div>
            <div style={{ flex:2 }}>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>Precio de la promo</div>
              <div style={{ display:'flex', alignItems:'center', gap:4, background:'var(--bg3)', borderRadius:8, padding:'0 12px', border:'1px solid var(--border)' }}>
                <span style={{ color:'var(--gold)' }}>$</span>
                <input type="number" value={form.promo_price}
                  onChange={e=>setForm(f=>({...f,promo_price:e.target.value}))}
                  placeholder="Ej: 7000"
                  style={{ background:'none', border:'none', outline:'none', color:'var(--text)', fontSize:15, width:'100%', padding:'10px 0' }}
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          {selectedVariant && form.promo_price && (
            <div style={{ background:'var(--bg1)', borderRadius:10, padding:'10px 14px', marginBottom:14, fontSize:13 }}>
              <div style={{ color:'var(--text3)', marginBottom:4 }}>Vista previa:</div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span>{form.qty}× {selectedVariant.label}</span>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  {saving > 0 && <span style={{ textDecoration:'line-through', color:'var(--text3)', fontSize:12 }}>{fmtCLP(normalTotal)}</span>}
                  <span style={{ fontWeight:800, color:'var(--gold)' }}>{fmtCLP(parseInt(form.promo_price)||0)}</span>
                  {saving > 0 && <span style={{ color:'var(--green)', fontSize:11, fontWeight:700 }}>−{fmtCLP(saving)}</span>}
                </div>
              </div>
            </div>
          )}

          <div style={{ display:'flex', gap:8 }}>
            <BtnSm onClick={cancel}>Cancelar</BtnSm>
            <BtnGold onClick={handleSave} style={{ flex:1 }}>💾 Guardar promo</BtnGold>
          </div>
        </Card>
      ) : (
        <BtnGold onClick={startNew}>+ Nueva promo</BtnGold>
      )}
    </>
  )
}

// ─── INGREDIENTES ─────────────────────────────────────────────────────────────
function IngredientesTab({ items, onSave }) {
  const [list, setList]     = useState(items)
  const [newName, setNew]   = useState('')
  const [newCost, setNCost] = useState('')
  const [dirty, setDirty]   = useState(false)
  const [saving, setSaving] = useState(false)

  const update = (id, field, val) => { setList(list.map(i => i.id===id ? {...i,[field]:val} : i)); setDirty(true) }
  const del    = (id) => { setList(list.filter(i => i.id!==id)); setDirty(true) }
  const add    = () => {
    if (!newName.trim()) return
    setList([...list, { id: uid(), name: newName.trim(), cost: parseInt(newCost)||0 }])
    setNew(''); setNCost(''); setDirty(true)
  }

  return (
    <>
      <Card>
        <SectionTitle>Lista de ingredientes</SectionTitle>
        {list.map(ing => (
          <div key={ing.id} style={{ display:'flex', gap:8, marginBottom:8, alignItems:'center' }}>
            <Input value={ing.name} onChange={e=>update(ing.id,'name',e.target.value)} style={{ flex:2, fontSize:13, padding:'8px 10px' }} />
            <PriceInput value={ing.cost} onChange={v=>update(ing.id,'cost',parseInt(v)||0)} />
            <BtnSm danger onClick={()=>del(ing.id)}>✕</BtnSm>
          </div>
        ))}
      </Card>
      <Card>
        <SectionTitle>Agregar ingrediente</SectionTitle>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <Input value={newName} onChange={e=>setNew(e.target.value)} placeholder="Nombre" style={{ flex:2, fontSize:13 }} onKeyDown={e=>e.key==='Enter'&&add()} />
          <PriceInput value={newCost} onChange={setNCost} placeholder="Costo" />
          <BtnSm gold onClick={add}>+ Agregar</BtnSm>
        </div>
      </Card>
      {dirty && <BtnGold onClick={async()=>{setSaving(true);await onSave(list);setSaving(false);setDirty(false)}} loading={saving}>💾 Guardar cambios</BtnGold>}
    </>
  )
}

// ─── EXTRAS ───────────────────────────────────────────────────────────────────
function ExtrasTab({ items, onSave }) {
  const [list, setList]       = useState(items)
  const [newName, setNew]     = useState('')
  const [newPrice, setNPrice] = useState('')
  const [dirty, setDirty]     = useState(false)
  const [saving, setSaving]   = useState(false)

  const update = (id, field, val) => { setList(list.map(i => i.id===id ? {...i,[field]:val} : i)); setDirty(true) }
  const del    = (id) => { setList(list.filter(i => i.id!==id)); setDirty(true) }
  const add    = () => {
    if (!newName.trim()) return
    setList([...list, { id: uid(), name: newName.trim(), price: parseInt(newPrice)||0 }])
    setNew(''); setNPrice(''); setDirty(true)
  }

  return (
    <>
      <Card>
        <SectionTitle>Lista de extras</SectionTitle>
        {list.map(ex => (
          <div key={ex.id} style={{ display:'flex', gap:8, marginBottom:8, alignItems:'center' }}>
            <Input value={ex.name} onChange={e=>update(ex.id,'name',e.target.value)} style={{ flex:2, fontSize:13, padding:'8px 10px' }} />
            <PriceInput value={ex.price} onChange={v=>update(ex.id,'price',parseInt(v)||0)} />
            <BtnSm danger onClick={()=>del(ex.id)}>✕</BtnSm>
          </div>
        ))}
      </Card>
      <Card>
        <SectionTitle>Agregar extra</SectionTitle>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <Input value={newName} onChange={e=>setNew(e.target.value)} placeholder="Nombre" style={{ flex:2, fontSize:13 }} onKeyDown={e=>e.key==='Enter'&&add()} />
          <PriceInput value={newPrice} onChange={setNPrice} placeholder="Precio" />
          <BtnSm gold onClick={add}>+ Agregar</BtnSm>
        </div>
      </Card>
      {dirty && <BtnGold onClick={async()=>{setSaving(true);await onSave(list);setSaving(false);setDirty(false)}} loading={saving}>💾 Guardar cambios</BtnGold>}
    </>
  )
}

// ─── GASTOS FIJOS ─────────────────────────────────────────────────────────────
function GastosFijosTab({ items, onSave }) {
  const [list, setList]     = useState(items)
  const [newName, setNew]   = useState('')
  const [newAmt, setNAmt]   = useState('')
  const [dirty, setDirty]   = useState(false)
  const [saving, setSaving] = useState(false)

  const update = (id, field, val) => { setList(list.map(i => i.id===id ? {...i,[field]:val} : i)); setDirty(true) }
  const del    = (id) => { setList(list.filter(i => i.id!==id)); setDirty(true) }
  const add    = () => {
    if (!newName.trim()) return
    setList([...list, { id: uid(), name: newName.trim(), amount: parseInt(newAmt)||0 }])
    setNew(''); setNAmt(''); setDirty(true)
  }

  const totalMonthly = list.reduce((a, f) => a + (parseInt(f.amount)||0), 0)

  return (
    <>
      <Card accent>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:12, color:'var(--gold)', fontWeight:700 }}>Total mensual GG</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:700, color:'var(--gold)' }}>{fmtCLP(totalMonthly)}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:12, color:'var(--text3)' }}>Costo diario</div>
            <div style={{ fontSize:20, fontWeight:700 }}>{fmtCLP(Math.round(totalMonthly/30))}</div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>÷ 30 días</div>
          </div>
        </div>
      </Card>
      <Card>
        <SectionTitle>Gastos fijos mensuales</SectionTitle>
        {list.map(f => (
          <div key={f.id} style={{ display:'flex', gap:8, marginBottom:8, alignItems:'center' }}>
            <Input value={f.name} onChange={e=>update(f.id,'name',e.target.value)} style={{ flex:2, fontSize:13, padding:'8px 10px' }} />
            <PriceInput value={f.amount} onChange={v=>update(f.id,'amount',parseInt(v)||0)} />
            <BtnSm danger onClick={()=>del(f.id)}>✕</BtnSm>
          </div>
        ))}
      </Card>
      <Card>
        <SectionTitle>Agregar gasto fijo</SectionTitle>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <Input value={newName} onChange={e=>setNew(e.target.value)} placeholder="Nombre (ej: Arriendo)" style={{ flex:2, fontSize:13 }} onKeyDown={e=>e.key==='Enter'&&add()} />
          <PriceInput value={newAmt} onChange={setNAmt} placeholder="Monto $" />
          <BtnSm gold onClick={add}>+ Agregar</BtnSm>
        </div>
      </Card>
      {dirty && <BtnGold onClick={async()=>{setSaving(true);await onSave(list);setSaving(false);setDirty(false)}} loading={saving}>💾 Guardar cambios</BtnGold>}
    </>
  )
}

// ─── CUENTA ───────────────────────────────────────────────────────────────────
function CuentaTab() {
  return (
    <Card>
      <SectionTitle>Estado de conexión</SectionTitle>
      <div style={{
        padding:'12px 16px', borderRadius:10, marginBottom:14,
        background: isConfigured ? '#0d2e1a' : '#2e1a0d',
        border: `1px solid ${isConfigured ? 'var(--green)' : 'var(--orange)'}`,
        color: isConfigured ? 'var(--green)' : 'var(--orange)',
        fontSize:14, fontWeight:600,
      }}>
        {isConfigured ? '🟢 Conectado a Supabase — datos en la nube' : '🟡 Modo demo — datos guardados localmente'}
      </div>
    </Card>
  )
}

// ─── SHARED ───────────────────────────────────────────────────────────────────
function PriceInput({ value, onChange, placeholder = 'Monto' }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4, background:'var(--bg3)', borderRadius:8, padding:'0 10px', border:'1px solid var(--border)', flexShrink:0 }}>
      <span style={{ color:'var(--gold)', fontSize:13 }}>$</span>
      <input type="number" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{ background:'none', border:'none', outline:'none', color:'var(--text)', fontSize:14, width:90, padding:'8px 0' }} />
    </div>
  )
}

const smallBtn = {
  width:28, height:28, borderRadius:6, border:'1px solid var(--border)',
  background:'var(--bg1)', color:'var(--text)', cursor:'pointer', fontSize:16,
}
