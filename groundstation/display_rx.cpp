#include "display_rx.h"

#include <TFT_eSPI.h>

static TFT_eSPI tft = TFT_eSPI();

#define COL_BG      0x0841
#define COL_PANEL   0x1082
#define COL_BORDER  0x2945
#define COL_RED     0xE249
#define COL_BLUE    0x3C1F
#define COL_AMBER   0xEF44
#define COL_GREEN   0x0F53
#define COL_PURPLE  0x801F
#define COL_DIM     0x4228
#define COL_WHITE   TFT_WHITE

#define DIV_TOPHDR    18
#define DIV_BIGSPLIT  79
#define DIV_WAVE      114
#define DIV_ENV       145
#define DIV_GPS       170
#define DIV_SOS       203
#define DIV_BATT      224

#define BPM_VAL_X     4
#define BPM_VAL_Y     25
#define SPO2_VAL_X    170
#define SPO2_VAL_Y    25
#define PANEL_SPLIT   160

#define BPMSTATUS_X   8
#define BPMSTATUS_Y   62
#define BPMSTATUS_W   150

#define WAVE_X        4
#define WAVE_Y        82
#define WAVE_W        312
#define WAVE_H        30

#define TEMP_X        4
#define TEMP_Y        122
#define HUMID_X       170
#define HUMID_Y       122

#define GPS_X         4
#define GPS_Y         154

#define SOS_X         0
#define SOS_Y         171
#define SOS_W         320
#define SOS_H         32

#define BATT_LABEL_X  4
#define BATT_BAR_X    36
#define BATT_BAR_W    150
#define BATT_BAR_H    5
#define BATT_BAR_Y    213
#define BATT_PCT_X    192
#define BATT_RX_X     232

static int16_t  s_waveBuf[WAVE_W] = {};
static uint16_t s_waveIdx         = 0;
static float    s_wavePhase       = 0.0f;
static bool     s_waveActive      = false;
static bool     s_hadFinger       = false;

static bool     s_sosActive       = false;
static bool     s_sosFlashOn      = false;
static uint32_t s_sosLastFlash    = 0;

#define SOS_FLASH_MS  400

static float ecgSample(float t) {
  float mod = fmod(t, 1.0f);
  if (mod < 0.22f) return sinf(mod * 31.4f) * 0.07f;
  if (mod < 0.28f) return -0.30f * expf(-powf((mod - 0.25f) * 60.0f, 2));
  if (mod < 0.42f) return  1.00f * expf(-powf((mod - 0.30f) * 22.0f, 2));
  if (mod < 0.60f) return  0.15f * expf(-powf((mod - 0.50f) * 30.0f, 2));
  return 0.0f;
}

static void pushWaveSample(float bpm) {
  float speed = (bpm > 30.0f ? bpm : 70.0f) / 3600.0f;
  s_wavePhase += speed;
  int16_t y = (int16_t)(WAVE_H / 2 - ecgSample(s_wavePhase) * (WAVE_H * 0.80f));
  s_waveBuf[s_waveIdx] = constrain(y, 1, WAVE_H - 2);
  s_waveIdx = (s_waveIdx + 1) % WAVE_W;
}

static void clearWaveBuf() {
  int16_t mid = WAVE_H / 2;
  for (int i = 0; i < WAVE_W; i++) s_waveBuf[i] = mid;
  s_waveIdx    = 0;
  s_wavePhase  = 0.0f;
  s_waveActive = false;
}

static void drawWaveRegion(bool animate) {
  tft.fillRect(WAVE_X, WAVE_Y, WAVE_W, WAVE_H, COL_BG);
  if (!animate) return;
  for (int i = 1; i < WAVE_W; i++) {
    int ia = (s_waveIdx + i - 1) % WAVE_W;
    int ib = (s_waveIdx + i)     % WAVE_W;
    int y0 = constrain(WAVE_Y + s_waveBuf[ia], WAVE_Y + 1, WAVE_Y + WAVE_H - 2);
    int y1 = constrain(WAVE_Y + s_waveBuf[ib], WAVE_Y + 1, WAVE_Y + WAVE_H - 2);
    tft.drawLine(WAVE_X + i - 1, y0, WAVE_X + i, y1, COL_RED);
  }
}

static void drawBpmStatus(bool hasSignal, bool validHR) {
  tft.fillRect(BPMSTATUS_X, BPMSTATUS_Y, BPMSTATUS_W, 10, COL_BG);
  tft.drawFastVLine(PANEL_SPLIT, BPMSTATUS_Y, 10, COL_BORDER);

  tft.setTextSize(1);
  if (!hasSignal) {
    tft.setTextColor(COL_DIM, COL_BG);
    tft.setCursor(BPMSTATUS_X, BPMSTATUS_Y);
    tft.print("no connection");
  } else if (!validHR) {
    tft.setTextColor(COL_AMBER, COL_BG);
    tft.setCursor(BPMSTATUS_X, BPMSTATUS_Y);
    tft.print("acquiring...");
  }
}

static void drawSOSBanner(bool flashOn) {
  if (flashOn) {
    tft.fillRect(SOS_X, SOS_Y, SOS_W, SOS_H, COL_RED);
    tft.setTextColor(COL_WHITE, COL_RED);
  } else {
    tft.fillRect(SOS_X, SOS_Y, SOS_W, SOS_H, COL_BG);
    tft.setTextColor(COL_RED, COL_BG);
  }
  tft.setTextSize(2);
  tft.setCursor(SOS_X + 80, SOS_Y + 8);
  tft.print("!! SOS ALERT !!");
}

static void clearSOSBanner() {
  tft.fillRect(SOS_X, SOS_Y, SOS_W, SOS_H, COL_BG);
}

static void labelAt(int x, int y, const char *txt, uint16_t col = COL_DIM) {
  tft.setTextColor(col, COL_BG);
  tft.setTextSize(1);
  tft.setCursor(x, y);
  tft.print(txt);
}

static void bigVal(int x, int y, const char *txt, uint16_t col) {
  tft.setTextColor(col, COL_BG);
  tft.setTextSize(3);
  tft.setCursor(x, y);
  tft.print(txt);
}

static void medVal(int x, int y, const char *txt, uint16_t col) {
  tft.setTextColor(col, COL_BG);
  tft.setTextSize(2);
  tft.setCursor(x, y);
  tft.print(txt);
}

static void drawStatusDot(bool ok) {
  tft.fillCircle(312, 8, 5, ok ? COL_GREEN : COL_RED);
}

static void drawBattRow(uint8_t pct, uint32_t lastRxMs, bool gotPacket) {
  tft.fillRect(0, DIV_SOS + 1, 320, DIV_BATT - DIV_SOS - 1, COL_BG);

  tft.setTextColor(COL_DIM, COL_BG);
  tft.setTextSize(1);
  tft.setCursor(BATT_LABEL_X, BATT_BAR_Y);
  tft.print("BATT");

  tft.fillRoundRect(BATT_BAR_X, BATT_BAR_Y, BATT_BAR_W, BATT_BAR_H, 2, COL_PANEL);
  if (gotPacket && pct > 0) {
    int fill = (int)(BATT_BAR_W * constrain((int)pct, 0, 100) / 100);
    uint16_t col = pct > 50 ? COL_GREEN : pct > 20 ? COL_AMBER : COL_RED;
    tft.fillRoundRect(BATT_BAR_X, BATT_BAR_Y, fill, BATT_BAR_H, 2, col);
  }

  if (gotPacket) {
    char buf[6];
    snprintf(buf, sizeof(buf), "%3d%%", (int)pct);
    uint16_t col = pct > 50 ? COL_GREEN : pct > 20 ? COL_AMBER : COL_RED;
    tft.setTextColor(col, COL_BG);
    tft.setTextSize(1);
    tft.setCursor(BATT_PCT_X, BATT_BAR_Y);
    tft.print(buf);
  }

  tft.setTextColor(COL_DIM, COL_BG);
  tft.setTextSize(1);
  tft.setCursor(BATT_RX_X, BATT_BAR_Y);
  if (!gotPacket) {
    tft.print("waiting...");
  } else {
    uint32_t secs = (millis() - lastRxMs) / 1000;
    if (secs > 99) {
      tft.print("waiting...");
    } else {
      char buf[14];
      snprintf(buf, sizeof(buf), "rx %lus ago", (unsigned long)secs);
      tft.print(buf);
    }
  }
}

void display_init() {
  pinMode(TFT_RST, OUTPUT);
  digitalWrite(TFT_RST, HIGH);
  delay(5);
  digitalWrite(TFT_RST, LOW);
  delay(20);
  digitalWrite(TFT_RST, HIGH);
  delay(150);

  tft.init();
  tft.setRotation(1);
  tft.fillScreen(COL_BG);

  tft.drawFastHLine(0, DIV_TOPHDR, 320, COL_BORDER);
  tft.drawFastHLine(0, DIV_BIGSPLIT, 320, COL_BORDER);
  tft.drawFastHLine(0, DIV_WAVE, 320, COL_BORDER);
  tft.drawFastHLine(0, DIV_ENV, 320, COL_BORDER);
  tft.drawFastHLine(0, DIV_GPS, 320, COL_BORDER);
  tft.drawFastHLine(0, DIV_SOS, 320, COL_BORDER);
  tft.drawFastVLine(PANEL_SPLIT, DIV_TOPHDR + 1, DIV_BIGSPLIT - DIV_TOPHDR - 1, COL_BORDER);

  labelAt(4, 5, "VITALS  RX", COL_BLUE);
  labelAt(4, DIV_TOPHDR + 2, "BPM", COL_DIM);
  labelAt(170, DIV_TOPHDR + 2, "SPO2 %", COL_DIM);
  labelAt(4, DIV_WAVE + 2, "TEMP C", COL_DIM);
  labelAt(170, DIV_WAVE + 2, "HUMID %", COL_DIM);
  labelAt(4, DIV_ENV + 2, "GPS", COL_DIM);

  drawStatusDot(false);
  bigVal(BPM_VAL_X, BPM_VAL_Y, " --", COL_DIM);
  bigVal(SPO2_VAL_X, SPO2_VAL_Y, " --", COL_DIM);
  medVal(TEMP_X, TEMP_Y, " --.-", COL_DIM);
  medVal(HUMID_X, HUMID_Y, " --.-", COL_DIM);
  labelAt(GPS_X, GPS_Y, "no GPS fix...", COL_DIM);
  drawBpmStatus(false, false);
  clearWaveBuf();
  drawWaveRegion(false);
  drawBattRow(0, 0, false);
}

void display_tick() {
  if (!s_sosActive) return;
  if (millis() - s_sosLastFlash >= SOS_FLASH_MS) {
    s_sosLastFlash = millis();
    s_sosFlashOn   = !s_sosFlashOn;
    drawSOSBanner(s_sosFlashOn);
  }
}

void display_update(const VitalsPayload &pkt, bool radioOK, uint32_t lastRxMs) {
  char buf[32];
  bool fresh = (millis() - lastRxMs) < 5000;

  drawStatusDot(radioOK && fresh);

  bool isSOS = (pkt.type == PKT_TYPE_SOS);
  if (isSOS && !s_sosActive) {
    s_sosActive    = true;
    s_sosFlashOn   = true;
    s_sosLastFlash = millis();
    drawSOSBanner(true);
  } else if (!isSOS && s_sosActive) {
    s_sosActive  = false;
    s_sosFlashOn = false;
    clearSOSBanner();
  }

  tft.fillRect(BPM_VAL_X, BPM_VAL_Y, PANEL_SPLIT - BPM_VAL_X, 38, COL_BG);
  if (pkt.validHR) {
    snprintf(buf, sizeof(buf), "%3d", (int)pkt.bpm);
    bigVal(BPM_VAL_X, BPM_VAL_Y, buf, COL_RED);
  } else {
    bigVal(BPM_VAL_X, BPM_VAL_Y, " --", COL_DIM);
  }

  tft.fillRect(SPO2_VAL_X, SPO2_VAL_Y, 320 - SPO2_VAL_X, 38, COL_BG);
  if (pkt.validSPO2) {
    snprintf(buf, sizeof(buf), "%3d", (int)pkt.spo2);
    bigVal(SPO2_VAL_X, SPO2_VAL_Y, buf, COL_BLUE);
  } else {
    bigVal(SPO2_VAL_X, SPO2_VAL_Y, " --", COL_DIM);
  }

  if (pkt.validHR && !s_hadFinger) {
    tft.fillRect(BPMSTATUS_X, BPMSTATUS_Y, BPMSTATUS_W, 10, COL_BG);
  }
  s_hadFinger = pkt.validHR;
  drawBpmStatus(radioOK, pkt.validHR);

  if (radioOK && pkt.validHR) {
    s_waveActive = true;
    pushWaveSample((float)pkt.bpm);
  } else {
    clearWaveBuf();
  }
  drawWaveRegion(s_waveActive);

  tft.fillRect(TEMP_X, TEMP_Y, PANEL_SPLIT - TEMP_X, 20, COL_BG);
  dtostrf(pkt.temp, 5, 1, buf);
  medVal(TEMP_X, TEMP_Y, buf, COL_AMBER);

  tft.fillRect(HUMID_X, HUMID_Y, 320 - HUMID_X, 20, COL_BG);
  dtostrf(pkt.humid, 5, 1, buf);
  medVal(HUMID_X, HUMID_Y, buf, COL_GREEN);

  tft.fillRect(GPS_X, GPS_Y, 312, 14, COL_BG);
  if (pkt.gpsFix) {
    char latBuf[12], lonBuf[12], altBuf[8];
    dtostrf(pkt.lat, 8, 4, latBuf);
    dtostrf(pkt.lon, 9, 4, lonBuf);
    dtostrf(pkt.alt, 5, 1, altBuf);
    snprintf(buf, sizeof(buf), "%s  %s  %sm", latBuf, lonBuf, altBuf);
    tft.setTextColor(COL_PURPLE, COL_BG);
    tft.setTextSize(1);
    tft.setCursor(GPS_X, GPS_Y);
    tft.print(buf);
  } else {
    labelAt(GPS_X, GPS_Y, "no GPS fix...", COL_DIM);
  }

  drawBattRow(pkt.battPct, lastRxMs, true);
}

void display_no_signal() {
  drawStatusDot(false);
  drawBpmStatus(false, false);
  drawBattRow(0, 0, false);
}
