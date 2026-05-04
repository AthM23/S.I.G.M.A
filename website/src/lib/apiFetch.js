/** Headers that avoid ngrok free-tier HTML interstitials on programmatic requests. */
const NGROK_HEADERS = { 'ngrok-skip-browser-warning': '69420' }

export function apiFetch(url, options = {}) {
  const headers = new Headers(options.headers ?? {})
  for (const [k, v] of Object.entries(NGROK_HEADERS)) {
    if (!headers.has(k)) headers.set(k, v)
  }
  return fetch(url, { ...options, headers })
}
