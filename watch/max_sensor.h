#pragma once

#include <MAX30105.h>
#include "display.h"   // for BioData struct
#include <stdint.h>

// ── Tuning constants ──────────────────────────────────────────────
/** Number of samples collected per SpO2 calculation pass */
#define MAX_BUFFER_LENGTH      100
/** IR count below which the finger is considered absent */
#define MAX_IR_THRESHOLD     50000L
/** How often (ms) the SpO2 algorithm re-runs while a finger is present */
#define MAX_SPO2_INTERVAL_MS  5000UL
/** Rolling-average window for BPM (must be a power-of-2 for the % trick) */
#define MAX_RATE_SIZE            8

// ── Public API ────────────────────────────────────────────────────

/**
 * @brief Initialise the MAX30102 on the shared I2C bus.
 *        Call once from setup() AFTER Wire.begin().
 *
 * @param sensor  Reference to the MAX30105 driver instance.
 * @return true   if the sensor was found and configured successfully.
 */
bool maxSensor_init(MAX30105 &sensor);

/**
 * @brief Blocking collection + HR / SpO2 update — call every loop().
 *
 *   - Collects MAX_BUFFER_LENGTH samples (~250 ms at 400 sps).
 *   - Runs real-time beat detection on each sample as it arrives.
 *   - Re-runs the SpO2 algorithm every MAX_SPO2_INTERVAL_MS ms.
 *   - Handles finger-present / finger-removed transitions.
 *
 * @param sensor  Reference to the MAX30105 driver instance.
 * @param maxOK   Whether the sensor initialised successfully.
 * @param bio     BioData struct updated with bpm, spo2, validity flags,
 *                and fingerPresent.
 */
void maxSensor_poll(MAX30105 &sensor, bool maxOK, BioData &bio);
