export const NOISE_CHUNK = `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
    const vec2  C = vec2(1.0/6.0, 1.0/3.0);
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
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
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
`;

export const AURA_VERTEX = `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-(modelViewMatrix * vec4(position, 1.0)).xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/** Aura quente dourada — sem branco; shimmer sutil como na versão original. */
export const AURA_FRAGMENT = `
  uniform float uTime;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float fresnel = 1.0 - max(dot(vNormal, vView), 0.0);
    float rim = pow(fresnel, 4.0);
    float pulse = 0.92 + 0.08 * sin(uTime * 2.2);
    float shimmer = 0.94 + 0.06 * sin(uTime * 4.6 + fresnel * 9.0);
    vec3 core = vec3(1.0, 0.45, 0.1);
    vec3 edge = vec3(1.0, 0.58, 0.16) * pow(fresnel, 2.4);
    vec3 teal = vec3(0.12, 0.72, 0.62) * pow(fresnel, 1.6) * 0.18;
    gl_FragColor = vec4((core * rim + edge * 0.42 + teal) * uIntensity * 5.0 * pulse * shimmer, 1.0);
  }
`;

export const DISK_VERTEX = (noiseChunk: string) => `
  ${noiseChunk}
  uniform float uTime;
  uniform float uMorph;
  uniform float uCompression;
  uniform float uIntensity;
  uniform float uOrbitScale;
  uniform float uDiskRMax;
  varying vec3 vColor;
  varying float vOpacity;
  void main() {
    vec4 instPos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    float rOriginal = length(instPos.xz);
    float r = rOriginal * uCompression;
    float initialAngle = atan(instPos.z, instPos.x);
    float orbitalVelocity = (1.5 / sqrt(rOriginal)) * uOrbitScale;
    float currentAngle = initialAngle - (uTime * orbitalVelocity);
    vec3 morphedLocal = vec3(cos(currentAngle) * r, instPos.y, sin(currentAngle) * r);
    float noise = snoise(vec3(morphedLocal.x * 0.08, morphedLocal.z * 0.08, uTime * 0.3));
    morphedLocal.y += noise * uMorph * 4.0;
    vec3 morphedWorldPos = (modelMatrix * vec4(morphedLocal, 1.0)).xyz;
    vec3 viewDir = normalize(cameraPosition - morphedWorldPos);
    vec3 orbitDir = normalize(mat3(modelMatrix) * vec3(-sin(currentAngle), 0.0, cos(currentAngle)));
    float doppler = dot(orbitDir, viewDir);
    vec3 hot = vec3(1.0, 0.52, 0.06);
    vec3 warm = vec3(1.0, 0.45, 0.1);
    vec3 cool = vec3(0.1, 0.35, 1.0);
    vec3 teal = vec3(0.15, 0.78, 0.68);
    float hue = fract(initialAngle * 0.318 + rOriginal * 0.024);
    vec3 accent = mix(cool, teal, hue);
    vec3 color = mix(accent, warm, smoothstep(uDiskRMax * 0.94, 12.0, r));
    color = mix(color, hot, smoothstep(10.0, 4.0, r) * 0.55);
    vColor = color * (1.42 + doppler * 0.78) * uIntensity;
    vOpacity =
      (smoothstep(3.8, 5.5, r) * (1.0 - smoothstep(uDiskRMax * 0.79, uDiskRMax * 0.98, r))) * 0.92;
    float deltaAngle = currentAngle - initialAngle;
    float c = cos(deltaAngle);
    float s = sin(deltaAngle);
    mat3 rotY = mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c);
    vec3 linearOffset = (instanceMatrix * vec4(position, 0.0)).xyz;
    vec3 rotatedOffset = rotY * linearOffset;
    vec3 finalLocal = morphedLocal + rotatedOffset;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(finalLocal, 1.0);
  }
`;

export const DISK_FRAGMENT = `
  varying vec3 vColor;
  varying float vOpacity;
  void main() {
    gl_FragColor = vec4(vColor, vOpacity);
  }
`;
