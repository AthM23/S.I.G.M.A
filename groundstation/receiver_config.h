#pragma once

#include <RF24.h>

// Must match transmitter exactly.
#define NRF_ADDRESS    "98324"
#define NRF_PA_LEVEL   RF24_PA_MIN
#define NRF_DATA_RATE  RF24_2MBPS

// Packet type flags.
#define PKT_TYPE_VITALS  0x01
#define PKT_TYPE_SOS     0x02

// HSPI pins for nRF24L01.
#define NRF_CE_PIN    17
#define NRF_CSN_PIN    5
#define NRF_SCK_PIN   14
#define NRF_MISO_PIN  12
#define NRF_MOSI_PIN  13

// Payload must stay binary-compatible with the transmitter.
struct VitalsPayload {
  float    lat;
  float    lon;
  float    alt;
  float    temp;
  float    humid;
  int16_t  bpm;
  int16_t  spo2;
  uint8_t  type;
  uint8_t  battPct;
  bool     gpsFix;
  bool     validHR;
  bool     validSPO2;
  uint8_t  _pad[3];
};

static_assert(sizeof(VitalsPayload) == 32, "VitalsPayload must be exactly 32 bytes");
