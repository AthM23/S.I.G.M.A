#pragma once

#include <RF24.h>
#include "display.h"   // for BioData, EnvData, BattData, GPSData structs

// ── Hardware config ───────────────────────────────────────────────
#define NRF_CE_PIN   2    // D2 → GPIO2
#define NRF_CSN_PIN  21   // D3 → GPIO21

// ── Radio config ──────────────────────────────────────────────────
#define NRF_ADDRESS          "98324"
#define NRF_PA_LEVEL         RF24_PA_MIN
#define NRF_DATA_RATE        RF24_2MBPS
#define NRF_TX_INTERVAL_MS   2000UL

// ── Payload ───────────────────────────────────────────────────────
/**
 * Packed vitals + GPS payload transmitted over the air.
 * NRF24L01 supports up to 32 bytes per packet — this uses all 32.
 *
 * Byte map:
 *   [0-1]   bpm           int16_t   2 bytes
 *   [2-3]   spo2          int16_t   2 bytes
 *   [4-7]   temp          float     4 bytes
 *   [8-11]  humid         float     4 bytes
 *   [12-15] battPct       float     4 bytes
 *   [16-19] lat           float     4 bytes
 *   [20-23] lon           float     4 bytes
 *   [24-27] alt           float     4 bytes
 *   [28]    validHR       bool      1 byte
 *   [29]    validSPO2     bool      1 byte
 *   [30]    fingerPresent bool      1 byte
 *   [31]    gpsFix        bool      1 byte  (true = lastUpdatedMs != 0)
 *                                  ────────
 *                                  32 bytes total
 */
struct VitalsPayload {
  int16_t  bpm;             // 2
  int16_t  spo2;            // 2
  float    temp;            // 4
  float    humid;           // 4
  float    battPct;         // 4
  float    lat;             // 4
  float    lon;             // 4
  float    alt;             // 4
  bool     validHR;         // 1
  bool     validSPO2;       // 1
  bool     fingerPresent;   // 1
  bool     gpsFix;          // 1  — receiver can check this before trusting lat/lon/alt
};
static_assert(sizeof(VitalsPayload) == 32, "VitalsPayload must be exactly 32 bytes");

// ── Public API ────────────────────────────────────────────────────

/**
 * @brief Initialise the NRF24L01 over SPI. Call once from setup().
 * @return true if the radio was found and configured.
 */
bool nrf_init();

/**
 * @brief Transmit a vitals + GPS packet if NRF_TX_INTERVAL_MS has elapsed.
 *        Non-blocking — checks millis() internally. Call every loop().
 */
void nrf_poll(const BioData  &bio,
              const EnvData  &env,
              const BattData &batt,
              const GPSData  &gps);