import React from 'react'

export default function Header({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'tracker', label: 'Item Tracker' },
    { id: 'summary', label: 'Summary' },
    { id: 'ah', label: 'AH Prices' },
    { id: 'reagents', label: 'Reagent Cost' },
  ]

  return (
    <header style={{
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg2)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '2rem',
          height: 60,
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
            <span style={{ fontSize: '1.4rem' }}>⚔️</span>
            <span style={{
              fontFamily: 'Cinzel, serif',
              fontSize: '1.1rem', fontWeight: 700,
              color: 'var(--gold-bright)',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
            }}>
              Crafting Tracker
            </span>
          </div>

          {/* Tabs */}
          <nav style={{ display: 'flex', gap: 0, height: '100%' }}>
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  background: 'none', border: 'none',
                  padding: '0 1.1rem',
                  fontSize: '0.9rem', fontWeight: 600,
                  letterSpacing: '0.04em',
                  color: activeTab === t.id ? 'var(--gold-bright)' : 'var(--text-dim)',
                  borderBottom: `2px solid ${activeTab === t.id ? 'var(--gold)' : 'transparent'}`,
                  transition: 'all 0.15s',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {t.label}
              </button>
            ))}
          </nav>

          {/* Tagline */}
          <div style={{
            marginLeft: 'auto', fontSize: '0.78rem',
            color: 'var(--text-muted)', fontStyle: 'italic',
            display: 'none',
          }} className="hide-mobile">
            Data saved in browser
          </div>
        </div>
      </div>
    </header>
  )
}
