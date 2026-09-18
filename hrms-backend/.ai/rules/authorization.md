# Authorization

## spatie/laravel-permission with custom `can()` override

Authorization uses spatie/laravel-permission. The User model overrides `can()` to query permissions directly. There are no Gates or Policy classes. Use `permission:name` middleware on routes for access control.
