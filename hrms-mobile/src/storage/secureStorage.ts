// src/storage/secureStorage.ts
//
// The JWT is the only sensitive value this app persists. It goes in
// expo-secure-store (Keychain on iOS, Keystore-backed EncryptedSharedPreferences
// on Android) - never AsyncStorage/plain storage. Everything else (the
// current user) is re-fetched from GET /api/me on app start rather than
// cached, so the backend stays the single source of truth and nothing
// else sensitive needs to be stored on-device.
import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "hrms_access_token";
const REFRESH_TOKEN_KEY = "hrms_refresh_token";

export const tokenStorage = {
  get: () => SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
  set: (token: string) => SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token),
  clear: () => SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
};

// The rotating refresh token lives in the same secure store; it is only ever
// read by the API client to renew the access token, never by UI code.
export const refreshTokenStorage = {
  get: () => SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  set: (token: string) => SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token),
  clear: () => SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
};
