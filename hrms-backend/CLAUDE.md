# HRMS Backend — Claude Code Rules

## 1. Instruction priority

Follow these project instructions together:

1. This `CLAUDE.md`
2. Existing `AGENTS.md`
3. `.ai/rules/index.md` and every applicable rule
4. Existing project conventions and implementation

Never bypass an applicable `.ai/rules` instruction.

## 2. Inspect before modifying

Before changing code:

- inspect the existing implementation;
- inspect related controllers/services/models;
- inspect routes;
- inspect Form Requests;
- inspect Resources;
- inspect policies/permissions;
- inspect migrations;
- inspect tests;
- inspect sibling implementations.

Never guess.

## 3. Do not break existing functionality

Only modify code required for the requested task.

Do not:

- refactor unrelated code;
- rename unrelated files;
- change working API contracts;
- upgrade dependencies;
- redesign architecture;
- modify unrelated database structures.

## 4. Unrelated bugs

If you find an unrelated bug:

1. stop before changing it;
2. explain the problem;
3. explain the affected area;
4. ask permission.

Do not silently fix unrelated bugs.

If a bug directly blocks the requested feature, explain why the change is necessary.

## 5. Backend is API source of truth

Frontend and mobile functionality must be based on actual Laravel APIs.

Before creating a client integration verify:

- route;
- HTTP method;
- middleware;
- authentication;
- authorization;
- request fields;
- validation;
- response structure;
- pagination;
- relationships;
- error format.

Never invent an endpoint.

## 6. HRMS security

For every sensitive operation verify:

- authentication;
- authorization;
- role/permission;
- ownership/access scope;
- validation;
- mass assignment;
- database constraints;
- sensitive response fields;
- file access;
- audit requirements where applicable.

Frontend authorization is never a substitute for backend authorization.

## 7. Employee data

Treat employee information as sensitive.

Do not expose:

- passwords;
- password hashes;
- authentication secrets;
- private documents;
- unnecessary personal information;
- tokens/secrets.

Employee documents must remain protected by authorization.

## 8. Employee code

If an existing EmployeeCodeService/generator exists, reuse it.

Do not create another employee-code generation mechanism.

Uniqueness must ultimately be protected by the database.

## 9. Employee onboarding

Before changing onboarding inspect the complete existing flow:

employee
→ user/account
→ role/permissions
→ employee code
→ credentials
→ welcome email/job
→ draft/onboarding status

Use the existing implementation and transaction strategy.

## 10. Masters

Do not invent masters.

Discover them from:

- migrations;
- models;
- routes;
- controllers;
- services;
- existing frontend;
- business requirements.

When adding a master, verify:

- CRUD;
- validation;
- authorization;
- dependencies;
- pagination/search;
- delete/deactivate behavior.

## 11. Menu

Use the existing menu implementation/API.

If the backend already returns permission-aware menus, preserve that design.

Never treat menu visibility as security.

## 12. Database

Inspect schema before modifying it.

Do not:

- drop data;
- rename production columns casually;
- delete existing migrations;
- introduce duplicate tables.

Use transactions where a business operation modifies multiple related records.

## 13. API compatibility

Do not silently change an existing API response.

If a breaking change is unavoidable:

- identify affected clients;
- explain the breaking change;
- ask for approval.

## 14. Performance

Optimize based on verified problems.

Check for:

- N+1 queries;
- unbounded lists;
- unnecessary queries;
- missing indexes;
- repeated API/database work.

Do not introduce unnecessary caching or architecture changes.

## 15. Testing

Follow the testing requirements in `AGENTS.md`.

Every code change must have appropriate test coverage.

Test:

- success path;
- validation failures;
- authorization failures;
- important business-rule failures.

Run the narrowest affected tests first.

## 16. Final verification

Before declaring completion:

- inspect git diff;
- verify changed files;
- run relevant tests;
- run required formatting;
- verify API behavior;
- verify authorization;
- verify no unrelated files were changed.

## 17. Final response

Report:

### Changed
...

### API
...

### Database
...

### Tests
...

### Security
...

### Unrelated issues found but not fixed
...

### Manual steps
...