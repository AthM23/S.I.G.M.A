#pragma once

#include <TinyGPSPlus.h>
#include <HardwareSerial.h>
#include "display.h"   // for GPSData struct

// ── Hardware config ───────────────────────────────────────────────
/** UART RX pin — connected to NEO-6M TX */
#define GPS_RX_PIN     0    // D0 / GPIO0
/** UART TX pin — not connected, set to -1 to leave floating */
#define GPS_TX_PIN    -1
/** Baud rate of the NEO-6M (factory default) */
#define GPS_BAUD    9600
/** Which ESP32 HardwareSerial port to use (Serial1 leaves Serial free for debug) */
#define GPS_SERIAL  Serial1

// ── Public API ────────────────────────────────────────────────────

/**
 * @brief Initialise the UART and TinyGPSPlus parser.
 *        Call once from setup().
 */
void gps_init();

/**
 * @brief Feed all available UART bytes into the TinyGPSPlus parser.
 *        Call every loop() — non-blocking.
 *        Updates `gpsData` only when a new valid fix is received.
 *
 * @param gpsData  GPSData struct — lat, lon, alt and lastUpdatedMs are
 *                 written whenever a fresh fix arrives.
 */
void gps_poll(GPSData &gpsData);