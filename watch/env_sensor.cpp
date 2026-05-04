#include "env_sensor.h"
#include <Arduino.h>

// ─────────────────────────────────────────────────────────────────
//  Initialisation
// ─────────────────────────────────────────────────────────────────
void envSensor_init(EnvData &env, Adafruit_SHT4x &sht4, RTC_PCF8563 &rtc) {

  // ── SHT40 ──────────────────────────────────────────────────────
  if (sht4.begin()) {
    sht4.setPrecision(SHT4X_HIGH_PRECISION);
    sht4.setHeater(SHT4X_NO_HEATER);
    env.sensorOK = true;
    Serial.println(F("SHT40 OK"));
  } else {
    env.sensorOK = false;
    Serial.println(F("SHT40 not found"));
  }

  // ── PCF8563 RTC ────────────────────────────────────────────────
  if (rtc.begin()) {
    env.rtcOK = true;
    // If power was lost, set RTC to compile-time timestamp
    if (rtc.lostPower()) {
      rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
    }
    Serial.println(F("PCF8563 OK"));
  } else {
    env.rtcOK = false;
    Serial.println(F("PCF8563 not found"));
  }
}

// ─────────────────────────────────────────────────────────────────
//  Periodic read
// ─────────────────────────────────────────────────────────────────
void envSensor_read(EnvData &env, Adafruit_SHT4x &sht4) {
  sensors_event_t humidity, temp;

  if (sht4.getEvent(&humidity, &temp)) {
    env.temp     = temp.temperature;
    env.humid    = humidity.relative_humidity;
    env.sensorOK = true;
  } else {
    env.sensorOK = false;
    Serial.println(F("SHT40: read failed"));
  }
}
