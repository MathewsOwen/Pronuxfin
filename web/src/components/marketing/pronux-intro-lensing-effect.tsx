"use client";

import { wrapEffect } from "@react-three/postprocessing";
import { Effect, BlendFunction } from "postprocessing";
import { Uniform, Vector2 } from "three";

const fragmentShader = /* glsl */ `
uniform vec2 blackHoleScreenPos;
uniform float lensingStrength;
uniform float lensingRadius;
uniform float aspectRatio;
uniform float chromaticAberration;
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 toCenter = uv - blackHoleScreenPos;
  toCenter.x *= aspectRatio;
  float dist = length(toCenter);
  float distortionAmount = lensingStrength / (dist * dist + 0.003);
  distortionAmount = clamp(distortionAmount, 0.0, 0.55);
  float falloff = smoothstep(lensingRadius, lensingRadius * 0.32, dist);
  distortionAmount *= falloff;
  vec2 offset = normalize(toCenter + 1e-6) * distortionAmount;
  offset.x /= aspectRatio;
  vec2 uvR = uv - offset * (1.0 + chromaticAberration);
  vec2 uvG = uv - offset;
  vec2 uvB = uv - offset * (1.0 - chromaticAberration);
  float r = texture2D(inputBuffer, uvR).r;
  float g = texture2D(inputBuffer, uvG).g;
  float b = texture2D(inputBuffer, uvB).b;
  outputColor = vec4(r, g, b, inputColor.a);
}
`;

class GravitationalLensingImpl extends Effect {
  constructor() {
    super("GravitationalLensing", fragmentShader, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, Uniform>([
        ["blackHoleScreenPos", new Uniform(new Vector2(0.5, 0.5))],
        ["lensingStrength", new Uniform(0.09)],
        ["lensingRadius", new Uniform(0.28)],
        ["aspectRatio", new Uniform(1)],
        ["chromaticAberration", new Uniform(0.0035)],
      ]),
    });
  }
}

export const GravitationalLensing = wrapEffect(GravitationalLensingImpl);
