#pragma once

// WiFi uplink: POST the latest RF payload to the ingest server without
// blocking the display loop.

#include <HTTPClient.h>
#include <WiFi.h>
#include <WiFiClient.h>
#include <WiFiClientSecure.h>

#include "receiver_config.h"

#if __has_include("WIFI_CONFIG.h")
#include "WIFI_CONFIG.h"
#endif

#ifndef WIFI_SSID
#define WIFI_SSID                 "your-ssid"
#define WIFI_PASS                 "your-password"
#define SIGMA_SERVER_URL          "http://localhost:3001"
#define SIGMA_API_KEY             "sigma-demo-key"
#define SIGMA_INGEST_INTERVAL_MS  5000
#endif

namespace _uplink {
  static uint32_t      lastSendMs = 0;
  static bool          ready      = false;
  static VitalsPayload pending    = {};
  static volatile bool hasPending = false;
  static uint32_t      lastThrottleLogMs = 0;
  static bool          warnedNotReady = false;
}

static void _uplinkTask(void*) {
  Serial.println(F("[uplink] background task started"));
  for (;;) {
    if (_uplink::hasPending) {
      _uplink::hasPending = false;
      const VitalsPayload pkt = _uplink::pending;

      Serial.println(F("[uplink] --- pending ingest ---"));
      Serial.printf(
        "[uplink] payload: type=%u bpm=%d spo2=%d temp=%.2f humid=%.2f "
        "batt=%u validHR=%d gpsFix=%d\n",
        (unsigned)pkt.type,
        (int)pkt.bpm,
        (int)pkt.spo2,
        pkt.temp,
        pkt.humid,
        (unsigned)pkt.battPct,
        (int)pkt.validHR,
        (int)pkt.gpsFix
      );
      if (pkt.gpsFix) {
        Serial.printf(
          "[uplink] gps: lat=%.6f lon=%.6f alt=%.1f\n",
          pkt.lat,
          pkt.lon,
          pkt.alt
        );
      }

      if (WiFi.status() != WL_CONNECTED) {
        Serial.print(F("[uplink] WiFi not connected (status="));
        Serial.print((int)WiFi.status());
        Serial.println(F("), dropping POST"));
        vTaskDelay(pdMS_TO_TICKS(250));
        continue;
      }

      Serial.print(F("[uplink] WiFi OK, RSSI="));
      Serial.print(WiFi.RSSI());
      Serial.println(F(" dBm"));

      HTTPClient http;
      const char* url = SIGMA_SERVER_URL "/api/ingest";
      const bool useHttps = (strncmp(url, "https://", 8) == 0);
      Serial.print(F("[uplink] POST "));
      Serial.print(url);
      Serial.print(F("  ("));
      Serial.print(useHttps ? F("HTTPS via WiFiClientSecure/insecure")
                            : F("HTTP via WiFiClient"));
      Serial.println(F(")"));

      WiFiClientSecure tls;
      WiFiClient       plain;
      bool beganOk = false;
      if (useHttps) {
        tls.setInsecure();
        tls.setTimeout(8);
        beganOk = http.begin(tls, url);
      } else {
        beganOk = http.begin(plain, url);
      }
      if (!beganOk) {
        Serial.println(F("[uplink] ERROR: http.begin() failed — bad URL?"));
        http.end();
        vTaskDelay(pdMS_TO_TICKS(250));
        continue;
      }
      http.addHeader("Content-Type", "application/json");
      http.addHeader("X-Api-Key", SIGMA_API_KEY);
      http.addHeader("ngrok-skip-browser-warning", "69420");
      http.setConnectTimeout(8000);
      http.setTimeout(8000);
      Serial.println(F("[uplink] HTTP connect/timeout ms=8000"));

      char body[320];
      int n = snprintf(
        body,
        sizeof(body),
        "{\"type\":%u,\"bpm\":%d,\"spo2\":%d,\"temp\":%.2f,\"humid\":%.2f,"
        "\"lat\":%.6f,\"lon\":%.6f,\"alt\":%.1f,"
        "\"gpsFix\":%s,\"validHR\":%s,\"validSPO2\":%s,\"battPct\":%u}",
        (unsigned)pkt.type,
        (int)pkt.bpm,
        (int)pkt.spo2,
        pkt.temp,
        pkt.humid,
        pkt.lat,
        pkt.lon,
        pkt.alt,
        pkt.gpsFix ? "true" : "false",
        pkt.validHR ? "true" : "false",
        pkt.validSPO2 ? "true" : "false",
        (unsigned)pkt.battPct
      );
      if (n < 0 || n >= (int)sizeof(body)) {
        Serial.printf("[uplink] ERROR json snprintf failed or truncated (n=%d)\n", n);
      }
      Serial.print(F("[uplink] JSON length="));
      Serial.println((int)strlen(body));
      Serial.print(F("[uplink] JSON: "));
      Serial.println(body);

      uint32_t tPost = millis();
      int code = http.POST(body);
      uint32_t elapsed = millis() - tPost;
      Serial.print(F("[uplink] HTTP code="));
      Serial.print(code);
      Serial.print(F(" ("));
      Serial.print(elapsed);
      Serial.println(F(" ms)"));

      if (code > 0) {
        String resp = http.getString();
        if (resp.length() > 0) {
          Serial.print(F("[uplink] response body: "));
          Serial.println(resp);
        } else {
          Serial.println(F("[uplink] (empty response body)"));
        }
      } else {
        Serial.print(F("[uplink] HTTPClient error: "));
        Serial.println(http.errorToString(code));
      }

      http.end();

      if (code == 200) {
        Serial.println(F("[uplink] OK — server accepted ingest"));
      } else {
        Serial.println(F("[uplink] FAIL — non-200 or transport error (see above)"));
      }
    }
    vTaskDelay(pdMS_TO_TICKS(250));
  }
}

inline void wifi_uplink_init() {
  Serial.println(F("[uplink] ========== wifi_uplink_init =========="));
  Serial.print(F("[uplink] SSID: "));
  Serial.println(WIFI_SSID);
  Serial.print(F("[uplink] Ingest base URL: "));
  Serial.println(SIGMA_SERVER_URL);
  Serial.print(F("[uplink] Full ingest URL: "));
  Serial.print(SIGMA_SERVER_URL);
  Serial.println(F("/api/ingest"));
  Serial.print(F("[uplink] API key length: "));
  Serial.println((int)strlen(SIGMA_API_KEY));
  Serial.print(F("[uplink] SIGMA_INGEST_INTERVAL_MS: "));
  Serial.println(SIGMA_INGEST_INTERVAL_MS);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print(F("[uplink] WiFi connecting"));
  uint32_t t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < 12000) {
    delay(300);
    Serial.print('.');
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    _uplink::ready = true;
    Serial.print(F("[uplink] WiFi connected, IP: "));
    Serial.println(WiFi.localIP());
    Serial.print(F("[uplink] Gateway: "));
    Serial.println(WiFi.gatewayIP());
    Serial.print(F("[uplink] DNS: "));
    Serial.println(WiFi.dnsIP());
    Serial.print(F("[uplink] subnet mask: "));
    Serial.println(WiFi.subnetMask());
    Serial.println(F("[uplink] creating uplink FreeRTOS task..."));
    BaseType_t ok = xTaskCreate(_uplinkTask, "sigma_uplink", 8192, nullptr, 1, nullptr);
    if (ok != pdPASS) {
      Serial.println(F("[uplink] ERROR: xTaskCreate failed — uplink will not run"));
    }
  } else {
    Serial.print(F("[uplink] WiFi failed (status="));
    Serial.print((int)WiFi.status());
    Serial.println(F(") — display-only mode, no HTTP uplink"));
  }
  Serial.println(F("[uplink] ========================================"));
}

inline void wifi_uplink_send(const VitalsPayload& pkt) {
  if (!_uplink::ready) {
    if (!_uplink::warnedNotReady) {
      _uplink::warnedNotReady = true;
      Serial.println(
        F("[uplink] wifi_uplink_send: uplink not ready (WiFi init failed); "
          "dropping — fix WiFi to enable POST")
      );
    }
    return;
  }
  uint32_t now = millis();
  bool forceSend = pkt.type == PKT_TYPE_SOS;
  if (!forceSend &&
      _uplink::lastSendMs != 0 &&
      now - _uplink::lastSendMs < SIGMA_INGEST_INTERVAL_MS) {
    uint32_t wait = SIGMA_INGEST_INTERVAL_MS - (now - _uplink::lastSendMs);
    if (now - _uplink::lastThrottleLogMs > 3000) {
      _uplink::lastThrottleLogMs = now;
      Serial.print(F("[uplink] rate-limit: skip send, ~"));
      Serial.print(wait);
      Serial.println(F(" ms until next allowed POST"));
    }
    return;
  }
  if (forceSend) {
    Serial.println(F("[uplink] wifi_uplink_send: SOS — bypassing interval limit"));
  }
  Serial.println(F("[uplink] wifi_uplink_send: queued for background POST"));
  _uplink::lastSendMs = now;
  _uplink::pending    = pkt;
  _uplink::hasPending = true;
}
