#pragma once

#include <Adafruit_SHT4x.h>
#include <RTClib.h>
#include "display.h"   // for EnvData struct

// ── Public API ────────────────────────────────────────────────────

/**
 * @brief Initialise SHT40 and PCF8563 RTC on the shared I2C bus.
 *        Call once from setup() AFTER Wire.begin().
 *
 * @param env   EnvData struct — sensorOK and rtcOK are set here.
 * @param sht4  Reference to the Adafruit_SHT4x driver instance.
 * @param rtc   Reference to the RTC_PCF8563 driver instance.
 */
void envSensor_init(EnvData &env, Adafruit_SHT4x &sht4, RTC_PCF8563 &rtc);

/**
 * @brief Read temperature and humidity from the SHT40.
 *        Should be called on a slow timer (e.g. every 5 s).
 *
 * @param env   EnvData struct — temp, humid and sensorOK are updated.
 * @param sht4  Reference to the Adafruit_SHT4x driver instance.
 */
void envSensor_read(EnvData &env, Adafruit_SHT4x &sht4);
