export default function handler(_req, res) {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
}
