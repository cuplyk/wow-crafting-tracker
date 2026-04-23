import React, { useState, useEffect, useMemo } from 'react'
import { fetchPriceHistory, fetchPriceHistorySummary } from './api.js'
import { fmt } from './useStore.js'
import { TrendingUp, TrendingDown, Minus, RefreshCw, ChevronDown, ChevronRight, Search, X } from 'lucide-react'

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function fmtDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function priceDelta(oldP, newP) {
  const diff = newP - oldP
  const pct = oldP > 0 ? (diff / oldP) * 100 : 0
  return { diff, pct }
}

function DeltaBadge({ oldPrice, newPrice }) {
  const { diff, pct } = priceDelta(oldPrice, newPrice)
  if (Math.abs(diff) < 0.001) return <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>
  const up = diff > 0
  const color = up ? 'var(--skip)' : 'var(--craft)'
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color, fontSize: '0.78rem', fontWeight: 600 }}>
      <Icon size={12} />
      {up ? '+' : ''}{fmt(diff)} ({up ? '+' : ''}{pct.toFixed(1)}%)
    </span>
  )
}

function TrendArrow({ firstPrice, latestPrice }) {
  const { diff } = priceDelta(firstPrice, latestPrice)
  if (Math.abs(diff) < 0.001) return <Minus size={14} style={{ color: 'var(--text-muted)' }} />
  return diff > 0
    ? <TrendingUp size={14} style={{ color: 'var(--skip)' }} />
    : <TrendingDown size={14} style={{ color: 'var(--craft)' }} />
}

// ── Mini sparkline from history entries for one reagent ───────────────────────

function MiniSparkline({ entries }) {
  if (entries.length < 2) return null
  const prices = [entries[entries.length - 1].oldPrice, ...entries.map(e => e.newPrice).reverse()]
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min || 1
  const W = 80, H = 24
  const pts = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * W
    const y = H - ((p - min) / range) * (H - 4) - 2
    return `${x},${y}`
  }).join(' ')

  const last = prices[prices.length - 1]
  const first = prices[0]
  const stroke = last > first ? '#c0392b' : last < first ? '#27ae60' : '#888'

  return (
    <svg width={W} height={H} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" />
      <circle cx={pts.split(' ').pop().split(',')[0]} cy={pts.split(' ').pop().split(',')[1]} r={2.5} fill={stroke} />
    </svg>
  )
}

// ── Summary card per reagent ──────────────────────────────────────────────────

function ReagentSummaryRow({ summary, allHistory, expanded, onToggle }) {
  const entries = useMemo(() =>
    allHistory.filter(h => h.reagentName === summary.reagentName),
    [allHistory, summary.reagentName]
  )

  const totalDelta = summary.latestPrice - summary.firstPrice
  const totalPct = summary.firstPrice > 0 ? (totalDelta / summary.firstPrice) * 100 : 0

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 10,
      overflow: 'hidden',
      background: 'rgba(255,255,255,0.02)',
      marginBottom: '0.6rem',
    }}>
      {/* Header row */}
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'grid',
          gridTemplateColumns: '1.5rem 1fr 90px 90px 90px 90px 80px 1.2rem',
          alignItems: 'center', gap: '0.75rem',
          padding: '0.65rem 1rem',
          background: 'transparent', border: 'none',
          color: 'var(--text)', textAlign: 'left',
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{summary.reagentName}</span>
        <span style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
          {fmt(summary.firstPrice)}
        </span>
        <span style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.88rem', color: 'var(--gold-bright)' }}>
          {fmt(summary.latestPrice)}
        </span>
        <span style={{ textAlign: 'right' }}>
          <span style={{
            fontSize: '0.75rem', fontWeight: 600,
            color: totalDelta > 0 ? 'var(--skip)' : totalDelta < 0 ? 'var(--craft)' : 'var(--text-muted)',
          }}>
            {totalDelta > 0 ? '+' : ''}{fmt(totalDelta)}
            <br />
            <span style={{ opacity: 0.8 }}>({totalDelta > 0 ? '+' : ''}{totalPct.toFixed(1)}%)</span>
          </span>
        </span>
        <span style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {summary.changeCount}x
          <br />
          {fmtDate(summary.lastChangedAt)}
        </span>
        <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <MiniSparkline entries={entries} />
        </span>
        <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <TrendArrow firstPrice={summary.firstPrice} latestPrice={summary.latestPrice} />
        </span>
      </button>

      {/* Expanded history rows */}
      {expanded && entries.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.15)' }}>
          {/* Sub-header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr 1.5fr',
            gap: '0.75rem',
            padding: '0.4rem 1rem 0.4rem 2.5rem',
            fontSize: '0.68rem',
            color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}>
            <span>Date &amp; Time</span>
            <span style={{ textAlign: 'right' }}>Old Price</span>
            <span style={{ textAlign: 'right' }}>New Price</span>
            <span style={{ textAlign: 'right' }}>Change</span>
            <span style={{ textAlign: 'right' }}>Item</span>
          </div>
          {entries.map((entry, i) => (
            <div
              key={entry.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr 1.5fr',
                gap: '0.75rem',
                padding: '0.45rem 1rem 0.45rem 2.5rem',
                fontSize: '0.82rem',
                borderBottom: i < entries.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
              }}
            >
              <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                {fmtDateTime(entry.changedAt)}
              </span>
              <span style={{ textAlign: 'right', color: 'var(--text-dim)' }}>{fmt(entry.oldPrice)}</span>
              <span style={{ textAlign: 'right', fontWeight: 600, color: 'var(--gold-bright)' }}>{fmt(entry.newPrice)}</span>
              <span style={{ textAlign: 'right' }}>
                <DeltaBadge oldPrice={entry.oldPrice} newPrice={entry.newPrice} />
              </span>
              <span style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                {entry.itemName}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PriceHistory() {
  const [history, setHistory] = useState([])
  const [summary, setSummary] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [expandedNames, setExpandedNames] = useState(new Set())
  const [view, setView] = useState('summary') // 'summary' | 'log'
  const [refreshKey, setRefreshKey] = useState(0)

  // Load data
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([
      fetchPriceHistory({ limit: 1000 }),
      fetchPriceHistorySummary(),
    ]).then(([hist, sum]) => {
      if (cancelled) return
      setHistory(hist)
      setSummary(sum)
      setLoading(false)
    }).catch(err => {
      if (cancelled) return
      setError(err.message)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [refreshKey])

  // Apply client-side filters
  const filteredHistory = useMemo(() => {
    return history.filter(h => {
      if (search && !h.reagentName.toLowerCase().includes(search.toLowerCase()) &&
          !h.itemName.toLowerCase().includes(search.toLowerCase())) return false
      if (dateFrom && new Date(h.changedAt) < new Date(dateFrom)) return false
      if (dateTo && new Date(h.changedAt) > new Date(dateTo + 'T23:59:59')) return false
      return true
    })
  }, [history, search, dateFrom, dateTo])

  const filteredSummary = useMemo(() => {
    if (!search) return summary
    return summary.filter(s => s.reagentName.toLowerCase().includes(search.toLowerCase()))
  }, [summary, search])

  // KPI stats from full history
  const stats = useMemo(() => {
    if (!history.length) return null
    const totalChanges = history.length
    const uniqueReagents = new Set(history.map(h => h.reagentName)).size
    const priceIncreases = history.filter(h => h.newPrice > h.oldPrice).length
    const priceDecreases = history.filter(h => h.newPrice < h.oldPrice).length
    const lastChange = history[0]?.changedAt
    return { totalChanges, uniqueReagents, priceIncreases, priceDecreases, lastChange }
  }, [history])

  function toggleExpand(name) {
    setExpandedNames(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  function expandAll() {
    setExpandedNames(new Set(filteredSummary.map(s => s.reagentName)))
  }

  function collapseAll() {
    setExpandedNames(new Set())
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
      Loading price history...
    </div>
  )

  if (error) return (
    <div style={{
      textAlign: 'center', padding: '3rem',
      color: 'var(--skip)', fontSize: '0.9rem',
    }}>
      {error.includes('does not exist') || error.includes('relation')
        ? 'Run the price history migration first: node server/migrate-price-history.js'
        : `Error: ${error}`}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* KPI strip */}
      {stats && (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <KpiCard label="Total Changes" value={stats.totalChanges} />
          <KpiCard label="Tracked Reagents" value={stats.uniqueReagents} />
          <KpiCard label="Price Increases" value={stats.priceIncreases} color="var(--skip)" icon={<TrendingUp size={13} />} />
          <KpiCard label="Price Drops" value={stats.priceDecreases} color="var(--craft)" icon={<TrendingDown size={13} />} />
          <KpiCard label="Last Change" value={fmtDate(stats.lastChange)} small />
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180, maxWidth: 320 }}>
          <Search size={13} style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)', pointerEvents: 'none',
          }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search reagent or item…"
            style={{
              width: '100%', paddingLeft: 30, paddingRight: search ? 28 : 10,
              height: 34, borderRadius: 7, border: '1px solid var(--border)',
              background: 'rgba(255,255,255,0.04)', color: 'var(--text)',
              fontSize: '0.82rem', boxSizing: 'border-box',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
              padding: 0, display: 'flex',
            }}>
              <X size={12} />
            </button>
          )}
        </div>

        {/* Date range */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            style={dateInputStyle}
          />
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>To</label>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            style={dateInputStyle}
          />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo('') }} style={clearBtnStyle}>
              <X size={11} /> Clear
            </button>
          )}
        </div>

        {/* View toggle */}
        <div style={{ display: 'flex', gap: '0.3rem', marginLeft: 'auto' }}>
          <ViewBtn active={view === 'summary'} onClick={() => setView('summary')}>By Reagent</ViewBtn>
          <ViewBtn active={view === 'log'} onClick={() => setView('log')}>Change Log</ViewBtn>
        </div>

        {/* Refresh */}
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          title="Refresh"
          style={{
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--text-muted)', borderRadius: 7, padding: '0 10px',
            height: 34, display: 'flex', alignItems: 'center', gap: 5,
            fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-bright)'; e.currentTarget.style.color = 'var(--text)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Empty state */}
      {history.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '4rem 1rem',
          color: 'var(--text-muted)', fontSize: '0.9rem',
          border: '1px dashed var(--border)', borderRadius: 12,
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📈</div>
          <div style={{ fontWeight: 600, marginBottom: '0.4rem' }}>No price history yet</div>
          <div style={{ fontSize: '0.82rem' }}>
            Price changes are recorded automatically when you update reagent prices in the Item Tracker.
          </div>
        </div>
      )}

      {/* ── Summary view ── */}
      {view === 'summary' && filteredSummary.length > 0 && (
        <div>
          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.5rem 1fr 90px 90px 90px 90px 80px 1.2rem',
            gap: '0.75rem',
            padding: '0 1rem 0.4rem 1rem',
            fontSize: '0.68rem', color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            <span />
            <span>Reagent</span>
            <span style={{ textAlign: 'right' }}>First Price</span>
            <span style={{ textAlign: 'right' }}>Current</span>
            <span style={{ textAlign: 'right' }}>Total Change</span>
            <span style={{ textAlign: 'right' }}>Changes / Last</span>
            <span style={{ textAlign: 'right' }}>Trend</span>
            <span />
          </div>

          {/* Expand/collapse controls */}
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <button onClick={expandAll} style={clearBtnStyle}>Expand all</button>
            <button onClick={collapseAll} style={clearBtnStyle}>Collapse all</button>
          </div>

          {filteredSummary.map(s => (
            <ReagentSummaryRow
              key={s.reagentName}
              summary={s}
              allHistory={filteredHistory}
              expanded={expandedNames.has(s.reagentName)}
              onToggle={() => toggleExpand(s.reagentName)}
            />
          ))}
        </div>
      )}

      {/* ── Change log view ── */}
      {view === 'log' && filteredHistory.length > 0 && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr 90px 90px 110px 1.2fr',
            gap: '0.75rem',
            padding: '0.5rem 1rem',
            fontSize: '0.68rem', color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            borderBottom: '1px solid var(--border)',
            background: 'rgba(255,255,255,0.02)',
          }}>
            <span>Date &amp; Time</span>
            <span>Reagent</span>
            <span style={{ textAlign: 'right' }}>Old Price</span>
            <span style={{ textAlign: 'right' }}>New Price</span>
            <span style={{ textAlign: 'right' }}>Change</span>
            <span style={{ textAlign: 'right' }}>Item</span>
          </div>
          {filteredHistory.map((entry, i) => (
            <div
              key={entry.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 1fr 90px 90px 110px 1.2fr',
                gap: '0.75rem',
                padding: '0.5rem 1rem',
                fontSize: '0.82rem',
                borderBottom: i < filteredHistory.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                alignItems: 'center',
              }}
            >
              <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>{fmtDateTime(entry.changedAt)}</span>
              <span style={{ fontWeight: 600 }}>{entry.reagentName}</span>
              <span style={{ textAlign: 'right', color: 'var(--text-dim)' }}>{fmt(entry.oldPrice)}</span>
              <span style={{ textAlign: 'right', fontWeight: 700, color: 'var(--gold-bright)' }}>{fmt(entry.newPrice)}</span>
              <span style={{ textAlign: 'right' }}>
                <DeltaBadge oldPrice={entry.oldPrice} newPrice={entry.newPrice} />
              </span>
              <span style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.76rem' }}>{entry.itemName}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filtered empty state */}
      {history.length > 0 && filteredHistory.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '2rem',
          color: 'var(--text-muted)', fontSize: '0.88rem',
          border: '1px dashed var(--border)', borderRadius: 10,
        }}>
          No price changes match your filters.
        </div>
      )}

      {/* Row count */}
      {filteredHistory.length > 0 && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
          Showing {filteredHistory.length} change{filteredHistory.length !== 1 ? 's' : ''}
          {filteredHistory.length < history.length ? ` of ${history.length} total` : ''}
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({ label, value, color, icon, small }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '0.65rem 1rem',
      minWidth: 110,
      flex: '1 1 100px',
    }}>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{
        fontSize: small ? '0.88rem' : '1.3rem',
        fontWeight: 700,
        color: color || 'var(--gold-bright)',
        fontFamily: small ? 'inherit' : 'Cinzel, serif',
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        {icon}{value}
      </div>
    </div>
  )
}

function ViewBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.35rem 0.75rem',
        borderRadius: 7, fontSize: '0.78rem', fontWeight: 500,
        border: `1px solid ${active ? 'rgba(200,155,60,0.40)' : 'var(--border)'}`,
        background: active ? 'rgba(200,155,60,0.10)' : 'transparent',
        color: active ? 'var(--gold-bright)' : 'var(--text-dim)',
        cursor: 'pointer', transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  )
}

const dateInputStyle = {
  height: 34, borderRadius: 7, border: '1px solid var(--border)',
  background: 'rgba(255,255,255,0.04)', color: 'var(--text)',
  fontSize: '0.78rem', padding: '0 8px', boxSizing: 'border-box',
}

const clearBtnStyle = {
  background: 'transparent', border: '1px solid var(--border)',
  color: 'var(--text-muted)', borderRadius: 6, padding: '0.2rem 0.55rem',
  fontSize: '0.75rem', cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 3,
}
