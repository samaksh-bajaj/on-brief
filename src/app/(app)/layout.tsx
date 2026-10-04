import { SiteNav } from "@/components/site-nav";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteNav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </>
  );
}
