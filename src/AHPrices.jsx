import React, { useMemo } from 'react'
import { fmt } from './useStore.js'

function buildReagentMap(items) {
  const map = {}
  items.forEach(item => {
    item.reagents.forEach(r => {
      if (!map[r.name]) map[r.name] = { price: r.price, qty: 0, items: new Set() }
      map[r.name].qty   += r.qty
      map[r.name].price  = r.price   // last seen price
      map[r.name].items.add(item.name)
    })
  })
  return Object.entries(map).map(([name, d]) => ({
    name,
    price: d.price,
    qty: d.qty,
    totalSpend: d.price * d.qty,
    usedIn: [...d.items],
  }))
}

export function AHPrices({ items }) {
  const reagents = useMemo(() =>
    buildReagentMap(items).sort((a, b) => b.price - a.price),
    [items]
  )

  const totalSpend = reagents.reduce((s, r) => s + r.totalSpend, 0)

  const tierLabel = (price) => {
    if (price >= 10) return { label: '🔴 Very expensive', color: 'var(--skip)' }
    if (price >= 3)  return { label: '🟡 Moderate',       color: 'var(--marginal)' }
    return               { label: '🟢 Cheap',             color: 'var(--craft)' }
  }

  return (
    <div>
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: '1rem', color: 'var(--gold)', marginBottom: 4 }}>
            Auction House Price Reference
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            All reagent prices pulled from your item data. Update prices in the Item Tracker to recalculate.
          </p>
        </div>
        <div style={{
          background: 'var(--bg3)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '0.5rem 1rem', textAlign: 'right',
        }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>TOTAL REAGENT SPEND</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--gold-bright)', fontFamily: 'Cinzel, serif' }}>{fmt(totalSpend)}</div>
        </div>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid var(--border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg3)' }}>
              {['Reagent', 'Unit Price', 'Used In', 'Total Qty', 'Total Spend', 'Tier'].map(h => (
                <th key={h} style={{
                  padding: '0.6rem 1rem', textAlign: h === 'Reagent' || h === 'Used In' ? 'left' : 'right',
                  fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em',
                  color: 'var(--text-muted)', borderBottom: '1px solid var(--border)',
                  whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reagents.map((r, i) => {
              const tier = tierLabel(r.price)
              return (
                <tr
                  key={r.name}
                  style={{
                    borderBottom: '1px solid rgba(200,155,60,0.05)',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,155,60,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'}
                >
                  <td style={{ padding: '0.6rem 1rem', color: 'var(--text)', fontWeight: 500 }}>{r.name}</td>
                  <td style={{ padding: '0.6rem 1rem', textAlign: 'right', color: 'var(--blue)', fontWeight: 600 }}>{fmt(r.price)}</td>
                  <td style={{ padding: '0.6rem 1rem', color: 'var(--text-dim)', fontSize: '0.82rem', maxWidth: 280 }}>
                    {r.usedIn.join(', ')}
                  </td>
                  <td style={{ padding: '0.6rem 1rem', textAlign: 'right', color: 'var(--marginal)' }}>{r.qty}</td>
                  <td style={{ padding: '0.6rem 1rem', textAlign: 'right', color: 'var(--craft)', fontWeight: 600 }}>{fmt(r.totalSpend)}</td>
                  <td style={{ padding: '0.6rem 1rem', textAlign: 'right', fontSize: '0.8rem', color: tier.color, whiteSpace: 'nowrap' }}>
                    {tier.label}
                  </td>
                </tr>
              )
            })}
            <tr style={{ background: 'var(--bg3)', borderTop: '1px solid var(--border)' }}>
              <td colSpan={4} style={{ padding: '0.65rem 1rem', fontFamily: 'Cinzel, serif', fontSize: '0.8rem', color: 'var(--gold)', letterSpacing: '0.06em' }}>
                TOTAL REAGENT SPEND (all items, one craft each)
              </td>
              <td style={{ padding: '0.65rem 1rem', textAlign: 'right', color: 'var(--gold)', fontWeight: 700 }}>{fmt(totalSpend)}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        🔴 10g+ — watch these on AH for dip-buy windows. &nbsp;🟢 Under 3g — stock freely.
      </p>
    </div>
  )
}

export function ExpensiveReagents({ items }) {
  const reagents = useMemo(() =>
    buildReagentMap(items).sort((a, b) => b.price - a.price),
    [items]
  )

  const maxPrice = reagents[0]?.price || 1
  const totalSpend = reagents.reduce((s, r) => s + r.totalSpend, 0)
  const top3Spend  = reagents.slice(0, 3).reduce((s, r) => s + r.totalSpend, 0)
  const top3Pct    = totalSpend > 0 ? (top3Spend / totalSpend * 100).toFixed(0) : 0

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: '1rem', color: 'var(--gold)', marginBottom: 4 }}>
          Most Expensive Reagents
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Ranked by unit price. The top {Math.min(3, reagents.length)} reagents make up {top3Pct}% of your total reagent spend — focus on these for maximum savings.
        </p>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid var(--border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg3)' }}>
              {['#', 'Reagent', 'Unit Price', 'Price bar', 'Total Qty', 'Total Spend'].map(h => (
                <th key={h} style={{
                  padding: '0.6rem 1rem',
                  textAlign: h === '#' || h === 'Reagent' || h === 'Price bar' ? 'left' : 'right',
                  fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em',
                  color: 'var(--text-muted)', borderBottom: '1px solid var(--border)',
                  whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reagents.map((r, i) => {
              const barPct  = (r.price / maxPrice) * 100
              const barColor = r.price >= 10 ? 'var(--skip)' : r.price >= 3 ? 'var(--marginal)' : 'var(--craft)'
              return (
                <tr
                  key={r.name}
                  style={{
                    borderBottom: '1px solid rgba(200,155,60,0.05)',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,155,60,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'}
                >
                  <td style={{ padding: '0.6rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem', width: 32 }}>{i + 1}</td>
                  <td style={{ padding: '0.6rem 1rem', color: 'var(--text)', fontWeight: 500 }}>{r.name}</td>
                  <td style={{ padding: '0.6rem 1rem', textAlign: 'right', color: barColor, fontWeight: 700, fontFamily: 'Cinzel, serif' }}>{fmt(r.price)}</td>
                  <td style={{ padding: '0.6rem 1rem', width: 140 }}>
                    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 3, height: 6, overflow: 'hidden' }}>
                      <div style={{ background: barColor, width: `${barPct}%`, height: '100%', borderRadius: 3, transition: 'width 0.4s' }} />
                    </div>
                  </td>
                  <td style={{ padding: '0.6rem 1rem', textAlign: 'right', color: 'var(--marginal)' }}>{r.qty}</td>
                  <td style={{ padding: '0.6rem 1rem', textAlign: 'right', color: 'var(--craft)', fontWeight: 600 }}>{fmt(r.totalSpend)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div style={{
        marginTop: '1rem', padding: '0.75rem 1rem',
        background: 'var(--bg3)', borderRadius: 8,
        border: '1px solid var(--border)',
        fontSize: '0.85rem', color: 'var(--gold)',
      }}>
        💡 <strong>Tip:</strong> Farm or bulk-buy 🔴 red reagents (10g+) when AH prices dip. Even saving 2–3g per unit adds up fast across multiple crafts.
      </div>
    </div>
  )
}
