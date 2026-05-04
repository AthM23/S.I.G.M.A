// ═══════════════════════════════════════════════════════════════════
//  FINAL_CODE.ino  —  Bio + Environment Tracker
//  Target : Seeed XIAO ESP32-C6
//
//  I2C map:
//    SSD1306  OLED     0x3C
//    SHT40    Temp/RH  0x44
//    PCF8563  RTC      0x51
//    MPU6050  IMU      0x68
//    MAX30102 HR/SpO2  0x57
//
//  UART:
//    NEO-6M GPS  TX → D0 (GPIO0)
//
//  SPI:
//    NRF24L01  CE → D2 (GPIO2)  CSN → D3 (GPIO21)
//
//  Shake the device to cycle through the three display screens.
// ═══════════════════════════════════════════════════════════════════

#include <Wire.h>
#include <SPI.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_SHT4x.h>
#include <RTClib.h>
#include <Adafruit_MPU6050.h>
#include <MAX30105.h>

#include "display.h"
#include "env_sensor.h"
#include "imu_sensor.h"
#include "max_sensor.h"
#include "battery.h"
#include "gps_sensor.h"
#include "nrf_radio.h"

// ── I2C pin assignment ────────────────────────────────────────────
#define I2C_SDA  22
#define I2C_SCL  23

// ── Display ───────────────────────────────────────────────────────
#define SCREEN_W    128
#define SCREEN_H     64
#define OLED_RESET   -1
#define OLED_ADDR  0x3C

// ── Polling intervals (milliseconds) ─────────────────────────────
#define SENSOR_INTERVAL_MS    5000UL
#define BATT_INTERVAL_MS     30000UL
#define DISPLAY_INTERVAL_MS    100UL

// ── Driver instances ──────────────────────────────────────────────
Adafruit_SSD1306 display(SCREEN_W, SCREEN_H, &Wire, OLED_RESET);
Adafruit_SHT4x   sht4;
RTC_PCF8563      rtc;
Adafruit_MPU6050 mpu;
MAX30105         particleSensor;

// ── Sensor-availability flags ────────────────────────────────────
bool imuOK = false;
bool maxOK = false;

// ── Shared data structs ───────────────────────────────────────────
EnvData  envData  = { 0.0f, 0.0f, false, false };
GPSData  gpsData  = { 0.0f, 0.0f, 0.0f, 0 };
BioData  bioData  = { 0, 0, false, false, false };
BattData battData = { 100.0f };

// ── Screen state ──────────────────────────────────────────────────
uint8_t currentScreen = 0;
bool    screenChanged = false;

// ── Timers ────────────────────────────────────────────────────────
uint32_t lastSensorRead  = 0;
uint32_t lastBattRead    = 0;
uint32_t lastDisplayDraw = 0;

// ─────────────────────────────────────────────────────────────────
//  setup()
// ─────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println(F("\n=== BIO TRACKER BOOT ==="));

  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  Wire.begin(I2C_SDA, I2C_SCL);
  Wire.setClock(100000);
  delay(100);

  // ── OLED ─────────────────────────────────────────────────────
  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) {
    Serial.println(F("FATAL: SSD1306 not found — halting"));
    while (true) delay(1000);
  }
  display_init(display);
  Serial.println(F("SSD1306 OK"));

  // ── Sensors ──────────────────────────────────────────────────
  envSensor_init(envData, sht4, rtc);
  imuOK = imu_init(mpu);
  delay(100);
  maxOK = maxSensor_init(particleSensor);
  gps_init();

  // ── NRF24L01 ─────────────────────────────────────────────────
  nrf_init();   // non-fatal if missing — nrf_poll() checks s_radioOK

  // ── Splash ───────────────────────────────────────────────────
  display_drawSplash(display);
  delay(2200);

  envSensor_read(envData, sht4);
  battery_update(battData);

  uint32_t t = millis();
  lastSensorRead = lastBattRead = lastDisplayDraw = t;

  Serial.println(F("=== BOOT COMPLETE ===\n"));
}

// ─────────────────────────────────────────────────────────────────
//  loop()
// ─────────────────────────────────────────────────────────────────
void loop() {
  uint32_t now = millis();

  // ── GPS ───────────────────────────────────────────────────────
  gps_poll(gpsData);

  // ── Shake ─────────────────────────────────────────────────────
  imu_pollShake(mpu, imuOK, currentScreen, NUM_SCREENS, screenChanged);

  // ── MAX30102 (blocking ~250 ms) ───────────────────────────────
  maxSensor_poll(particleSensor, maxOK, bioData);

  // Second shake poll to catch gestures during the blocking read
  imu_pollShake(mpu, imuOK, currentScreen, NUM_SCREENS, screenChanged);

  // ── SHT40 ────────────────────────────────────────────────────
  if (now - lastSensorRead >= SENSOR_INTERVAL_MS) {
    envSensor_read(envData, sht4);
    lastSensorRead = now;
  }

  // ── Battery ───────────────────────────────────────────────────
  if (now - lastBattRead >= BATT_INTERVAL_MS) {
    battery_update(battData);
    lastBattRead = now;
  }

  // ── NRF24L01 transmit ─────────────────────────────────────────
  nrf_poll(bioData, envData, battData, gpsData);

  // ── Display ───────────────────────────────────────────────────
  if (now - lastDisplayDraw >= DISPLAY_INTERVAL_MS) {
    lastDisplayDraw = now;

    if (screenChanged) {
      display_flashTransition(display);
      screenChanged = false;
    }

    display.clearDisplay();
    switch (currentScreen) {
      case 0: display_drawScreenMain(display, envData, battData, currentScreen, rtc); break;
      case 1: display_drawScreenBio (display, bioData, battData, currentScreen);      break;
      case 2: display_drawScreenGPS (display, gpsData, battData, currentScreen);      break;
    }
    display.display();
  }
}