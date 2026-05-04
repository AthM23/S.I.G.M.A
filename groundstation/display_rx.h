#pragma once

#include "receiver_config.h"

void display_init();
void display_update(const VitalsPayload &pkt, bool radioOK, uint32_t lastRxMs);
void display_no_signal();
void display_tick();
