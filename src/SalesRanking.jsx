import React, { useState, useEffect, useCallback } from 'react'
import { TrendingUp, TrendingDown, Minus, ShoppingCart, Trash2, ChevronDown, ChevronRight, Award, Target, AlertTriangle, Zap } from 'lucide-react'
import { fmt, fmtPct, calcItem } from './useStore.js'
import * as api from './api.js'

function uid() { return Math.random().toString(36).slice(2, 10) }

// ---------------------------------------------------------------------------
// Mini sparkline (pure CSS bars)
// ---------------------------------------------------------------------------

function Sparkline({ data, height = 32, color = 'var(--craft)' }) {
  if (!data || data.length === 0) return null
  const max = Math.max(...data, 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height }}>
      {data.map((v, i) => (
        <div key={i} style={{
          flex: 1, minWidth: 3, maxWidth: 8,
          height: `${(v / max) * 100}%`,
          background: color,
          borderRadius: '2px 2px 0 0',
          opacity: 0.7 + (i / data.length) * 0.3,
        }} />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Trend badge
// ---------------------------------------------------------------------------

function TrendBadge({ pct }) {
  if (pct === 0) return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
      <Minus size={12} /> Flat
    </span>
  )
  const up = pct > 0
  return (
    <span style={{
      display: 'flex', alignItems: 'center', gap: 3,
      fontSize: '0.78rem', fontWeight: 600,
      color: up ? 'var(--craft)' : 'var(--skip)',
    }}>
      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {up ? '+' : ''}{pct.toFixed(0)}%
    </span>
  )
}

// ---------------------------------------------------------------------------
// Strategy insight generator
// ---------------------------------------------------------------------------

function getInsights(rankings) {
  const insights = []

  // Top performers — items to double down on
  const topByRevenue = rankings.slice(0, 3)
  if (topByRevenue.length > 0) {
    insights.push({
      type: 'success',
      icon: <Award size={14} />,
      title: 'Top Revenue Drivers',
      text: `${topByRevenue.map(r => r.itemName).join(', ')} ${topByRevenue.length === 1 ? 'is' : 'are'} your highest-grossing ${topByRevenue.length === 1 ? 'item' : 'items'}. Prioritize crafting these.`,
    })
  }

  // High-margin items with low volume — untapped opportunity
  const highMarginLowVol = rankings.filter(r => r.profitMargin > 0.3 && r.totalQty < (rankings[0]?.totalQty || 1) * 0.3)
  if (highMarginLowVol.length > 0) {
    insights.push({
      type: 'opportunity',
      icon: <Target size={14} />,
      title: 'Untapped Opportunity',
      text: `${highMarginLowVol.map(r => r.itemName).join(', ')} ${highMarginLowVol.length === 1 ? 'has' : 'have'} strong margins (${fmtPct(highMarginLowVol[0].profitMargin)}) but low volume. Increase production to capitalize.`,
    })
  }

  // Trending up items
  const trending = rankings.filter(r => r.trendPct > 20)
  if (trending.length > 0) {
    insights.push({
      type: 'trend',
      icon: <Zap size={14} />,
      title: 'Rising Demand',
      text: `${trending.map(r => r.itemName).join(', ')} ${trending.length === 1 ? 'is' : 'are'} trending up (${trending.length === 1 ? trending[0].trendPct.toFixed(0) + '% increase' : 'strong growth'}). Stock up on reagents.`,
    })
  }

  // Declining items — warning
  const declining = rankings.filter(r => r.trendPct < -20 && r.totalQty > 3)
  if (declining.length > 0) {
    insights.push({
      type: 'warning',
      icon: <AlertTriangle size={14} />,
      title: 'Declining Sales',
      text: `${declining.map(r => r.itemName).join(', ')} ${declining.length === 1 ? 'is' : 'are'} losing momentum. Consider reducing stock or adjusting pricing.`,
    })
  }

  // Negative profit items that still sell
  const unprofitable = rankings.filter(r => r.totalProfit < 0 && r.totalQty > 1)
  if (unprofitable.length > 0) {
    insights.push({
      type: 'warning',
      icon: <AlertTriangle size={14} />,
      title: 'Unprofitable Sellers',
      text: `${unprofitable.map(r => r.itemName).join(', ')} ${unprofitable.length === 1 ? 'sells' : 'sell'} but at a loss (${fmt(unprofitable.reduce((s, r) => s + r.totalProfit, 0))} total). Raise prices or cut production.`,
    })
  }

  return insights
}

const insightColors = {
  success:     { bg: 'rgba(60,179,113,0.06)', border: 'rgba(60,179,113,0.25)', color: 'var(--craft)' },
  opportunity: { bg: 'rgba(100,149,237,0.06)', border: 'rgba(100,149,237,0.25)', color: 'var(--blue)' },
  trend:       { bg: 'rgba(200,155,60,0.06)',  border: 'rgba(200,155,60,0.25)',  color: 'var(--gold-bright)' },
  warning:     { bg: 'rgba(192,57,43,0.06)',   border: 'rgba(192,57,43,0.25)',   color: 'var(--skip)' },
}

// ---------------------------------------------------------------------------
// Record Sale modal
// ---------------------------------------------------------------------------

function RecordSaleForm({ items, onSubmit, onClose }) {
  const [itemId, setItemId] = useState('')
  const [qty, setQty] = useState(1)
  const [unitPrice, setUnitPrice] = useState('')
  const [notes, setNotes] = useState('')

  const selectedItem = items.find(i => i.id === itemId)

  // Auto-fill price from item sell price
  useEffect(() => {
    if (selectedItem && !unitPrice) {
      setUnitPrice(selectedItem.sell.toString())
    }
  }, [itemId])

  const handleSubmit = () => {
    if (!itemId || qty < 1) return
    const price = parseFloat(unitPrice) || 0
    onSubmit({ id: uid(), itemId, qty, unitPrice: price, notes })
    onClose()
  }

  return (
    <div className="fade-up" style={{
      background: 'var(--bg3)', border: '1px solid var(--border-bright)',
      borderRadius: 8, padding: '1rem', marginBottom: '1rem',
    }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--gold)', marginBottom: 8, letterSpacing: '0.08em' }}>
        RECORD SALE
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 2, minWidth: 180 }}>
          <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Item</label>
          <select
            value={itemId}
            onChange={e => setItemId(e.target.value)}
            style={{
              width: '100%', background: 'var(--bg4)', border: '1px solid var(--border)',
              color: 'var(--text)', padding: '0.5rem 0.75rem', borderRadius: 6, fontSize: '0.9rem',
            }}
          >
            <option value="">Select item...</option>
            {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
        <div style={{ width: 80 }}>
          <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Qty</label>
          <input type="number" value={qty} min="1" onChange={e => setQty(parseInt(e.target.value) || 1)}
            style={{ width: '100%', background: 'var(--bg4)', border: '1px solid var(--border)',
              color: 'var(--marginal)', padding: '0.5rem 0.75rem', borderRadius: 6, fontSize: '0.9rem', }} />
        </div>
        <div style={{ width: 120 }}>
          <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Unit Price (g)</label>
          <input type="number" value={unitPrice} min="0" step="0.01" onChange={e => setUnitPrice(e.target.value)}
            style={{ width: '100%', background: 'var(--bg4)', border: '1px solid var(--border-bright)',
              color: 'var(--blue)', padding: '0.5rem 0.75rem', borderRadius: 6, fontSize: '0.9rem', }} />
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Notes</label>
          <input type="text" value={notes} placeholder="Optional" onChange={e => setNotes(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={{ width: '100%', background: 'var(--bg4)', border: '1px solid var(--border)',
              color: 'var(--text)', padding: '0.5rem 0.75rem', borderRadius: 6, fontSize: '0.9rem', }} />
        </div>
        <button onClick={handleSubmit} style={{
          background: 'var(--gold)', border: 'none', color: '#080C14',
          padding: '0.5rem 1rem', borderRadius: 6, fontSize: '0.9rem', fontWeight: 700,
        }}>Record</button>
        <button onClick={onClose} style={{
          background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)',
          padding: '0.5rem 0.75rem', borderRadius: 6, fontSize: '0.9rem',
        }}>Cancel</button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function SalesRanking({ items }) {
  const [analytics, setAnalytics] = useState(null)
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [sortField, setSortField] = useState('revenue')

  const loadData = useCallback(async () => {
    try {
      const [analyticsData, salesData] = await Promise.all([
        api.fetchSalesAnalytics(),
        api.fetchSales(),
      ])
      setAnalytics(analyticsData)
      setSales(salesData)
    } catch (err) {
      console.error('Failed to load sales data:', err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleRecordSale = async (sale) => {
    try {
      await api.createSale(sale)
      loadData()
    } catch (err) {
      console.error('Failed to record sale:', err.message)
    }
  }

  const handleDeleteSale = async (id) => {
    try {
      await api.deleteSale(id)
      setSales(prev => prev.filter(s => s.id !== id))
      loadData()
    } catch (err) {
      console.error('Failed to delete sale:', err.message)
    }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading sales data...</div>
  }

  const summary = analytics?.summary || { totalSales: 0, totalUnits: 0, totalRevenue: 0, uniqueItems: 0 }
  const rankings = analytics?.rankings || []
  const dailyVolume = analytics?.dailyVolume || []

  // Sort rankings
  const sortedRankings = [...rankings].sort((a, b) => {
    switch (sortField) {
      case 'qty': return b.totalQty - a.totalQty
      case 'profit': return b.totalProfit - a.totalProfit
      case 'margin': return b.profitMargin - a.profitMargin
      case 'trend': return b.trendPct - a.trendPct
      default: return b.totalRevenue - a.totalRevenue
    }
  })

  const insights = getInsights(rankings)

  // Items not yet sold
  const soldItemIds = new Set(rankings.map(r => r.itemId))
  const unsoldItems = items.filter(i => !soldItemIds.has(i.id))

  // Total profit across all sales
  const totalProfit = rankings.reduce((s, r) => s + r.totalProfit, 0)

  return (
    <div>
      {/* ── KPI Cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '0.75rem', marginBottom: '1.5rem',
      }}>
        {[
          { label: 'TOTAL SALES', value: summary.totalSales, sub: `${summary.uniqueItems} unique items`, color: 'var(--gold-bright)' },
          { label: 'UNITS SOLD', value: summary.totalUnits, sub: 'total quantity', color: 'var(--marginal)' },
          { label: 'TOTAL REVENUE', value: fmt(summary.totalRevenue), sub: 'gross income', color: 'var(--blue)' },
          { label: 'NET PROFIT', value: fmt(totalProfit), sub: totalProfit >= 0 ? 'from all sales' : 'net loss', color: totalProfit >= 0 ? 'var(--craft)' : 'var(--skip)' },
        ].map(k => (
          <div key={k.label} style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '0.75rem 1rem',
          }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: k.color, fontFamily: 'Cinzel, serif' }}>{k.value}</div>
            {k.sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* ── 30-Day Volume Sparkline ── */}
      {dailyVolume.length > 0 && (
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem',
        }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 8 }}>
            30-DAY SALES VOLUME
          </div>
          <Sparkline data={dailyVolume.map(d => d.qty)} height={40} color="var(--gold)" />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>
      )}

      {/* ── Record Sale + Sort controls ── */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{
            background: 'linear-gradient(135deg, var(--gold-dim), var(--gold))',
            border: '1px solid var(--gold)', color: '#080C14',
            padding: '0.5rem 1.2rem', borderRadius: 6,
            fontSize: '0.9rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <ShoppingCart size={15} /> Record Sale
        </button>

        <div style={{ display: 'flex', gap: '0.4rem', marginLeft: 'auto' }}>
          {[
            { id: 'revenue', label: 'Revenue' },
            { id: 'qty', label: 'Volume' },
            { id: 'profit', label: 'Profit' },
            { id: 'margin', label: 'Margin' },
            { id: 'trend', label: 'Trend' },
          ].map(s => (
            <button key={s.id} onClick={() => setSortField(s.id)}
              style={{
                background: sortField === s.id ? 'rgba(200,155,60,0.10)' : 'transparent',
                border: `1px solid ${sortField === s.id ? 'rgba(200,155,60,0.30)' : 'var(--border)'}`,
                color: sortField === s.id ? 'var(--gold-bright)' : 'var(--text-dim)',
                padding: '0.35rem 0.6rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 500,
              }}>{s.label}</button>
          ))}
        </div>
      </div>

      {/* ── Record Sale Form ── */}
      {showForm && (
        <RecordSaleForm items={items} onSubmit={handleRecordSale} onClose={() => setShowForm(false)} />
      )}

      {/* ── Strategy Insights ── */}
      {insights.length > 0 && (
        <div style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 2 }}>
            STRATEGY INSIGHTS
          </div>
          {insights.map((ins, i) => {
            const c = insightColors[ins.type]
            return (
              <div key={i} style={{
                background: c.bg, border: `1px solid ${c.border}`,
                borderRadius: 8, padding: '0.6rem 1rem',
                display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
              }}>
                <span style={{ color: c.color, marginTop: 2, flexShrink: 0 }}>{ins.icon}</span>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: c.color }}>{ins.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 2 }}>{ins.text}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Rankings Table ── */}
      {sortedRankings.length > 0 ? (
        <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid var(--border)', marginBottom: '1.25rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg3)' }}>
                {['#', 'Item', 'Units Sold', 'Revenue', 'Mat Cost', 'Profit', 'Margin', '30d Trend'].map(h => (
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
              {sortedRankings.map((r, i) => {
                const profitColor = r.totalProfit >= 0 ? 'var(--craft)' : 'var(--skip)'
                const marginColor = r.profitMargin > 0.2 ? 'var(--craft)' : r.profitMargin > 0 ? 'var(--marginal)' : 'var(--skip)'
                return (
                  <tr key={r.itemId}
                    style={{ borderBottom: '1px solid rgba(200,155,60,0.05)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,155,60,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {i + 1}
                      {i === 0 && <span style={{ marginLeft: 4 }}>👑</span>}
                    </td>
                    <td style={{ padding: '0.65rem 1rem' }}>
                      <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.85rem', color: 'var(--gold-bright)' }}>
                        {r.itemName}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {r.saleCount} sale{r.saleCount !== 1 ? 's' : ''} · avg {fmt(r.avgPrice)}/unit
                      </div>
                    </td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right', color: 'var(--marginal)', fontSize: '0.88rem', fontWeight: 600 }}>
                      {r.totalQty}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right', color: 'var(--blue)', fontSize: '0.88rem', fontWeight: 600 }}>
                      {fmt(r.totalRevenue)}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                      {fmt(r.matCost * r.totalQty)}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: 700, fontSize: '0.88rem', color: profitColor }}>
                      {r.totalProfit >= 0 ? '+' : ''}{fmt(r.totalProfit)}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right', fontSize: '0.85rem', color: marginColor }}>
                      {fmtPct(r.profitMargin)}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right' }}>
                      <TrendBadge pct={r.trendPct} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="fade-up" style={{
          background: 'var(--bg3)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '2.5rem 2rem', textAlign: 'center',
          maxWidth: 520, margin: '1rem auto',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(200,155,60,0.10)', border: '1px solid rgba(200,155,60,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}>
            <ShoppingCart size={26} style={{ color: 'var(--gold-bright)' }} />
          </div>
          <h2 style={{
            fontFamily: 'Cinzel, serif', fontSize: '1.1rem', fontWeight: 700,
            color: 'var(--gold-bright)', marginBottom: '0.5rem',
          }}>No sales recorded yet</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.6, maxWidth: 380, margin: '0 auto 1.25rem' }}>
            Record your first sale to start tracking performance. Rankings, trends, and strategy insights will appear here automatically.
          </p>
          <button onClick={() => setShowForm(true)} style={{
            background: 'linear-gradient(135deg, var(--gold-dim), var(--gold))',
            border: '1px solid var(--gold)', color: '#080C14',
            padding: '0.6rem 1.4rem', borderRadius: 8, fontSize: '0.9rem', fontWeight: 700,
          }}>
            <ShoppingCart size={14} style={{ verticalAlign: '-2px', marginRight: 6 }} /> Record First Sale
          </button>
        </div>
      )}

      {/* ── Unsold Items ── */}
      {unsoldItems.length > 0 && rankings.length > 0 && (
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.25rem',
        }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 8 }}>
            NOT YET SOLD ({unsoldItems.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {unsoldItems.map(item => {
              const { profit, margin } = calcItem(item)
              return (
                <span key={item.id} style={{
                  fontSize: '0.78rem', padding: '0.25rem 0.6rem',
                  borderRadius: 20, whiteSpace: 'nowrap',
                  color: profit >= 0 ? 'var(--craft)' : 'var(--skip)',
                  background: profit >= 0 ? 'var(--craft-bg)' : 'var(--skip-bg)',
                  border: `1px solid ${profit >= 0 ? 'rgba(60,179,113,0.2)' : 'rgba(192,57,43,0.2)'}`,
                }}>
                  {item.name} <span style={{ opacity: 0.7 }}>({fmtPct(margin)})</span>
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Recent Sales History ── */}
      {sales.length > 0 && (
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 8, overflow: 'hidden',
        }}>
          <button onClick={() => setShowHistory(v => !v)} style={{
            width: '100%', background: 'var(--bg3)', border: 'none',
            padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
            color: 'var(--text-dim)', fontSize: '0.78rem', fontWeight: 600,
            letterSpacing: '0.06em', cursor: 'pointer',
          }}>
            {showHistory ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            RECENT SALES ({sales.length})
          </button>
          {showHistory && (
            <div>
              {sales.slice(0, 50).map(s => (
                <div key={s.id} style={{
                  display: 'grid', gridTemplateColumns: '1fr auto auto auto auto',
                  gap: '0.5rem', alignItems: 'center',
                  padding: '0.5rem 1rem',
                  borderBottom: '1px solid rgba(200,155,60,0.06)',
                  fontSize: '0.82rem',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,155,60,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <span style={{ color: 'var(--gold-bright)', fontFamily: 'Cinzel, serif' }}>{s.itemName}</span>
                    {s.notes && <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: '0.75rem' }}>{s.notes}</span>}
                  </div>
                  <span style={{ color: 'var(--marginal)' }}>x{s.qty}</span>
                  <span style={{ color: 'var(--blue)', fontWeight: 600 }}>{fmt(s.unitPrice)}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {new Date(s.soldAt).toLocaleDateString()}
                  </span>
                  <button onClick={() => { if (confirm('Delete this sale record?')) handleDeleteSale(s.id) }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: 4, borderRadius: 4, cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--skip)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
