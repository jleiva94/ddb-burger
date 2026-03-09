export const fmtCLP = (n) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(n ?? 0)

export const todayStr = () => new Date().toISOString().slice(0, 10)

export const dayLabel = (d) =>
  new Date(d + 'T12:00:00').toLocaleDateString('es-CL', {
    weekday: 'long', day: 'numeric', month: 'short',
  })

export const monthLabel = (m) =>
  new Date(m + '-15').toLocaleDateString('es-CL', {
    month: 'long', year: 'numeric',
  })

export const timeLabel = (iso) => {
  const d = new Date(iso)
  return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
}

// Revenue from a single order
// order.items = [{ variant_id, product_id, qty, unit_price, extras: [{ extra_id, qty, unit_price }] }]
export const orderRevenue = (order) => {
  let t = 0
  ;(order.items || []).forEach(item => {
    t += item.qty * item.unit_price
    ;(item.extras || []).forEach(ex => { t += ex.qty * ex.unit_price })
  })
  return t
}

export const orderCost = (order, products, ingredients) => {
  let c = 0
  ;(order.items || []).forEach(item => {
    const product = products.find(p => p.id === item.product_id)
    if (!product) return
    const baseQtys  = product.ingredient_quantities || {}
    const overrides = product.variant_overrides?.[item.variant_id] || {}
    const effective = { ...baseQtys, ...overrides }
    const varCost   = Object.entries(effective).reduce((sum, [iid, qty]) => {
      const ing = ingredients.find(i => i.id === iid)
      return sum + (ing?.cost ?? 0) * qty
    }, 0)
    c += item.qty * varCost
  })
  return c
}

export const saleRevenue = (sale, products, extras) => {
  let t = 0
  products.forEach(p =>
    p.variants.forEach(v => { t += (sale.units?.[v.id] || 0) * v.price })
  )
  extras.forEach(ex =>
    products.forEach(p => { t += (sale.extras?.[`${p.id}_${ex.id}`] || 0) * ex.price })
  )
  return t
}

export const saleUnitsTotal = (sale) =>
  Object.values(sale.units || {}).reduce((a, v) => a + (parseInt(v) || 0), 0)
