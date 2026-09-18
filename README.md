# HRMS Claude Code Setup

This package contains Claude Code instruction files for the HRMS project.

## Repository layout

Recommended local structure:

```text
hrms/
├── hrms-backend/
│   ├── CLAUDE.md
│   └── ...
├── hrms-frontend/
│   ├── CLAUDE.md
│   └── ...
└── hrms-mobile/
    ├── CLAUDE.md
    └── ...
```

## What to do now

### 1. Backend

Copy `CLAUDE.backend.md` into:

```text
hrms-backend/CLAUDE.md
```

Open Claude Code in the backend repository:

```bash
cd hrms-backend
claude
```

Start with:

```text
Read CLAUDE.md and inspect the entire existing Laravel project before changing anything.

Do not modify code yet.

Give me:
1. current architecture;
2. Laravel/PHP versions;
3. installed packages;
4. authentication flow;
5. authorization/roles/permissions;
6. API route groups;
7. employee/onboarding structure;
8. existing masters;
9. menu API/implementation;
10. database entities and relationships;
11. validation patterns;
12. security risks you can verify;
13. tests and available quality checks.

Do not guess anything. If something cannot be verified, mark it as "not verified".
```

Do not ask Claude to implement everything in the first prompt. First get an inventory.

---

### 2. Frontend

Copy `CLAUDE.frontend.md` into:

```text
hrms-frontend/CLAUDE.md
```

Open Claude Code:

```bash
cd hrms-frontend
claude
```

Use:

```text
Read CLAUDE.md and inspect the existing Next.js/React project.

Do not change code yet.

Audit the frontend against the actual Laravel backend.

Identify:
1. existing pages;
2. missing pages;
3. API client;
4. authentication;
5. route protection;
6. permission handling;
7. menu integration;
8. masters;
9. employee module;
10. forms and validation;
11. loading/error/empty states;
12. API mismatches;
13. TypeScript issues;
14. build/lint/test status.

For every API claim, verify it from the backend repository if that repository is available in this workspace.

Do not invent endpoints.
Do not fix bugs yet.
```

---

### 3. Mobile

Create a separate directory/repository:

```text
hrms-mobile
```

Copy `CLAUDE.mobile.md` into:

```text
hrms-mobile/CLAUDE.md
```

Then create the React Native project using the current React Native setup appropriate for the environment.

Open Claude Code:

```bash
cd hrms-mobile
claude
```

Start with:

```text
Read CLAUDE.md.

Do not implement business features yet.

Inspect the backend and existing web frontend if available.

Create a technical plan for the mobile application based only on verified backend APIs.

First report:
1. authentication flow;
2. API base URL strategy;
3. available user/profile APIs;
4. roles/permissions;
5. menu;
6. masters;
7. employee features;
8. dashboard;
9. leave/attendance features that actually exist;
10. reusable UI requirements;
11. packages needed;
12. any backend API gaps.

Do not invent APIs or mock production functionality.
Do not modify backend/frontend.
```

---

# IMPORTANT: Using Claude Code with TWO EXISTING REPOSITORIES

If the backend and frontend are separate Git repositories, the cleanest workflow is to keep the repositories separate.

However, for API contract auditing, Claude needs access to both repositories.

Recommended workspace:

```text
hrms/
├── hrms-backend/
└── hrms-frontend/
```

Then start Claude Code from the parent directory when you want it to inspect both repositories:

```bash
cd hrms
claude
```

You can still keep separate `CLAUDE.md` files inside each repository.

Use the parent directory for cross-repository tasks such as:

- backend/frontend API matching;
- menu integration;
- master integration;
- employee onboarding end-to-end;
- authentication integration;
- API contract review.

Use the individual repository for isolated work.

---

# MASTER CROSS-REPOSITORY PROMPT

Use this when you want Claude Code to audit and connect backend + frontend:

```text
You are working on an HRMS with two separate repositories:

- hrms-backend: Laravel PHP + MySQL
- hrms-frontend: Next.js + React + TypeScript

Read all applicable CLAUDE.md files before doing anything.

OBJECTIVE:
Make the existing frontend fully functional against the existing backend without breaking working functionality.

STRICT RULES:
1. Inspect before modifying.
2. Backend is the source of truth.
3. Never invent an endpoint, field, table, permission, menu item, role, or response.
4. Do not rewrite working code.
5. Do not refactor unrelated code.
6. Do not change architecture unnecessarily.
7. If you discover an unrelated bug, report it and ask permission before fixing it.
8. If a requested feature requires an API that does not exist, report the API gap instead of mocking it.
9. Preserve existing authentication unless a change is explicitly requested.
10. Validate all user input.
11. Backend authorization is mandatory.
12. Frontend permission checks are for UX, not security.
13. Do not expose secrets.
14. Optimize only where it is justified.
15. Keep each task narrowly scoped.

PHASE 1 — AUDIT ONLY:
Inspect both repositories and produce:

A. Backend API inventory
- authentication;
- users;
- employees;
- employee onboarding/drafts;
- roles/permissions;
- menus;
- masters;
- all major modules;
- CRUD endpoints;
- pagination;
- search/filter;
- request validation;
- response formats.

B. Frontend inventory
- existing pages;
- API client;
- auth;
- route protection;
- menu;
- permissions;
- forms;
- tables;
- masters;
- employee screens.

C. API mismatch report
For every frontend/backend mismatch provide:
- frontend file;
- endpoint expected;
- actual backend endpoint;
- request mismatch;
- response mismatch;
- recommended minimal change.

D. Missing functionality
Separate:
- backend missing;
- frontend missing;
- both missing.

E. Security findings
Only report findings you can verify from code.

DO NOT MODIFY ANY FILE IN PHASE 1.

After the audit, wait for my approval before implementing the identified work.
```

---

# FEATURE IMPLEMENTATION PROMPT

Use this for individual features:

```text
Implement ONLY this feature:

[DESCRIBE FEATURE]

Before coding:
1. inspect the existing implementation;
2. identify exact backend API;
3. identify exact request/response structure;
4. identify authorization;
5. identify validation;
6. identify affected frontend files;
7. provide a short plan.

Rules:
- do not change unrelated code;
- do not rewrite working code;
- do not invent APIs;
- do not invent database fields;
- do not invent permissions;
- reuse existing components/patterns;
- ask permission before fixing unrelated bugs;
- keep the implementation minimal and production-ready.

After implementation:
- run relevant validation;
- report changed files;
- report API usage;
- report tests/checks;
- report known issues.

Feature:
[DESCRIBE FEATURE]
```

---

# BUG FIX PROMPT

Use this when you intentionally want a bug fixed:

```text
Fix ONLY this bug:

[BUG DESCRIPTION]

First inspect and reproduce/trace the issue.

Report:
1. root cause;
2. affected files;
3. why the issue occurs;
4. smallest safe fix;
5. regression risk.

Then implement only the approved fix.

Do not refactor unrelated code.

Run the relevant test/build/type/lint checks.

Report exactly what changed.
```

---

# SECURITY AUDIT PROMPT

Use periodically:

```text
Perform a READ-ONLY security audit of this HRMS project.

Do not modify files.

Inspect:
- authentication;
- authorization;
- roles/permissions;
- IDOR/access-control risks;
- request validation;
- mass assignment;
- SQL/query safety;
- file uploads;
- sensitive data exposure;
- logs;
- secrets;
- CORS;
- CSRF where applicable;
- rate limiting;
- error responses;
- password handling;
- token/session handling;
- dependency risks visible from project files.

For every finding provide:
- severity;
- exact file/location;
- verified evidence;
- impact;
- recommended remediation.

Do not claim a vulnerability without code evidence.
```

---

# END-TO-END VALIDATION PROMPT

After implementing a group of features:

```text
Perform an end-to-end validation of the HRMS.

Do not make unrelated changes.

Verify:
1. authentication;
2. authorization;
3. menu;
4. dashboard;
5. masters;
6. employee CRUD;
7. employee onboarding;
8. employee draft;
9. employee code;
10. forms;
11. server validation;
12. pagination/search;
13. error handling;
14. frontend/backend API compatibility;
15. relevant mobile APIs if mobile is in scope.

Run available tests/type/lint/build checks.

If you find bugs:
- classify them;
- report them;
- do not fix unrelated bugs without permission.

At the end provide a concise verification matrix:
Feature | Backend | Frontend | Mobile | Validation | Status
```

---

# WORKFLOW RECOMMENDATION

Do not ask Claude to "complete the whole HRMS" in one huge operation.

Use this order:

1. **Read-only backend audit**
2. **Read-only frontend audit**
3. **API mismatch report**
4. **Authentication integration**
5. **Menu + permission integration**
6. **Masters**
7. **Employee module**
8. **Onboarding/draft**
9. **Remaining HRMS modules**
10. **Mobile foundation**
11. **Mobile authentication**
12. **Mobile modules**
13. **Security audit**
14. **End-to-end testing**

This reduces accidental changes to working code and makes API mismatches visible early.
