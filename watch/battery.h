#pragma once

#include "display.h"   // for BattData struct
#include <stdint.h>

// ── Hardware / calibration constants ─────────────────────────────
/** Analog pin connected to the voltage divider mid-point */
#define BATT_PIN      A1
/** ADC full-scale value (12-bit resolution) */
#define BATT_ADC_MAX  4095.0f
/** MCU reference voltage (volts) */
#define BATT_VREF        3.3f
/** Upper resistor of the voltage divider (ohms) */
#define BATT_R1     100000.0f
/** Lower resistor of the voltage divider (ohms) */
#define BATT_R2     100000.0f
/** Battery voltage at 0 % */
#define BATT_V_MIN       3.1f
/** Battery voltage at 100 % */
#define BATT_V_MAX       3.5f

// ── Public API ────────────────────────────────────────────────────

/**
 * @brief Read the battery voltage and update BattData.
 *        Averages `samples` ADC readings to reduce noise.
 *        Call once in setup() and then on a slow timer (e.g. every 30 s).
 *
 * @param batt     BattData struct — percentage is updated.
 * @param samples  Number of ADC samples to average (default: 64).
 */
void battery_update(BattData &batt, int samples = 64);
