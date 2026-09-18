# Services

## Helpers for primitives, facades for services

Use global helpers (`config()`, `auth()`, `response()`, `now()`) for primitive values and simple lookups. Use facades (`Hash::`, `JWTAuth::`, `Http::`, `Mail::`, `DB::`, `Log::`) for service operations.

## Named rate limiters via `RateLimiter::for()`

Define rate limiters in `AppServiceProvider::boot()` with `RateLimiter::for()` and reference them by name in route middleware (e.g. `throttle:login`).
