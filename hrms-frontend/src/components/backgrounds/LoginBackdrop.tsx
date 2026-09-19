"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const NetworkScene = dynamic(() => import("./NetworkScene"), { ssr: false });

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void) => number;
  cancelIdleCallback?: (handle: number) => void;
};

function canUseWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Decorative layer only. The CSS gradient is always present (and is the
 * whole fallback); the WebGL scene loads after the page is idle so it can
 * never delay the login form.
 */
export function LoginBackdrop() {
  const [enabled, setEnabled] = useState(false);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const nav = navigator as Navigator & {
      connection?: { saveData?: boolean };
      deviceMemory?: number;
    };
    const lowEnd =
      nav.connection?.saveData ||
      (nav.hardwareConcurrency ?? 8) <= 2 ||
      (nav.deviceMemory ?? 8) <= 2;

    if (lowEnd || !canUseWebGL()) return;

    const start = () => {
      setAnimate(!reduced.matches);
      setEnabled(true);
    };
    const w = window as IdleWindow;
    const hasIdle = typeof w.requestIdleCallback === "function";
    const handle = hasIdle
      ? (w.requestIdleCallback as (cb: () => void) => number)(start)
      : window.setTimeout(start, 300);

    return () => {
      if (hasIdle) w.cancelIdleCallback?.(handle);
      else clearTimeout(handle);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="login-gradient absolute inset-0" />
      {enabled && (
        <div className="absolute inset-0 animate-[fade-in_1.2s_ease-out_both]">
          <NetworkScene animate={animate} />
        </div>
      )}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(3,10,25,0.55)_100%)]" />
    </div>
  );
}
