import React from 'react'
import { Hammer, BarChart3, Store, Coins } from 'lucide-react'

export default function Header({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'tracker',  label: 'Tracker',      icon: Hammer },
    { id: 'summary',  label: 'Summary',      icon: BarChart3 },
    { id: 'ah',       label: 'AH Prices',    icon: Store },
    { id: 'reagents', label: 'Reagent Cost',  icon: Coins },
  ]

  return (
    <header style={{
      borderBottom: '1px solid var(--border)',
      background: 'rgba(13,15,24,0.95)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1.5rem',
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

          {/* Pill tabs */}
          <nav style={{ display: 'flex', gap: '0.5rem', height: '100%', alignItems: 'center' }}>
            {tabs.map(t => {
              const Icon = t.icon
              const isActive = activeTab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.82rem', fontWeight: 500,
                    letterSpacing: '0.02em',
                    color: isActive ? 'var(--gold-bright)' : 'var(--text-dim)',
                    background: isActive
                      ? 'rgba(200,155,60,0.10)'
                      : 'rgba(15,17,26,0.9)',
                    border: `1px solid ${isActive
                      ? 'rgba(200,155,60,0.40)'
                      : 'rgba(255,255,255,0.10)'}`,
                    borderRadius: 8,
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
                      e.currentTarget.style.color = 'var(--text)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'
                      e.currentTarget.style.color = 'var(--text-dim)'
                    }
                  }}
                >
                  <Icon size={14} style={{ opacity: isActive ? 1 : 0.6 }} />
                  <span className="tab-label">{t.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Status tagline */}
          <div className="hide-mobile" style={{
            marginLeft: 'auto', fontSize: '0.75rem',
            color: 'var(--text-muted)', fontStyle: 'italic',
          }}>
            Data saved in browser
          </div>
        </div>
      </div>
    </header>
  )
}
