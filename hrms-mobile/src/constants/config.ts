// src/constants/config.ts
//
// Resolves the Laravel backend base URL for every dev target without
// hardcoding a developer's machine into the app:
//   - EXPO_PUBLIC_API_BASE_URL always wins when set (dev or prod) - this is
//     the ONLY reliable path when running `expo start --tunnel`, since the
//     tunnel host below only proxies Metro's own port, not the Laravel
//     backend's port, and must not be reused as if it were a real LAN IP.
//   - Physical device on LAN mode (Expo Go/dev client): derived from
//     Expo's own dev server host (Constants.expoConfig.hostUri), since the
//     phone and the dev machine share the same LAN in that setup -
//     "localhost" on the phone means the phone itself, not the dev machine.
//   - Android emulator: 10.0.2.2 is the documented special alias Android
//     provides for the host machine's loopback - plain localhost does not
//     reach it.
//   - iOS simulator: shares the host's network namespace, localhost works.
import Constants from "expo-constants";
import { Platform } from "react-native";

const BACKEND_PORT = 8000;

// Tunnel hosts (expo start --tunnel) look like "xxxx-xxxx.exp.direct" or an
// ngrok domain - never a bare IPv4 address. Reusing one as the backend host
// would silently point at a URL that can never reach Laravel, so treat it
// as "unknown" and fall through to the emulator/simulator defaults instead
// of confidently constructing a guaranteed-wrong URL.
function looksLikeLanIp(host: string): boolean {
  return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host);
}

function resolveDevBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envUrl) return envUrl;

  const hostUri =
    Constants.expoConfig?.hostUri ??
    // Older Expo Go manifest shape, kept as a fallback only.
    (Constants as unknown as { manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } } })
      .manifest2?.extra?.expoGo?.debuggerHost;

  const host = hostUri?.split(":")[0];

  if (host && looksLikeLanIp(host)) {
    return `http://${host}:${BACKEND_PORT}/api`;
  }

  if (Platform.OS === "android") {
    return `http://10.0.2.2:${BACKEND_PORT}/api`;
  }

  return `http://localhost:${BACKEND_PORT}/api`;
}

export const API_BASE_URL = __DEV__
  ? resolveDevBaseUrl()
  : (process.env.EXPO_PUBLIC_API_BASE_URL ?? "");

if (__DEV__) {
  // Safe to log - no credentials involved, just the resolved host. Shows
  // up in the Metro/Expo terminal to make "why can't it reach the backend"
  // instantly diagnosable instead of guessing.
  // eslint-disable-next-line no-console
  console.log(`[config] API_BASE_URL resolved to: ${API_BASE_URL}`);
}

if (!__DEV__ && !API_BASE_URL) {
  // eslint-disable-next-line no-console
  console.warn(
    "EXPO_PUBLIC_API_BASE_URL is not configured for this production build."
  );
}

export const REQUEST_TIMEOUT_MS = 15000;
