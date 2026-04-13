/**
 * WoW Item API Service
 *
 * Fetches item data on hover. Uses an in-memory cache so each item is only
 * fetched once per session. The service is API-agnostic — swap the fetch URL
 * to point at Blizzard's Game Data API, a proxy, or any other source.
 *
 * Default mode: builds a rich tooltip payload from LOCAL store data so the
 * feature works out of the box with zero configuration. When an external
 * API endpoint is configured, it fetches from the network instead.
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const API_CONFIG = {
  // Set to a real endpoint to enable network fetches, e.g.
  //   "https://your-proxy.example.com/api/item"
  // The service will call  `${baseUrl}?name=<encodedName>`
  baseUrl: null,

  // How long (ms) a cache entry stays valid
  cacheTTL: 5 * 60 * 1000, // 5 minutes
}

// ---------------------------------------------------------------------------
// In-memory cache  { [key]: { data, timestamp } }
// ---------------------------------------------------------------------------

const cache = new Map()

function getCached(key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > API_CONFIG.cacheTTL) {
    cache.delete(key)
    return null
  }
  return entry.data
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() })
}

// ---------------------------------------------------------------------------
// Debounce helper — prevents rapid-fire fetches while the mouse crosses
// multiple elements quickly.
// ---------------------------------------------------------------------------

const pending = new Map() // itemKey -> timeoutId

/**
 * Schedule a fetch after a short delay.  If the user moves away before the
 * delay fires, call `cancelFetch` to abort.
 *
 * @param {string}   key       Unique cache key (item name or id)
 * @param {Function} fetchFn   () => Promise<data>
 * @param {Function} onResult  (data) => void
 * @param {Function} onError   (err)  => void
 * @param {number}   delay     Debounce delay in ms (default 300)
 */
export function scheduleFetch(key, fetchFn, onResult, onError, delay = 300) {
  // 1. Return immediately if cached
  const cached = getCached(key)
  if (cached) {
    onResult(cached)
    return
  }

  // 2. Cancel any previously scheduled fetch for this key
  cancelFetch(key)

  // 3. Schedule the real fetch
  const id = setTimeout(async () => {
    pending.delete(key)
    try {
      const data = await fetchFn()
      setCache(key, data)
      onResult(data)
    } catch (err) {
      onError(err)
    }
  }, delay)

  pending.set(key, id)
}

/**
 * Cancel a pending debounced fetch (e.g. on mouse-leave).
 */
export function cancelFetch(key) {
  const id = pending.get(key)
  if (id != null) {
    clearTimeout(id)
    pending.delete(key)
  }
}

// ---------------------------------------------------------------------------
// Fetch implementations
// ---------------------------------------------------------------------------

/**
 * Fetch item data from the configured external API.
 * Falls back to local data builder if no endpoint is set.
 */
async function fetchFromApi(name) {
  if (!API_CONFIG.baseUrl) {
    throw new Error('NO_API') // triggers local fallback in the caller
  }

  const url = `${API_CONFIG.baseUrl}?name=${encodeURIComponent(name)}`
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(5000),
  })

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`)
  }

  return res.json()
}

/**
 * Build a rich tooltip payload from LOCAL store data.
 * This is the zero-config default — no network call needed.
 *
 * @param {string} name         The item or reagent name
 * @param {Array}  allItems     The full items array from useStore
 * @param {'item'|'reagent'} type  What kind of entity we're looking up
 * @returns {object}            Normalized tooltip data
 */
export function buildLocalTooltipData(name, allItems, type = 'item') {
  if (type === 'item') {
    const item = allItems.find(i => i.name === name)
    if (!item) return null

    const matCost = item.reagents.reduce((s, r) => s + r.qty * r.price, 0)
    const profit = item.sell - matCost
    const margin = item.sell > 0 ? profit / item.sell : 0

    // Find most expensive reagent
    let topReagent = null
    let topCost = 0
    item.reagents.forEach(r => {
      const cost = r.qty * r.price
      if (cost > topCost) { topCost = cost; topReagent = r.name }
    })

    return {
      type: 'item',
      name: item.name,
      sellPrice: item.sell,
      matCost,
      profit,
      margin,
      reagentCount: item.reagents.length,
      topReagent,
      topReagentCost: topCost,
      reagents: item.reagents.map(r => ({
        name: r.name,
        qty: r.qty,
        price: r.price,
        lineCost: r.qty * r.price,
      })),
    }
  }

  // --- Reagent lookup: aggregate across all items ---
  const usedIn = []
  let totalQty = 0
  let unitPrice = 0

  allItems.forEach(item => {
    item.reagents.forEach(r => {
      if (r.name === name) {
        usedIn.push({ itemName: item.name, qty: r.qty })
        totalQty += r.qty
        unitPrice = r.price // last-seen price (same reagent = same price)
      }
    })
  })

  if (usedIn.length === 0) return null

  return {
    type: 'reagent',
    name,
    unitPrice,
    totalQty,
    totalSpend: unitPrice * totalQty,
    usedIn,
  }
}

/**
 * Primary entry point — tries API first, falls back to local data.
 *
 * @param {string} name       Item or reagent name
 * @param {Array}  allItems   Full items array from useStore
 * @param {'item'|'reagent'} type
 * @returns {Promise<object>}
 */
export async function fetchItemData(name, allItems, type = 'item') {
  try {
    const apiData = await fetchFromApi(name)
    return apiData
  } catch {
    // No API configured or network error — use local data
    return buildLocalTooltipData(name, allItems, type)
  }
}
