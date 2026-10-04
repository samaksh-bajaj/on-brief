# OnBrief

Check any text against rules you write yourself.

Paste text, pick a rule set, and each rule is judged by TypeSafe's Jev model:
a tick if the text meets the rule, a cross if it doesn't. A rule can be broken
into sub-rules, several levels deep; it is met only when all of them are, and
opening it shows which part fell short.
People bring their own TypeSafe API key. Signed-out visitors can try a live
demo that runs on the site owner's key.

## Stack

Next.js (App Router), Tailwind, shadcn/ui, Supabase (auth, database, Vault),
and the TypeSafe SDK.

## Set up

1. Create a Supabase project and apply `supabase/migrations/` to it.
2. Copy `.env.example` to `.env.local` and fill it in:
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY`: the project's secret key. Server only.
   - `TYPESAFE_DEMO_API_KEY`: the TypeSafe key the live demo spends. Server
     only. Leave it empty to switch the demo off.
3. Install and run:

```sh
npm install
npm run dev
```

Then open http://localhost:3000.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm test` | Unit tests |
| `npm run lint` | ESLint |

## How it handles your data

- Sign-in is email and password. The app sends no email, so accounts need no
  confirmation and a forgotten password cannot be reset.
- TypeSafe keys are stored as Supabase Vault secrets and are only ever read on
  the server. The interface shows the last four characters.
- Checked text and results are never stored.
- Deleting an account removes its rule sets, rules and stored key.
