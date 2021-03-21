varying vec2 vUv;

uniform float uTime;
uniform float uAverageFrequencies[5];
uniform float uFrequenciesA[32];
uniform float uFrequenciesB[32];
uniform float uFrequenciesC[32];
uniform float uFrequenciesD[32];
uniform float uFrequenciesE[32];

void main() {
  vec2 uv = vUv;
  ivec2 iuv = ivec2(uv * 5.0);
  float spectrum = 0.0;

  spectrum = uAverageFrequencies[iuv.y];

  gl_FragColor = vec4(spectrum, 0, 0, 1);
}
