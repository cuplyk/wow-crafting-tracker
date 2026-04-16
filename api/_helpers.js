const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
]

export function cors(req, res) {
  const origin = req.headers.origin
  if (origin && (ALLOWED_ORIGINS.includes(origin) || process.env.VERCEL_URL)) {
    // In production, allow the Vercel deployment origin
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Max-Age', '86400')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return true
  }
  return false
}

export function validateItem(body) {
  const errors = []
  if (typeof body.name !== 'string' || body.name.trim().length === 0) {
    errors.push('name is required and must be a non-empty string')
  }
  if (body.name && body.name.length > 200) {
    errors.push('name must be 200 characters or less')
  }
  if (body.sell !== undefined && (typeof body.sell !== 'number' || !isFinite(body.sell))) {
    errors.push('sell must be a finite number')
  }
  return errors
}

export function validateReagent(body) {
  const errors = []
  if (body.name !== undefined && typeof body.name !== 'string') {
    errors.push('name must be a string')
  }
  if (body.name && body.name.length > 200) {
    errors.push('name must be 200 characters or less')
  }
  if (body.qty !== undefined && (typeof body.qty !== 'number' || !isFinite(body.qty) || body.qty < 0)) {
    errors.push('qty must be a non-negative finite number')
  }
  if (body.price !== undefined && (typeof body.price !== 'number' || !isFinite(body.price))) {
    errors.push('price must be a finite number')
  }
  return errors
}
