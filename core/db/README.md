# core/db

Supabase clients: `server.ts` for pages, actions and route handlers; `session.ts` for proxy.ts.
Both are typed with `types.ts`, which is generated from the live database. Regenerate it after every migration.
Database tables are defined only by the numbered files in `supabase/migrations/`.
