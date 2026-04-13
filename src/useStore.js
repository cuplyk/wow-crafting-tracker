import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'wow-crafting-items'

const DEFAULT_ITEMS = [
  {
    id: '1',
    name: "Chain Cloak Lining",
    sell: 190,
    reagents: [
      { id: 'r1', name: "Dragonweave", qty: 1, price: 0.11 },
      { id: 'r2', name: "Profane Cloth", qty: 1, price: 0.50 },
      { id: 'r3', name: "Dark Iron Bar", qty: 10, price: 4.00 },
      { id: 'r4', name: "Essence of Earth", qty: 5, price: 19.00 },
    ]
  },
  {
    id: '2',
    name: "Sustaining Cloak Lining",
    sell: 97,
    reagents: [
      { id: 'r5', name: "Gostweave", qty: 1, price: 8.00 },
      { id: 'r6', name: "Profane Cloth", qty: 1, price: 0.50 },
      { id: 'r7', name: "Blue Sapphire", qty: 3, price: 3.00 },
      { id: 'r8', name: "Living Essence", qty: 5, price: 9.00 },
    ]
  },
  {
    id: '3',
    name: "Flowing Cloak Lining",
    sell: 90,
    reagents: [
      { id: 'r9', name: "Blackrock Fireweave", qty: 1, price: 2.00 },
      { id: 'r10', name: "Profane Cloth", qty: 1, price: 0.50 },
      { id: 'r11', name: "Star Ruby", qty: 3, price: 0.30 },
      { id: 'r12', name: "Essence of Water", qty: 5, price: 16.00 },
    ]
  },
  {
    id: '4',
    name: "Absorptive Cloak Lining",
    sell: 15,
    reagents: [
      { id: 'r13', name: "Dragonweave", qty: 1, price: 0.11 },
      { id: 'r14', name: "Profane Cloth", qty: 1, price: 0.50 },
      { id: 'r15', name: "Azerothian Diamond", qty: 3, price: 0.90 },
      { id: 'r16', name: "Essence of Underath", qty: 5, price: 2.70 },
    ]
  },
  {
    id: '5',
    name: "Nimble Cloak Lining",
    sell: 110,
    reagents: [
      { id: 'r17', name: "Gostweave", qty: 1, price: 8.00 },
      { id: 'r18', name: "Profane Cloth", qty: 1, price: 0.50 },
      { id: 'r19', name: "Huge Emerald", qty: 3, price: 1.20 },
      { id: 'r20', name: "Essence of Air", qty: 5, price: 12.00 },
    ]
  },
  {
    id: '6',
    name: "Rampager's Cloak Lining",
    sell: 155,
    reagents: [
      { id: 'r21', name: "Blackrock Fireweave", qty: 1, price: 2.00 },
      { id: 'r22', name: "Profane Cloth", qty: 1, price: 0.50 },
      { id: 'r23', name: "Black Diamond", qty: 10, price: 0.20 },
      { id: 'r24', name: "Essence of Fire", qty: 5, price: 16.00 },
    ]
  },
]

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

export function useStore() {
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) return JSON.parse(stored)
    } catch {}
    return DEFAULT_ITEMS
  })

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch {}
  }, [items])

  const addItem = useCallback((name, sell) => {
    const newItem = { id: uid(), name, sell: parseFloat(sell) || 0, reagents: [] }
    setItems(prev => [...prev, newItem])
    return newItem.id
  }, [])

  const updateItem = useCallback((id, fields) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...fields } : it))
  }, [])

  const deleteItem = useCallback((id) => {
    setItems(prev => prev.filter(it => it.id !== id))
  }, [])

  const duplicateItem = useCallback((id) => {
    setItems(prev => {
      const src = prev.find(it => it.id === id)
      if (!src) return prev
      const copy = {
        ...src,
        id: uid(),
        name: src.name + ' (copy)',
        reagents: src.reagents.map(r => ({ ...r, id: uid() }))
      }
      const idx = prev.findIndex(it => it.id === id)
      const next = [...prev]
      next.splice(idx + 1, 0, copy)
      return next
    })
  }, [])

  const addReagent = useCallback((itemId) => {
    setItems(prev => prev.map(it =>
      it.id === itemId
        ? { ...it, reagents: [...it.reagents, { id: uid(), name: '', qty: 1, price: 0 }] }
        : it
    ))
  }, [])

  const updateReagent = useCallback((itemId, reagentId, fields) => {
    setItems(prev => prev.map(it =>
      it.id === itemId
        ? { ...it, reagents: it.reagents.map(r => r.id === reagentId ? { ...r, ...fields } : r) }
        : it
    ))
  }, [])

  const deleteReagent = useCallback((itemId, reagentId) => {
    setItems(prev => prev.map(it =>
      it.id === itemId
        ? { ...it, reagents: it.reagents.filter(r => r.id !== reagentId) }
        : it
    ))
  }, [])

  const resetToDefault = useCallback(() => {
    setItems(DEFAULT_ITEMS)
  }, [])

  return {
    items,
    addItem, updateItem, deleteItem, duplicateItem,
    addReagent, updateReagent, deleteReagent,
    resetToDefault,
  }
}

export function calcItem(item) {
  const matCost = item.reagents.reduce((s, r) => s + (r.qty * r.price), 0)
  const profit  = item.sell - matCost
  const margin  = item.sell > 0 ? profit / item.sell : 0
  const decision = profit < 0 ? 'skip' : margin > 0.2 ? 'craft' : 'marginal'
  return { matCost, profit, margin, decision }
}

export function fmt(n) {
  return (typeof n === 'number' ? n : 0).toFixed(2) + ' g'
}

export function fmtPct(n) {
  return ((typeof n === 'number' ? n : 0) * 100).toFixed(1) + '%'
}
