"use client";

import { Button } from "@/components/ui/button";

export default function AppError({ retry }: { error: Error; retry: () => void }) {
  return (
    <div role="alert">
      <h1 className="text-2xl font-semibold tracking-tight">
        This page could not be loaded
      </h1>
      <p className="mt-1 max-w-[60ch] text-muted-foreground">
        Something went wrong while fetching your data. Nothing was changed.
      </p>
      <Button type="button" size="lg" className="mt-5" onClick={() => retry()}>
        Load the page again
      </Button>
    </div>
  );
}
