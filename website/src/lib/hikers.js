export const STATUS_COLORS = {
  normal: '#22c55e',
  warning: '#b8960a',
  critical: '#ef4444',
}

export const DEFAULT_THRESHOLDS = {
  heartRate: { warning: 140, critical: 170 },
  spO2: { warning: 94, critical: 90 },
  temperature: {
    warningHigh: 38.0,
    criticalHigh: 39.5,
    warningLow: 35.0,
    criticalLow: 34.0,
  },
}

export function deriveStatus(sensors, thresholds = DEFAULT_THRESHOLDS) {
  if (!sensors) return 'normal'
  const { heartRate, spO2, temperature, heartRateValid } = sensors
  let level = 'normal'

  const bump = (next) => {
    if (next === 'critical') level = 'critical'
    else if (next === 'warning' && level !== 'critical') level = 'warning'
  }

  if (heartRateValid !== false && typeof heartRate === 'number') {
    if (heartRate >= thresholds.heartRate.critical) bump('critical')
    else if (heartRate >= thresholds.heartRate.warning) bump('warning')
  }

  if (typeof spO2 === 'number') {
    if (spO2 <= thresholds.spO2.critical) bump('critical')
    else if (spO2 <= thresholds.spO2.warning) bump('warning')
  }

  if (typeof temperature === 'number') {
    const t = thresholds.temperature
    if (temperature >= t.criticalHigh || temperature <= t.criticalLow) bump('critical')
    else if (temperature >= t.warningHigh || temperature <= t.warningLow) bump('warning')
  }

  return level
}

const now = Date.now()
const minutesAgo = (m) => new Date(now - m * 60_000).toISOString()

const h = (id, name, lat, lon, groundStation, sensors, lastSeenMin) => ({
  id,
  name,
  lat,
  lon,
  groundStation,
  sensors: { heartRateValid: true, ...sensors },
  lastSeen: minutesAgo(lastSeenMin),
})

const N = { heartRate: 82, spO2: 98, temperature: 36.8, humidity: 45, light: 18000 }
const W_HR = { heartRate: 152, spO2: 96, temperature: 37.4, humidity: 55, light: 14000 }
const W_SPO2 = { heartRate: 108, spO2: 93, temperature: 37.1, humidity: 60, light: 9000 }
const W_TEMP = { heartRate: 118, spO2: 97, temperature: 38.4, humidity: 40, light: 22000 }
const C_HR = { heartRate: 178, spO2: 91, temperature: 38.6, humidity: 70, light: 8000 }
const C_SPO2 = { heartRate: 132, spO2: 88, temperature: 37.2, humidity: 65, light: 12000 }
const C_TEMP = { heartRate: 140, spO2: 94, temperature: 39.8, humidity: 80, light: 25000 }

export const SEED_HIKERS = [
  // Austin — LIVE hiker (ID 1)
  h(1,  'Avery Quinn',    30.2849,  -97.7341,  'GS-01', N, 1),

  // Southeast
  h(2,  'Noah Chen',      33.7490,  -84.3880,  'GS-02', N, 3),        // Atlanta, GA
  h(3,  'Mia Patel',      25.7617,  -80.1918,  'GS-02', N, 5),        // Miami, FL
  h(4,  'Liam Garcia',    35.2271,  -80.8431,  'GS-02', W_HR, 4),     // Charlotte, NC
  h(5,  'Zoe Nguyen',     36.1627,  -86.7816,  'GS-02', N, 7),        // Nashville, TN
  h(6,  'Ethan Brooks',   29.9511,  -90.0715,  'GS-02', N, 2),        // New Orleans, LA

  // Northeast
  h(7,  'Isla Rivera',    40.7128,  -74.0060,  'GS-03', C_HR, 1),     // New York, NY
  h(8,  'Kai Thompson',   42.3601,  -71.0589,  'GS-03', N, 6),        // Boston, MA
  h(9,  'Harper Lee',     39.9526,  -75.1652,  'GS-03', W_SPO2, 3),   // Philadelphia, PA
  h(10, 'Owen Walker',    38.9072,  -77.0369,  'GS-03', N, 2),        // Washington, DC

  // Midwest
  h(11, 'Sofia Reyes',    41.8781,  -87.6298,  'GS-04', N, 8),        // Chicago, IL
  h(12, 'Jaxon Hill',     44.9778,  -93.2650,  'GS-04', W_TEMP, 5),   // Minneapolis, MN
  h(13, 'Luna Morales',   39.7684,  -86.1581,  'GS-04', N, 6),        // Indianapolis, IN
  h(14, 'Eli Ward',       41.4993,  -81.6944,  'GS-04', N, 9),        // Cleveland, OH
  h(15, 'Aria Cooper',    38.2527,  -85.7585,  'GS-04', N, 4),        // Louisville, KY

  // Great Plains
  h(16, 'Mason Kim',      39.0997,  -94.5786,  'GS-05', N, 3),        // Kansas City, MO
  h(17, 'Layla Brooks',   41.2565,  -95.9345,  'GS-05', N, 6),        // Omaha, NE
  h(18, 'Finn Rodriguez', 43.5460,  -96.7313,  'GS-05', W_HR, 4),     // Sioux Falls, SD
  h(19, 'Nora Bennett',   46.8772,  -96.7898,  'GS-05', N, 2),        // Fargo, ND
  h(20, 'Leo Carter',     35.4676,  -97.5164,  'GS-05', N, 7),        // Oklahoma City, OK

  // Mountain West
  h(21, 'Ruby Foster',    39.7392,  -104.9903, 'GS-06', N, 3),        // Denver, CO
  h(22, 'Jude Ellis',     40.7608,  -111.8910, 'GS-06', N, 5),        // Salt Lake City, UT
  h(23, 'Ivy Hayes',      46.8721,  -113.9940, 'GS-06', C_SPO2, 2),   // Missoula, MT
  h(24, 'Atlas Price',    43.6150,  -116.2023, 'GS-06', C_TEMP, 1),   // Boise, ID
  h(25, 'Maya Sullivan',  35.0844,  -106.6504, 'GS-06', N, 4),        // Albuquerque, NM

  // West Coast
  h(26, 'Silas Gray',     34.0522,  -118.2437, 'GS-07', N, 8),        // Los Angeles, CA
  h(27, 'Cora Quinn',     37.7749,  -122.4194, 'GS-07', W_SPO2, 3),   // San Francisco, CA
  h(28, 'Rowan Blake',    47.6062,  -122.3321, 'GS-07', N, 5),        // Seattle, WA
  h(29, 'Hazel Diaz',     45.5051,  -122.6750, 'GS-07', N, 7),        // Portland, OR

  // Alaska / Hawaii
  h(30, 'Theo Mendez',    61.2181,  -149.9003, 'GS-08', { ...N, heartRateValid: false }, 2), // Anchorage, AK
]

export function hikersToDots(hikers, thresholds, sosHikerId = null, sosRecentHikerId = null, liveHikerId = null) {
  return hikers.map((hiker) => {
    const sos = hiker.id === sosHikerId
    let status
    if (sos) {
      status = 'critical'
    } else if (hiker.id === sosRecentHikerId) {
      status = 'warning'
    } else if (hiker.id === liveHikerId) {
      // Demo: live hiker stays green unless SOS has escalated them.
      status = 'normal'
    } else {
      status = deriveStatus(hiker.sensors, thresholds)
    }
    return {
      ...hiker,
      status,
      sos,
      color: STATUS_COLORS[status],
      size: 0.015,
      label: hiker.name,
    }
  })
}
