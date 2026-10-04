import Link from "next/link";
import { CheckWorkspace } from "@/components/check-workspace";
import { buttonVariants } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";
import { DEMO_MAX_TEXT_LENGTH } from "@/lib/check";
import { demoRuleSet, demoSampleText } from "@/lib/demo-rule-set";
import { runDemoCheckAction } from "./actions";

const steps = [
  {
    title: "Write your rules",
    body: "Plain English, as many rules as you need. Mark each as yes-or-no or as a score.",
  },
  {
    title: "Paste your text",
    body: "An email, a product page, a press release: whatever has to meet the brief.",
  },
  {
    title: "See what holds up",
    body: "A tick or a cross for every yes-or-no rule, and a bar for every score.",
  },
];

export default function HomePage() {
  return (
    <>
      <header className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Wordmark />
        <nav aria-label="Account" className="flex items-center gap-2">
          <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
            Log in
          </Link>
          <Link href="/signup" className={buttonVariants()}>
            Create account
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 sm:px-6">
        <section aria-labelledby="hero-heading">
          <div className="pt-8 pb-8 sm:pt-12">
            <h1
              id="hero-heading"
              className="max-w-[20ch] text-4xl font-bold tracking-tight text-balance sm:text-5xl"
            >
              Check any text against rules you write yourself.
            </h1>
            <p className="mt-4 max-w-[62ch] text-lg text-muted-foreground">
              Write your rules in plain English and paste a draft. OnBrief marks
              each rule as met or missed, and scores the ones that come in
              degrees. Try it here on a sales email: the check is live, and you
              can edit the text or paste your own.
            </p>
          </div>
          <CheckWorkspace
            ruleSets={[demoRuleSet]}
            run={runDemoCheckAction}
            maxLength={DEMO_MAX_TEXT_LENGTH}
            initialText={demoSampleText}
          />
        </section>

        <section
          aria-labelledby="how-heading"
          className="mt-20 border-t pt-12"
        >
          <h2 id="how-heading" className="text-xl font-semibold tracking-tight">
            Your own rules work the same way
          </h2>
          <ol className="mt-6 grid gap-8 sm:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title}>
                <span className="text-sm font-semibold text-primary tabular-nums">
                  {index + 1}
                </span>
                <h3 className="mt-1 font-semibold">{step.title}</h3>
                <p className="mt-1 text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href="/signup" className={buttonVariants({ size: "lg" })}>
              Create account
            </Link>
            <p className="text-sm text-muted-foreground">
              Checks on your own rules run on your TypeSafe API key.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
