import { supabase, isConfigured } from './supabase.js'

// ─── SEED DATA ────────────────────────────────────────────────────────────────
export const SEED_INGREDIENTS = [
  { id: 'i1',  name: 'Pan',                cost: 450  },
  { id: 'i2',  name: 'Queso Cheddar',      cost: 124  },
  { id: 'i3',  name: 'Carne 120gr',        cost: 1000 },
  { id: 'i4',  name: 'Salsa DDB',          cost: 100  },
  { id: 'i5',  name: 'Sal',                cost: 10   },
  { id: 'i6',  name: 'Pimienta',           cost: 50   },
  { id: 'i7',  name: 'Mantequilla',        cost: 50   },
  { id: 'i8',  name: 'Lechuga',            cost: 200  },
  { id: 'i9',  name: 'Cebolla Morada',     cost: 100  },
  { id: 'i10', name: 'Tomate',             cost: 100  },
  { id: 'i11', name: 'Cebolla Carameliz.', cost: 300  },
  { id: 'i12', name: 'Champiñones',        cost: 600  },
  { id: 'i13', name: 'Bacon Chips',        cost: 450  },
]

export const SEED_EXTRAS = [
  { id: 'e1', name: 'Bacon Chips',       price: 990  },
  { id: 'e2', name: 'Queso Cheddar',     price: 590  },
  { id: 'e3', name: 'Pepinillos',        price: 490  },
  { id: 'e4', name: 'Salsa BBQ',         price: 690  },
  { id: 'e5', name: 'Bebida Lata 350cc', price: 1490 },
  { id: 'e6', name: 'Jugo Lata Jumex',   price: 1490 },
  { id: 'e7', name: 'Not Burger',        price: 1490 },
]

export const SEED_PRODUCTS = [
  {
    id: 'p1', name: 'DDB Cheese Burger',
    variants: [
      { id: 'p1_simple', label: 'Simple', price: 4500 },
      { id: 'p1_doble',  label: 'Doble',  price: 6500 },
      { id: 'p1_triple', label: 'Triple', price: 9000 },
    ],
    ingredient_quantities: { i1:1, i2:1, i3:1, i4:1, i5:1, i6:1, i7:1 },
    variant_overrides: { p1_simple:{i3:1}, p1_doble:{i3:2}, p1_triple:{i3:3} },
  },
  {
    id: 'p2', name: 'DDB Notorious Big',
    variants: [
      { id: 'p2_simple', label: 'Simple', price: 5000 },
      { id: 'p2_doble',  label: 'Doble',  price: 7000 },
      { id: 'p2_triple', label: 'Triple', price: 9500 },
    ],
    ingredient_quantities: { i1:1, i2:1, i3:1, i4:1, i5:1, i6:1, i7:1, i8:1, i9:1 },
    variant_overrides: { p2_simple:{i3:1}, p2_doble:{i3:2}, p2_triple:{i3:3} },
  },
  {
    id: 'p3', name: 'DDB Candy Bacon',
    variants: [
      { id: 'p3_simple', label: 'Simple', price: 6000 },
      { id: 'p3_doble',  label: 'Doble',  price: 8000 },
      { id: 'p3_triple', label: 'Triple', price: 10500 },
    ],
    ingredient_quantities: { i1:1, i2:1, i3:1, i4:1, i5:1, i6:1, i7:1, i11:1, i13:1 },
    variant_overrides: { p3_simple:{i3:1}, p3_doble:{i3:2}, p3_triple:{i3:3} },
  },
  {
    id: 'p4', name: 'DDB Cuarto de Libra',
    variants: [
      { id: 'p4_simple', label: 'Simple', price: 4800 },
      { id: 'p4_doble',  label: 'Doble',  price: 6800 },
      { id: 'p4_triple', label: 'Triple', price: 9300 },
    ],
    ingredient_quantities: { i1:1, i2:1, i3:1, i4:1, i5:1, i6:1, i7:1, i9:1 },
    variant_overrides: { p4_simple:{i3:1}, p4_doble:{i3:2}, p4_triple:{i3:3} },
  },
  {
    id: 'p5', name: 'DDB Clásica',
    variants: [
      { id: 'p5_simple', label: 'Simple', price: 5500 },
      { id: 'p5_doble',  label: 'Doble',  price: 7500 },
      { id: 'p5_triple', label: 'Triple', price: 10000 },
    ],
    ingredient_quantities: { i1:1, i2:1, i3:1, i4:1, i5:1, i6:1, i7:1, i8:1, i9:1, i10:1 },
    variant_overrides: { p5_simple:{i3:1}, p5_doble:{i3:2}, p5_triple:{i3:3} },
  },
  {
    id: 'p6', name: 'DDB Galáctica',
    variants: [
      { id: 'p6_simple', label: 'Simple', price: 6500 },
      { id: 'p6_doble',  label: 'Doble',  price: 8500 },
      { id: 'p6_triple', label: 'Triple', price: 11000 },
    ],
    ingredient_quantities: { i1:1, i2:1, i3:1, i4:1, i5:1, i6:1, i7:1, i11:1, i12:1 },
    variant_overrides: { p6_simple:{i3:1}, p6_doble:{i3:2}, p6_triple:{i3:3} },
  },
  {
    id: 'p7', name: 'DDB Homenaje del Mes',
    variants: [
      { id: 'p7_doble', label: 'Doble', price: 10500 },
    ],
    ingredient_quantities: { i1:1, i2:2, i3:2, i4:1, i5:1, i6:1, i7:1 },
    variant_overrides: {},
  },
]

export const SEED_FIXED_COSTS = [
  { id: 'fc1', name: 'Arriendo',           amount: 200000 },
  { id: 'fc2', name: 'Luz',                amount: 15000  },
  { id: 'fc3', name: 'Agua',               amount: 5000   },
  { id: 'fc4', name: 'Gas',                amount: 96000  },
  { id: 'fc5', name: 'Mantención Equipos', amount: 20000  },
  { id: 'fc6', name: 'Patente',            amount: 4583   },
  { id: 'fc7', name: 'Contador/Auditor',   amount: 20000  },
]

// ─── COST CALCULATIONS ────────────────────────────────────────────────────────
export const calcVariantCost = (product, variantId, ingredients) => {
  const base      = product.ingredient_quantities || {}
  const overrides = product.variant_overrides?.[variantId] || {}
  return Object.entries({ ...base, ...overrides }).reduce((sum, [iid, qty]) => {
    const ing = ingredients.find(i => i.id === iid)
    return sum + (ing?.cost ?? 0) * qty
  }, 0)
}

export const calcProductCost = (product, ingredients, variantId = null) => {
  if (variantId) return calcVariantCost(product, variantId, ingredients)
  const mid = product.variants?.[Math.floor((product.variants?.length || 1) / 2)]
  return mid ? calcVariantCost(product, mid.id, ingredients) : 0
}

export const totalFixedCostMonthly = (fc) => (fc || []).reduce((a, f) => a + (f.amount || 0), 0)
export const dailyFixedCost = (fc, days = 30) => totalFixedCostMonthly(fc) / days

// ─── LOCAL STORAGE ────────────────────────────────────────────────────────────
const LS_KEY = 'ddb_db_v3'
const lsLoad = () => { try { const r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : null } catch { return null } }
const lsSave = (d) => { try { localStorage.setItem(LS_KEY, JSON.stringify(d)) } catch {} }
const lsInit = () => {
  const e = lsLoad()
  if (e) return { ...e, orders: e.orders || [], promos: e.promos || [] }
  const fresh = {
    ingredients: SEED_INGREDIENTS, extras: SEED_EXTRAS,
    products: SEED_PRODUCTS, fixed_costs: SEED_FIXED_COSTS,
    orders: [], promos: [],
  }
  lsSave(fresh); return fresh
}

// ─── LOAD ALL ─────────────────────────────────────────────────────────────────
export async function loadAll() {
  if (!isConfigured) return lsInit()

  const [
    { data: ingredients },
    { data: extras },
    { data: products },
    { data: variants },
    { data: prodIngredients },
    { data: variantOverrides },
    { data: fixedCosts },
    { data: promos },
    { data: orders },
    { data: orderItems },
    { data: orderItemExtras },
  ] = await Promise.all([
    supabase.from('ingredients').select('*').order('name'),
    supabase.from('extras').select('*').order('name'),
    supabase.from('products').select('*').eq('active', true).order('name'),
    supabase.from('product_variants').select('*').order('price'),
    supabase.from('product_ingredients').select('*'),
    supabase.from('variant_ingredient_overrides').select('*'),
    supabase.from('fixed_costs').select('*').order('name'),
    supabase.from('promos').select('*').order('name'),
    supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('order_items').select('*'),
    supabase.from('order_item_extras').select('*'),
  ])

  const enrichedProducts = (products || []).map(p => {
    const pIngs = (prodIngredients || []).filter(pi => pi.product_id === p.id)
    const ingredient_quantities = Object.fromEntries(pIngs.map(pi => [pi.ingredient_id, pi.qty ?? 1]))
    const pVariants = (variants || []).filter(v => v.product_id === p.id)
    const variant_overrides = {}
    pVariants.forEach(v => {
      const ovs = (variantOverrides || []).filter(o => o.variant_id === v.id)
      if (ovs.length) variant_overrides[v.id] = Object.fromEntries(ovs.map(o => [o.ingredient_id, o.qty]))
    })
    return { ...p, variants: pVariants, ingredient_quantities, variant_overrides }
  })

  const enrichedOrders = (orders || []).map(o => ({
    ...o,
    items: (orderItems || [])
      .filter(i => i.order_id === o.id)
      .map(item => ({
        ...item,
        extras: (orderItemExtras || []).filter(e => e.order_item_id === item.id),
      })),
  }))

  return {
    ingredients: ingredients || [],
    extras: extras || [],
    products: enrichedProducts,
    fixed_costs: fixedCosts || [],
    promos: promos || [],
    orders: enrichedOrders,
  }
}

// ─── PROMOS ───────────────────────────────────────────────────────────────────
// promo = { id, name, variant_id, qty, promo_price, active }
// Example: { name: "2 Cheese Simples", variant_id: "p1_simple", qty: 2, promo_price: 7000, active: true }

export async function savePromo(db, promo, isNew) {
  if (!isConfigured) {
    const newPromos = isNew
      ? [...(db.promos || []), promo]
      : (db.promos || []).map(p => p.id === promo.id ? promo : p)
    const n = { ...db, promos: newPromos }; lsSave(n); return n
  }
  await supabase.from('promos').upsert(promo)
  return await loadAll()
}

export async function deletePromo(db, promoId) {
  if (!isConfigured) {
    const n = { ...db, promos: (db.promos || []).filter(p => p.id !== promoId) }
    lsSave(n); return n
  }
  await supabase.from('promos').delete().eq('id', promoId)
  return await loadAll()
}

// ─── ORDERS ───────────────────────────────────────────────────────────────────
// item.promo_id: id of applied promo (or null)
// item.promo_name: name of applied promo (or null)
// item.original_price: original total price before promo (for dashboard insight)
// item.unit_price: actual charged price (already reflects promo total / qty)

export async function createOrder(db, order) {
  const newOrder = {
    id: uid(),
    customer_name: order.customer_name || '',
    status: 'pending',
    created_at: new Date().toISOString(),
    items: order.items,
  }

  if (!isConfigured) {
    const n = { ...db, orders: [newOrder, ...(db.orders || [])] }
    lsSave(n); return n
  }

  const { data: created } = await supabase
    .from('orders')
    .insert({ id: newOrder.id, customer_name: newOrder.customer_name, status: 'pending' })
    .select().single()

  for (const item of order.items) {
    const { data: createdItem } = await supabase
      .from('order_items')
      .insert({
        id: uid(),
        order_id: created.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        product_name: item.product_name,
        variant_label: item.variant_label,
        qty: item.qty,
        unit_price: item.unit_price,
        promo_id: item.promo_id || null,
        promo_name: item.promo_name || null,
        original_unit_price: item.original_unit_price || item.unit_price,
      })
      .select().single()

    if (item.extras?.length) {
      await supabase.from('order_item_extras').insert(
        item.extras.map(ex => ({
          id: uid(),
          order_item_id: createdItem.id,
          extra_id: ex.extra_id,
          extra_name: ex.extra_name,
          qty: ex.qty,
          unit_price: ex.unit_price,
        }))
      )
    }
  }

  return await loadAll()
}

export async function updateOrderStatus(db, orderId, status) {
  if (!isConfigured) {
    const n = { ...db, orders: db.orders.map(o => o.id === orderId ? { ...o, status } : o) }
    lsSave(n); return n
  }
  await supabase.from('orders').update({ status }).eq('id', orderId)
  return await loadAll()
}

export async function deleteOrder(db, orderId) {
  if (!isConfigured) {
    const n = { ...db, orders: db.orders.filter(o => o.id !== orderId) }
    lsSave(n); return n
  }
  await supabase.from('orders').delete().eq('id', orderId)
  return await loadAll()
}

export async function loadTodayOrders() {
  if (!isConfigured) {
    const db = lsInit()
    const today = new Date().toISOString().slice(0, 10)
    return (db.orders || []).filter(o => o.created_at?.startsWith(today))
  }
  const today = new Date().toISOString().slice(0, 10)
  const { data: orders } = await supabase
    .from('orders').select('*')
    .gte('created_at', today + 'T00:00:00')
    .order('created_at', { ascending: true })

  const ids = (orders || []).map(o => o.id)
  if (!ids.length) return []

  const { data: orderItems }      = await supabase.from('order_items').select('*').in('order_id', ids)
  const itemIds = (orderItems || []).map(i => i.id)
  const { data: orderItemExtras } = itemIds.length
    ? await supabase.from('order_item_extras').select('*').in('order_item_id', itemIds)
    : { data: [] }

  return (orders || []).map(o => ({
    ...o,
    items: (orderItems || [])
      .filter(i => i.order_id === o.id)
      .map(item => ({ ...item, extras: (orderItemExtras || []).filter(e => e.order_item_id === item.id) })),
  }))
}

// ─── PRODUCTS / INGREDIENTS / EXTRAS / FIXED COSTS ───────────────────────────
export async function saveProduct(db, product, isNew) {
  if (!isConfigured) {
    const newProds = isNew ? [...db.products, product] : db.products.map(p => p.id === product.id ? product : p)
    const n = { ...db, products: newProds }; lsSave(n); return n
  }
  const { variants, ingredient_quantities, variant_overrides, ...productData } = product
  await supabase.from('products').upsert({ ...productData, active: true })
  await supabase.from('product_variants').delete().eq('product_id', product.id)
  if (variants.length) await supabase.from('product_variants').insert(
    variants.map(v => ({ id: v.id, product_id: product.id, label: v.label, price: v.price }))
  )
  await supabase.from('product_ingredients').delete().eq('product_id', product.id)
  const ingRows = Object.entries(ingredient_quantities||{}).filter(([,q])=>q>0).map(([ingredient_id,qty])=>({product_id:product.id,ingredient_id,qty}))
  if (ingRows.length) await supabase.from('product_ingredients').insert(ingRows)
  const allVids = variants.map(v => v.id)
  if (allVids.length) await supabase.from('variant_ingredient_overrides').delete().in('variant_id', allVids)
  const overrideRows = []
  Object.entries(variant_overrides||{}).forEach(([variant_id,ings])=>{
    Object.entries(ings).forEach(([ingredient_id,qty])=>overrideRows.push({variant_id,ingredient_id,qty}))
  })
  if (overrideRows.length) await supabase.from('variant_ingredient_overrides').insert(overrideRows)
  return await loadAll()
}

export async function deleteProduct(db, productId) {
  if (!isConfigured) { const n={...db,products:db.products.filter(p=>p.id!==productId)}; lsSave(n); return n }
  await supabase.from('products').update({ active: false }).eq('id', productId)
  return await loadAll()
}

export async function saveIngredients(db, ingredients) {
  if (!isConfigured) { const n={...db,ingredients}; lsSave(n); return n }
  await supabase.from('ingredients').upsert(ingredients)
  const del = db.ingredients.filter(o=>!ingredients.find(i=>i.id===o.id)).map(i=>i.id)
  if (del.length) await supabase.from('ingredients').delete().in('id', del)
  return await loadAll()
}

export async function saveExtras(db, extras) {
  if (!isConfigured) { const n={...db,extras}; lsSave(n); return n }
  await supabase.from('extras').upsert(extras)
  const del = db.extras.filter(o=>!extras.find(e=>e.id===o.id)).map(e=>e.id)
  if (del.length) await supabase.from('extras').delete().in('id', del)
  return await loadAll()
}

export async function saveFixedCosts(db, fixed_costs) {
  if (!isConfigured) { const n={...db,fixed_costs}; lsSave(n); return n }
  await supabase.from('fixed_costs').upsert(fixed_costs)
  const del = (db.fixed_costs||[]).filter(o=>!fixed_costs.find(f=>f.id===o.id)).map(f=>f.id)
  if (del.length) await supabase.from('fixed_costs').delete().in('id', del)
  return await loadAll()
}

export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2))
