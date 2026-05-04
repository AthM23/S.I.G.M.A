#include "nrf_radio.h"
#include <SPI.h>
#include <nRF24L01.h>
#include <Arduino.h>

// ── Internal state ────────────────────────────────────────────────
static RF24     s_radio(NRF_CE_PIN, NRF_CSN_PIN);
static bool     s_radioOK = false;
static uint32_t s_lastTx  = 0;

static const byte s_address[6] = NRF_ADDRESS;

// ─────────────────────────────────────────────────────────────────
//  Initialisation
// ─────────────────────────────────────────────────────────────────
bool nrf_init() {
  if (!s_radio.begin()) {
    Serial.println(F("NRF24L01 not found"));
    return false;
  }

  s_radio.openWritingPipe(s_address);
  s_radio.setPALevel(NRF_PA_LEVEL);
  s_radio.setDataRate(NRF_DATA_RATE);
  s_radio.stopListening();

  s_radioOK = true;
  Serial.println(F("NRF24L01 OK"));
  return true;
}

// ─────────────────────────────────────────────────────────────────
//  Periodic transmit
// ─────────────────────────────────────────────────────────────────
void nrf_poll(const BioData  &bio,
              const EnvData  &env,
              const BattData &batt,
              const GPSData  &gps)
{
  if (!s_radioOK) return;

  uint32_t now = millis();
  if (now - s_lastTx < NRF_TX_INTERVAL_MS) return;
  s_lastTx = now;

  VitalsPayload pkt;
  memset(&pkt, 0, sizeof(pkt));

  pkt.bpm           = (int16_t)bio.bpm;
  pkt.spo2          = (int16_t)bio.spo2;
  pkt.validHR       = bio.validHR;
  pkt.validSPO2     = bio.validSPO2;
  pkt.fingerPresent = bio.fingerPresent;
  pkt.temp          = env.temp;
  pkt.humid         = env.humid;
  pkt.battPct       = batt.percentage;
  pkt.lat           = gps.lat;
  pkt.lon           = gps.lon;
  pkt.alt           = gps.alt;
  pkt.gpsFix        = (gps.lastUpdatedMs != 0);   // false until first valid fix

  bool ok = s_radio.write(&pkt, sizeof(pkt));

  Serial.print(F("NRF TX ")); Serial.print(ok ? F("OK") : F("FAIL"));
  Serial.print(F("  BPM="));  Serial.print(pkt.bpm);
  Serial.print(F("  SpO2=")); Serial.print(pkt.spo2);
  Serial.print(F("  T="));    Serial.print(pkt.temp,  1);
  Serial.print(F("  H="));    Serial.print(pkt.humid, 1);
  Serial.print(F("  Batt=")); Serial.print(pkt.battPct, 0);
  Serial.print(F("  GPS="));  Serial.print(pkt.gpsFix ? F("fix") : F("none"));
  if (pkt.gpsFix) {
    Serial.print(F("  lat=")); Serial.print(pkt.lat, 5);
    Serial.print(F("  lon=")); Serial.print(pkt.lon, 5);
    Serial.print(F("  alt=")); Serial.print(pkt.alt, 1);
  }
  Serial.println();
}