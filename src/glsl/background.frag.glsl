#pragma glslify: pillow = require(./pillow)

uniform vec3 uColor;

vec3 hsb_2_rgb(in vec3 c){
  vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),
                           6.0)-3.0)-1.0,
                   0.0,
                   1.0 );
  rgb = rgb*rgb*(3.0-2.0*rgb);
  return c.z * mix(vec3(1.0), rgb, c.y);
}

vec3 rgb_2_hsv(in vec3 rgb) {
  vec4 k = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(rgb.bg, k.wz),
               vec4(rgb.gb, k.xy),
               step(rgb.b, rgb.g));
  vec4 q = mix(vec4(p.xyw, rgb.r),
               vec4(rgb.r, p.yzw),
               step(p.x, rgb.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)),
              d / (q.x + e),
              q.x);
}

float rand(vec2 n) { 
	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 p){
	vec2 ip = floor(p);
	vec2 u = fract(p);
	u = u*u*(3.0-2.0*u);
	
	float res = mix(
		mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
		mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
	return res*res;
}

uniform vec2 uResolution;

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec3 color = vec3(0.0);

  vec3 colorHsv = rgb_2_hsv(uColor);
  colorHsv.z -= 0.3;
  vec4 color_a = vec4(hsb_2_rgb(colorHsv), 1.0);
  vec4 color_b = vec4(uColor, 1.0);

  vec2 gamma = vec2(6.0);
  
  color = pillow(color_a, color_b, gamma, uv).rgb + rand(uv * 100.0) / 100.0;

  gl_FragColor = vec4(color, 1.0);
}
