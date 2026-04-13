import React, { useState } from 'react'
import { useStore } from './useStore.js'
import Header from './Header.jsx'
import ItemTracker from './ItemTracker.jsx'
import Summary from './Summary.jsx'
import { AHPrices, ExpensiveReagents } from './AHPrices.jsx'

export default function App() {
  const [activeTab, setActiveTab] = useState('tracker')
  const store = useStore()
  const { items } = store

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

      <main style={{
        flex: 1, position: 'relative', zIndex: 1,
        maxWidth: 1200, margin: '0 auto', width: '100%',
        padding: '1.5rem',
      }}>
        {/* Page title */}
        <div style={{ marginBottom: '1.5rem' }}>
          {{
            tracker:  <PageTitle icon="⚔️" title="Item Tracker" sub="Add items, manage reagents, see profit at a glance. Click any item to expand." />,
            summary:  <PageTitle icon="📊" title="Profit Summary" sub="All items ranked by profit. Totals calculated automatically." />,
            ah:       <PageTitle icon="🏪" title="AH Price List" sub="All reagents aggregated across every item. Update prices in Item Tracker." />,
            reagents: <PageTitle icon="💰" title="Expensive Reagents" sub="Ranked by unit price — your biggest cost drivers." />,
          }[activeTab]}
        </div>

        {/* Tab content */}
        <div className="fade-up" key={activeTab}>
          {activeTab === 'tracker'  && <ItemTracker store={store} />}
          {activeTab === 'summary'  && <Summary items={items} />}
          {activeTab === 'ah'       && <AHPrices items={items} />}
          {activeTab === 'reagents' && <ExpensiveReagents items={items} />}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        position: 'relative', zIndex: 1,
        borderTop: '1px solid var(--border)',
        padding: '0.75rem 1.5rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 8,
        background: 'var(--bg2)',
      }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          WoW Crafting Tracker · Data saved in your browser · No account needed
        </span>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
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
