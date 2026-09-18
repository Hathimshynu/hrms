# Testing

## PHPUnit classes, not Pest

Tests are written as PHPUnit classes extending `TestCase`. Do not use Pest syntax (`it()`, `test()`, `expect()`).

## Array-based JSON assertions

Use `assertJsonPath`, `assertJsonStructure`, and `assertJsonValidationErrors` for API response assertions. Do not use `AssertableJson`.

## Factories + manual role/permission setup

Use model factories (e.g. `User::factory()->create()`) for test-owned records. Set up roles and permissions manually with `Role::firstOrCreate()` and `givePermissionTo()`.
