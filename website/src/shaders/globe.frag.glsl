uniform sampler2D uWaterMask;
uniform sampler2D uTopology;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  // earth-water.png: bright = water, dark = land
  float water = texture2D(uWaterMask, vUv).r;
  float land = 1.0 - step(0.5, water);

  // Edge detection on the land mask for coastline outlines
  float px = 1.0 / 2048.0;
  float wL = step(0.5, texture2D(uWaterMask, vUv + vec2(-px, 0.0)).r);
  float wR = step(0.5, texture2D(uWaterMask, vUv + vec2( px, 0.0)).r);
  float wU = step(0.5, texture2D(uWaterMask, vUv + vec2(0.0,  px)).r);
  float wD = step(0.5, texture2D(uWaterMask, vUv + vec2(0.0, -px)).r);

  float edge = abs(wL - wR) + abs(wU - wD);
  edge = clamp(edge, 0.0, 1.0);

  // Widen the coastline slightly with additional samples
  float px2 = 2.0 / 2048.0;
  float wL2 = step(0.5, texture2D(uWaterMask, vUv + vec2(-px2, 0.0)).r);
  float wR2 = step(0.5, texture2D(uWaterMask, vUv + vec2( px2, 0.0)).r);
  float wU2 = step(0.5, texture2D(uWaterMask, vUv + vec2(0.0,  px2)).r);
  float wD2 = step(0.5, texture2D(uWaterMask, vUv + vec2(0.0, -px2)).r);

  float edge2 = abs(wL2 - wR2) + abs(wU2 - wD2);
  edge = max(edge, edge2 * 0.7);
  edge = clamp(edge, 0.0, 1.0);

  vec3 ocean    = vec3(0.02, 0.02, 0.02);
  vec3 landCol  = vec3(0.10, 0.10, 0.10);
  vec3 coastCol = vec3(0.65, 0.65, 0.65);

  vec3 color = mix(ocean, landCol, land);
  color = mix(color, coastCol, edge);

  vec3 viewDir = normalize(vViewPosition);
  float rim = 1.0 - max(dot(vNormal, viewDir), 0.0);
  color -= rim * 0.02;

  gl_FragColor = vec4(color, 1.0);
}
