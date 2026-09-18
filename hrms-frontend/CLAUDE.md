# HRMS Frontend — Claude Code Instructions

Read the root `../CLAUDE.md` first if it exists.

## Stack

Expected project:

- Next.js
- React
- TypeScript

Inspect `package.json` before assuming versions or libraries.

## API-first rule

The Laravel backend is the source of truth.

Before implementing a page:

1. inspect backend routes;
2. inspect request validation;
3. inspect response/resource structure;
4. inspect permissions;
5. inspect pagination/filtering;
6. inspect existing frontend API client;
7. reuse existing frontend patterns.

Never create fake API endpoints to make a page appear functional.

## Page completion

Every requested page should be connected end-to-end.

Check:

- route;
- API client;
- TypeScript types;
- list;
- create;
- edit;
- view;
- delete/deactivate;
- validation;
- pagination;
- search/filter;
- loading;
- empty state;
- API errors;
- success feedback;
- authorization/permission visibility.

Only implement operations that the backend actually supports.

## Forms

Use the existing form/validation library if one exists.

Frontend validation should mirror backend validation.

Always handle server-side validation errors.

Prevent duplicate submission.

Show meaningful field-level errors.

## Authentication

Inspect the current authentication implementation before changing it.

Do not replace:

- HTTP-only cookie authentication;
- JWT;
- Sanctum;
- OAuth;

with another mechanism unless explicitly requested.

If cookies are used, preserve the existing credentials/CORS/CSRF configuration.

Do not put secrets in client-side environment variables.

Remember: `NEXT_PUBLIC_*` values are exposed to the browser.

## Authorization

UI permission checks improve UX but do not provide security.

The Laravel backend must enforce authorization.

Handle 401/403 consistently.

Do not expose pages/modules merely because the user manually enters the URL.

## Menus

Build the application menu from the actual backend menu/permission response when that API exists.

Do not duplicate permission rules in many components.

If the backend has no menu API, report the gap before inventing one.

## Masters

Discover masters from backend routes/controllers/migrations.

Build reusable CRUD screens only for actual backend entities.

Use shared:

- table;
- form;
- modal/drawer;
- pagination;
- search;
- confirmation;
- toast;
- error handling

patterns already present in the project.

## Employee module

Before changing employee pages, inspect:

- employee API;
- employee code behavior;
- draft/onboarding API;
- user/account relationship;
- roles;
- departments;
- designations;
- documents;
- validation.

Do not duplicate employee-code generation on the frontend.

## API client

Use one centralized API configuration/pattern.

Do not scatter raw `fetch`/Axios configuration across pages if the project already has a shared client.

Handle:

- base URL;
- credentials;
- common headers;
- 401;
- 403;
- validation errors;
- network errors.

## Next.js

Respect the project's current App Router/Pages Router architecture.

Do not migrate the whole project.

Use Server Components/Client Components according to the existing architecture and actual browser-interaction requirements.

Avoid unnecessary client-side fetching when an established server-side pattern is already used.

## Performance

Avoid:

- unnecessary `useEffect`;
- duplicate API calls;
- huge client-side datasets;
- unnecessary global state;
- repeated expensive renders.

Use pagination for large HRMS lists.

Debounce server-side search when appropriate.

## Security

Never expose:

- database credentials;
- backend secrets;
- private API keys;
- JWT signing secrets;
- OAuth client secrets.

Do not trust client-side role/permission state for security decisions.

Sanitize/render untrusted content safely.

Do not display sensitive employee information unless authorized by the backend response and current user's permissions.

## Validation

Before completion, run appropriate checks from `package.json`, for example:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Only run commands that exist in the project.

## Do not change working code

If you discover unrelated UI/API bugs:

- document them;
- do not fix them;
- ask for permission.

If a bug directly blocks the requested feature, explain why the change is required.

## Definition of done

A frontend feature is complete only when it:

- uses the real backend API;
- matches the backend request/response contract;
- validates input;
- handles errors;
- respects permissions;
- handles loading/empty states;
- works on the relevant screen sizes;
- passes available type/lint/build checks.
