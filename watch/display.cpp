#include "display.h"
#include <Adafruit_GFX.h>

#define SCREEN_W 128
#define SCREEN_H  64

static void printPad2(Adafruit_SSD1306 &d, uint8_t n) {
  if (n < 10) d.print('0');
  d.print(n);
}

static void drawIndicator(Adafruit_SSD1306 &d, uint8_t cur) {
  int16_t sx = SCREEN_W / 2 - (NUM_SCREENS * 7) / 2;
  for (uint8_t i = 0; i < NUM_SCREENS; i++) {
    int16_t x = sx + i * 7;
    if (i == cur) d.fillRect(x, 61, 5, 3, SSD1306_WHITE);
    else           d.drawRect(x, 61, 5, 3, SSD1306_WHITE);
  }
}

static void drawBattery(Adafruit_SSD1306 &d, BattData &b) {
  d.setTextSize(1);
  d.setCursor(80, 57);
  char buf[6];
  snprintf(buf, sizeof(buf), "%3.0f%%", b.percentage);
  d.print(buf);
  d.drawRect(110, 57, 14, 7, SSD1306_WHITE);
  d.fillRect(124, 59,  2, 3, SSD1306_WHITE);
  uint8_t fw = (uint8_t)(12.0f * constrain(b.percentage, 0.0f, 100.0f) / 100.0f);
  if (fw > 0) d.fillRect(111, 58, fw, 5, SSD1306_WHITE);
}

// ── Public ────────────────────────────────────────────────────────

void display_init(Adafruit_SSD1306 &d) {
  d.clearDisplay();
  d.setTextColor(SSD1306_WHITE);
  d.display();
}

void display_drawSplash(Adafruit_SSD1306 &d) {
  d.clearDisplay();
  d.setTextSize(2); d.setCursor(4, 4);   d.print(F("BIO TRACK"));
  d.setTextSize(1); d.setCursor(10, 28); d.print(F("XIAO ESP32-C6"));
  d.setCursor(0, 38); d.print(F("SHT40 RTC MPU MAX30102"));
  d.setCursor(16, 50); d.print(F("shake to switch >>"));
  d.display();
}

void display_flashTransition(Adafruit_SSD1306 &d) {
  d.invertDisplay(true);
  delay(60);
  d.invertDisplay(false);
}

// ── Screen 1: Clock + Env ─────────────────────────────────────────
void display_drawScreenMain(Adafruit_SSD1306 &d, EnvData &env,
                             BattData &batt, uint8_t cur, RTC_PCF8563 &rtc) {
  DateTime now = env.rtcOK ? rtc.now() : DateTime(2000,1,1,0,0,0);

  d.setTextSize(2); d.setCursor(0, 0);
  printPad2(d, now.hour()); d.print(':'); printPad2(d, now.minute());

  static const char* DOW[] = {"SUN","MON","TUE","WED","THU","FRI","SAT"};
  static const char* MON[] = {"JAN","FEB","MAR","APR","MAY","JUN",
                               "JUL","AUG","SEP","OCT","NOV","DEC"};
  d.setTextSize(1);
  d.setCursor(82,  1); d.print(DOW[now.dayOfTheWeek()]);
  d.setCursor(82, 11); printPad2(d, now.day());
  d.print(' '); d.print(MON[now.month()-1]);

  if (now.second() % 2 == 0) d.fillCircle(124, 6, 2, SSD1306_WHITE);
  else                         d.drawCircle(124, 6, 2, SSD1306_WHITE);

  d.drawFastHLine(0, 23, SCREEN_W, SSD1306_WHITE);

  d.setTextSize(1); d.setCursor(0,  26); d.print(F("TEMP"));
  d.setTextSize(2); d.setCursor(0,  35);
  if (env.sensorOK) { char b[8]; dtostrf(env.temp,  4, 1, b); d.print(b); }
  else                d.print(F("--.-"));
  d.setTextSize(1); d.print('c');

  d.setTextSize(1); d.setCursor(72, 26); d.print(F("HUMID"));
  d.setTextSize(2); d.setCursor(72, 35);
  if (env.sensorOK) { char b[8]; dtostrf(env.humid, 4, 1, b); d.print(b); }
  else                d.print(F("--.-"));
  d.setTextSize(1); d.print('%');

  d.drawFastHLine(0, 55, SCREEN_W, SSD1306_WHITE);
  drawBattery(d, batt);
  drawIndicator(d, cur);
}

// ── Screen 2: HR + SpO2 ───────────────────────────────────────────
void display_drawScreenBio(Adafruit_SSD1306 &d, BioData &bio,
                            BattData &batt, uint8_t cur) {
  d.setTextSize(1);
  d.setCursor(0, 0); d.print(F("HEART RATE & SpO2"));
  d.drawFastHLine(0, 10, SCREEN_W, SSD1306_WHITE);

  if (!bio.fingerPresent) {
    d.setCursor(10, 22); d.print(F("Place finger"));
    d.setCursor(16, 32); d.print(F("on sensor"));
    d.setCursor(0,  44); d.print(F("MAX30102 waiting..."));
  } else {
    d.setCursor(0, 13); d.print(F("BPM"));
    d.setTextSize(2); d.setCursor(0, 22);
    if (bio.validHR && bio.bpm > 20 && bio.bpm < 220)
      d.print(bio.bpm);
    else
      d.print(F("--"));

    d.setTextSize(1); d.setCursor(72, 13); d.print(F("SpO2"));
    d.setTextSize(2); d.setCursor(72, 22);
    if (bio.validSPO2 && bio.spo2 >= 80 && bio.spo2 <= 100) {
      d.print(bio.spo2); d.setTextSize(1); d.print('%');
    } else {
      d.print(F("--"));
    }

    d.setTextSize(1); d.setCursor(0, 44);
    if      (bio.validSPO2 && bio.spo2 < 95)   d.print(F("!! SpO2 LOW"));
    else if (bio.validHR   && bio.bpm > 100)    d.print(F("!! HR ELEVATED"));
    else if (bio.validHR   && bio.bpm < 50)     d.print(F("!! HR LOW"));
    else                                         d.print(F("Reading OK"));
  }

  d.drawFastHLine(0, 55, SCREEN_W, SSD1306_WHITE);
  drawBattery(d, batt);
  drawIndicator(d, cur);
}

// ── Screen 3: GPS ─────────────────────────────────────────────────
void display_drawScreenGPS(Adafruit_SSD1306 &d, GPSData &gps,
                            BattData &batt, uint8_t cur) {
  d.setTextSize(1);
  d.setCursor(0, 0); d.print(F("GPS POSITION"));
  d.drawFastHLine(0, 10, SCREEN_W, SSD1306_WHITE);

  // A fix is considered valid if lastUpdatedMs is non-zero
  bool hasFix = (gps.lastUpdatedMs != 0);

  if (!hasFix) {
    // ── No fix yet ──────────────────────────────────────────────
    d.setCursor(16, 20); d.print(F("Waiting for fix"));
    d.setCursor(22, 32); d.print(F("NEO-6M..."));
  } else {
    // ── Live coordinates ────────────────────────────────────────
    d.setCursor(0, 14); d.print(F("LAT")); d.setCursor(28, 14);
    char latBuf[12]; dtostrf(gps.lat, 9, 5, latBuf); d.print(latBuf);
    d.print(gps.lat >= 0 ? 'N' : 'S');

    d.setCursor(0, 26); d.print(F("LON")); d.setCursor(28, 26);
    char lonBuf[12]; dtostrf(gps.lon, 9, 5, lonBuf); d.print(lonBuf);
    d.print(gps.lon >= 0 ? 'E' : 'W');

    d.setCursor(0, 38); d.print(F("ALT")); d.setCursor(28, 38);
    char altBuf[8]; dtostrf(gps.alt, 6, 1, altBuf); d.print(altBuf);
    d.print(F("m"));
  }

  d.drawFastHLine(0, 55, SCREEN_W, SSD1306_WHITE);
  drawBattery(d, batt);
  drawIndicator(d, cur);
}