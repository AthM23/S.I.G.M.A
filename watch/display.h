#pragma once

#include <Adafruit_SSD1306.h>
#include <RTClib.h>
#include <stdint.h>

#define NUM_SCREENS 3

struct EnvData {
  float temp;
  float humid;
  bool  sensorOK;
  bool  rtcOK;
};

struct GPSData {
  float    lat;
  float    lon;
  float    alt;
  /** millis() timestamp of the last valid fix — tracked internally, not displayed */
  uint32_t lastUpdatedMs;
};

struct BioData {
  int32_t bpm;
  int32_t spo2;
  bool    validHR;
  bool    validSPO2;
  bool    fingerPresent;
};

struct BattData {
  float percentage;
};

// ── Display functions ─────────────────────────────────────────────
void display_init           (Adafruit_SSD1306 &disp);
void display_drawSplash     (Adafruit_SSD1306 &disp);
void display_flashTransition(Adafruit_SSD1306 &disp);

void display_drawScreenMain (Adafruit_SSD1306 &disp, EnvData  &env,
                              BattData &batt, uint8_t cur, RTC_PCF8563 &rtc);
void display_drawScreenBio  (Adafruit_SSD1306 &disp, BioData  &bio,
                              BattData &batt, uint8_t cur);
void display_drawScreenGPS  (Adafruit_SSD1306 &disp, GPSData  &gps,
                              BattData &batt, uint8_t cur);