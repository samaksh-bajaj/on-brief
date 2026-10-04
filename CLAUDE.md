@AGENTS.md

# OnBrief

A dashboard where people paste text and check it against rule sets they write themselves. Each rule is judged by TypeSafe's Jev model: yes/no (`noul`) rules show a tick or cross, `score` rules show a red-to-green bar. Users bring their own TypeSafe key; a signed-out live demo runs on the owner's key.

The full build plan is in `~/.claude/plans/create-onbrief-a-dashboard-quirky-wall.md`. It is delivered one verified commit at a time.

## Commands

- `npm run dev` starts the dev server
- `npm run lint` and `npx tsc --noEmit` must pass before each commit

## Layout

- `src/app/page.tsx`: signed-out landing page
- `src/app/(app)/`: the signed-in dashboard (`check`, `rule-sets`, `settings`), sharing the nav in `(app)/layout.tsx`
- `src/components/ui/`: shadcn components (base-nova style, built on Base UI, not Radix)
- `src/components/`: our own components

## Design

- Colour tokens live in `src/app/globals.css`. Blue (`--primary`) is the only accent. `--pass`, `--warn` and `--fail` are for check results only.
- Schibsted Grotesk (`font-sans`) is the interface face. Newsreader (`font-serif`) is used only for the text being checked.
- Light theme only. Sentence case everywhere; no all-caps labels.

## Conventions

- Multi-step operations go in one server-side function with plain typed arguments and a typed result union (no `Request`/`Response`, no throwing). Server actions are thin wrappers.
- Commit messages carry no Claude attribution.

## Status

Commit 1 of 7 done: scaffold and shell. Pages are placeholders; there is no auth or database yet.
