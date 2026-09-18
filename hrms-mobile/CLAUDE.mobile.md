# HRMS Mobile — Claude Code Instructions

Read the root `../CLAUDE.md` first if it exists.

## Project

Create/maintain a separate React Native + TypeScript application:

`hrms-mobile`

Do not modify the web or backend repository merely to create the mobile shell.

## Backend-first

The Laravel backend is the source of truth.

Before creating a mobile feature, inspect the backend for:

- routes;
- authentication;
- user/profile endpoints;
- roles/permissions;
- menu API;
- masters;
- employee endpoints;
- dashboard;
- leave/attendance features;
- file/document endpoints.

Do not mock production APIs.

If the required endpoint does not exist, report the API gap.

## Existing mobile setup

Before adding packages or changing architecture:

- inspect `package.json`;
- inspect navigation;
- inspect API client;
- inspect environment configuration;
- inspect existing components;
- inspect authentication;
- inspect secure storage.

Reuse existing packages and patterns.

## Authentication

Follow the backend's actual authentication architecture.

Do not assume that a web HTTP-only cookie flow can be copied directly to a native app.

If mobile requires a different token/session transport, verify the backend's supported approach before implementation.

Never store sensitive credentials insecurely.

Never hard-code production credentials.

## Navigation

Create navigation based on actual authorized application modules.

If the backend supplies a permission/menu response, use it to control available modules.

Navigation visibility is not authorization; the backend remains authoritative.

## Screens

For every screen implement:

- loading state;
- empty state;
- error state;
- retry;
- validation;
- success feedback;
- unauthorized handling;
- network handling.

For large lists:

- pagination;
- efficient list rendering;
- pull-to-refresh where appropriate.

## Forms

Use the existing validation pattern if present.

Do not duplicate complex backend business rules.

Display server validation errors clearly.

Prevent duplicate submissions.

## API client

Use one centralized API client.

It should consistently handle:

- base URL;
- authentication;
- request headers;
- response parsing;
- 401;
- 403;
- validation errors;
- network errors.

## Mobile security

Do not put:

- database passwords;
- Laravel secrets;
- private API keys;
- signing secrets;
- OAuth client secrets

inside the mobile application.

Anything shipped in the application can potentially be inspected.

## Performance

Prefer:

- FlatList for large lists;
- pagination;
- memoization only where useful;
- minimal re-renders;
- request cancellation/cleanup where appropriate;
- small payloads.

Do not add complicated caching unless requirements justify it.

## Platform support

Before adding native dependencies, verify Android/iOS compatibility with the installed React Native version.

Do not blindly upgrade React Native.

## Validation

Run the checks that actually exist in the project.

Typical checks:

```bash
npx tsc --noEmit
npm run lint
npm test
```

For native builds, use the project's documented Android/iOS commands.

## Scope safety

Do not modify the backend or web application for unrelated reasons.

If you find an unrelated bug:

1. report it;
2. explain impact;
3. ask permission before fixing.

## Definition of done

A mobile feature is complete when it is connected to the real backend, validates input, handles errors/loading/empty states, respects authorization, and passes the available checks.
