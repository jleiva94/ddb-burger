import React, { useState, useMemo } from 'react'
import { fmtCLP, todayStr, dayLabel, monthLabel, timeLabel } from '../lib/utils.js'
import { calcVariantCost, totalFixedCostMonthly } from '../lib/data.js'
import { Card, SectionTitle, StatCard, ProgressBar, Badge, EmptyState } from '../components/UI.jsx'

const orderRev = (order) =>
  (order.items || []).reduce((sum, item) => {
    const ex = (item.extras || []).reduce((a, e) => a + e.qty * e.unit_price, 0)
    return sum + item.qty * item.unit_price + ex
  }, 0)

const orderVarCost = (order, products, ingredients) =>
  (order.items || []).reduce((sum, item) => {
    const product = products.find(p => p.id === item.product_id)
    if (!product) return sum
    const eff = { ...(product.ingredient_quantities||{}), ...(product.variant_overrides?.[item.variant_id]||{}) }
    const vc  = Object.entries(eff).reduce((c,[iid,qty])=>{
      const ing = ingredients.find(i=>i.id===iid); return c+(ing?.cost??0)*qty
    }, 0)
    return sum + item.qty * vc
  }, 0)

const orderUnits = (o) => (o.items||[]).reduce((a,i)=>a+i.qty,0)

export default function DashboardPage({ db }) {
  const [tab, setTab]         = useState('hoy')
  const [selMonth, setSelMonth] = useState(() => todayStr().slice(0,7))

  const today     = todayStr()
  const fcMonthly = totalFixedCostMonthly(db.fixed_costs)
  const daysInM   = (m) => { const [y,mo]=m.split('-').map(Number); return new Date(y,mo,0).getDate() }
  const fcDaily   = (m) => fcMonthly / daysInM(m)

  const ordersByDate = useMemo(()=>{
    const map = {}
    ;(db.orders||[]).forEach(o=>{
      const d = o.created_at?.slice(0,10)||today
      if (!map[d]) map[d]=[]
      map[d].push(o)
    })
    return map
  },[db.orders])

  const allDates    = Object.keys(ordersByDate).sort().reverse()
  const months      = [...new Set(allDates.map(d=>d.slice(0,7)))].sort().reverse()
  const last7Dates  = allDates.slice(0,7).reverse()
  const todayOrders = ordersByDate[today]||[]
  const monthOrders = (db.orders||[]).filter(o=>o.created_at?.startsWith(selMonth))

  // Today stats
  const todayRev    = todayOrders.reduce((a,o)=>a+orderRev(o),0)
  const todayVC     = todayOrders.reduce((a,o)=>a+orderVarCost(o,db.products,db.ingredients),0)
  const todayFC     = fcDaily(today.slice(0,7))
  const todayProfit = todayRev - todayVC - todayFC
  const todayUnits  = todayOrders.reduce((a,o)=>a+orderUnits(o),0)
  const todayMargin = todayRev ? (todayProfit/todayRev*100) : 0

  // Month stats
  const activeDays  = new Set(monthOrders.map(o=>o.created_at?.slice(0,10))).size
  const monthRev    = monthOrders.reduce((a,o)=>a+orderRev(o),0)
  const monthVC     = monthOrders.reduce((a,o)=>a+orderVarCost(o,db.products,db.ingredients),0)
  const monthFC     = fcDaily(selMonth)*activeDays
  const monthProfit = monthRev-monthVC-monthFC
  const monthUnits  = monthOrders.reduce((a,o)=>a+orderUnits(o),0)
  const monthMargin = monthRev ? (monthProfit/monthRev*100) : 0

  const prodStats = useMemo(()=>{
    const stats={}
    monthOrders.forEach(o=>{
      ;(o.items||[]).forEach(item=>{
        if (!stats[item.product_id]) stats[item.product_id]={units:0,revenue:0}
        stats[item.product_id].units+=item.qty
        stats[item.product_id].revenue+=item.qty*item.unit_price
      })
    })
    return db.products.map(p=>{
      const mid=p.variants[Math.floor(p.variants.length/2)]
      const midCost=mid?calcVariantCost(p,mid.id,db.ingredients):0
      const midPrice=mid?.price||0
      return { ...p, units:stats[p.id]?.units||0, revenue:stats[p.id]?.revenue||0,
        margin:midPrice?((midPrice-midCost)/midPrice*100):0 }
    }).sort((a,b)=>b.units-a.units)
  },[monthOrders,db.products,db.ingredients])
  const maxUnits=Math.max(...prodStats.map(p=>p.units),1)

  const TabBtn = ({id,label})=>(
    <button onClick={()=>setTab(id)} style={{
      flex:1, padding:'10px 4px',
      background:tab===id?'var(--gold)':'var(--bg3)',
      color:tab===id?'#0d0d0d':'var(--text2)',
      border:'none', borderRadius:8, cursor:'pointer',
      fontFamily:'var(--font-body)', fontSize:12, fontWeight:700,
    }}>{label}</button>
  )

  const MonthSelect=()=>(
    <select value={selMonth} onChange={e=>setSelMonth(e.target.value)} style={{
      width:'100%', background:'var(--bg3)', border:'1px solid var(--border)',
      borderRadius:10, padding:'10px 12px', color:'var(--text)',
      fontSize:15, fontFamily:'var(--font-body)', marginBottom:14, outline:'none',
    }}>
      {months.map(m=><option key={m} value={m}>{monthLabel(m)}</option>)}
      {!months.includes(today.slice(0,7))&&<option value={today.slice(0,7)}>Mes actual (sin datos)</option>}
    </select>
  )

  return (
    <div className="page-enter" style={{padding:'20px 16px 120px',maxWidth:480,margin:'0 auto'}}>
      <h2 style={{fontFamily:'var(--font-display)',fontSize:26,fontWeight:700,color:'var(--gold)',margin:'0 0 16px'}}>
        Dashboard
      </h2>
      <div style={{display:'flex',gap:8,marginBottom:20}}>
        <TabBtn id="hoy"       label="Hoy"       />
        <TabBtn id="7dias"     label="7 días"    />
        <TabBtn id="mes"       label="Por mes"   />
        <TabBtn id="productos" label="Productos" />
      </div>

      {/* HOY */}
      {tab==='hoy'&&(
        <>
          {todayOrders.length===0
            ? <EmptyState icon="🍔" title="Sin comandas hoy" sub="Los pedidos aparecerán aquí" />
            : <>
                <Card accent style={{textAlign:'center',marginBottom:10}}>
                  <div style={{fontFamily:'var(--font-display)',fontSize:36,fontWeight:700,color:'#0d0d0d'}}>{fmtCLP(todayRev)}</div>
                  <div style={{fontSize:12,color:'#7a4800'}}>Ingresos de hoy</div>
                  <div style={{display:'flex',justifyContent:'space-around',marginTop:14,paddingTop:12,borderTop:'1px solid #c8932a44'}}>
                    <Kpi label="Pedidos"  val={todayOrders.length} />
                    <Kpi label="Unidades" val={todayUnits} />
                    <Kpi label="Neto" val={fmtCLP(Math.round(todayProfit))} col={todayProfit>=0?'#0d4a1f':'#4a0d0d'} />
                    <Kpi label="Mg real" val={`${todayMargin.toFixed(1)}%`} col={todayMargin>=0?'#0d4a1f':'#4a0d0d'} />
                  </div>
                </Card>
                <Card style={{marginBottom:10}}>
                  <SectionTitle>Resultado del día</SectionTitle>
                  <PLRow label="Ingresos"          val={fmtCLP(todayRev)}                   bold />
                  <PLRow label="− Costo variable"  val={`− ${fmtCLP(todayVC)}`}            col="var(--red)" />
                  <PLRow label="= Mg contribución" val={fmtCLP(todayRev-todayVC)}          col="var(--gold)" bold />
                  <div style={{height:1,background:'var(--border)',margin:'6px 0'}}/>
                  <PLRow label="− GG del día"      val={`− ${fmtCLP(Math.round(todayFC))}`} col="var(--orange)" />
                  <div style={{height:1,background:'var(--border)',margin:'6px 0'}}/>
                  <PLRow label="= Resultado neto"  val={fmtCLP(Math.round(todayProfit))}
                    col={todayProfit>=0?'var(--green)':'var(--red)'} bold big />
                </Card>
                <Card>
                  <SectionTitle>Comandas del día ({todayOrders.length})</SectionTitle>
                  {[...todayOrders].sort((a,b)=>b.created_at?.localeCompare(a.created_at)).map(o=>(
                    <div key={o.id} style={{padding:'9px 0',borderBottom:'1px solid var(--border)'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <div>
                          <div style={{fontSize:13,fontWeight:700}}>{o.customer_name||'Sin nombre'}</div>
                          <div style={{fontSize:11,color:'var(--text3)'}}>{timeLabel(o.created_at)} · {orderUnits(o)} items</div>
                        </div>
                        <div style={{textAlign:'right'}}>
                          <div style={{fontWeight:700,color:'var(--gold)'}}>{fmtCLP(orderRev(o))}</div>
                          <div style={{fontSize:10,padding:'2px 7px',borderRadius:10,display:'inline-block',
                            background:o.status==='ready'?'#0d2e1a':'#2e1a0d',
                            color:o.status==='ready'?'var(--green)':'var(--orange)',fontWeight:700}}>
                            {o.status==='ready'?'✅ Listo':'⏳ Pendiente'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </Card>
              </>
          }
        </>
      )}

      {/* 7 DÍAS */}
      {tab==='7dias'&&(
        <>
          {last7Dates.length===0
            ? <EmptyState icon="📭" title="Sin registros aún" sub="Ingresa comandas para ver historial" />
            : <>
                <Card>
                  <SectionTitle>📈 Últimos días</SectionTitle>
                  {(()=>{
                    const maxR=Math.max(...last7Dates.map(d=>(ordersByDate[d]||[]).reduce((a,o)=>a+orderRev(o),0)),1)
                    return(
                      <div style={{display:'flex',alignItems:'flex-end',gap:5,height:110,marginBottom:8}}>
                        {last7Dates.map(d=>{
                          const r=(ordersByDate[d]||[]).reduce((a,o)=>a+orderRev(o),0)
                          const h=Math.max((r/maxR)*88,4)
                          const isToday=d===today
                          return(
                            <div key={d} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                              <div style={{fontSize:9,color:'var(--text3)'}}>{(r/1000).toFixed(0)}k</div>
                              <div style={{width:'100%',height:h,background:isToday?'var(--gold)':'#3a3a3a',borderRadius:'5px 5px 0 0'}}/>
                              <div style={{fontSize:9,color:isToday?'var(--gold)':'var(--text3)'}}>
                                {new Date(d+'T12:00:00').toLocaleDateString('es-CL',{weekday:'short'})}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                </Card>
                <Card>
                  <SectionTitle>Detalle por día</SectionTitle>
                  {[...last7Dates].reverse().map(d=>{
                    const dos=ordersByDate[d]||[]
                    const r=dos.reduce((a,o)=>a+orderRev(o),0)
                    const vc=dos.reduce((a,o)=>a+orderVarCost(o,db.products,db.ingredients),0)
                    const fc=fcDaily(d.slice(0,7))
                    const profit=r-vc-fc
                    return(
                      <div key={d} style={{padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                          <div>
                            <div style={{fontSize:13,fontWeight:600,textTransform:'capitalize'}}>{dayLabel(d)}</div>
                            <div style={{fontSize:11,color:'var(--text3)'}}>{dos.length} pedidos · {dos.reduce((a,o)=>a+orderUnits(o),0)} items</div>
                          </div>
                          <div style={{textAlign:'right'}}>
                            <div style={{fontWeight:700,color:'var(--gold)'}}>{fmtCLP(r)}</div>
                            <div style={{fontSize:11,color:profit>=0?'var(--green)':'var(--red)',fontWeight:700}}>
                              {profit>=0?'▲':'▼'} {fmtCLP(Math.abs(Math.round(profit)))} neto
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </Card>
              </>
          }
        </>
      )}

      {/* MES */}
      {tab==='mes'&&(
        <>
          <MonthSelect />
          {monthOrders.length===0
            ? <EmptyState icon="📅" title="Sin comandas este mes" sub="Selecciona otro mes o registra pedidos" />
            : <>
                <Card accent style={{textAlign:'center'}}>
                  <div style={{fontFamily:'var(--font-display)',fontSize:36,fontWeight:700,color:'#0d0d0d'}}>{fmtCLP(monthRev)}</div>
                  <div style={{fontSize:12,color:'#7a4800'}}>Ingresos del mes</div>
                  <div style={{display:'flex',justifyContent:'space-around',marginTop:14,paddingTop:12,borderTop:'1px solid #c8932a44'}}>
                    <Kpi label="Pedidos"   val={monthOrders.length} />
                    <Kpi label="Unidades"  val={monthUnits} />
                    <Kpi label="GG asign." val={fmtCLP(Math.round(monthFC))} />
                    <Kpi label="Mg real"   val={`${monthMargin.toFixed(1)}%`} col={monthMargin>=0?'#0d4a1f':'#4a0d0d'} />
                  </div>
                </Card>
                <Card>
                  <SectionTitle>📋 Resultado del mes</SectionTitle>
                  <PLRow label="Ingresos totales"       val={fmtCLP(monthRev)}              bold />
                  <PLRow label="− Costo variable"       val={`− ${fmtCLP(monthVC)}`}        col="var(--red)" />
                  <PLRow label="= Mg de contribución"   val={fmtCLP(monthRev-monthVC)}      col="var(--gold)" bold />
                  <div style={{height:1,background:'var(--border)',margin:'8px 0'}}/>
                  <PLRow label={`− GG (${activeDays} días × ${fmtCLP(Math.round(fcDaily(selMonth)))})`}
                    val={`− ${fmtCLP(Math.round(monthFC))}`} col="var(--orange)" />
                  <div style={{height:1,background:'var(--border)',margin:'8px 0'}}/>
                  <PLRow label="= Resultado neto" val={fmtCLP(Math.round(monthProfit))}
                    col={monthProfit>=0?'var(--green)':'var(--red)'} bold big />
                </Card>
              </>
          }
        </>
      )}

      {/* PRODUCTOS */}
      {tab==='productos'&&(
        <>
          <MonthSelect />
          {prodStats.every(p=>p.units===0)
            ? <EmptyState icon="🍔" title="Sin ventas este mes" sub="Registra comandas para ver estadísticas" />
            : prodStats.filter(p=>p.units>0).map(p=>(
                <Card key={p.id}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                    <div>
                      <div style={{fontFamily:'var(--font-display)',fontSize:15,fontWeight:600}}>{p.name}</div>
                      <div style={{fontSize:12,color:'var(--text3)',marginTop:2}}>{p.units} un. · {fmtCLP(p.revenue)}</div>
                    </div>
                    <Badge color={p.margin>55?'var(--green)':'var(--orange)'}>{p.margin.toFixed(0)}% mg</Badge>
                  </div>
                  <ProgressBar value={p.units} max={maxUnits} />
                </Card>
              ))
          }
        </>
      )}
    </div>
  )
}

function Kpi({label,val,col}){
  return(
    <div style={{textAlign:'center'}}>
      <div style={{fontSize:17,fontWeight:900,fontFamily:'var(--font-display)',color:col||'#0d0d0d'}}>{val}</div>
      <div style={{fontSize:10,color:'#7a4800'}}>{label}</div>
    </div>
  )
}
function PLRow({label,val,col,bold,big}){
  return(
    <div style={{display:'flex',justifyContent:'space-between',padding:'6px 0'}}>
      <span style={{fontSize:big?14:13,color:'var(--text2)',fontWeight:bold?700:400}}>{label}</span>
      <span style={{fontSize:big?16:14,fontWeight:bold?800:600,color:col||'var(--text)',fontFamily:big?'var(--font-display)':'inherit'}}>
        {val}
      </span>
    </div>
  )
}
