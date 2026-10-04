import { Wordmark } from "@/components/wordmark";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="mx-auto flex h-14 w-full max-w-6xl items-center px-4 sm:px-6">
        <Wordmark />
      </header>
      <main className="flex flex-1 justify-center px-4 py-12 sm:px-6 sm:py-20">
        {children}
      </main>
    </>
  );
}
