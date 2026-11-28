# Auth

Log in, the current student, and the Supabase session.

- **Continue with Google** is the main way in (`loginWithGoogle`, then `/auth/callback`).
- **Class code** ("Have a class code?"): email plus the shared code. `invite_code_password` (migration 0016, made safe in 0029) gives back the class-code password for that email, and the server signs in, or signs up the first time.
  - An account that already exists is let in only if it joined with the class code. Accounts that joined with Google or an emailed link get P0015, and their password is never touched.
  - Error messages for P0010–P0013 and P0015 are in `schema.ts` (`codeErrorMessage`).
- **Emailed sign-in link** (admins): `sendLoginLink`.
- `getCurrentUser()` / `requireAdmin()` in `queries.ts` guard pages.
