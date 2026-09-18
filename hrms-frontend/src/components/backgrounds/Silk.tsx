"use client";

import React, { forwardRef, useMemo, useRef, useLayoutEffect, useEffect } from 'react';
import { Canvas, useFrame, useThree, RootState } from '@react-three/fiber';
import { Color, Mesh, ShaderMaterial } from 'three';
import { IUniform } from 'three';

type NormalizedRGB = [number, number, number];

const hexToNormalizedRGB = (hex: string): NormalizedRGB => {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return [r, g, b];
};

// Get color from CSS variable
const getThemeColor = (variable: string): string => {
  if (typeof window !== 'undefined') {
    const color = getComputedStyle(document.documentElement)
      .getPropertyValue(variable)
      .trim();
    return color || '#159adc';
  }
  return '#159adc';
};

interface UniformValue<T = number | Color> {
  value: T;
}

interface SilkUniforms {
  uSpeed: UniformValue<number>;
  uScale: UniformValue<number>;
  uNoiseIntensity: UniformValue<number>;
  uColor: UniformValue<Color>;
  uRotation: UniformValue<number>;
  uTime: UniformValue<number>;
  uDarkMode: UniformValue<number>;
  [uniform: string]: IUniform;
}

const vertexShader = `
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vPosition = position;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;
varying vec3 vPosition;

uniform float uTime;
uniform vec3  uColor;
uniform float uSpeed;
uniform float uScale;
uniform float uRotation;
uniform float uNoiseIntensity;
uniform float uDarkMode;

const float e = 2.71828182845904523536;

float noise(vec2 texCoord) {
  float G = e;
  vec2  r = (G * sin(G * texCoord));
  return fract(r.x * r.y * (1.0 + texCoord.x));
}

vec2 rotateUvs(vec2 uv, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  mat2  rot = mat2(c, -s, s, c);
  return rot * uv;
}

void main() {
  float rnd        = noise(gl_FragCoord.xy);
  vec2  uv         = rotateUvs(vUv * uScale, uRotation);
  vec2  tex        = uv * uScale;
  float tOffset    = uSpeed * uTime;

  tex.y += 0.03 * sin(8.0 * tex.x - tOffset);

  float pattern = 0.6 +
                  0.4 * sin(5.0 * (tex.x + tex.y +
                                   cos(3.0 * tex.x + 5.0 * tex.y) +
                                   0.02 * tOffset) +
                           sin(20.0 * (tex.x + tex.y - 0.1 * tOffset)));

  // Apply dark mode adjustment
  vec3 baseColor = uColor;
  if (uDarkMode > 0.5) {
    // Dark mode: make colors darker and more muted
    baseColor = baseColor * 0.3 + vec3(0.1);
  }
  
  vec4 col = vec4(baseColor, 1.0) * vec4(pattern) - rnd / 15.0 * uNoiseIntensity;
  col.a = 1.0;
  gl_FragColor = col;
}
`;

interface SilkPlaneProps {
  uniforms: SilkUniforms;
}

const SilkPlane = forwardRef<Mesh, SilkPlaneProps>(function SilkPlane({ uniforms }, ref) {
  const { viewport } = useThree();

  useLayoutEffect(() => {
    const mesh = ref as React.MutableRefObject<Mesh | null>;
    if (mesh.current) {
      mesh.current.scale.set(viewport.width, viewport.height, 1);
    }
  }, [ref, viewport]);

  useFrame((_state: RootState, delta: number) => {
    const mesh = ref as React.MutableRefObject<Mesh | null>;
    if (mesh.current) {
      const material = mesh.current.material as ShaderMaterial & {
        uniforms: SilkUniforms;
      };
      material.uniforms.uTime.value += 0.1 * delta;
    }
  });

  return (
    <mesh ref={ref}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} />
    </mesh>
  );
});
SilkPlane.displayName = 'SilkPlane';

export interface SilkProps {
  speed?: number;
  scale?: number;
  color?: string;
  noiseIntensity?: number;
  rotation?: number;
  className?: string;
  useThemeColor?: boolean;
  darkMode?: boolean;
}

const Silk: React.FC<SilkProps> = ({ 
  speed = 3, 
  scale = 0.8, 
  color = '#159adc', 
  noiseIntensity = 1.2, 
  rotation = 0.5,
  className = '',
  useThemeColor = true,
  darkMode = false
}) => {
  const meshRef = useRef<Mesh>(null);
  const [themeColor, setThemeColor] = React.useState(color);

  // Get theme color on client side
  useEffect(() => {
    if (useThemeColor && typeof window !== 'undefined') {
      // Try to get primary color from CSS variables
      const primaryColor = getThemeColor('--color-primary');
      if (primaryColor) {
        setThemeColor(primaryColor);
      }
    }
  }, [useThemeColor]);

  const uniforms = useMemo<SilkUniforms>(
    () => ({
      uSpeed: { value: speed },
      uScale: { value: scale },
      uNoiseIntensity: { value: noiseIntensity },
      uColor: { value: new Color(...hexToNormalizedRGB(themeColor)) },
      uRotation: { value: rotation },
      uTime: { value: 0 },
      uDarkMode: { value: darkMode ? 1 : 0 }
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [themeColor, darkMode]
  );

  useEffect(() => {
    uniforms.uSpeed.value = speed;
    uniforms.uScale.value = scale;
    uniforms.uNoiseIntensity.value = noiseIntensity;
    uniforms.uColor.value.setRGB(...hexToNormalizedRGB(themeColor));
    uniforms.uRotation.value = rotation;
    uniforms.uDarkMode.value = darkMode ? 1 : 0;
  }, [speed, scale, noiseIntensity, themeColor, rotation, darkMode, uniforms]);

  // Listen for theme changes (dark mode toggle)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      uniforms.uDarkMode.value = isDark ? 1 : 0;
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, [uniforms]);

  return (
    <div className={`fixed inset-0 -z-10 ${className}`}>
      <Canvas dpr={[1, 2]} frameloop="always">
        <SilkPlane ref={meshRef} uniforms={uniforms} />
      </Canvas>
    </div>
  );
};

export default Silk;