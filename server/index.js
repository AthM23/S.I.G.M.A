import 'dotenv/config'
import { config } from 'dotenv'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env.local (overrides .env) — dotenv/config loads .env by default
config({ path: resolve(__dirname, '.env.local'), override: true })

const app = express()
app.use(cors())
app.use(express.json())

const API_KEY       = process.env.API_KEY       || 'sigma-demo-key'
const PORT          = parseInt(process.env.PORT  || '3001', 10)
const LIVE_HIKER_ID = parseInt(process.env.LIVE_HIKER_ID || '1', 10)
const USING_DEMO_API_KEY = API_KEY === 'sigma-demo-key'

// Log every incoming request. Noisy, but invaluable when diagnosing
// whether the ESP's POSTs are reaching this process at all.
app.use((req, _res, next) => {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown'
  console.log(`[req] ${req.method} ${req.url}  from=${ip}`)
  next()
})

let latestReading = null
let latestSosAt   = null  // ISO timestamp of most recent SOS packet

// Ground station posts here
app.post('/api/ingest', (req, res) => {
  const suppliedKey = req.headers['x-api-key']
  if (suppliedKey !== API_KEY) {
    console.warn('[ingest] 401 unauthorized — invalid or missing X-Api-Key')
    return res.status(401).json({ error: 'unauthorized' })
  }
  console.log('[ingest] 200 body:', JSON.stringify(req.body))

  const { type, bpm, spo2, temp, humid, lat, lon, alt, validHR, battPct } = req.body

  if (type === 2) {
    latestSosAt = new Date().toISOString()
    console.log('[ingest] SOS received — latestSosAt=', latestSosAt)
  }

  latestReading = {
    id: LIVE_HIKER_ID,
    sensors: {
      heartRate:      typeof bpm   === 'number' ? Math.round(bpm)   : null,
      spO2:           typeof spo2  === 'number' ? Math.round(spo2)  : null,
      temperature:    typeof temp  === 'number' ? temp  : null,
      humidity:       typeof humid === 'number' ? humid : null,
      heartRateValid: validHR !== false,
    },
    lat:       typeof lat === 'number' && lat !== 0 ? lat : null,
    lon:       typeof lon === 'number' && lon !== 0 ? lon : null,
    alt:       typeof alt === 'number' ? alt : null,
    battPct:   typeof battPct === 'number' ? battPct : null,
    lastSeen:  new Date().toISOString(),
    receivedAt: Date.now(),
  }

  res.json({ ok: true })
})

// Dashboard polls here
app.get('/api/live', (_req, res) => {
  if (!latestReading) return res.json({ data: null, sosAt: latestSosAt })
  const age = Date.now() - latestReading.receivedAt
  res.json({
    data:       latestReading,
    stale:      age > 30_000,
    ageSeconds: Math.floor(age / 1000),
    sosAt:      latestSosAt,
  })
})

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    liveHikerId: LIVE_HIKER_ID,
    hasData: latestReading !== null,
    usingDemoApiKey: USING_DEMO_API_KEY,
  })
})

// Bind explicitly to 0.0.0.0 so the ESP on the hotspot LAN can reach us.
// Without this, some Node versions bind IPv6-only (::) and IPv4 LAN
// clients get silent connection refusals.
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Sigma ingest server  :${PORT}`)
  console.log(`Live hiker ID        ${LIVE_HIKER_ID}`)
  console.log(`API key mode         ${USING_DEMO_API_KEY ? 'demo default' : 'custom'}`)
  console.log(`POST /api/ingest     ground station → server`)
  console.log(`GET  /api/live       server → dashboard`)
})
