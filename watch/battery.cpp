#include "battery.h"
#include <Arduino.h>

// ─────────────────────────────────────────────────────────────────
//  Internal helpers
// ─────────────────────────────────────────────────────────────────

/**
 * @brief Read the raw ADC pin and compute the actual battery voltage,
 *        accounting for the voltage-divider ratio.
 */
static float readVoltage(int samples) {
  long sum = 0;
  for (int i = 0; i < samples; i++) {
    sum += analogRead(BATT_PIN);
  }
  float avg  = (float)sum / samples;
  float vPin = (avg / BATT_ADC_MAX) * BATT_VREF;

  // Un-divide: V_batt = V_pin * (R1 + R2) / R2
  return vPin * ((BATT_R1 + BATT_R2) / BATT_R2);
}

/**
 * @brief Linear mapping from voltage to 0–100 %.
 */
static float voltsToPercent(float v) {
  if (v >= BATT_V_MAX) return 100.0f;
  if (v <= BATT_V_MIN) return   0.0f;
  return (v - BATT_V_MIN) / (BATT_V_MAX - BATT_V_MIN) * 100.0f;
}

// ─────────────────────────────────────────────────────────────────
//  Public
// ─────────────────────────────────────────────────────────────────
void battery_update(BattData &batt, int samples) {
  batt.percentage = voltsToPercent(readVoltage(samples));
}
