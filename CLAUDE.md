@AGENTS.md

# GreenBook: rules for every session

GreenBook is a free SAT practice website with a Bluebook-style test screen.
Full plan: https://claude.ai/artifact/6TWEQqRdWkE3qukgray8iu
Approved designs: https://claude.ai/artifact/MvRPeE2en1vsw3D27BmdAf

The owner is a beginner. Explain what you change in plain words, work in small
steps, and run `npm run check` before saying something is done.

## Product decisions
- Login is required for everything except `/` and `/login`.
- English only. Two subjects in the URL: `/english/...` and `/math/...`; the switch swaps that word.
- Full tests are per subject: module 1, then an easier or harder module 2, scored 200 to 800.
- All questions are the owner's own. The owner is the only admin.

## Structure (built to change safely)
- `app/` routes only. A page file awaits params, calls a feature's query and renders a feature component. Keep it under ~30 lines.
- `features/<name>/` one sealed folder per feature: `components/`, `queries.ts`, `actions.ts`, `schema.ts`, `index.ts`, `README.md`.
  Other code imports a feature ONLY through `@/features/<name>` (its index.ts). ESLint enforces this.
- `core/` shared and feature-free: `design/` (tokens + ui), `layout/` (app shell), `config/` (subjects, feature switches), `scoring/`, `question/`, `db/`. `core/` must never import a feature.
- Add a feature = folder in `features/` + page in `app/(app)/[subject]/` + one line in `core/config/features.ts`.
- Hide a feature = `enabled: false` in `core/config/features.ts`. Unfinished work merges switched off.
- Subject facts (timing, modules, tools, domains) live in `core/config/subjects.ts`, never hard-coded.
- Database changes only through numbered files in `supabase/migrations/`. Add before you remove.
- Never send correct answers to the browser during a test. The server grades and keeps the clock.

## Design system (approved 24 Nov 2026)
- Apple-like, minimal, Bluebook-style, liquid glass. Must not look AI-generated.
- Font: Nunito (`@fontsource-variable/nunito`) for the interface. Headlines extra-bold with slight negative tracking. Test text (passages, questions, choices) uses the serif `font-serif` (Source Serif 4), like Bluebook (owner request, 25 Nov 2026).
- Colors: only the tokens in `app/globals.css` (`bg-paper`, `bg-mist`, `bg-canvas`, `text-ink`, `text-graphite`, `border-hairline`, `bg-pine`, `bg-pine-soft`...). No raw hex in `app/` or `features/` (lint blocks it). Pine green is the only accent.
- Glass (`glass`, `glass-on-brand` utilities) ONLY on floating things: nav bar, side tabs, subject switch, phone sheets. The test screen follows Bluebook's layout (owner request): flat full-width top and bottom bars in `bg-pine-tint` with dashed rules, a draggable divider, grey question bar with number, Mark for Review and ABC. Content panels stay flat: `Panel` with a hairline, no shadow.
- Logged-in pages: glass side tabs on the left (bottom tab bar on phones), `PageHeader` with the English/Math switch.
- Reuse `core/design/ui` (Button, ButtonLink, PillSwitch, Panel, AccentPanel, EmptyState, Icon, Logo). New shared pieces go there first and onto `/dev/design`.
- Never: decorative gradients, identical card grids, emoji, rows of icons, ALL-CAPS labels, "→" on buttons, sales phrases. Copy is sentence case with plain verbs; buttons say what happens.
- Check every screen at 390 px and 1440 px wide, in light and dark mode.

## Publishing
- Push to `main` on GitHub (rescartess/greenbook). GitHub Actions runs `npm run check`; only if it passes, the `publish` job calls the Vercel deploy hook (secret `VERCEL_DEPLOY_HOOK`). Live site: https://greenbook-alpha.vercel.app
- The GitHub repo is public (since 25 Nov 2026): Vercel's free plan only publishes a private repo's commits when the owner wrote them. Keep secrets out of the repo; only the Supabase URL and publishable key are committed. Never sign commits as the owner.

## Database
- Supabase project `greenbook` (ref `pgpotvnyomwrlmnhzcmy`, Frankfurt). Migrations are applied with Claude's Supabase connector, then the security and performance advisors are re-run and `core/db/types.ts` is updated.
- Anything that writes student activity or reveals answers is a database function (test engine 0007, admin tools 0009, practice and mistakes 0010). Pages call them with `supabase.rpc(...)`. Answers reach the browser only after a question is finished.
- `tests/db/` runs every migration in an in-memory Postgres (PGlite) and checks the rules as a student and as an admin. Add a check there for every new database function.
- Question content and answer keys never go in this public repo; they live only in the database.
- Destructive SQL (deletes) through the connector asks the owner to confirm; don't run it while they're away.
- Login uses email sign-in links. Supabase's built-in email allows only a few emails per hour; set up custom SMTP before launch.

## Feature map
- `test-runner` (/test/[id]): timed Bluebook screen. `full-tests`, `results`, `practice` (/practice/[id], used by `topics` and `monthly`), `mistakes`, `dashboard`, `admin` (/admin), `auth`, `marketing`.
- Shared question display lives in `core/question` (RichText format, QuestionView, AnswerCheck, highlights).
- Scores are estimated while `ESTIMATED_SCORES` is true in `core/config/subjects.ts`.

## Commands
- `npm run dev` local site at http://localhost:3000
- `npm run check` typecheck + lint + unit tests + production build (must pass before merging)
- `npm test` unit tests only
