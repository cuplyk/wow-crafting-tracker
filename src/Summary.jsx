import React from 'react'
import { calcItem, fmt, fmtPct } from './useStore.js'

function Verdict({ profit, margin }) {
  if (profit < 0)    return <span style={{ color: 'var(--skip)' }}>❌ Avoid</span>
  if (margin > 0.35) return <span style={{ color: 'var(--craft)' }}>⭐ High Value</span>
  if (margin > 0.2)  return <span style={{ color: 'var(--craft)' }}>✅ Craft</span>
  return <span style={{ color: 'var(--marginal)' }}>⚠️ Situational</span>
}

export default function Summary({ items }) {
  const rows = items
    .map(item => ({ item, ...calcItem(item) }))
    .sort((a, b) => b.profit - a.profit)

  const totalMat    = rows.reduce((s, r) => s + r.matCost, 0)
  const totalSell   = rows.reduce((s, r) => s + r.item.sell, 0)
  const totalProfit = rows.reduce((s, r) => s + r.profit, 0)
  const avgMargin   = totalSell > 0 ? totalProfit / totalSell : 0

  const best = rows[0]

  return (
    <div>
      {/* KPIs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '0.75rem', marginBottom: '1.5rem',
      }}>
        {[
          { label: 'BEST PROFIT', value: best ? fmt(best.profit) : '—', sub: best?.item.name.split(' ').slice(0,2).join(' '), color: 'var(--craft)' },
          { label: 'TOTAL SELL VALUE', value: fmt(totalSell), sub: `${items.length} items`, color: 'var(--blue)' },
          { label: 'TOTAL PROFIT', value: fmt(totalProfit), sub: totalProfit >= 0 ? 'net positive' : 'net loss', color: totalProfit >= 0 ? 'var(--craft)' : 'var(--skip)' },
          { label: 'AVG MARGIN', value: fmtPct(avgMargin), sub: 'across all items', color: avgMargin > 0.2 ? 'var(--craft)' : avgMargin > 0 ? 'var(--marginal)' : 'var(--skip)' },
        ].map(k => (
          <div key={k.label} style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '0.75rem 1rem',
          }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 4 }}>
              {k.label}
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: k.color, fontFamily: 'Cinzel, serif' }}>
              {k.value}
            </div>
            {k.sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid var(--border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg3)' }}>
              {['#', 'Item', 'Mat Cost', 'Sell Price', 'Profit', 'Margin', 'Decision', 'Verdict'].map(h => (
                <th key={h} style={{
                  padding: '0.6rem 1rem', textAlign: h === '#' || h === 'Item' ? 'left' : 'right',
                  fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em',
                  color: 'var(--text-muted)', borderBottom: '1px solid var(--border)',
                  whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.item.id}
                style={{ borderBottom: '1px solid rgba(200,155,60,0.05)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,155,60,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i + 1}</td>
                <td style={{ padding: '0.65rem 1rem', fontFamily: 'Cinzel, serif', fontSize: '0.85rem', color: 'var(--gold-bright)', whiteSpace: 'nowrap' }}>
                  {r.item.name}
                </td>
                <td style={{ padding: '0.65rem 1rem', textAlign: 'right', color: 'var(--text-dim)', fontSize: '0.88rem' }}>{fmt(r.matCost)}</td>
                <td style={{ padding: '0.65rem 1rem', textAlign: 'right', color: 'var(--blue)', fontSize: '0.88rem' }}>{fmt(r.item.sell)}</td>
                <td style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: 700, fontSize: '0.88rem', color: r.profit >= 0 ? 'var(--craft)' : 'var(--skip)' }}>
                  {r.profit >= 0 ? '+' : ''}{fmt(r.profit)}
                </td>
                <td style={{ padding: '0.65rem 1rem', textAlign: 'right', fontSize: '0.88rem', color: r.margin > 0.2 ? 'var(--craft)' : r.margin > 0 ? 'var(--marginal)' : 'var(--skip)' }}>
                  {fmtPct(r.margin)}
                </td>
                <td style={{ padding: '0.65rem 1rem', textAlign: 'right' }}>
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem',
                    borderRadius: 20, whiteSpace: 'nowrap',
                    color: r.decision === 'craft' ? 'var(--craft)' : r.decision === 'marginal' ? 'var(--marginal)' : 'var(--skip)',
                    background: r.decision === 'craft' ? 'var(--craft-bg)' : r.decision === 'marginal' ? 'var(--marginal-bg)' : 'var(--skip-bg)',
                    border: `1px solid ${r.decision === 'craft' ? 'rgba(60,179,113,0.3)' : r.decision === 'marginal' ? 'rgba(232,160,32,0.3)' : 'rgba(192,57,43,0.3)'}`,
                  }}>
                    {r.decision === 'craft' ? '🟢 Craft' : r.decision === 'marginal' ? '🟡 Marginal' : '🔴 Skip'}
                  </span>
                </td>
                <td style={{ padding: '0.65rem 1rem', textAlign: 'right', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                  <Verdict profit={r.profit} margin={r.margin} />
                </td>
              </tr>
            ))}

            {/* Totals row */}
            <tr style={{ background: 'var(--bg3)', borderTop: '1px solid var(--border)' }}>
              <td colSpan={2} style={{ padding: '0.65rem 1rem', fontFamily: 'Cinzel, serif', fontSize: '0.8rem', color: 'var(--gold)', letterSpacing: '0.06em' }}>
                TOTALS
              </td>
              <td style={{ padding: '0.65rem 1rem', textAlign: 'right', color: 'var(--gold)', fontWeight: 700 }}>{fmt(totalMat)}</td>
              <td style={{ padding: '0.65rem 1rem', textAlign: 'right', color: 'var(--gold)', fontWeight: 700 }}>{fmt(totalSell)}</td>
              <td style={{ padding: '0.65rem 1rem', textAlign: 'right', color: totalProfit >= 0 ? 'var(--craft)' : 'var(--skip)', fontWeight: 700 }}>
                {totalProfit >= 0 ? '+' : ''}{fmt(totalProfit)}
              </td>
              <td style={{ padding: '0.65rem 1rem', textAlign: 'right', color: 'var(--gold)', fontWeight: 700 }}>{fmtPct(avgMargin)}</td>
              <td colSpan={2} />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
