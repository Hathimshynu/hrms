"use client";

import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/src/hooks/useAuth";

// Public OAuth client id (never a secret). Must equal the backend's
// GOOGLE_CLIENT_ID, which validates the token audience.
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GSI_SRC = "https://accounts.google.com/gsi/client";

interface GsiCredentialResponse {
  credential?: string;
}

interface GsiApi {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (r: GsiCredentialResponse) => void;
      }) => void;
      renderButton: (el: HTMLElement, options: Record<string, unknown>) => void;
    };
  };
}

function loadGsi(): Promise<GsiApi> {
  const w = window as unknown as { google?: GsiApi };
  if (w.google?.accounts?.id) return Promise.resolve(w.google);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", () => resolve((window as unknown as { google: GsiApi }).google));
    script.addEventListener("error", () => reject(new Error("Google script failed to load")));
    if (!existing) {
      script.src = GSI_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
  });
}

export function GoogleSignIn({ rememberMe }: { rememberMe: boolean }) {
  const { googleLogin } = useAuth();
  const holder = useRef<HTMLDivElement>(null);
  const rememberRef = useRef(rememberMe);
  const [failed, setFailed] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    rememberRef.current = rememberMe;
  }, [rememberMe]);

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;

    loadGsi()
      .then((google) => {
        if (cancelled || !holder.current) return;
        google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: async (response) => {
            if (!response.credential) return;
            setMessage("");
            try {
              await googleLogin({
                id_token: response.credential,
                remember_me: rememberRef.current,
              });
            } catch {
              setMessage("Google sign-in was rejected. Please try again or use your email.");
            }
          },
        });
        google.accounts.id.renderButton(holder.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          logo_alignment: "left",
          width: 320,
        });
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
    };
    // googleLogin identity changes per render; the callback only needs the latest via closure at init.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!CLIENT_ID) {
    return (
      <p className="text-center text-xs text-gray-500">
        Google sign-in is not configured for this environment.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={holder} className="flex min-h-11 justify-center" />
      {failed && (
        <p className="text-center text-xs text-red-600">
          Google sign-in could not be loaded. Use your email and password instead.
        </p>
      )}
      {message && (
        <p role="alert" className="text-center text-xs text-red-600">
          {message}
        </p>
      )}
    </div>
  );
}
