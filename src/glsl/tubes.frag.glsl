precision highp float;
precision highp int;

#define PI 3.14159

uniform int uStopCount;
uniform vec2 uResolution;
uniform vec3 uColors[5];
uniform float uAnalysers[5];

varying vec3 vViewPosition;

void main() {
  float d = vViewPosition.x;
  vec3 color = vec3(0);
  if (uStopCount == 1) {
    vec3 single_color_stop = uColors[0];
    single_color_stop *= 0.5 + uAnalysers[0];
    color = single_color_stop;
  } else {
    float stepSize = 1.0 / float(uStopCount - 1);
    for (int i = 0; i < 5; i++) {
        if (i == uStopCount) break;
        float t_prev = smoothstep(float(i) * stepSize, float(i + 1) * stepSize, d);
        float t_next = smoothstep(float(i - 1) * stepSize, float(i) * stepSize, d);
        vec3 color_stop = uColors[i] * vec3(t_next - t_prev);
        color_stop *= 0.5 + uAnalysers[i];
        color += color_stop;
    }
  }
  gl_FragColor = vec4(color, 1.0);
}
