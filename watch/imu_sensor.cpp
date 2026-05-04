#include "imu_sensor.h"
#include <Arduino.h>
#include <math.h>

// ── Internal state (file-scope) ───────────────────────────────────
static uint8_t  s_shakeCount   = 0;
static uint32_t s_lastShakeAdv = 0;   // millis() of last screen advance
static uint32_t s_lastPoll     = 0;   // millis() of last IMU read

// ─────────────────────────────────────────────────────────────────
//  Initialisation
// ─────────────────────────────────────────────────────────────────
bool imu_init(Adafruit_MPU6050 &mpu) {
  if (!mpu.begin()) {
    Serial.println(F("MPU6050 not found"));
    return false;
  }

  mpu.setAccelerometerRange(MPU6050_RANGE_4_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);

  Serial.println(F("MPU6050 OK"));
  return true;
}

// ─────────────────────────────────────────────────────────────────
//  Shake detection (non-blocking)
// ─────────────────────────────────────────────────────────────────
void imu_pollShake(Adafruit_MPU6050 &mpu,
                   bool     imuOK,
                   uint8_t &currentScreen,
                   uint8_t  numScreens,
                   bool    &screenChanged)
{
  if (!imuOK) return;

  uint32_t now = millis();
  if (now - s_lastPoll < SHAKE_POLL_MS) return;
  s_lastPoll = now;

  // Read accelerometer
  sensors_event_t accel, gyro, temp;
  mpu.getEvent(&accel, &gyro, &temp);

  float ax  = accel.acceleration.x;
  float ay  = accel.acceleration.y;
  float az  = accel.acceleration.z;
  float mag = sqrtf(ax * ax + ay * ay + az * az);

  // Still in cooldown — drain counter so stale peaks don't fire late
  if (now - s_lastShakeAdv < SHAKE_COOLDOWN_MS) {
    s_shakeCount = 0;
    return;
  }

  if (mag > SHAKE_THRESHOLD) {
    s_shakeCount++;

    if (s_shakeCount >= SHAKE_COUNT_NEEDED) {
      // Advance the screen
      currentScreen  = (currentScreen + 1) % numScreens;
      s_lastShakeAdv = now;
      s_shakeCount   = 0;
      screenChanged  = true;
    }
  } else {
    // Gentle decay: only subtract every other quiet sample so a real
    // shake is not cancelled by one low reading between peaks
    static uint8_t missCount = 0;
    if (++missCount >= 2) {
      missCount = 0;
      if (s_shakeCount > 0) s_shakeCount--;
    }
  }
}
