@AGENTS.md

# OnBrief

A dashboard where people paste text and check it against rule sets they write themselves. Each rule is judged by TypeSafe's Jev model: yes/no (`noul`) rules show a tick or cross, `score` rules show a red-to-green bar. Users bring their own TypeSafe key; a signed-out live demo runs on the owner's key.

The full build plan is in `~/.claude/plans/create-onbrief-a-dashboard-quirky-wall.md`. It is delivered one verified commit at a time.

## Commands

- `npm run dev` starts the dev server
- `npm run lint` and `npx tsc --noEmit` must pass before each commit

## Layout

- `src/app/page.tsx`: signed-out landing page
- `src/app/(auth)/`: `login`, `signup` and the auth server actions
- `src/app/(app)/`: the signed-in dashboard (`check`, `rule-sets`, `settings`), sharing the nav in `(app)/layout.tsx`, which also rejects signed-out visitors
- `src/proxy.ts`: Next 16's name for middleware. Refreshes the Supabase session cookie and redirects by signed-in state
- `src/server/`: server-side functions holding the real logic (`auth.ts` so far)
- `src/lib/supabase/server.ts`: `createClient()` acts as the signed-in user (RLS applies); `createAdminClient()` uses the secret key and bypasses RLS
- `supabase/migrations/`: the schema. Applied to the hosted project through the Supabase MCP `apply_migration` tool; keep the file and the applied SQL identical
- `src/components/ui/`: shadcn components (base-nova style, built on Base UI, not Radix)
- `src/components/`: our own components

## Design

- Colour tokens live in `src/app/globals.css`. Blue (`--primary`) is the only accent. `--pass`, `--warn` and `--fail` are for check results only.
- Schibsted Grotesk (`font-sans`) is the interface face. Newsreader (`font-serif`) is used only for the text being checked.
- Light theme only. Sentence case everywhere; no all-caps labels.

## Conventions

- Multi-step operations go in one server-side function with plain typed arguments and a typed result union (no `Request`/`Response`, no throwing). Server actions are thin wrappers.
- Commit messages carry no Claude attribution.

## Supabase

- Hosted project `OnBrief`, ref `imjmcolitaqwvhmfzomn`, region ap-south-1. Keys are in `.env.local` (see `.env.example`).
- Auth is email + password. The app cannot send email, so `signUp` creates users through the admin API with `email_confirm: true`. There is no password reset.
- `rule_sets` and `rules` are protected by owner-only RLS. `save_rule_set()` writes a set and replaces its rules in one transaction, as the caller.
- TypeSafe keys are Vault secrets. `user_api_keys` holds only the secret id and last four characters, and has no RLS policies on purpose (the "RLS enabled, no policy" advisor note is expected). `set_typesafe_key`, `get_typesafe_key` and `delete_typesafe_key` are callable by the service role only. Deleting the row, or the account, deletes the Vault secret through a trigger.

## Status

Commits 1 and 2 of 7 done: shell, database schema and auth. Rule sets, settings and check pages are still placeholders (settings has only Log out).
