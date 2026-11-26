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
- Questions are the owner's own, plus College Board's SAT Suite Question Bank (SQB), which the owner has College Board's permission to publish with credit (owner, 26 Nov 2026). The owner is the only admin.
- SQB: import exactly as printed (same rule as Dovudprep), with College Board's rationale as the explanation. Show `SQB_CREDIT` (core/config/practice.ts) wherever SQB topics appear. Don't name Dovudprep on SQB pages; the collection is just "SQB".
- Dovudprep (EBRW Practice books) is the owner's own brand. Its questions were already rewritten by the owner; import them exactly as written (only fix PDF line breaks), never reword them. Book levels map to ours: 1–3 easy, 4–5 medium, 6–7 hard. Answers are in the book's Solutions copy.

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
- Exam screens (test, practice, review; root has class `exam`) copy Bluebook's type and layout as closely as possible (owner request, 26 Nov 2026): Roboto for the interface, Noto Serif for test text (rules in `app/globals.css`), Bluebook wording in Title Case (Mark for Review, Check Your Work, Go to Review Page, This Module Is Over), question map with Current pin, dashed number squares 10 per row and a red `flag` token for For Review. In light mode exam screens swap pine for blue (`.exam` overrides the `--gb-pine*` tokens in `app/globals.css`; owner request, 26 Nov 2026); dark mode keeps pine. The top bar has Highlight, Full screen (`FullscreenTool`, hidden where unsupported) and Dark mode / Light mode (`ThemeTool`, shared hook `core/design/theme.ts`) side by side. Highlights (owner request, 26 Nov 2026): yellow / blue / pink plus underline; with Highlight on, selecting words adds one and opens `HighlightMenu`; tapping a highlight any time opens it to recolor, underline or delete (`useHighlights`, marks in `highlights.ts`, colors `hl-*` tokens). A hidden clock shows a stopwatch and Show. Directions opens a full panel between the bars with a yellow Close button (our own wording in `core/config/subjects.ts`, never College Board's). ABC is solid blue when on. The practice title shows the topic and level only (no question numbers). On wide screens the passage and the question scroll separately between the bars (`QuestionView` `fillHeight`). Keep GreenBook's colors, name and logo: never copy College Board branding or Bluebook's sign-in page. Preview locally at /dev/exam (made-up questions; hidden in production).
- Colors: only the tokens in `app/globals.css` (`bg-paper`, `bg-mist`, `bg-canvas`, `text-ink`, `text-graphite`, `border-hairline`, `bg-pine`, `bg-pine-soft`...). No raw hex in `app/` or `features/` (lint blocks it). Pine green is the only accent. Exception (owner request, 25 Nov 2026): answer feedback uses `correct` (bright green) and `incorrect` (red) tokens, with `-tint` versions; use them only for right/wrong answers.
- Glass (`glass`, `glass-on-brand` utilities) ONLY on floating things: nav bar, side tabs, subject switch, phone sheets. The test screen follows Bluebook's layout (owner request): flat full-width top and bottom bars in `bg-pine-tint` with dashed rules, a draggable divider, grey question bar with number, Mark for Review and ABC. Content panels stay flat: `Panel` with a hairline, no shadow.
- Logged-in pages: glass side tabs on the left (bottom tab bar on phones), `PageHeader` with the English/Math switch.
- Reuse `core/design/ui` (Button, ButtonLink, PillSwitch, Panel, AccentPanel, EmptyState, Icon, Logo). New shared pieces go there first and onto `/dev/design`.
- Topic cards follow the owner's reference (26 Nov 2026): title, progress line, question counts, full-width Start practice button; no topic descriptions.
- Never: decorative gradients, identical card grids, emoji, rows of icons, ALL-CAPS labels, "→" on buttons, sales phrases. Copy is sentence case with plain verbs; buttons say what happens.
- Check every screen at 390 px and 1440 px wide, in light and dark mode.

## Publishing
- Push to `main` on GitHub (rescartess/greenbook). GitHub Actions runs `npm run check`; only if it passes, the `publish` job calls the Vercel deploy hook (secret `VERCEL_DEPLOY_HOOK`). Live site: https://greenbook-alpha.vercel.app
- The GitHub repo is public (since 25 Nov 2026): Vercel's free plan only publishes a private repo's commits when the owner wrote them. Keep secrets out of the repo; only the Supabase URL and publishable key are committed. Never sign commits as the owner.

## Database
- Supabase project `greenbook` (ref `pgpotvnyomwrlmnhzcmy`, Frankfurt). Migrations are applied with Claude's Supabase connector, then the security and performance advisors are re-run and `core/db/types.ts` is updated.
- Anything that writes student activity or reveals answers is a database function (test engine 0007, admin tools 0009, practice and mistakes 0010, topic practice 0012, results and review 0013, pictures and import 0014, invite code 0016, SQB collection 0017, mistakes by practice 0018). Pages call them with `supabase.rpc(...)`. Answers reach the browser only after a question is finished.
- `tests/db/` runs every migration in an in-memory Postgres (PGlite) and checks the rules as a student and as an admin. Add a check there for every new database function.
- Question content and answer keys never go in this public repo; they live only in the database.
- Big imports: Claude turns a book into an import file (format `greenbook-import-1`, see `features/admin/import-book.ts`); the owner uploads it at /admin/import, which sends pictures to the `question-images` storage bucket and questions to `admin_import_questions` (migration 0014) in batches. Re-running is safe (same `source` is skipped). Pictures are `questions.image_path`, shown above the passage.
- Destructive SQL (deletes) through the connector asks the owner to confirm; don't run it while they're away.
- Students log in with their email + one shared invite code (migration 0016, owner sets it under Admin › Student login). The database turns email+code into that student's password (keyed hash); the server then signs in, or signs up on first use. Needs "Confirm email" OFF in Supabase Auth. Admins can't use the code; they log in with the emailed link (Supabase's built-in email only reaches team members, about 2 an hour; set up custom SMTP before students rely on links).

## Feature map
- `test-runner` (/test/[id]): timed Bluebook screen. `full-tests`, `results`, `practice` (/practice/[id]: Bluebook screen, check as you go or at the end, optional timer, results with an "Incorrect" review; Finish (bottom bar, two-step) or More › Finish practice ends it any time, unchecked picks are scored; used by `topics` and `monthly`), `topics` (/[subject]/topics and /[subject]/topics/[setId] setup page), `mistakes` (/[subject]/mistakes lists practices; /[subject]/mistakes/[practice] its questions), `dashboard`, `admin` (/admin), `auth`, `marketing`.
- Shared question display lives in `core/question` (RichText format, QuestionView, AnswerCheck, highlights) and so do the Bluebook exam pieces used by both the test and practice screens (`ExamParts.tsx`: top/bottom bars, clock, Mark for Review, ABC, question map; `exam-hooks.ts`), and the shared review screen (`ReviewScreen.tsx`: Bluebook review with All / Incorrect / Skipped / Marked filters and a Show correct answer switch) used by practice results and full-test results.
- Topic practice settings (levels, sizes, SAT pace) live in `core/config/practice.ts`.
- Topics come in collections (`question_sets.collection`, migration 0017): `books` (/[subject]/topics, labelled GreenBook) and `sqb` (/[subject]/topics/sqb). Import files name their collection (`"collection": "sqb"`). SQB book reader: `sqb_parse.py` + `sqb_make_import.py` (outside the repo, in Claude's content folder).
- Scores are estimated while `ESTIMATED_SCORES` is true in `core/config/subjects.ts`.

## Commands
- `npm run dev` local site at http://localhost:3000
- `npm run check` typecheck + lint + unit tests + production build (must pass before merging)
- `npm test` unit tests only
