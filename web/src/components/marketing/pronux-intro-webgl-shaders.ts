export const warpParticleVertex = /* glsl */ `
  attribute float aSpeed;
  attribute float aOffset;
  uniform float uTime;
  uniform float uStrength;
  varying float vAlpha;
  void main() {
    float t = mod(uTime * aSpeed + aOffset, 1.0);
    float z = mix(18.0, -2.0, t);
    vec3 pos = position;
    pos.z = z;
    pos.xy *= mix(0.15, 1.0, t);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = mix(1.0, 4.5, t) * uStrength * (220.0 / -mv.z);
    vAlpha = smoothstep(0.0, 0.15, t) * smoothstep(1.0, 0.55, t) * uStrength;
  }
`;

export const warpParticleFragment = /* glsl */ `
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float glow = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(mix(vec3(0.18, 0.83, 0.75), vec3(1.0), glow), vAlpha * glow);
  }
`;

export const sphereLineVertex = /* glsl */ `
  attribute vec3 aColor;
  attribute float aPhase;
  uniform float uTime;
  uniform float uAlpha;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec3 pos = position;
    float wave = sin(uTime * 2.8 + aPhase + pos.y * 6.0) * 0.08;
    pos.x += wave;
    pos.z += cos(uTime * 2.2 + aPhase) * 0.05;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    vColor = aColor;
    vAlpha = uAlpha;
  }
`;

export const sphereLineFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    gl_FragColor = vec4(vColor, vAlpha * 0.85);
  }
`;

export const terrainVertex = /* glsl */ `
  uniform float uTime;
  uniform float uReveal;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec3 pos = position;
    float wave =
      sin(pos.x * 2.2 + uTime * 1.3) * 0.35 +
      cos(pos.z * 1.8 + uTime * 1.0) * 0.28 +
      sin((pos.x + pos.z) * 1.5 + uTime * 0.8) * 0.18;
    pos.y += wave * uReveal;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    float hue = (pos.x + 6.0) / 12.0;
    vec3 teal = vec3(0.18, 0.83, 0.75);
    vec3 purple = vec3(0.65, 0.55, 0.98);
    vec3 pink = vec3(0.98, 0.45, 0.55);
    vColor = hue < 0.33 ? mix(teal, purple, hue / 0.33) : mix(purple, pink, (hue - 0.33) / 0.67);
    vAlpha = uReveal * 0.75;
  }
`;

export const terrainFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    gl_FragColor = vec4(vColor, vAlpha);
  }
`;

export const coreGlowVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
  }
`;

export const coreGlowFragment = /* glsl */ `
  uniform float uIntensity;
  uniform vec3 uColor;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float fresnel = pow(1.0 - max(dot(vNormal, vView), 0.0), 2.5);
    gl_FragColor = vec4(uColor, fresnel * uIntensity);
  }
`;

const SIMPLEX_NOISE = /* glsl */ `
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

export const fluidVertex = /* glsl */ `
  uniform float uTime;
  uniform float uAlpha;
  attribute vec3 aSeed;
  attribute float aSize;
  varying vec3 vColor;
  varying float vAlpha;
  ${SIMPLEX_NOISE}
  void main() {
    vec3 pos = position;
    float n1 = snoise(pos * 0.55 + vec3(uTime * 0.18, uTime * 0.14, uTime * 0.11));
    float n2 = snoise(pos * 1.1 + vec3(uTime * 0.22) + aSeed);
    pos += normalize(pos + 0.001) * n1 * 0.85;
    pos.y += n2 * 0.45;
    pos.x += sin(uTime * 0.7 + aSeed.x * 6.28) * 0.15;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * (1.0 + n2 * 0.35) * uAlpha * (180.0 / -mv.z);
    float hue = clamp(pos.y * 0.35 + 0.5 + n1 * 0.2, 0.0, 1.0);
    vec3 teal = vec3(0.18, 0.83, 0.75);
    vec3 purple = vec3(0.65, 0.55, 0.98);
    vec3 magenta = vec3(0.95, 0.35, 0.65);
    vec3 green = vec3(0.35, 0.95, 0.55);
    if (hue < 0.25) vColor = mix(teal, green, hue / 0.25);
    else if (hue < 0.55) vColor = mix(green, purple, (hue - 0.25) / 0.3);
    else vColor = mix(purple, magenta, (hue - 0.55) / 0.45);
    vAlpha = uAlpha * (0.45 + 0.55 * smoothstep(-1.5, 1.5, pos.y));
  }
`;

export const fluidFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.0, d);
    float glow = pow(core, 1.4);
    gl_FragColor = vec4(vColor, vAlpha * glow * 0.9);
  }
`;

export const waterVertex = /* glsl */ `
  uniform float uTime;
  uniform float uReveal;
  varying vec3 vWorld;
  varying float vRipple;
  void main() {
    vec3 pos = position;
    float r =
      sin(pos.x * 1.8 + uTime * 1.2) * 0.08 +
      cos(pos.z * 1.5 + uTime * 0.9) * 0.06 +
      sin((pos.x + pos.z) * 2.2 + uTime * 1.5) * 0.04;
    pos.y += r * uReveal;
    vRipple = r;
    vec4 world = modelMatrix * vec4(pos, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const waterFragment = /* glsl */ `
  uniform float uReveal;
  uniform float uTime;
  varying vec3 vWorld;
  varying float vRipple;
  void main() {
    vec3 teal = vec3(0.18, 0.83, 0.75);
    vec3 deep = vec3(0.02, 0.06, 0.1);
    float fresnel = pow(1.0 - abs(vRipple) * 4.0, 2.0);
    vec3 col = mix(deep, teal, fresnel * 0.55 + 0.12);
    float shimmer = sin(vWorld.x * 3.0 + uTime * 2.0) * 0.5 + 0.5;
    col += vec3(0.08, 0.12, 0.1) * shimmer * 0.15;
    gl_FragColor = vec4(col, uReveal * 0.55);
  }
`;

export const infinityTrailVertex = /* glsl */ `
  attribute float aAlong;
  uniform float uTime;
  varying float vAlong;
  varying float vAlpha;
  void main() {
    vAlong = aAlong;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    vAlpha = 0.85;
  }
`;

export const infinityTrailFragment = /* glsl */ `
  uniform float uAlpha;
  varying float vAlong;
  varying float vAlpha;
  void main() {
    float pulse = sin(vAlong * 40.0) * 0.5 + 0.5;
    vec3 col = mix(vec3(0.18, 0.83, 0.75), vec3(0.93, 0.89, 0.82), pulse);
    gl_FragColor = vec4(col, vAlpha * uAlpha * (0.35 + pulse * 0.65));
  }
`;

export const singularityVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vPos;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vPos = position;
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

export const singularityFragment = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform float uWarp;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vPos;
  ${SIMPLEX_NOISE}
  void main() {
    vec3 n = normalize(vNormal);
    vec3 v = normalize(vView);
    float fresnel = pow(1.0 - max(dot(n, v), 0.0), 3.0);
    float r = length(vPos.xz);
    float ang = atan(vPos.z, vPos.x);
    float disk = exp(-pow(vPos.y * 3.2, 2.0)) * (0.55 + 0.45 * sin(ang * 6.0 + uTime * 2.2));
    float doppler = 0.5 + 0.5 * sin(ang - uTime * 1.8);
    vec3 teal = vec3(0.18, 0.83, 0.75);
    vec3 gold = vec3(0.93, 0.89, 0.82);
    vec3 purple = vec3(0.65, 0.55, 0.98);
    vec3 diskCol = mix(teal, gold, doppler) * disk;
    float noise = snoise(vPos * 2.5 + vec3(uTime * 0.35));
    float horizon = smoothstep(0.22, 0.08, length(vPos)) * uIntensity;
    float ring = smoothstep(0.38, 0.34, abs(length(vPos.xz) - 0.36));
    ring += smoothstep(0.48, 0.44, abs(length(vPos.xz) - 0.44)) * 0.6;
    vec3 col = diskCol * 1.4;
    col += purple * fresnel * 0.35 * uIntensity;
    col += gold * ring * 1.8 * uIntensity;
    col += teal * noise * 0.12 * uIntensity;
    float alpha = (disk * 0.85 + fresnel * 0.55 + ring * 0.9) * uIntensity + uWarp * 0.35;
    col = mix(col, vec3(0.0), horizon * 0.92);
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;

export const dnaVertex = /* glsl */ `
  attribute vec3 aColor;
  attribute float aPhase;
  uniform float uTime;
  uniform float uAlpha;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec3 pos = position;
    pos.x += sin(uTime * 1.8 + aPhase + pos.y * 2.5) * 0.04;
    pos.z += cos(uTime * 1.5 + aPhase) * 0.04;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (2.8 + sin(uTime * 3.0 + aPhase) * 1.2) * uAlpha * (140.0 / -mv.z);
    vColor = aColor;
    vAlpha = uAlpha;
  }
`;

export const dnaFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float g = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor, vAlpha * g * 0.95);
  }
`;

export const shockwaveVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const shockwaveFragment = /* glsl */ `
  uniform float uProgress;
  uniform float uAlpha;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    vec2 c = vUv - 0.5;
    float d = length(c) * 2.0;
    float ring = smoothstep(uProgress + 0.08, uProgress, d) * smoothstep(uProgress - 0.18, uProgress, d);
    float glow = ring * (1.0 - uProgress) * uAlpha;
    gl_FragColor = vec4(uColor, glow * 0.85);
  }
`;

export const cortexPulseVertex = /* glsl */ `
  attribute float aPulse;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uAlpha;
  varying vec3 vColor;
  varying float vBright;
  void main() {
    vec3 pos = position;
    float pulse = sin(uTime * 2.5 + aPulse * 6.28) * 0.5 + 0.5;
    pos += normalize(pos + 0.001) * pulse * 0.04;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (2.2 + pulse * 2.5) * uAlpha * (120.0 / -mv.z);
    vColor = aColor;
    vBright = pulse;
  }
`;

export const cortexPulseFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vBright;
  uniform float uAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float g = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor * (0.7 + vBright * 0.6), uAlpha * g);
  }
`;

export const dataStreamVertex = /* glsl */ `
  attribute float aSpeed;
  attribute float aOffset;
  attribute float aLane;
  uniform float uTime;
  uniform float uAlpha;
  varying float vAlpha;
  void main() {
    float t = mod(uTime * aSpeed + aOffset, 1.0);
    vec3 pos = position;
    pos.y = mix(8.0, -6.0, t);
    pos.x += sin(uTime * 1.2 + aLane * 3.0) * 0.08;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (1.2 + aLane * 0.4) * uAlpha * (100.0 / -mv.z);
    vAlpha = smoothstep(0.0, 0.12, t) * smoothstep(1.0, 0.65, t) * uAlpha;
  }
`;

export const dataStreamFragment = /* glsl */ `
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float g = smoothstep(0.5, 0.0, d);
    vec3 col = mix(vec3(0.18, 0.83, 0.75), vec3(0.83, 0.77, 0.66), g);
    gl_FragColor = vec4(col, vAlpha * g);
  }
`;
