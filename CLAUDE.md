@AGENTS.md

# OnBrief

A dashboard where people paste text and check it against rule sets they write themselves. Every rule is a yes-or-no judgment made by TypeSafe's Jev model and shown as a tick or a cross. Users bring their own TypeSafe key; a signed-out live demo runs on the owner's key.

Work is delivered one verified commit at a time. The current plan is in `~/.claude/plans/create-onbrief-a-dashboard-quirky-wall.md`.

## Commands

- `npm run dev` starts the dev server
- `npm test` runs the unit tests with Node's built-in runner (no test framework installed; test files import with a `.ts` extension)
- `npm run lint`, `npx tsc --noEmit` and `npm test` must pass before each commit

## Layout

- `src/app/page.tsx`: signed-out landing page, whose hero is the live demo. `src/app/actions.ts` holds its one server action
- `src/lib/demo-rule-set.ts`: the demo's fixed rule set and sample email
- `src/app/(auth)/`: `login`, `signup` and the auth server actions
- `src/app/not-found.tsx`, `src/app/(app)/loading.tsx`, `src/app/(app)/error.tsx`: the fallback pages
- `src/app/(app)/`: the signed-in dashboard (`check`, `rule-sets`, `settings`), sharing the nav in `(app)/layout.tsx`, which also rejects signed-out visitors
- `src/proxy.ts`: Next 16's name for middleware. Refreshes the Supabase session cookie and redirects by signed-in state. It must use `getUser()`, not `getClaims()`: a deleted account's cookie still passes a local token check, and the pages then bounce it into a redirect loop
- `src/server/`: server-side functions holding the real logic (`auth.ts`, `rule-sets.ts`, `api-key.ts`, `typesafe.ts`, `check.ts`)
- `src/lib/check.ts`: result types, text limits, the pass threshold, and the two pure functions behind nested checking: `collectLeaves` (which rules to ask the model) and `buildResults` (a rule with sub-rules passes only if all of them do). No runtime imports, so the tests can load it directly
- `src/components/check-workspace.tsx`: text box plus results. Takes its rule sets and its `run` function as props so the live demo reuses it. `RuleRow` is recursive: a rule with sub-rules is a button that shows one mark when closed and hands the marks to its sub-rules when open
- `src/lib/rules.ts`: the `Rule` tree type (`{ text, children }`), limits, and pure helpers (`buildRuleTree`, `countRules`, `ruleDepth`). Never show the word "noul" in the UI; a rule is just a rule
- `src/components/rule-set-editor.tsx`: the one editor used by both `/rule-sets/new` and `/rule-sets/[id]`. Rules are a tree of drafts edited through small immutable helpers (`mapNode`, `removeNode`, `moveNode`); `RuleNode` renders itself recursively
- `src/lib/supabase/server.ts`: `createClient()` acts as the signed-in user (RLS applies); `createAdminClient()` uses the secret key and bypasses RLS
- `supabase/migrations/`: the schema. Applied to the hosted project through the Supabase MCP `apply_migration` tool; keep the file and the applied SQL identical
- `src/components/ui/`: shadcn components (base-nova style, built on Base UI, not Radix)
- `src/components/`: our own components

## Design

- Colour tokens live in `src/app/globals.css`. Blue (`--primary`) is the only accent. `--pass` and `--fail` are for check results only; `--warn` is for notices.
- Schibsted Grotesk (`font-sans`) is the interface face. Newsreader (`font-serif`) is used only for the text being checked.
- Light theme only. Sentence case everywhere; no all-caps labels.

## Conventions

- Multi-step operations go in one server-side function with plain typed arguments and a typed result union (no `Request`/`Response`, no throwing). Server actions are thin wrappers.
- Commit messages carry no Claude attribution.

## Supabase

- Hosted project `OnBrief`, ref `imjmcolitaqwvhmfzomn`, region ap-south-1. Keys are in `.env.local` (see `.env.example`).
- Auth is email + password. The app cannot send email, so `signUp` creates users through the admin API with `email_confirm: true`. There is no password reset.
- `rule_sets` and `rules` are protected by owner-only RLS. `save_rule_set()` writes a set and replaces its rules in one transaction, as the caller.
- Rules nest through `rules.parent_id` (null for top-level rules; `position` orders siblings). A composite foreign key keeps a sub-rule in the same rule set as its parent, and deleting a parent deletes its sub-rules.
- `save_rule_set()` takes a tree, `[{ "text", "children": [...] }]`, written by the recursive `insert_rules()`. Limits enforced there: 4 levels, 60 rules per set. A flat list still works.
- `rules.type` is obsolete (every rule is yes-or-no) and always `'noul'`. It is kept only until the nested-rules app code is deployed; then a cleanup migration drops it.
- Local and live share this one database, and pushing to `main` deploys. Migrations must work with the code that is live at the time, and nothing is pushed without the owner saying so.
- TypeSafe keys are Vault secrets. `user_api_keys` holds only the secret id and last four characters, and has no RLS policies on purpose (the "RLS enabled, no policy" advisor note is expected). `set_typesafe_key`, `get_typesafe_key` and `delete_typesafe_key` are callable by the service role only. Deleting the row, or the account, deletes the Vault secret through a trigger.

## TypeSafe

- SDK: `@typesafe-ai/sdk`, used only in `src/server/typesafe.ts`. Read the live docs at https://docs.typesafe.ai/llms.txt before changing how questions are asked.
- One check is one Jev request (`judge` in `typesafe.ts`): state is `{ text }`, and each rule **without sub-rules** is its own `noul` question, met when the probability is above 0.5. Rules with sub-rules are never sent; their result is worked out from their sub-rules.
  - A top-level rule is asked as `Does the text satisfy this rule: "<rule>"?`.
  - A sub-rule is asked with the rules above it and explicit yes/no criteria (`leafQuestion`). Asked alone, "Must include time" was ticked for any time anywhere in the text. Nine wordings were compared on 2026-10-04; the one in the code got 28 of 28 sample judgments right, the plain wording 17 of 20. Re-test on sample texts before changing it.
- There are no score rules any more; they were removed on 2026-10-04 at the owner's request. Do not reintroduce Jev `score` questions without being asked.
- The live demo (`runDemoCheck`) uses `TYPESAFE_DEMO_API_KEY` and only ever runs the fixed demo rule set: rules never come from the browser. It caps text at 5,000 characters and reports a bad or missing owner key as `demo_unavailable`.
- Nothing about a check is stored. Text and results live only in the page's state.
- A key is validated before saving with `client.models.list()`, which is free. A rejected key is never stored.
- Functions in `src/server/api-key.ts` use the admin client, so they must only ever be given a user id that came from `getUserId()` / `getUser()`, never one from the browser.

## Status

Version 1 is deployed at https://on-brief.vercel.app.

Nested rules are built and committed locally but **not pushed**: steps 1 to 4 of 5 of the plan in `~/.claude/plans/create-onbrief-a-dashboard-quirky-wall.md`. Step 5, after the owner pushes and the new code is live: a migration dropping the unused `rules.type` column and `rule_type` enum, then delete the test account.

Known gaps: no password reset (no email sending), no rate limit on the live demo beyond the owner's TypeSafe spending cap, and leaked-password protection is off in Supabase Auth.

## Testing notes

- shadcn dialogs here are Base UI: use the `render` prop, not `asChild`, and control them with `open` / `onOpenChange`.
- One throwaway account, `tester-three@onbrief.test`, exists while nested rules are being built (a flat "Sales email" set, the three-level "Supplier quote" set, and a working key). Delete it when that work is done.
- Never type a real API key into the browser during automated testing. Use made-up values in the UI, and set real ones through `set_typesafe_key` if a working key is needed.
- Browser automation sometimes drops clicks made by element reference and keystrokes sent straight after a navigation. Click by coordinate, wait for the page, and confirm the field's value before trusting a result.
- The owner often has their own session open on `localhost:3210` in the same Chrome profile. To test signed-out pages without logging them out, run `npm run build && npx next start -p 3211` and use `http://127.0.0.1:3211` (a different cookie jar; the dev server refuses that host).
- Automated browser tabs are hidden tabs, and React holds back streamed content (anything behind `loading.tsx`) until the tab paints. After navigating to a signed-in page, take a screenshot before querying or typing, or the page will still read "Loading…".
