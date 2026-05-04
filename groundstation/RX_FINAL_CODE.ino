#include <Arduino.h>
#include <SPI.h>
#include <RF24.h>

#include "receiver_config.h"
#include "display_rx.h"
#include "wifi_uplink.h"

static SPIClass      s_hspi(HSPI);
static RF24          s_radio(NRF_CE_PIN, NRF_CSN_PIN);
static bool          s_radioOK        = false;
static bool          s_gotFirstPacket = false;
static uint32_t      s_lastRxMs       = 0;
static VitalsPayload s_pkt            = {};

static const byte s_address[6] = NRF_ADDRESS;

/** How often to remind on Serial that no RF ⇒ no HTTP uplink (ms). */
static const uint32_t RF_DEBUG_INTERVAL_MS = 8000;

void setup() {
  Serial.begin(115200);

  display_init();

  s_hspi.begin(NRF_SCK_PIN, NRF_MISO_PIN, NRF_MOSI_PIN, NRF_CSN_PIN);

  if (!s_radio.begin(&s_hspi)) {
    Serial.println(F("nRF24L01 not found"));
    display_no_signal();
    return;
  }

  s_radio.openReadingPipe(1, s_address);
  s_radio.setPALevel(NRF_PA_LEVEL);
  s_radio.setDataRate(NRF_DATA_RATE);
  s_radio.startListening();
  s_radioOK = true;

  s_pkt.validHR   = false;
  s_pkt.validSPO2 = false;
  s_pkt.gpsFix    = false;
  s_pkt.type      = PKT_TYPE_VITALS;
  s_pkt.battPct   = 0;

  Serial.println(F("nRF24L01 OK - listening"));

  wifi_uplink_init();
}

void loop() {
  if (!s_radioOK) {
    display_no_signal();
    display_tick();
    delay(500);
    return;
  }

  if (s_radio.available()) {
    s_radio.read(&s_pkt, sizeof(s_pkt));
    s_lastRxMs       = millis();
    s_gotFirstPacket = true;

    wifi_uplink_send(s_pkt);

    Serial.print(F("RX type="));
    Serial.print(s_pkt.type);
    Serial.print(F(" BPM="));
    Serial.print(s_pkt.bpm);
    Serial.print(F(" SpO2="));
    Serial.print(s_pkt.spo2);
    Serial.print(F(" T="));
    Serial.print(s_pkt.temp, 1);
    Serial.print(F(" H="));
    Serial.print(s_pkt.humid, 1);
    Serial.print(F(" Batt="));
    Serial.print(s_pkt.battPct);
    Serial.print(F(" GPS="));
    Serial.print(s_pkt.gpsFix ? "fix" : "none");
    if (s_pkt.gpsFix) {
      Serial.print(F(" Lat="));
      Serial.print(s_pkt.lat, 4);
      Serial.print(F(" Lon="));
      Serial.print(s_pkt.lon, 4);
      Serial.print(F(" Alt="));
      Serial.print(s_pkt.alt, 1);
    }
    Serial.println();
  }

  static uint32_t s_lastRfDebugMs = 0;
  if (millis() - s_lastRfDebugMs >= RF_DEBUG_INTERVAL_MS) {
    s_lastRfDebugMs = millis();
    if (!s_gotFirstPacket) {
      Serial.println(
        F("[rx] No RF packets yet — transmitter/watch may be off, out of range, or "
          "pipe/config mismatch. wifi_uplink_send() is never called; server gets no data."));
    } else if (millis() - s_lastRxMs > 5000) {
      uint32_t silentSec = (millis() - s_lastRxMs) / 1000;
      Serial.print(F("[rx] No RF for "));
      Serial.print(silentSec);
      Serial.println(
        F(" s (link lost or wearable off). Uplink throttles/resumes only when packets return."));
    }
  }

  static uint32_t s_lastDraw = 0;
  if (millis() - s_lastDraw >= 50) {
    s_lastDraw = millis();
    bool stale = s_gotFirstPacket && (millis() - s_lastRxMs > 5000);
    if (stale) {
      display_no_signal();
    } else {
      display_update(s_pkt, s_radioOK, s_lastRxMs);
    }
  }

  display_tick();
}
