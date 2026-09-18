# Login Module — Setup Notes

Files map 1:1 onto your existing structure. Drop each into the matching path
under `src/`.

```
src/
├── app/auth/login/page.tsx        route entry (/auth/login)
├── middleware.ts                  route protection, place at src/ root (next to app/)
├── features/auth/
│   ├── schemas/login.schema.ts    zod validation
│   ├── api/auth.api.ts            login/logout/me API calls
│   └── components/LoginForm.tsx   the form UI
├── hooks/useAuth.ts               login()/logout() + auth state
├── store/auth.store.ts            zustand store (session state)
├── lib/axios-instance.ts          axios client w/ auto token refresh
├── config/api.config.ts           base URL, endpoints, route constants
└── types/auth.types.ts            User, LoginPayload, LoginResponse, etc.
```

## 1. Install dependencies

```bash
npm install axios zustand react-hook-form @hookform/resolvers zod lucide-react
```

## 2. Environment variable

Add to `.env.local`:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

## 3. Path alias

Confirm `tsconfig.json` has the `@/*` alias (Next.js sets this up by default):

```json
{
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  }
}
```

## 4. Backend contract expected

- `POST /auth/login` → `{ email, password }` → `{ user, accessToken, refreshToken, expiresIn }`
- `POST /auth/refresh` → uses httpOnly refresh cookie → `{ accessToken, expiresIn }`
- `POST /auth/logout` → clears the refresh cookie server-side
- `GET /auth/me` → returns the current `User`

If your backend doesn't set an httpOnly `hrm_refresh_token` cookie yet,
update `AUTH_COOKIE_NAME` in `middleware.ts` and the `withCredentials`
handling in `axios-instance.ts` to match whatever session mechanism you use.

## 5. Wire it into layout.tsx

No provider is required — Zustand doesn't need a context wrapper. Just make
sure `src/app/layout.tsx` wraps children in `<html><body>` as usual; the auth
store initializes lazily on first use.

## 6. Role-based access (optional next step)

`User.role` is already typed (`admin | hr | manager | employee`). Your
`permissions/` and `hooks/usePermission.ts` folders are the natural place to
gate UI by role once this module is wired in — happy to generate that next.

## Security notes

- The store currently persists only `user` + `isAuthenticated` to
  localStorage (see `partialize` in `auth.store.ts`) — the access token is
  kept in memory only, and refresh should ride on an httpOnly cookie set by
  your backend, not localStorage.
- `middleware.ts` does a *shallow* cookie-presence check (fast, edge-safe).
  Treat it as UX-level route gating, not your source of truth — always
  re-verify the token server-side for actual protected API calls.