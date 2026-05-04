#pragma once

#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <stdint.h>

// ── Tuning constants ──────────────────────────────────────────────
/** m/s² magnitude that counts as a shake */
#define SHAKE_THRESHOLD      11.0f
/** Number of threshold crossings needed before advancing the screen */
#define SHAKE_COUNT_NEEDED    2
/** Minimum ms between successive screen advances */
#define SHAKE_COOLDOWN_MS  1000UL
/** How often (ms) the IMU is polled — runs independently of other timers */
#define SHAKE_POLL_MS        20UL

// ── Public API ────────────────────────────────────────────────────

/**
 * @brief Initialise the MPU6050 on the shared I2C bus.
 *        Call once from setup() AFTER Wire.begin().
 *
 * @param mpu    Reference to the Adafruit_MPU6050 driver instance.
 * @return true  if the sensor was found and configured successfully.
 */
bool imu_init(Adafruit_MPU6050 &mpu);

/**
 * @brief Non-blocking shake poll — call every loop() iteration.
 *        Advances `currentScreen` by 1 (wrapping) when a shake is detected
 *        and sets `screenChanged` to true so the display layer can react.
 *
 * @param mpu            Reference to the Adafruit_MPU6050 driver instance.
 * @param imuOK          Whether the sensor initialised successfully.
 * @param currentScreen  In/out — incremented on a confirmed shake.
 * @param numScreens     Total number of screens (used for wrap-around).
 * @param screenChanged  Out — set to true when the screen index changes.
 */
void imu_pollShake(Adafruit_MPU6050 &mpu,
                   bool     imuOK,
                   uint8_t &currentScreen,
                   uint8_t  numScreens,
                   bool    &screenChanged);
