# Auth Model (Supabase + Backend API)

## Responsibility split

- Supabase handles user login and session management.
- WaxWatch backend validates the JWT and authorizes all `/api/**` routes.

## Frontend requirements

- Obtain Supabase access token for the current session.
- Send it as:
  - `Authorization: Bearer <jwt>`

## Auth failures

- On 401/403:
  - clear local session via Supabase client
  - redirect to login route

Do not attempt to “fix” tokens client-side beyond refreshing via Supabase.
