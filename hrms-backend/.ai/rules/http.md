# HTTP

## `response()->json()` with `success`/`message`/`data` envelope

API responses use `response()->json()` with a consistent envelope: `['success' => true, 'message' => '...', 'data' => ...]`. API Resource classes (like `UserResource`) are used selectively for complex objects; most responses are built inline.

## Unconditional relationship access in resources

Resource classes access relationships directly (e.g. `$this->role`) without `whenLoaded()` guards.
