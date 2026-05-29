export const SIMPLEX_NOISE = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

export const bhStarVertex = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;
attribute float size;
attribute float twinkle;
varying vec3 vColor;
varying float vTwinkle;
void main() {
  vColor = color;
  vTwinkle = sin(uTime * 2.5 + twinkle) * 0.5 + 0.5;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = size * uPixelRatio * (300.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const bhStarFragment = /* glsl */ `
varying vec3 vColor;
varying float vTwinkle;
void main() {
  float dist = distance(gl_PointCoord, vec2(0.5));
  if (dist > 0.5) discard;
  float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
  alpha *= (0.2 + vTwinkle * 0.8);
  gl_FragColor = vec4(vColor, alpha);
}
`;

export const bhHorizonVertex = /* glsl */ `
varying vec3 vNormal;
varying vec3 vPosition;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const bhHorizonFragment = /* glsl */ `
uniform float uTime;
uniform vec3 uCameraPosition;
uniform float uIntensity;
varying vec3 vNormal;
varying vec3 vPosition;
void main() {
  vec3 viewDirection = normalize(uCameraPosition - vPosition);
  float fresnel = 1.0 - abs(dot(vNormal, viewDirection));
  fresnel = pow(fresnel, 2.5);
  vec3 glowColor = mix(vec3(0.18, 0.83, 0.75), vec3(0.93, 0.89, 0.82), 0.45);
  float pulse = sin(uTime * 2.5) * 0.15 + 0.85;
  gl_FragColor = vec4(glowColor * fresnel * pulse * uIntensity, fresnel * 0.45 * uIntensity);
}
`;

export const bhAuraVertex = /* glsl */ `
varying vec3 vNormal;
varying vec3 vView;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vView = normalize(-(modelViewMatrix * vec4(position, 1.0)).xyz);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const bhAuraFragment = /* glsl */ `
uniform float uIntensity;
varying vec3 vNormal;
varying vec3 vView;
void main() {
  float rim = pow(1.0 - max(dot(vNormal, vView), 0.0), 4.0);
  vec3 col = mix(vec3(0.18, 0.83, 0.75), vec3(0.93, 0.77, 0.45), 0.35);
  gl_FragColor = vec4(col * rim * uIntensity * 4.5, rim * uIntensity);
}
`;

export const bhRingVertex = /* glsl */ `
varying vec2 vUv;
varying float vRadius;
varying float vAngle;
void main() {
  vUv = uv;
  vRadius = length(position.xy);
  vAngle = atan(position.y, position.x);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const bhRingFragment = (innerR: number, outerR: number) => /* glsl */ `
uniform float uTime;
uniform float uIntensity;
uniform float uMorph;
varying vec2 vUv;
varying float vRadius;
varying float vAngle;
${SIMPLEX_NOISE}
void main() {
  float normalizedRadius = smoothstep(${innerR.toFixed(2)}, ${outerR.toFixed(2)}, vRadius);
  float spiral = vAngle * 3.0 - (1.0 / (normalizedRadius + 0.1)) * 2.0;
  vec2 noiseUv = vec2(
    vUv.x + uTime * 0.22 * (2.0 / (vRadius * 0.3 + 1.0)) + sin(spiral) * 0.1,
    vUv.y * 0.8 + cos(spiral) * 0.1
  );
  float noiseVal1 = snoise(vec3(noiseUv * 2.5, uTime * 0.15));
  float noiseVal2 = snoise(vec3(noiseUv * 7.5 + 0.8, uTime * 0.22));
  float noiseVal3 = snoise(vec3(noiseUv * 15.0 + 1.5, uTime * 0.3));
  float noiseVal = (noiseVal1 * 0.45 + noiseVal2 * 0.35 + noiseVal3 * 0.2);
  noiseVal = (noiseVal + 1.0) * 0.5;
  noiseVal += uMorph * 0.08 * snoise(vec3(vRadius * 3.0, vAngle * 2.0, uTime * 0.4));

  vec3 outer = vec3(0.27, 0.47, 1.0);
  vec3 mid3 = vec3(0.47, 0.27, 1.0);
  vec3 mid2 = vec3(1.0, 0.27, 0.47);
  vec3 mid1 = vec3(1.0, 0.47, 0.2);
  vec3 hot = vec3(1.0, 0.95, 0.9);
  vec3 color = outer;
  color = mix(color, mid3, smoothstep(0.0, 0.25, normalizedRadius));
  color = mix(color, mid2, smoothstep(0.2, 0.55, normalizedRadius));
  color = mix(color, mid1, smoothstep(0.5, 0.75, normalizedRadius));
  color = mix(color, hot, smoothstep(0.7, 0.95, normalizedRadius));
  color = mix(color, vec3(0.18, 0.83, 0.75), 0.12);

  color *= (0.5 + noiseVal * 1.0) * uIntensity;
  float brightness = pow(1.0 - normalizedRadius, 1.0) * 3.5 + 0.5;
  brightness *= (0.3 + noiseVal * 2.2);
  float pulse = sin(uTime * 1.8 + normalizedRadius * 12.0 + vAngle * 2.0) * 0.15 + 0.85;
  brightness *= pulse;

  float alpha = 1.3 * (0.2 + noiseVal * 0.9);
  alpha *= smoothstep(0.0, 0.15, normalizedRadius);
  alpha *= (1.0 - smoothstep(0.85, 1.0, normalizedRadius));
  alpha = clamp(alpha, 0.0, 1.0);
  gl_FragColor = vec4(color * brightness, alpha);
}
`;

export const bhStreakVertex = /* glsl */ `
${SIMPLEX_NOISE}
uniform float uTime;
uniform float uMorph;
uniform float uCompression;
uniform float uIntensity;
uniform float uOrbitScale;
varying vec3 vColor;
varying float vOpacity;
void main() {
  vec4 instPos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  float rOriginal = length(instPos.xz);
  float r = rOriginal * uCompression;
  float initialAngle = atan(instPos.z, instPos.x);
  float orbitalVelocity = (1.5 / sqrt(max(rOriginal, 0.5))) * uOrbitScale;
  float currentAngle = initialAngle + (uTime * orbitalVelocity);
  vec3 morphedWorldPos = vec3(cos(currentAngle) * r, instPos.y, sin(currentAngle) * r);
  float noise = snoise(vec3(morphedWorldPos.x * 0.08, morphedWorldPos.z * 0.08, uTime * 0.3));
  morphedWorldPos.y += noise * uMorph * 4.0;
  vec3 viewDir = normalize(cameraPosition - morphedWorldPos);
  vec3 orbitDir = normalize(vec3(-sin(currentAngle), 0.0, cos(currentAngle)));
  float doppler = dot(orbitDir, viewDir);
  vec3 hot = vec3(1.0, 0.95, 0.9);
  vec3 warm = vec3(0.93, 0.77, 0.45);
  vec3 teal = vec3(0.18, 0.83, 0.75);
  vec3 cool = vec3(0.1, 0.35, 1.0);
  vec3 color = mix(cool, warm, smoothstep(45.0, 12.0, r));
  color = mix(color, hot, smoothstep(10.0, 4.0, r));
  color = mix(color, teal, 0.18);
  vColor = color * (1.3 + doppler * 0.7) * uIntensity;
  vOpacity = (smoothstep(3.8, 5.5, r) * (1.0 - smoothstep(38.0, 48.0, r))) * 0.8;
  float deltaAngle = currentAngle - initialAngle;
  float c = cos(deltaAngle);
  float s = sin(deltaAngle);
  mat3 rotY = mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c);
  vec3 localPos = (instanceMatrix * vec4(position, 0.0)).xyz;
  vec3 rotatedLocalPos = rotY * localPos;
  gl_Position = projectionMatrix * viewMatrix * vec4(morphedWorldPos + rotatedLocalPos, 1.0);
}
`;

export const bhStreakFragment = /* glsl */ `
varying vec3 vColor;
varying float vOpacity;
void main() {
  gl_FragColor = vec4(vColor, vOpacity);
}
`;

export const bhLensingFragment = /* glsl */ `
uniform sampler2D tDiffuse;
uniform vec2 blackHoleScreenPos;
uniform float lensingStrength;
uniform float lensingRadius;
uniform float aspectRatio;
uniform float chromaticAberration;
varying vec2 vUv;
void main() {
  vec2 screenPos = vUv;
  vec2 toCenter = screenPos - blackHoleScreenPos;
  toCenter.x *= aspectRatio;
  float dist = length(toCenter);
  float distortionAmount = lensingStrength / (dist * dist + 0.003);
  distortionAmount = clamp(distortionAmount, 0.0, 0.7);
  float falloff = smoothstep(lensingRadius, lensingRadius * 0.3, dist);
  distortionAmount *= falloff;
  vec2 offset = normalize(toCenter) * distortionAmount;
  offset.x /= aspectRatio;
  vec2 distortedUvR = screenPos - offset * (1.0 + chromaticAberration);
  vec2 distortedUvG = screenPos - offset;
  vec2 distortedUvB = screenPos - offset * (1.0 - chromaticAberration);
  float r = texture2D(tDiffuse, distortedUvR).r;
  float g = texture2D(tDiffuse, distortedUvG).g;
  float b = texture2D(tDiffuse, distortedUvB).b;
  gl_FragColor = vec4(r, g, b, 1.0);
}
`;
