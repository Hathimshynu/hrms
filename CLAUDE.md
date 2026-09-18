# HRMS Claude Code – Master Development Rules

## Project

This is an HRMS application with separate repositories:

- `hrms-backend` — Laravel PHP + MySQL REST API
- `hrms-frontend` — Next.js + React web application
- `hrms-mobile` — React Native mobile application

The backend is the source of truth for API contracts, authentication, authorization, validation rules, entities, masters, menus, and business rules.

---

# 1. NON-NEGOTIABLE RULES

### 1.1 Inspect before changing

Before writing or modifying code:

1. Inspect the existing project structure.
2. Inspect the relevant files.
3. Trace the current implementation and its dependencies.
4. Check routes, controllers, services, models, migrations, requests, resources, middleware, policies, permissions, and frontend API usage as applicable.
5. Reuse existing patterns where they are already working.
6. Do not invent APIs, fields, database columns, permissions, routes, or business rules.

If the requested functionality already exists, extend it instead of creating a duplicate implementation.

### 1.2 Do not break working code

- Do not refactor unrelated code.
- Do not rename working files, routes, database columns, components, functions, or API fields unless explicitly required.
- Do not replace a working architecture merely because another architecture is preferred.
- Keep changes scoped to the requested task.
- Preserve backward compatibility where practical.
- Do not perform broad cleanup while implementing a feature.

### 1.3 Bug handling requires permission

If you discover a bug that is outside the requested task:

1. Report the bug clearly.
2. Explain the likely cause and affected area.
3. Do NOT modify it automatically.
4. Ask for permission before fixing it.

Exception: a defect that must be changed to complete the exact requested task safely may be fixed, but explain the change before/while making it.

### 1.4 Never hallucinate

Never assume that:

- an endpoint exists;
- a database table exists;
- a field exists;
- a permission exists;
- a menu exists;
- a role exists;
- a package is installed;
- an environment variable exists;
- an API response has a particular shape;
- authentication works in a particular way;
- a mobile/web feature already exists.

Verify from the repository.

If something cannot be verified, say exactly what is missing and ask for the required information instead of guessing.

---

# 2. TASK EXECUTION PROTOCOL

For every task, follow this sequence:

## Step A — Understand

Restate the requested scope briefly.

## Step B — Inspect

Identify:

- relevant files;
- existing implementation;
- dependencies;
- API contract;
- database impact;
- authorization impact;
- validation impact;
- frontend/mobile impact.

## Step C — Plan

Create a short implementation plan.

For larger tasks, show:

- files to create;
- files to modify;
- database changes;
- API changes;
- frontend changes;
- mobile changes;
- tests.

## Step D — Permission gate

If the task would require changing unrelated working code, stop and ask for permission.

If you find unrelated bugs, report them and ask before fixing.

## Step E — Implement

Make the smallest safe change that completes the task.

## Step F — Validate

Run the narrowest useful validation first, then broader validation when appropriate.

Examples:

### Laravel

- PHP syntax checks where useful
- Laravel tests
- route checks
- static analysis if configured
- migration/schema validation
- endpoint/auth/authorization tests

### Next.js

- TypeScript check
- ESLint if configured
- production build when practical
- API integration validation

### React Native

- TypeScript check
- lint/tests if configured
- platform build when practical

## Step G — Report

At the end, report:

1. What changed.
2. Files changed.
3. APIs added/changed.
4. Database changes.
5. Validation/tests executed.
6. Any known issue.
7. Any unrelated bug discovered but NOT changed.
8. Any manual step still required.

---

# 3. SECURITY FIRST

This is an HRMS. Treat employee data as sensitive business information.

## Backend security

Use defense in depth:

- authentication;
- authorization;
- role/permission checks;
- request validation;
- policy/gate checks where appropriate;
- mass-assignment protection;
- output/API resources;
- rate limiting for sensitive endpoints;
- secure password handling;
- secure token/session handling;
- CSRF protection where applicable to cookie authentication;
- CORS restrictions;
- secure headers where appropriate;
- audit logging for sensitive actions;
- database constraints;
- transaction boundaries for multi-step writes;
- safe file upload validation;
- no sensitive data in logs;
- no secrets committed to Git.

Never expose:

- password hashes;
- authentication secrets;
- private tokens;
- refresh/access tokens in ordinary API payloads unless the existing verified architecture requires it;
- database credentials;
- encryption keys;
- unnecessary employee-sensitive information.

Do not log passwords, tokens, OTPs, or credentials.

## Frontend/mobile security

Never put:

- database credentials;
- Laravel app secrets;
- private API keys;
- signing secrets;
- service-account credentials

in client-side code.

Assume anything bundled into a web/mobile client can be inspected.

Use secure storage mechanisms appropriate to the existing authentication architecture.

Do not store sensitive authentication material in insecure browser storage when the verified architecture supports safer mechanisms.

Never bypass authorization in the UI as a substitute for backend authorization.

The backend must enforce access control.

---

# 4. VALIDATION STANDARD

Validation must exist at the correct layers.

## Backend

Validate all client-controlled input with Laravel Form Requests or the project's established validation pattern.

Check:

- required/nullable rules;
- type;
- format;
- length;
- numeric boundaries;
- enum/status values;
- unique constraints;
- foreign keys;
- authorization;
- business rules;
- cross-field dependencies;
- file MIME/type/size where applicable.

Never trust frontend validation alone.

## Frontend

Provide:

- required-field validation;
- correct input types;
- useful error messages;
- loading states;
- disabled submit while processing;
- server validation error display;
- network error handling;
- empty states;
- success feedback;
- retry behavior where appropriate.

Frontend validation must match the backend contract. Do not silently invent different business rules.

## Mobile

Use the same backend contract and business rules.

Do not duplicate complex business logic in a way that can diverge from the backend.

---

# 5. API-FIRST INTEGRATION

The backend is the source of truth.

Before creating or modifying frontend/mobile screens:

1. Inspect backend routes.
2. Inspect controller actions.
3. Inspect Form Requests.
4. Inspect Resources/Transformers.
5. Inspect Models/relationships.
6. Inspect Services/Actions.
7. Inspect migrations.
8. Inspect authorization/policies/permissions.
9. Determine actual request and response shapes.
10. Confirm authentication flow.

Then implement the client.

Do NOT create a fake/mock endpoint just because the frontend needs one.

If an endpoint is genuinely missing, state that and propose the backend change.

---

# 6. HRMS MASTERS AND MENU

The UI must reflect the actual backend.

Typical HRMS masters may include departments, designations, employment types, locations, shifts, leave types, holiday settings, etc., but DO NOT create any master merely because it is typical.

First inspect the backend.

For each existing master:

- identify CRUD endpoints;
- identify list/search/filter/pagination behavior;
- identify permissions;
- identify validation;
- build or complete the frontend page;
- connect it to the real API;
- handle loading/error/empty states;
- use reusable components.

For menus:

- inspect the backend menu/permission model and existing menu API;
- do not hard-code permissions that already come from the backend;
- render only authorized modules;
- ensure direct URL navigation is also protected;
- never treat hidden UI as authorization.

---

# 7. EMPLOYEE ONBOARDING

Employee onboarding is a high-risk HRMS workflow.

Before changing it, inspect:

- employee tables;
- user/account tables;
- employee code generation;
- draft functionality;
- onboarding stages;
- roles/permissions;
- credential generation;
- email jobs/mails;
- transactions;
- unique constraints;
- audit requirements.

Preserve existing employee-code and onboarding behavior unless the requested task explicitly changes it.

For multi-table onboarding, use database transactions where appropriate so partial employee creation does not leave inconsistent records.

Never expose generated passwords or credentials unnecessarily.

---

# 8. DATABASE RULES

Before migrations:

- inspect existing schema;
- check naming conventions;
- check foreign keys;
- check indexes;
- check unique constraints;
- check soft-delete strategy;
- check existing data compatibility.

Do not alter or drop production-sensitive columns without explicit approval.

Prefer additive, backward-compatible migrations where possible.

Do not modify existing data through a migration unless the task explicitly requires it and the migration is safe and reversible where practical.

---

# 9. PERFORMANCE

Prioritize correctness first, then measurable optimization.

Backend:

- eager load required relationships;
- avoid N+1 queries;
- paginate large lists;
- select only required columns when appropriate;
- use indexes for real query patterns;
- cache only where justified;
- avoid unnecessary repeated queries;
- use queues for expensive asynchronous work where the existing architecture supports them.

Frontend:

- avoid unnecessary re-renders;
- reuse components;
- debounce expensive search/filter requests;
- paginate large datasets;
- avoid duplicate API requests;
- use Next.js server/client boundaries appropriately;
- lazy-load genuinely heavy UI where useful.

Mobile:

- paginate large lists;
- avoid loading huge datasets;
- use FlatList/optimized list rendering;
- cache only when appropriate;
- handle offline/network states without corrupting data.

Do not introduce complicated optimization without evidence.

---

# 10. ERROR HANDLING

Use the project's existing error-response format if one exists.

Never hide server errors silently.

Frontend/mobile should distinguish:

- validation errors;
- authentication failures;
- authorization failures;
- not found;
- conflict/business-rule errors;
- rate limits;
- network failures;
- unexpected server errors.

Do not expose stack traces or internal implementation details to users.

---

# 11. AUTHENTICATION AND AUTHORIZATION

Do not assume JWT, Sanctum, OAuth, cookie sessions, or any other authentication mechanism.

Inspect the backend and preserve the existing verified mechanism.

For authenticated API calls:

- centralize client configuration;
- handle unauthorized responses consistently;
- avoid duplicating token logic across pages;
- enforce permissions server-side;
- protect frontend routes;
- protect mobile navigation where appropriate.

If the repository already uses HTTP-only cookies, do not replace that with localStorage tokens.

If the repository uses another verified mechanism, follow it unless the task explicitly requests an architecture change.

---

# 12. FILE UPLOADS

For employee documents/images:

Backend must validate:

- MIME/type;
- extension;
- size;
- authorization;
- storage location;
- filename/path safety.

Never trust the original filename.

Do not expose private employee documents publicly.

Use authorized download/view endpoints when private storage is required.

---

# 13. FRONTEND ARCHITECTURE

Before adding a component, find the existing pattern.

Prefer:

- reusable form components;
- reusable table/list components;
- centralized API client;
- centralized error handling;
- typed API models;
- consistent loading states;
- consistent confirmation dialogs;
- consistent toast/notification handling;
- consistent pagination/filtering.

Do not duplicate the same API call or UI logic across many pages when an existing abstraction is available.

Do not migrate the whole application to a new state-management library unless explicitly requested.

---

# 14. MOBILE APP

Create `hrms-mobile` as a separate React Native application.

Before implementation, inspect the backend and web frontend to understand:

- authentication;
- API base URL;
- employee/user data;
- roles/permissions;
- menus;
- masters;
- dashboard;
- attendance/leave/profile features that actually exist.

Use the backend API rather than creating a separate mobile backend unless explicitly requested.

Recommended baseline:

- React Native with TypeScript;
- a maintained navigation solution;
- centralized API client;
- typed API models;
- secure credential/token storage compatible with the verified backend authentication model;
- reusable form components;
- reusable list/table-like mobile components;
- environment-based API URL configuration.

Do not invent native modules or packages without checking whether they are already installed/compatible.

If a mobile feature requires backend functionality that does not exist, stop and report the API gap rather than mocking production behavior.

---

# 15. ENVIRONMENT AND SECRETS

Never commit:

- `.env`;
- API secrets;
- private keys;
- database passwords;
- JWT secrets;
- OAuth client secrets;
- production credentials.

Maintain `.env.example` with placeholders only.

Before changing environment variables, inspect the current configuration.

---

# 16. GIT SAFETY

Before large changes:

- inspect `git status`;
- inspect the current branch;
- avoid overwriting unrelated local work;
- do not reset/rebase/delete work unless explicitly requested.

Never run destructive commands such as:

- `git reset --hard`;
- deleting branches;
- deleting migrations;
- dropping databases;

without explicit permission.

Do not modify generated lockfiles/dependencies unnecessarily.

---

# 17. DEPENDENCIES

Before installing a package:

1. Check whether the functionality already exists.
2. Check installed dependencies.
3. Prefer existing dependencies.
4. If a new dependency is genuinely needed, explain why.
5. Check compatibility with the project's current framework/version.

Do not upgrade major framework/package versions as part of an unrelated feature.

---

# 18. COMPLETION CRITERIA

A feature is not complete merely because the UI exists.

For a normal HRMS feature, verify as applicable:

- database/schema;
- migration;
- model;
- relationship;
- request validation;
- service/action;
- controller;
- route;
- authorization;
- resource/response;
- frontend API integration;
- frontend page/form/list;
- loading/error/empty states;
- mobile API integration if requested;
- mobile screen if requested;
- tests;
- build/type/lint checks.

Only mark it complete when the actual end-to-end path is connected.

---

# 19. COMMUNICATION FORMAT

Before implementation:

```text
Task:
Scope:
Existing implementation found:
Files likely affected:
API/database impact:
Security/authorization impact:
Plan:
```

After implementation:

```text
Completed:
Files changed:
API changes:
Database changes:
Validation:
Tests/checks:
Known issues:
Unrelated bugs found (not fixed):
Manual steps:
```

If permission is required:

```text
I found an unrelated issue:

File:
Problem:
Impact:
Why it is outside the requested task:

I have NOT changed it.
May I fix this separately?
```

---

# 20. IMPORTANT FINAL RULE

Optimize for:

**verified → minimal change → secure → validated → working**

Not:

**guess → rewrite → hope it works**
