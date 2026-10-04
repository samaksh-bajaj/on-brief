import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";

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
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6 sm:py-20">
        <h1 className="max-w-[18ch] text-4xl font-bold tracking-tight text-balance sm:text-6xl">
          Check any text against rules you write yourself.
        </h1>
        <p className="mt-5 max-w-[60ch] text-lg text-muted-foreground">
          Write your rules in plain English. Paste a draft. OnBrief marks each
          rule as met or missed, and scores the ones that come in degrees.
        </p>
      </main>
    </>
  );
}
