import React, { useState } from 'react'
import { useStore, calcItem, fmt, fmtPct } from './useStore.js'
import Header from './Header.jsx'
import ItemTracker from './ItemTracker.jsx'
import Summary from './Summary.jsx'
import { AHPrices, ExpensiveReagents } from './AHPrices.jsx'
import { Download, RotateCcw, ArrowUpDown, Filter, TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function App() {
  const [activeTab, setActiveTab] = useState('tracker')
  const [sortBy, setSortBy] = useState('default')
  const [filterDecision, setFilterDecision] = useState('all')
  const store = useStore()
  const { items } = store

  // Compute sidebar stats
  const calcs = items.map(it => ({ item: it, ...calcItem(it) }))
  const totalProfit = calcs.reduce((s, r) => s + r.profit, 0)
  const avgMargin = items.length > 0
    ? calcs.reduce((s, r) => s + r.margin, 0) / items.length
    : 0
  const craftCount = calcs.filter(c => c.decision === 'craft').length
  const marginalCount = calcs.filter(c => c.decision === 'marginal').length
  const skipCount = calcs.filter(c => c.decision === 'skip').length

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Ambient background */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `
          radial-gradient(ellipse 70% 40% at 50% -10%, rgba(200,155,60,0.06) 0%, transparent 60%),
          radial-gradient(ellipse 50% 50% at 90% 90%, rgba(155,114,207,0.04) 0%, transparent 50%)
        `,
      }} />

      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="app-main">
        {/* ── Main content column ── */}
        <div className="app-content">
          {/* Page title */}
          <div style={{ marginBottom: '1.25rem' }}>
            {{
              tracker:  <PageTitle icon="⚔️" title="Item Tracker" sub="Add items, manage reagents, see profit at a glance. Click any item to expand." />,
              summary:  <PageTitle icon="📊" title="Profit Summary" sub="All items ranked by profit. Totals calculated automatically." />,
              ah:       <PageTitle icon="🏪" title="AH Price List" sub="All reagents aggregated across every item. Update prices in Item Tracker." />,
              reagents: <PageTitle icon="💰" title="Expensive Reagents" sub="Ranked by unit price — your biggest cost drivers." />,
            }[activeTab]}
          </div>

          {/* Tab content */}
          <div className="fade-up" key={activeTab}>
            {activeTab === 'tracker'  && <ItemTracker store={store} sortBy={sortBy} filterDecision={filterDecision} />}
            {activeTab === 'summary'  && <Summary items={items} />}
            {activeTab === 'ah'       && <AHPrices items={items} />}
            {activeTab === 'reagents' && <ExpensiveReagents items={items} />}
          </div>
        </div>

        {/* ── Sidebar (xl+ only) ── */}
        <aside className="sidebar">
          {/* Quick stats */}
          <div className="sidebar-card">
            <div className="sidebar-label">Quick Stats</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <SidebarStat
                label="Total Profit"
                value={(totalProfit >= 0 ? '+' : '') + fmt(totalProfit)}
                color={totalProfit >= 0 ? 'var(--craft)' : 'var(--skip)'}
                icon={totalProfit >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              />
              <SidebarStat
                label="Avg Margin"
                value={fmtPct(avgMargin)}
                color={avgMargin > 0.2 ? 'var(--craft)' : avgMargin > 0 ? 'var(--marginal)' : 'var(--skip)'}
                icon={<Minus size={13} />}
              />
              <div style={{
                display: 'flex', gap: '0.5rem', marginTop: '0.25rem',
              }}>
                <MiniCount label="Craft" count={craftCount} color="var(--craft)" />
                <MiniCount label="Marg" count={marginalCount} color="var(--marginal)" />
                <MiniCount label="Skip" count={skipCount} color="var(--skip)" />
              </div>
            </div>
          </div>

          {/* Sort (tracker tab only) */}
          {activeTab === 'tracker' && (
            <div className="sidebar-card">
              <div className="sidebar-label">
                <ArrowUpDown size={11} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 4 }} />
                Sort By
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {[
                  { id: 'default', label: 'Default order' },
                  { id: 'profit-desc', label: 'Profit (high → low)' },
                  { id: 'profit-asc', label: 'Profit (low → high)' },
                  { id: 'margin-desc', label: 'Margin (high → low)' },
                  { id: 'cost-desc', label: 'Mat cost (high → low)' },
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSortBy(s.id)}
                    style={{
                      background: sortBy === s.id ? 'rgba(200,155,60,0.10)' : 'transparent',
                      border: `1px solid ${sortBy === s.id ? 'rgba(200,155,60,0.30)' : 'transparent'}`,
                      color: sortBy === s.id ? 'var(--gold-bright)' : 'var(--text-dim)',
                      padding: '0.35rem 0.6rem',
                      borderRadius: 6, fontSize: '0.78rem', fontWeight: 500,
                      textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filter (tracker tab only) */}
          {activeTab === 'tracker' && (
            <div className="sidebar-card">
              <div className="sidebar-label">
                <Filter size={11} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 4 }} />
                Filter
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {[
                  { id: 'all', label: 'Show all', color: 'var(--text-dim)' },
                  { id: 'craft', label: '🟢 Craft only', color: 'var(--craft)' },
                  { id: 'marginal', label: '🟡 Marginal only', color: 'var(--marginal)' },
                  { id: 'skip', label: '🔴 Skip only', color: 'var(--skip)' },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFilterDecision(f.id)}
                    style={{
                      background: filterDecision === f.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                      border: `1px solid ${filterDecision === f.id ? 'rgba(255,255,255,0.15)' : 'transparent'}`,
                      color: filterDecision === f.id ? f.color : 'var(--text-dim)',
                      padding: '0.35rem 0.6rem',
                      borderRadius: 6, fontSize: '0.78rem', fontWeight: 500,
                      textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="sidebar-card">
            <div className="sidebar-label">Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <SidebarButton
                icon={<Download size={13} />}
                label="Export JSON backup"
                borderColor="rgba(200,155,60,0.30)"
                hoverBorderColor="rgba(200,155,60,0.50)"
                color="var(--gold-accent)"
                onClick={() => {
                  const json = JSON.stringify(store.items, null, 2)
                  const blob = new Blob([json], { type: 'application/json' })
                  const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
                  a.download = 'wow-crafting-backup.json'; a.click()
                }}
              />
              <SidebarButton
                icon={<RotateCcw size={13} />}
                label="Reset to defaults"
                borderColor="rgba(255,255,255,0.10)"
                hoverBorderColor="rgba(192,57,43,0.40)"
                color="var(--text-dim)"
                onClick={() => {
                  if (confirm('Reset all items to the default sample data?')) store.resetToDefault()
                }}
              />
            </div>
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="app-footer">
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          WoW Crafting Tracker · Data saved in your browser · No account needed
        </span>
        {/* Keep footer buttons for non-xl screens where sidebar is hidden */}
        <div className="footer-actions" style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => {
              if (confirm('Reset all items to the default sample data?')) store.resetToDefault()
            }}
            style={{
              background: 'none', border: '1px solid var(--border)',
              color: 'var(--text-muted)', padding: '4px 10px',
              borderRadius: 5, fontSize: '0.78rem', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-bright)'; e.currentTarget.style.color = 'var(--text)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            Reset to defaults
          </button>
          <button
            onClick={() => {
              const json = JSON.stringify(store.items, null, 2)
              const blob = new Blob([json], { type: 'application/json' })
              const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
              a.download = 'wow-crafting-backup.json'; a.click()
            }}
            style={{
              background: 'none', border: '1px solid var(--border-bright)',
              color: 'var(--gold-dim)', padding: '4px 10px',
              borderRadius: 5, fontSize: '0.78rem', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-bright)'; e.currentTarget.style.color = 'var(--gold-dim)' }}
          >
            ⬇ Export JSON backup
          </button>
        </div>
      </footer>
    </div>
  )
}

// ── Sidebar sub-components ──────────────────────────────────

function SidebarStat({ label, value, color, icon }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
        {icon} {label}
      </span>
      <span style={{ fontSize: '0.92rem', fontWeight: 700, color, fontFamily: 'Cinzel, serif' }}>
        {value}
      </span>
    </div>
  )
}

function MiniCount({ label, count, color }) {
  return (
    <div style={{
      flex: 1, textAlign: 'center',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid var(--border)',
      borderRadius: 6, padding: '0.3rem 0.25rem',
    }}>
      <div style={{ fontSize: '1rem', fontWeight: 700, color, fontFamily: 'Cinzel, serif' }}>{count}</div>
      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
    </div>
  )
}

function SidebarButton({ icon, label, borderColor, hoverBorderColor, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        border: `1px solid ${borderColor}`,
        color,
        padding: '0.45rem 0.7rem',
        borderRadius: 6, fontSize: '0.78rem', fontWeight: 500,
        display: 'flex', alignItems: 'center', gap: 6,
        transition: 'all 0.15s', textAlign: 'left',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = hoverBorderColor; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = borderColor; e.currentTarget.style.background = 'transparent' }}
    >
      {icon} {label}
    </button>
  )
}

function PageTitle({ icon, title, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <span style={{ fontSize: '1.4rem' }}>{icon}</span>
      <div>
        <h1 style={{
          fontFamily: 'Cinzel, serif', fontSize: '1.2rem',
          fontWeight: 700, color: 'var(--gold-bright)',
          lineHeight: 1.2,
        }}>{title}</h1>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>{sub}</p>
      </div>
    </div>
  )
}
