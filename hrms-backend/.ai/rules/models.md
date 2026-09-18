# Models

## `$fillable` allow-list exclusively

All models use `$fillable` for mass assignment protection. Never use `$guarded`.

## Explicit per-query eager loading

Eager loading is done per-query with `->with()` in controllers. Do not add model-level `$with` defaults.
