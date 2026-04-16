import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import itemsRouter from './routes/items.js'
import salesRouter from './routes/sales.js'

const app = express()
const PORT = process.env.PORT || 3001

// ---------------------------------------------------------------------------
// Security middleware
// ---------------------------------------------------------------------------

// HTTP security headers
app.use(helmet())

// CORS — restrict to known origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
]
app.use(cors({
  origin(origin, cb) {
    // Allow requests with no origin (curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error('Not allowed by CORS'))
  },
  credentials: true,
}))

// Body parser with size limit to prevent payload abuse
app.use(express.json({ limit: '100kb' }))

// Rate limiting — 100 requests per minute per IP
app.use('/api', rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
}))

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.use('/api/items', itemsRouter)
app.use('/api/sales', salesRouter)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.message)
  res.status(500).json({ error: 'Internal server error' })
})

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})
