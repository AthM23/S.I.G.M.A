varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vec3 viewDir = normalize(vViewPosition);
  float fresnel = 1.0 - max(dot(vNormal, viewDir), 0.0);
  fresnel = pow(fresnel, 4.5);
  gl_FragColor = vec4(0.7, 0.72, 0.78, fresnel * 0.15);
}
