import React, { useState, useRef, useCallback, useEffect } from 'react'
import { scheduleFetch, cancelFetch, fetchItemData } from './wowApi.js'
import { fmt, fmtPct } from './useStore.js'

// ---------------------------------------------------------------------------
// Tooltip positioning helper
// ---------------------------------------------------------------------------

function getTooltipPosition(triggerRect, tooltipRect) {
  const pad = 12
  let top = triggerRect.top - tooltipRect.height - pad
  let left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2

  // Flip below if not enough room above
  if (top < pad) {
    top = triggerRect.bottom + pad
  }

  // Clamp horizontal
  left = Math.max(pad, Math.min(left, window.innerWidth - tooltipRect.width - pad))

  return { top, left }
}

// ---------------------------------------------------------------------------
// Tooltip content renderers
// ---------------------------------------------------------------------------

function LoadingContent() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.5rem' }}>
      <div className="tooltip-spinner" />
      <span style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>
        Loading item data...
      </span>
    </div>
  )
}

function ErrorContent({ message }) {
  return (
    <div style={{ padding: '0.5rem', color: 'var(--skip)', fontSize: '0.82rem' }}>
      Could not retrieve item data.
      {message && (
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
          {message}
        </div>
      )}
    </div>
  )
}

function ItemContent({ data }) {
  const profitColor = data.profit >= 0 ? 'var(--craft)' : 'var(--skip)'
  const marginColor = data.margin > 0.2 ? 'var(--craft)' : data.margin > 0 ? 'var(--marginal)' : 'var(--skip)'

  return (
    <div>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid var(--border-bright)',
        paddingBottom: '0.5rem', marginBottom: '0.5rem',
      }}>
        <div style={{
          fontFamily: 'Cinzel, serif', fontSize: '0.95rem',
          fontWeight: 700, color: 'var(--gold-bright)',
        }}>
          {data.name}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
          Crafted Item · {data.reagentCount} reagent{data.reagentCount !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem 1rem' }}>
        <StatRow label="Sell Price" value={fmt(data.sellPrice)} color="var(--blue)" />
        <StatRow label="Mat Cost" value={fmt(data.matCost)} color="var(--text-dim)" />
        <StatRow label="Profit" value={(data.profit >= 0 ? '+' : '') + fmt(data.profit)} color={profitColor} />
        <StatRow label="Margin" value={fmtPct(data.margin)} color={marginColor} />
      </div>

      {/* Top reagent */}
      {data.topReagent && (
        <div style={{
          marginTop: '0.5rem', paddingTop: '0.5rem',
          borderTop: '1px solid var(--border)',
          fontSize: '0.78rem', color: 'var(--text-dim)',
        }}>
          Top cost: <span style={{ color: 'var(--marginal)' }}>{data.topReagent}</span>
          {' '}({fmt(data.topReagentCost)})
        </div>
      )}

      {/* Reagent mini-list */}
      {data.reagents && data.reagents.length > 0 && (
        <div style={{
          marginTop: '0.4rem', paddingTop: '0.4rem',
          borderTop: '1px solid var(--border)',
        }}>
          <div style={{
            fontSize: '0.68rem', color: 'var(--text-muted)',
            letterSpacing: '0.08em', marginBottom: '0.25rem',
          }}>
            REAGENTS
          </div>
          {data.reagents.slice(0, 6).map((r, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: '0.78rem', padding: '1px 0',
            }}>
              <span style={{ color: 'var(--text)' }}>
                {r.name || '(unnamed)'} <span style={{ color: 'var(--text-muted)' }}>x{r.qty}</span>
              </span>
              <span style={{ color: 'var(--craft)', fontWeight: 600 }}>{fmt(r.lineCost)}</span>
            </div>
          ))}
          {data.reagents.length > 6 && (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
              +{data.reagents.length - 6} more...
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ReagentContent({ data }) {
  return (
    <div>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid var(--border-bright)',
        paddingBottom: '0.5rem', marginBottom: '0.5rem',
      }}>
        <div style={{
          fontFamily: 'Cinzel, serif', fontSize: '0.95rem',
          fontWeight: 700, color: 'var(--blue)',
        }}>
          {data.name}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
          Reagent · Used in {data.usedIn.length} item{data.usedIn.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem 1rem' }}>
        <StatRow label="Unit Price" value={fmt(data.unitPrice)} color="var(--blue)" />
        <StatRow label="Total Qty" value={data.totalQty.toString()} color="var(--marginal)" />
        <StatRow label="Total Spend" value={fmt(data.totalSpend)} color="var(--gold-bright)" />
      </div>

      {/* Used in list */}
      {data.usedIn.length > 0 && (
        <div style={{
          marginTop: '0.5rem', paddingTop: '0.5rem',
          borderTop: '1px solid var(--border)',
        }}>
          <div style={{
            fontSize: '0.68rem', color: 'var(--text-muted)',
            letterSpacing: '0.08em', marginBottom: '0.25rem',
          }}>
            USED IN
          </div>
          {data.usedIn.map((u, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: '0.78rem', padding: '1px 0',
            }}>
              <span style={{ color: 'var(--gold-bright)' }}>{u.itemName}</span>
              <span style={{ color: 'var(--text-dim)' }}>x{u.qty}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: '0.85rem', fontWeight: 600, color }}>{value}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// HoverTooltip — wraps any element; shows tooltip on hover
// ---------------------------------------------------------------------------

/**
 * @param {object}   props
 * @param {string}   props.itemName   Name of the item or reagent
 * @param {'item'|'reagent'} props.type
 * @param {Array}    props.allItems   Full items array from the store
 * @param {React.ReactNode} props.children  The trigger element
 */
export default function HoverTooltip({ itemName, type = 'item', allItems, children }) {
  const [state, setState] = useState('idle') // idle | loading | loaded | error
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  const triggerRef = useRef(null)
  const tooltipRef = useRef(null)
  const cacheKey = `${type}:${itemName}`

  // Recalculate position after data loads
  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return
    const triggerRect = triggerRef.current.getBoundingClientRect()
    const tooltipRect = tooltipRef.current.getBoundingClientRect()
    setPosition(getTooltipPosition(triggerRect, tooltipRect))
  }, [])

  useEffect(() => {
    if (state === 'loaded' || state === 'loading' || state === 'error') {
      updatePosition()
    }
  }, [state, data, updatePosition])

  const handleMouseEnter = useCallback(() => {
    setState('loading')

    scheduleFetch(
      cacheKey,
      () => fetchItemData(itemName, allItems, type),
      (result) => {
        if (result) {
          setData(result)
          setState('loaded')
        } else {
          setError('Item not found')
          setState('error')
        }
      },
      (err) => {
        setError(err.message)
        setState('error')
      },
      300
    )
  }, [cacheKey, itemName, allItems, type])

  const handleMouseLeave = useCallback(() => {
    cancelFetch(cacheKey)
    setState('idle')
    setData(null)
    setError(null)
  }, [cacheKey])

  const isVisible = state !== 'idle'

  return (
    <span
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ position: 'relative', display: 'inline' }}
    >
      {children}

      {isVisible && (
        <div
          ref={tooltipRef}
          className="item-tooltip"
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            zIndex: 9999,
            minWidth: 260,
            maxWidth: 340,
            padding: '0.75rem 1rem',
            background: 'linear-gradient(170deg, #0E1520 0%, #080C14 100%)',
            border: '1px solid var(--border-bright)',
            borderRadius: 8,
            boxShadow: `
              0 4px 24px rgba(0,0,0,0.6),
              0 0 0 1px rgba(200,155,60,0.1),
              inset 0 1px 0 rgba(200,155,60,0.08)
            `,
            pointerEvents: 'none',
          }}
        >
          {/* Gold corner accents — WoW frame feel */}
          <div style={{
            position: 'absolute', top: -1, left: -1, right: -1, height: 2,
            background: 'linear-gradient(90deg, var(--gold), transparent 30%, transparent 70%, var(--gold))',
            borderRadius: '8px 8px 0 0',
            opacity: 0.5,
          }} />

          {state === 'loading' && <LoadingContent />}
          {state === 'error'   && <ErrorContent message={error} />}
          {state === 'loaded'  && data?.type === 'item'    && <ItemContent data={data} />}
          {state === 'loaded'  && data?.type === 'reagent' && <ReagentContent data={data} />}
        </div>
      )}
    </span>
  )
}
