"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const NODE_COUNT = 70;
const LINK_DISTANCE = 1.9;

function Network({ animate }: { animate: boolean }) {
  const group = useRef<THREE.Group>(null);
  const mouse = useRef({ x: 0, y: 0 });

  const { positions, linePositions } = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    // Deterministic pseudo-random layout (stable across renders, pure).
    let seed = 7;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < NODE_COUNT; i++) {
      pts.push(
        new THREE.Vector3((rnd() - 0.5) * 11, (rnd() - 0.5) * 7, (rnd() - 0.5) * 5),
      );
    }
    const pos = new Float32Array(NODE_COUNT * 3);
    pts.forEach((p, i) => p.toArray(pos, i * 3));

    const lines: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        if (pts[i].distanceTo(pts[j]) < LINK_DISTANCE) {
          lines.push(...pts[i].toArray(), ...pts[j].toArray());
        }
      }
    }
    return { positions: pos, linePositions: new Float32Array(lines) };
  }, []);

  const pointsGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  const linesGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    return g;
  }, [linePositions]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      pointsGeo.dispose();
      linesGeo.dispose();
    };
  }, [pointsGeo, linesGeo]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g || !animate) return;
    g.rotation.y += delta * 0.04;
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, mouse.current.y * 0.12, 0.03);
    state.camera.position.x = THREE.MathUtils.lerp(
      state.camera.position.x,
      mouse.current.x * 0.5,
      0.03,
    );
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <group ref={group}>
      <lineSegments geometry={linesGeo}>
        <lineBasicMaterial color="#5b9bd5" transparent opacity={0.22} />
      </lineSegments>
      <points geometry={pointsGeo}>
        <pointsMaterial color="#9ccbff" size={0.05} sizeAttenuation transparent opacity={0.9} />
      </points>
    </group>
  );
}

export default function NetworkScene({ animate = true }: { animate?: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 7], fov: 55 }}
      gl={{ antialias: false, powerPreference: "low-power", alpha: true }}
      frameloop={animate ? "always" : "demand"}
    >
      <Network animate={animate} />
    </Canvas>
  );
}
