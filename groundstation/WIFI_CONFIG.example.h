// Copy this file to WIFI_CONFIG.h and fill in your values.
// WIFI_CONFIG.h is gitignored — never commit real credentials.
#pragma once

// Phone hotspot credentials (laptop must also be connected to this hotspot).
#define WIFI_SSID               "your-hotspot-ssid"
#define WIFI_PASS               "your-hotspot-password"

// Laptop's IPv4 on the hotspot LAN — run `ipconfig` on the laptop after it
// connects to the hotspot, look under the Wi-Fi adapter for "IPv4 Address".
// Typical ranges:
//   iPhone hotspot         172.20.10.X
//   Android hotspot        192.168.43.X
//   Windows Mobile Hotspot 192.168.137.X
// Plain HTTP (no TLS) — far more reliable on ESP32 than HTTPS on a trusted
// LAN. wifi_uplink.h auto-detects http:// vs https:// so you can still
// point this at an ngrok https URL if you ever need to.
#define SIGMA_SERVER_URL        "http://192.168.43.100:3001"

// Must match the API_KEY set in server/.env
#define SIGMA_API_KEY           "sigma-demo-key"

// How often to POST a reading (ms). Display refresh is unaffected.
#define SIGMA_INGEST_INTERVAL_MS 5000
