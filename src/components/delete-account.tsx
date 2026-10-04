"use client";

import { useState, useTransition } from "react";
import { deleteAccountAction } from "@/app/(app)/settings/actions";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CONFIRM_WORD = "delete";

export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleting, startDeleting] = useTransition();
  const confirmed = typed.trim().toLowerCase() === CONFIRM_WORD;

  const remove = () => {
    setError(null);
    startDeleting(async () => {
      // On success the action redirects to the home page
      const result = await deleteAccountAction();
      if (result && !result.ok) {
        setError("The account could not be deleted. Try again.");
      }
    });
  };

  return (
    <>
      <Button type="button" variant="destructive" onClick={() => setOpen(true)}>
        Delete account
      </Button>
      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setTyped("");
            setError(null);
          }
        }}
      >
        <AlertDialogContent>
          <form
            className="contents"
            onSubmit={(event) => {
              event.preventDefault();
              if (confirmed) remove();
            }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                Your rule sets and your saved API key are removed for good.
                This can&apos;t be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirm-delete">
                Type “{CONFIRM_WORD}” to confirm
              </Label>
              <Input
                id="confirm-delete"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
              />
              {error ? (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              ) : null}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel type="button" disabled={deleting}>
                Keep account
              </AlertDialogCancel>
              <Button
                type="submit"
                variant="destructive"
                disabled={!confirmed || deleting}
              >
                {deleting ? "Deleting…" : "Delete account"}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
