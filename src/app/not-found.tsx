import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";

export const metadata = { title: "Page not found · OnBrief" };

export default function NotFound() {
  return (
    <>
      <header className="mx-auto flex h-14 w-full max-w-6xl items-center px-4 sm:px-6">
        <Wordmark />
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6 sm:py-20">
        <h1 className="text-2xl font-semibold tracking-tight">
          This page doesn&apos;t exist
        </h1>
        <p className="mt-1 max-w-[60ch] text-muted-foreground">
          The link may be old, or the rule set it pointed to may have been
          deleted.
        </p>
        <Link href="/" className={buttonVariants({ size: "lg", className: "mt-5" })}>
          Go to OnBrief
        </Link>
      </main>
    </>
  );
}
