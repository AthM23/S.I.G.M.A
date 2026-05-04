# Groundstation Hotspot LAN Setup

This replaces the old ngrok-based demo path with a simpler local-network setup. The
ground station and the laptop running the ingest server both join the same phone hotspot,
and the ESP32 posts directly to the laptop over plain HTTP.

## Topology

```text
Wearable watch (nRF24 telemetry)
        |
        v
Groundstation ESP32 --WiFi hotspot--> Laptop :3001 --> Dashboard
```

## Why this path is better for demos

- No tunnel URL churn
- No TLS handshake overhead on the ESP32
- No ngrok browser-warning headers
- Easier to debug with `curl` and serial logs

## Setup

1. Turn on the phone hotspot.
2. Connect the laptop to that hotspot.
3. Run `ipconfig` on the laptop and note the Wi-Fi adapter's IPv4 address.
4. Copy `groundstation/WIFI_CONFIG.example.h` to `groundstation/WIFI_CONFIG.h`.
5. Set `WIFI_SSID`, `WIFI_PASS`, and `SIGMA_SERVER_URL` to the hotspot values and laptop IP.
6. Start the ingest server on the laptop.
7. Flash the ground station and verify it can reach `http://<laptop-ip>:3001/api/ingest`.

Example config:

```c
#pragma once

#define WIFI_SSID               "YourHotspotName"
#define WIFI_PASS               "YourHotspotPassword"
#define SIGMA_SERVER_URL        "http://192.168.43.100:3001"
#define SIGMA_API_KEY           "sigma-demo-key"
#define SIGMA_INGEST_INTERVAL_MS 5000
```

## Server binding

The Express server should listen on `0.0.0.0`, not just localhost, so the ESP32 can reach
it over the hotspot LAN.

## Windows firewall

Hotspots are commonly treated as public networks on Windows, so inbound traffic to Node may
be blocked even when the server is running locally. If the ESP32 times out, allow TCP port
`3001` through Windows Defender Firewall.

## Quick checks

- `curl http://localhost:3001/health` works on the laptop
- `curl http://<laptop-ip>:3001/health` works from another device on the hotspot
- ESP32 serial output shows a successful Wi-Fi connection and `HTTP code=200`
- Dashboard polling against `/api/live` returns data after a packet is received
