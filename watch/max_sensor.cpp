#include "max_sensor.h"
#include <Arduino.h>
#include <spo2_algorithm.h>
#include <heartRate.h>

// ── Sample buffers (file-scope) ───────────────────────────────────
static uint32_t s_irBuffer [MAX_BUFFER_LENGTH];
static uint32_t s_redBuffer[MAX_BUFFER_LENGTH];

// ── SpO2 algorithm outputs ────────────────────────────────────────
static int32_t  s_spo2       = 0;
static int8_t   s_validSPO2  = 0;
static int32_t  s_hrAlgo     = 0;
static int8_t   s_validHR    = 0;

// ── Beat-detection rolling average ───────────────────────────────
static byte     s_rates[MAX_RATE_SIZE] = { 0 };
static byte     s_rateSpot = 0;
static long     s_lastBeat = 0;
static float    s_bpm      = 0.0f;
static int      s_avgBpm   = 0;

// ── Finger state ──────────────────────────────────────────────────
static bool     s_fingerPresent   = false;
static bool     s_fingerWasAbsent = true;
static uint32_t s_lastSpo2Calc    = 0;

// ─────────────────────────────────────────────────────────────────
//  Internal helpers
// ─────────────────────────────────────────────────────────────────

/** Update the rolling-average BPM when a beat is detected. */
static void updateBeatDetection(long irValue) {
  if (checkForBeat(irValue)) {
    long delta = millis() - s_lastBeat;
    s_lastBeat = millis();
    s_bpm      = 60.0f / (delta / 1000.0f);

    if (s_bpm >= 30 && s_bpm <= 200) {
      s_rates[s_rateSpot++] = (byte)s_bpm;
      s_rateSpot %= MAX_RATE_SIZE;

      int sum = 0;
      for (byte i = 0; i < MAX_RATE_SIZE; i++) sum += s_rates[i];
      s_avgBpm = sum / MAX_RATE_SIZE;
    }
  }
}

/** Reset all HR / SpO2 state when the finger is lifted. */
static void resetBioReadings(BioData &bio) {
  s_fingerPresent   = false;
  s_fingerWasAbsent = true;
  bio.fingerPresent = false;
  bio.validHR       = false;
  bio.validSPO2     = false;
  bio.bpm           = 0;
  bio.spo2          = 0;
  memset(s_rates, 0, sizeof(s_rates));
  s_rateSpot = 0;
  s_bpm      = 0.0f;
  s_avgBpm   = 0;
}

// ─────────────────────────────────────────────────────────────────
//  Initialisation
// ─────────────────────────────────────────────────────────────────
bool maxSensor_init(MAX30105 &sensor) {
  if (!sensor.begin(Wire, I2C_SPEED_STANDARD)) {
    Serial.println(F("MAX30102 not found"));
    return false;
  }

  // Settings match the original reference design:
  //   ledBrightness=0xFF, sampleAverage=4, ledMode=2 (red+IR),
  //   sampleRate=400, pulseWidth=411, adcRange=4096
  sensor.setup(0xFF, 4, 2, 400, 411, 4096);
  sensor.setPulseAmplitudeRed(0x1F);
  sensor.setPulseAmplitudeIR(0x1F);
  sensor.enableDIETEMPRDY();

  Serial.println(F("MAX30102 OK"));
  return true;
}

// ─────────────────────────────────────────────────────────────────
//  Main polling function (blocking ~250 ms)
// ─────────────────────────────────────────────────────────────────
void maxSensor_poll(MAX30105 &sensor, bool maxOK, BioData &bio) {
  if (!maxOK) return;

  // ── Collect MAX_BUFFER_LENGTH samples ─────────────────────────
  for (byte i = 0; i < MAX_BUFFER_LENGTH; i++) {
    uint32_t t = millis();

    // Wait for the FIFO to have data (with 3-second safety timeout)
    while (!sensor.available()) {
      sensor.check();
      if (millis() - t > 3000) {
        Serial.println(F("MAX30102: sample timeout"));
        return;
      }
    }

    s_redBuffer[i] = sensor.getRed();
    s_irBuffer[i]  = sensor.getIR();
    sensor.nextSample();

    // Run beat detection on every new IR sample
    updateBeatDetection(s_irBuffer[i]);
  }

  long irVal = s_irBuffer[MAX_BUFFER_LENGTH - 1];

  // ── Finger detection ──────────────────────────────────────────
  if (irVal < MAX_IR_THRESHOLD) {
    if (!s_fingerWasAbsent) {
      Serial.println(F("MAX30102: finger removed"));
      resetBioReadings(bio);
    }
    return;   // Nothing more to do without a finger
  }

  if (s_fingerWasAbsent) {
    Serial.println(F("MAX30102: finger detected"));
    s_fingerWasAbsent = false;
    s_fingerPresent   = true;
    s_lastSpo2Calc    = 0;   // Force an immediate SpO2 calculation
  }

  bio.fingerPresent = true;

  // ── Update BPM from beat detector ────────────────────────────
  if (s_avgBpm > 0) {
    bio.bpm     = s_avgBpm;
    bio.validHR = true;
  }

  // ── SpO2 recalculation on interval ───────────────────────────
  if (millis() - s_lastSpo2Calc >= MAX_SPO2_INTERVAL_MS) {
    maxim_heart_rate_and_oxygen_saturation(
      s_irBuffer, MAX_BUFFER_LENGTH, s_redBuffer,
      &s_spo2, &s_validSPO2, &s_hrAlgo, &s_validHR
    );
    s_lastSpo2Calc = millis();

    // Accept SpO2 only when the algorithm reports it as valid
    if (s_validSPO2 && s_spo2 >= 80 && s_spo2 <= 100) {
      bio.spo2      = s_spo2;
      bio.validSPO2 = true;
    }

    // Use algorithm HR as a fallback when beat-detect hasn't locked yet
    if (s_validHR && s_hrAlgo > 20 && s_hrAlgo < 220 && !bio.validHR) {
      bio.bpm     = s_hrAlgo;
      bio.validHR = true;
    }

    Serial.print(F("SpO2=")); Serial.print(s_spo2);
    Serial.print(F(" valid=")); Serial.print(s_validSPO2);
    Serial.print(F("  HR_algo=")); Serial.print(s_hrAlgo);
    Serial.print(F(" valid=")); Serial.print(s_validHR);
    Serial.print(F("  avgBpm=")); Serial.println(s_avgBpm);
  }
}
