# Validation

## Form Request classes exclusively

All validation is done via Form Request classes in `app/Http/Requests/`. Never use inline `$request->validate()` or `Validator::make()` in controllers.

## Custom messages via FormRequest `messages()` method

Custom validation messages are defined in the Form Request's `messages()` method, not in `lang/*/validation.php` files.

## Typed input retrieval exclusively

Use typed getters (`$request->string()`, `$request->integer()`, `$request->boolean()`) for all request input. Never use magic properties like `$request->search` or `$request->input()`.
