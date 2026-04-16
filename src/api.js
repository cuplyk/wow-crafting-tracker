const BASE = '/api/items'

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed (${res.status})`)
  }
  return res.json()
}

export async function fetchItems() {
  return request(BASE)
}

export async function createItem(item) {
  return request(BASE, {
    method: 'POST',
    body: JSON.stringify({ id: item.id, name: item.name, sell: item.sell }),
  })
}

export async function updateItem(id, fields) {
  return request(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(fields),
  })
}

export async function deleteItem(id) {
  return request(`${BASE}/${id}`, { method: 'DELETE' })
}

export async function duplicateItem(id, newId, reagentIds) {
  return request(`${BASE}/${id}/duplicate`, {
    method: 'POST',
    body: JSON.stringify({ newId, reagentIds }),
  })
}

export async function createReagent(itemId, reagent) {
  return request(`${BASE}/${itemId}/reagents`, {
    method: 'POST',
    body: JSON.stringify(reagent),
  })
}

export async function updateReagent(itemId, reagentId, fields) {
  return request(`${BASE}/${itemId}/reagents/${reagentId}`, {
    method: 'PUT',
    body: JSON.stringify(fields),
  })
}

export async function deleteReagent(itemId, reagentId) {
  return request(`${BASE}/${itemId}/reagents/${reagentId}`, { method: 'DELETE' })
}

export async function bulkSync(items) {
  return request(`${BASE}/bulk`, {
    method: 'PUT',
    body: JSON.stringify({ items }),
  })
}

// ---------------------------------------------------------------------------
// Sales
// ---------------------------------------------------------------------------

const SALES_BASE = '/api/sales'

export async function fetchSales() {
  return request(SALES_BASE)
}

export async function fetchSalesAnalytics() {
  return request(`${SALES_BASE}/analytics`)
}

export async function createSale(sale) {
  return request(SALES_BASE, {
    method: 'POST',
    body: JSON.stringify(sale),
  })
}

export async function deleteSale(id) {
  return request(`${SALES_BASE}/${id}`, { method: 'DELETE' })
}
