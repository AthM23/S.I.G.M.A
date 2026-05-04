#include "gps_sensor.h"
#include <Arduino.h>

// ── Internal state ────────────────────────────────────────────────
static TinyGPSPlus s_gps;

// ─────────────────────────────────────────────────────────────────
//  Initialisation
// ─────────────────────────────────────────────────────────────────
void gps_init() {
  // RX = GPS_RX_PIN, TX = GPS_TX_PIN (-1 = unused)
  GPS_SERIAL.begin(GPS_BAUD, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  Serial.println(F("NEO-6M GPS UART started (GPIO0 RX)"));
}

// ─────────────────────────────────────────────────────────────────
//  Poll — call every loop()
// ─────────────────────────────────────────────────────────────────
void gps_poll(GPSData &gpsData) {
  // Drain all bytes currently in the UART FIFO
  while (GPS_SERIAL.available()) {
    char c = GPS_SERIAL.read();
    s_gps.encode(c);
  }

  // Only update the struct when a brand-new valid fix has been parsed
  if (s_gps.location.isUpdated() && s_gps.location.isValid()) {
    gpsData.lat           = (float)s_gps.location.lat();
    gpsData.lon           = (float)s_gps.location.lng();
    gpsData.lastUpdatedMs = millis();
  }

  if (s_gps.altitude.isUpdated() && s_gps.altitude.isValid()) {
    gpsData.alt = (float)s_gps.altitude.meters();
  }
}