import React, { useState, useRef } from 'react'
import { calcItem, fmt, fmtPct } from './useStore.js'
import { Trash2, Plus, ChevronDown, ChevronRight, Copy, Sword, FlaskConical } from 'lucide-react'
import HoverTooltip from './ItemTooltip.jsx'

function DecisionBadge({ decision }) {
  const map = {
    craft:    { label: '🟢 Craft',    color: 'var(--craft)',    bg: 'var(--craft-bg)',    border: 'rgba(60,179,113,0.3)' },
    marginal: { label: '🟡 Marginal', color: 'var(--marginal)', bg: 'var(--marginal-bg)', border: 'rgba(232,160,32,0.3)' },
    skip:     { label: '🔴 Skip',     color: 'var(--skip)',     bg: 'var(--skip-bg)',     border: 'rgba(192,57,43,0.3)' },
  }
  const d = map[decision]
  return (
    <span style={{
      fontSize: '0.75rem', fontWeight: 700,
      padding: '0.2rem 0.7rem', borderRadius: 20,
      color: d.color, background: d.bg,
      border: `1px solid ${d.border}`,
      letterSpacing: '0.04em', whiteSpace: 'nowrap',
    }}>{d.label}</span>
  )
}

function InlineEdit({ value, onChange, style = {}, type = 'text', placeholder = '' }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const ref = useRef()

  const commit = () => {
    setEditing(false)
    if (draft !== value) onChange(draft)
  }

  if (editing) {
    return (
      <input
        ref={ref}
        type={type}
        value={draft}
        step={type === 'number' ? '0.01' : undefined}
        min={type === 'number' ? '0' : undefined}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false) } }}
        autoFocus
        style={{
          background: 'var(--bg4)', border: '1px solid var(--gold)',
          color: 'var(--gold-bright)', padding: '0.2rem 0.4rem',
          borderRadius: 4, fontSize: 'inherit', fontFamily: 'Rajdhani, sans-serif',
          fontWeight: 600, width: type === 'number' ? 80 : '100%',
          ...style
        }}
      />
    )
  }

  return (
    <span
      onClick={() => { setDraft(value); setEditing(true) }}
      title="Click to edit"
      style={{
        cursor: 'text', borderBottom: '1px dashed var(--border-bright)',
        paddingBottom: 1, transition: 'border-color 0.15s',
        ...style
      }}
    >
      {placeholder && !value ? <span style={{ color: 'var(--text-muted)' }}>{placeholder}</span> : value}
    </span>
  )
}

function ReagentRow({ reagent, itemId, onUpdate, onDelete, allItems }) {
  const lineCost = reagent.qty * reagent.price
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 52px 90px 90px 28px',
      gap: 8, alignItems: 'center',
      padding: '0.4rem 1rem',
      borderBottom: '1px solid rgba(200,155,60,0.06)',
    }}>
      <HoverTooltip itemName={reagent.name} type="reagent" allItems={allItems}>
        <InlineEdit
          value={reagent.name}
          placeholder="Reagent name"
          onChange={v => onUpdate(reagent.id, { name: v })}
          style={{ fontSize: '0.9rem', color: 'var(--text)' }}
        />
      </HoverTooltip>
      <InlineEdit
        value={reagent.qty}
        type="number"
        onChange={v => onUpdate(reagent.id, { qty: parseFloat(v) || 0 })}
        style={{ fontSize: '0.9rem', color: 'var(--marginal)', textAlign: 'right' }}
      />
      <InlineEdit
        value={reagent.price}
        type="number"
        onChange={v => onUpdate(reagent.id, { price: parseFloat(v) || 0 })}
        style={{ fontSize: '0.9rem', color: 'var(--blue)', textAlign: 'right' }}
      />
      <span style={{ fontSize: '0.9rem', color: 'var(--craft)', textAlign: 'right', fontWeight: 600 }}>
        {fmt(lineCost)}
      </span>
      <button
        onClick={() => onDelete(itemId, reagent.id)}
        style={{
          background: 'none', border: 'none', padding: 4,
          color: 'var(--text-muted)', borderRadius: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--skip)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}

function ItemCard({ item, onUpdate, onDelete, onDuplicate, onAddReagent, onUpdateReagent, onDeleteReagent, allItems }) {
  const [open, setOpen] = useState(false)
  const { matCost, profit, margin, decision } = calcItem(item)

  return (
    <div className="slide-in" style={{
      background: 'var(--bg2)',
      border: `1px solid ${open ? 'var(--border-bright)' : 'var(--border)'}`,
      borderRadius: 10, overflow: 'hidden',
      marginBottom: '0.6rem',
      transition: 'border-color 0.2s',
    }}>
      {/* Header row */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto auto auto auto',
          gap: '0.75rem', alignItems: 'center',
          padding: '0.8rem 1rem',
          background: 'var(--bg3)',
          cursor: 'pointer',
        }}
      >
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', transition: 'transform 0.2s', display: 'flex' }}>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>

        {/* Item name */}
        <div onClick={e => e.stopPropagation()}>
          <HoverTooltip itemName={item.name} type="item" allItems={allItems}>
            <InlineEdit
              value={item.name}
              placeholder="Item name"
              onChange={v => onUpdate(item.id, { name: v })}
              style={{
                fontFamily: 'Cinzel, serif', fontSize: '0.9rem',
                color: 'var(--gold-bright)', fontWeight: 600,
              }}
            />
          </HoverTooltip>
        </div>

        {/* Stats */}
        <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
          Mat: {fmt(matCost)}
        </span>
        <span style={{ fontSize: '0.82rem', color: 'var(--blue)', whiteSpace: 'nowrap' }}>
          Sell: {fmt(item.sell)}
        </span>
        <span style={{
          fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap',
          color: profit >= 0 ? 'var(--craft)' : 'var(--skip)',
        }}>
          {profit >= 0 ? '+' : ''}{fmt(profit)} ({fmtPct(margin)})
        </span>
        <DecisionBadge decision={decision} />
      </div>

      {/* Expanded body */}
      {open && (
        <div>
          {/* Sell price row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.5rem 1rem',
            borderBottom: '1px solid var(--border)',
            background: 'rgba(0,0,0,0.2)',
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
              SELL PRICE
            </span>
            <div onClick={e => e.stopPropagation()}>
              <InlineEdit
                value={item.sell}
                type="number"
                onChange={v => onUpdate(item.id, { sell: parseFloat(v) || 0 })}
                style={{ fontSize: '1rem', color: 'var(--blue)', fontWeight: 700 }}
              />
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>g</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem' }}>
              <button
                onClick={() => onDuplicate(item.id)}
                title="Duplicate item"
                style={{
                  background: 'none', border: '1px solid var(--border)',
                  color: 'var(--text-dim)', padding: '4px 8px',
                  borderRadius: 5, fontSize: '0.75rem',
                  display: 'flex', alignItems: 'center', gap: 4,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold-dim)'; e.currentTarget.style.color = 'var(--gold)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-dim)' }}
              >
                <Copy size={11} /> Copy
              </button>
              <button
                onClick={() => { if (confirm(`Delete "${item.name}"?`)) onDelete(item.id) }}
                title="Delete item"
                style={{
                  background: 'none', border: '1px solid var(--border)',
                  color: 'var(--text-muted)', padding: '4px 8px',
                  borderRadius: 5, fontSize: '0.75rem',
                  display: 'flex', alignItems: 'center', gap: 4,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--skip)'; e.currentTarget.style.color = 'var(--skip)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                <Trash2 size={11} /> Delete
              </button>
            </div>
          </div>

          {/* Reagent header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 52px 90px 90px 28px',
            gap: 8, padding: '0.3rem 1rem',
            fontSize: '0.7rem', fontWeight: 700,
            letterSpacing: '0.1em', color: 'var(--text-muted)',
            borderBottom: '1px solid var(--border)',
          }}>
            <span>REAGENT</span>
            <span style={{ textAlign: 'right' }}>QTY</span>
            <span style={{ textAlign: 'right' }}>UNIT PRICE</span>
            <span style={{ textAlign: 'right' }}>LINE COST</span>
            <span />
          </div>

          {/* Reagents */}
          {item.reagents.map(r => (
            <ReagentRow
              key={r.id}
              reagent={r}
              itemId={item.id}
              onUpdate={onUpdateReagent}
              onDelete={onDeleteReagent}
              allItems={allItems}
            />
          ))}

          {/* Total + Add reagent */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0.5rem 1rem',
            borderTop: '1px solid var(--border)',
          }}>
            <button
              onClick={() => onAddReagent(item.id)}
              style={{
                background: 'none', border: '1px dashed var(--border-bright)',
                color: 'var(--gold-dim)', padding: '4px 10px',
                borderRadius: 5, fontSize: '0.8rem',
                display: 'flex', alignItems: 'center', gap: 4,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-bright)'; e.currentTarget.style.color = 'var(--gold-dim)' }}
            >
              <Plus size={12} /> Add reagent
            </button>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: 8 }}>Total mat cost</span>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gold-bright)', fontFamily: 'Cinzel, serif' }}>
                {fmt(matCost)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ItemTracker({ store }) {
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSell, setNewSell] = useState('')
  const [search, setSearch] = useState('')

  const {
    items, addItem, updateItem, deleteItem, duplicateItem,
    addReagent, updateReagent, deleteReagent
  } = store

  const filtered = search
    ? items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    : items

  const handleAdd = () => {
    if (!newName.trim()) return
    const id = addItem(newName.trim(), parseFloat(newSell) || 0)
    setNewName(''); setNewSell(''); setShowAdd(false)
  }

  const calcs = items.map(it => calcItem(it))
  const craftCount    = calcs.filter(c => c.decision === 'craft').length
  const marginalCount = calcs.filter(c => c.decision === 'marginal').length
  const skipCount     = calcs.filter(c => c.decision === 'skip').length

  return (
    <div>
      {/* KPI strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '0.75rem', marginBottom: '1.5rem',
      }}>
        {[
          { label: 'TOTAL ITEMS', value: items.length, color: 'var(--gold-bright)' },
          { label: 'CRAFT', value: craftCount, color: 'var(--craft)' },
          { label: 'MARGINAL', value: marginalCount, color: 'var(--marginal)' },
          { label: 'SKIP', value: skipCount, color: 'var(--skip)' },
        ].map(k => (
          <div key={k.label} style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '0.75rem 1rem',
          }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 4 }}>
              {k.label}
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: k.color, fontFamily: 'Cinzel, serif' }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search items…"
          style={{
            flex: 1, minWidth: 160,
            background: 'var(--bg3)', border: '1px solid var(--border)',
            color: 'var(--text)', padding: '0.5rem 0.8rem',
            borderRadius: 6, fontSize: '0.9rem',
          }}
        />
        <button
          onClick={() => setShowAdd(v => !v)}
          style={{
            background: 'linear-gradient(135deg, var(--gold-dim), var(--gold))',
            border: '1px solid var(--gold)', color: '#080C14',
            padding: '0.5rem 1.2rem', borderRadius: 6,
            fontSize: '0.95rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'filter 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
          onMouseLeave={e => e.currentTarget.style.filter = 'none'}
        >
          <Plus size={15} /> New Item
        </button>
      </div>

      {/* Add item form */}
      {showAdd && (
        <div className="fade-up" style={{
          background: 'var(--bg3)', border: '1px solid var(--border-bright)',
          borderRadius: 8, padding: '1rem', marginBottom: '1rem',
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--gold)', marginBottom: 8, letterSpacing: '0.08em' }}>
            NEW ITEM
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="Item name (e.g. Swift Cloak Lining)"
              autoFocus
              style={{
                flex: 1, minWidth: 200,
                background: 'var(--bg4)', border: '1px solid var(--border)',
                color: 'var(--text)', padding: '0.5rem 0.75rem',
                borderRadius: 6, fontSize: '0.95rem',
              }}
            />
            <input
              type="number"
              value={newSell}
              onChange={e => setNewSell(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="Sell price (g)"
              min="0" step="0.01"
              style={{
                width: 130,
                background: 'var(--bg4)', border: '1px solid var(--border-bright)',
                color: 'var(--blue)', padding: '0.5rem 0.75rem',
                borderRadius: 6, fontSize: '0.95rem',
              }}
            />
            <button
              onClick={handleAdd}
              style={{
                background: 'var(--gold)', border: 'none', color: '#080C14',
                padding: '0.5rem 1rem', borderRadius: 6,
                fontSize: '0.9rem', fontWeight: 700,
              }}
            >
              Add
            </button>
            <button
              onClick={() => setShowAdd(false)}
              style={{
                background: 'none', border: '1px solid var(--border)',
                color: 'var(--text-muted)', padding: '0.5rem 0.75rem',
                borderRadius: 6, fontSize: '0.9rem',
              }}
            >
              Cancel
            </button>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8 }}>
            After adding, click the item to expand and add reagents.
          </p>
        </div>
      )}

      {/* Items */}
      {filtered.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '3rem 1rem',
          color: 'var(--text-muted)', fontSize: '0.95rem',
        }}>
          {search ? `No items match "${search}"` : 'No items yet. Click "New Item" to get started.'}
        </div>
      )}

      {filtered.map(item => (
        <ItemCard
          key={item.id}
          item={item}
          onUpdate={updateItem}
          onDelete={deleteItem}
          onDuplicate={duplicateItem}
          onAddReagent={addReagent}
          onUpdateReagent={updateReagent}
          onDeleteReagent={deleteReagent}
          allItems={items}
        />
      ))}
    </div>
  )
}
