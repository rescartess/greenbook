# GreenBook

Free SAT practice with a Bluebook-style test screen. Built with Next.js, Tailwind CSS and (from milestone 2) Supabase.

## Run it on your Mac

1. Open this folder in the Claude desktop app's **Code** tab, or in Terminal.
2. Install the packages once: `npm install`
3. Start the site: `npm run dev`
4. Open http://localhost:3000

Useful pages:

| Page | Address |
| --- | --- |
| Homepage | http://localhost:3000 |
| Log in (design only until milestone 2) | http://localhost:3000/login |
| Dashboard | http://localhost:3000/english/dashboard |
| Design system | http://localhost:3000/dev/design |

## Before every change goes live

Run `npm run check`. It checks types, the folder and design rules, the unit tests and a full production build. GitHub runs the same check on every push (`.github/workflows/checks.yml`).

## Where things live

- `app/` web addresses (thin files only)
- `features/` one folder per feature (dashboard, full tests, topics...)
- `core/` shared design system, layout, settings and scoring
- `CLAUDE.md` the project rules Claude follows in every session
