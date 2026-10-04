"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  removeApiKeyAction,
  saveApiKeyAction,
} from "@/app/(app)/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ApiKeyStatus, SaveApiKeyResult } from "@/server/api-key";

type SaveFailure = Extract<SaveApiKeyResult, { ok: false }>["reason"];

const saveErrors: Record<SaveFailure, string> = {
  empty: "Paste your TypeSafe API key first.",
  invalid_api_key:
    "TypeSafe rejected this key. Check that you copied all of it and that it is still active.",
  unverified:
    "TypeSafe could not be reached to check this key, so it was not saved. Try again in a moment.",
  failed: "The key could not be saved. Try again.",
};

export function ApiKeyForm({ status }: { status: ApiKeyStatus }) {
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const [removing, startRemoving] = useTransition();
  const busy = saving || removing;

  const save = () => {
    setError(null);
    startSaving(async () => {
      const result = await saveApiKeyAction(key);
      if (!result.ok) {
        setError(saveErrors[result.reason]);
        return;
      }
      setKey("");
      toast.success("API key saved");
    });
  };

  const remove = () => {
    setError(null);
    startRemoving(async () => {
      const result = await removeApiKeyAction();
      if (!result.ok) {
        setError("The key could not be removed. Try again.");
        return;
      }
      toast.success("API key removed");
    });
  };

  return (
    <div className="max-w-md">
      {status.saved ? (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2.5">
          <p className="text-sm">
            Saved key ending in{" "}
            <span className="font-semibold tabular-nums">{status.last4}</span>
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={remove}
          >
            {removing ? "Removing…" : "Remove key"}
          </Button>
        </div>
      ) : null}

      <form
        className="flex flex-col gap-1.5"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <Label htmlFor="api-key">
          {status.saved ? "Replace with a new key" : "API key"}
        </Label>
        <div className="flex gap-2">
          <Input
            id="api-key"
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={key}
            onChange={(event) => setKey(event.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "api-key-error" : undefined}
          />
          <Button type="submit" disabled={busy || !key.trim()}>
            {saving ? "Checking key…" : "Save key"}
          </Button>
        </div>
        {error ? (
          <p id="api-key-error" role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}
