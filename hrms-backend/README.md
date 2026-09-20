# HRMS Backend API

Laravel REST API backend for the HRMS frontend. The backend provides JWT authentication, Google sign-in, role and permission checks, employee account provisioning, login-session tracking, and MySQL persistence.

## Stack

- PHP 8.3+
- Laravel 13
- MySQL 8 or compatible MariaDB
- JWT authentication with `tymon/jwt-auth`
- Custom role and permission tables
- Vite and npm for frontend asset tooling

## Requirements

Install these before starting:

- PHP 8.3 or newer
- Composer
- Node.js and npm
- MySQL or MariaDB
- Git

Check the installed versions in PowerShell:

```powershell
php -v
composer --version
node --version
npm --version
```

## Installation

Open PowerShell and run each command from the project directory:

```powershell
cd D:\Projects\hrms-BE
```

Install PHP dependencies:

```powershell
composer install
```

Install JavaScript dependencies:

```powershell
npm install
```

Create the local environment file:

```powershell
Copy-Item .env.example .env
```

If `.env` already exists, keep it and edit it instead of running the copy command.

Generate the Laravel application key:

```powershell
php artisan key:generate --force
```

Generate the JWT signing secret:

```powershell
php artisan jwt:secret --force
```

Clear cached configuration:

```powershell
php artisan optimize:clear
```

## Database setup

Create a database named `hrms` in MySQL or phpMyAdmin.

For MySQL CLI, use:

```powershell
mysql -u root -p
```

Then run:

```sql
CREATE DATABASE hrms CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci;
EXIT;
```

Update `.env` with the local database credentials:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=hrms
DB_USERNAME=root
DB_PASSWORD=
DB_CHARSET=utf8mb3
DB_COLLATION=utf8mb3_unicode_ci
```

If your MySQL user has a password, set it in `DB_PASSWORD`.

Run all migrations and seed the roles, permissions, and default administrator:

```powershell
php artisan migrate:fresh --seed --force
```

> `migrate:fresh` deletes all existing tables and data. For an existing database, use `php artisan migrate --force` instead.

## Default administrator

The seeder creates the Super Admin account from `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your `.env` (see `.env.example`).
Choose a strong, unique `ADMIN_PASSWORD` before seeding; there is no built-in default password.
The seeder only sets the password when the account is first created, so rotate it manually (Change Password screen) if the account was seeded with a weak value.

## Google sign-in setup

Create a Google OAuth web client in Google Cloud Console and add the frontend origin to the authorized JavaScript origins.

Add the client ID to `.env`:

```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

Clear the cached configuration:

```powershell
php artisan optimize:clear
```

The frontend sends the Google Identity Services ID token to:

```http
POST /api/google-login
```

Request body:

```json
{
  "credential": "GOOGLE_ID_TOKEN",
  "remember_me": true
}
```

Only an existing HRMS user with the same verified Google email can sign in. The backend stores the Google subject ID in `users.google_id`.

## Email setup

Employee creation and onboarding generate a random temporary password and send it to the employee email in-process. The password is never stored or queued, and it is never returned by the API. If delivery fails the API/UI reports it and an administrator must reset the account password from Users.

Do not use `MAIL_MAILER=log` with real accounts: the log mailer writes the full email body, including the temporary password, to `storage/logs`. For local development use a mail catcher such as Mailpit (`MAIL_HOST=127.0.0.1`, `MAIL_PORT=1025`).

To send real email, configure SMTP in `.env`:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=your-smtp-username
MAIL_PASSWORD=your-smtp-password
MAIL_SCHEME=tls
MAIL_FROM_ADDRESS=hr@example.com
MAIL_FROM_NAME="HRMS"
```

Clear cached configuration after changing mail settings:

```powershell
php artisan optimize:clear
```

## Start the backend

Start the Laravel development server:

```powershell
cd D:\Projects\hrms-BE
php artisan serve --host=127.0.0.1 --port=8000
```

The backend health response is available at:

```text
http://127.0.0.1:8000/
```

Expected response:

```json
{
  "success": true,
  "message": "HRMS backend API running"
}
```

Keep the server terminal open while using the frontend or Postman.

## Frontend configuration

Set the Next.js frontend API base URL to:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

For cookie authentication, frontend requests must include credentials:

```javascript
fetch(`${API_URL}/login`, {
  method: "POST",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  },
  body: JSON.stringify({ email, password })
});
```

The login response is read from `response.data`:

```javascript
const response = await api.post("/login", {
  email,
  password
});

const { token, user, expiresIn, provider } = response.data;
```

The backend also sets the JWT as an HTTP-only `token` cookie. Do not expose the HTTP-only cookie value through browser JavaScript. If the frontend uses bearer headers instead, use the returned `data.token` value:

```javascript
await fetch(`${API_URL}/me`, {
  headers: {
    Accept: "application/json",
    Authorization: `Bearer ${response.data.token}`
  }
});
```

## API authentication

### Email login

```http
POST http://127.0.0.1:8000/api/login
Content-Type: application/json
Accept: application/json
```

```json
{
  "email": "admin@example.com",
  "password": "<your ADMIN_PASSWORD>",
  "remember_me": true
}
```

Successful response shape:

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "token": "JWT_TOKEN",
    "user": {},
    "expires_in": 3600,
    "provider": "password"
  }
}
```

### Google login

```http
POST http://127.0.0.1:8000/api/google-login
Content-Type: application/json
Accept: application/json
```

```json
{
  "credential": "GOOGLE_ID_TOKEN",
  "remember_me": true
}
```

Google login returns the same `success`, `message`, and `data` response structure with `provider` set to `google`.

### Protected request

Use either the HTTP-only cookie or a bearer token:

```http
GET http://127.0.0.1:8000/api/me
Authorization: Bearer JWT_TOKEN
Accept: application/json
```

### Logout

```http
POST http://127.0.0.1:8000/api/logout
Authorization: Bearer JWT_TOKEN
Accept: application/json
```

Logout marks the login session inactive and revokes the user token version. A new login also invalidates previous active sessions for that user.

### Refresh token

```http
POST http://127.0.0.1:8000/api/refresh
Authorization: Bearer JWT_TOKEN
Accept: application/json
```

### Menu permissions

```http
GET http://127.0.0.1:8000/api/menus
Authorization: Bearer JWT_TOKEN
Accept: application/json
```

The response contains frontend route access:

```json
{
  "success": true,
  "data": [
    {
      "module": "dashboard",
      "routePath": "/admin/dashboard",
      "access": {
        "edit": false,
        "view": true,
        "delete": false
      }
    }
  ]
}
```

## Create employee and account

An authorized admin creates an employee with:

```http
POST http://127.0.0.1:8000/api/employees
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json
Accept: application/json
```

```json
{
  "employee_id": "EMP-1001",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@company.com",
  "employment_status": "Active",
  "role_id": 5
}
```

The backend automatically:

1. Creates the linked user account.
2. Generates a strong temporary password.
3. Assigns the selected role, or the `Employee` role by default.
4. Sends the temporary credentials to the company email.
5. Sets `must_change_password` to `true`.

The employee must change the temporary password before accessing normal protected APIs.

## Change password

```http
POST http://127.0.0.1:8000/api/change-password
Authorization: Bearer EMPLOYEE_TOKEN
Content-Type: application/json
Accept: application/json
```

```json
{
  "new_password": "NewStrong@123",
  "new_password_confirmation": "NewStrong@123"
}
```

Passwords created through account creation or password change require at least 8 characters, uppercase and lowercase letters, a number, and a special character.

## API response errors

Invalid, expired, revoked, or missing JWT tokens return:

```http
401 Unauthorized
```

```json
{
  "success": false,
  "message": "Invalid or expired token. Please log in again."
}
```

Users with insufficient permissions return:

```http
403 Forbidden
```

Validation errors return:

```http
422 Unprocessable Entity
```

## Testing

Run the focused HRMS API tests:

```powershell
php artisan test --filter=HrmsCoreApiTest
```

Run the complete test suite:

```powershell
php artisan test
```

Run PHP syntax checks for a changed file:

```powershell
php -l app/Http/Controllers/AuthController.php
```

Run Laravel formatting on changed PHP files:

```powershell
vendor\bin\pint --dirty --format agent
```

## Frontend assets

Build the Vite assets:

```powershell
npm run build
```

Start the Vite development watcher:

```powershell
npm run dev
```

## Useful maintenance commands

List all API routes:

```powershell
php artisan route:list --path=api
```

Check migration status:

```powershell
php artisan migrate:status
```

Run the role and permission seeder again:

```powershell
php artisan db:seed --class=RolePermissionSeeder --force
```

Clear all Laravel caches:

```powershell
php artisan optimize:clear
```

Inspect recent application logs:

```powershell
Get-Content storage\logs\laravel.log -Tail 100
```

## Project structure

```text
app/Http/Controllers/       API controllers
app/Http/Requests/          Request validation
app/Http/Resources/         JSON response resources
app/Http/Middleware/        JWT, session, and password middleware
app/Models/                 Eloquent models
app/Mail/                   Employee credential email
database/migrations/        Database schema
 database/seeders/          Roles, permissions, and admin seed data
resources/views/emails/     Email templates
routes/api.php              API routes
routes/web.php              Backend health route
tests/Feature/Api/          API feature tests
```

## Important security notes

- Never commit `.env` or real credentials.
- Production must run with `APP_ENV=production` and `APP_DEBUG=false`. With `APP_DEBUG=true` error responses (including 404/405) expose exception classes, file paths and stack traces.
- Never seed with a shared or default `ADMIN_PASSWORD`; rotate it after the first login.
- Use HTTPS and set `JWT_COOKIE_SECURE=true` in production.
- Set a production `GOOGLE_CLIENT_ID` and restrict its authorized origins.
- Use a real SMTP provider in production instead of the `log` mailer.
- Do not use `php artisan migrate:fresh` on production data.
- Rotate the JWT secret if it is exposed.
