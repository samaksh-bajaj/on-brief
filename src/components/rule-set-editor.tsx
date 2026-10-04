"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteRuleSetAction,
  saveRuleSetAction,
} from "@/app/(app)/rule-sets/actions";
import {
  AlertDialog,
  AlertDialogAction,
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
import { Textarea } from "@/components/ui/textarea";
import {
  MAX_NAME_LENGTH,
  MAX_RULE_LENGTH,
  MAX_RULES,
  type RuleSet,
} from "@/lib/rules";
import type { SaveRuleSetResult } from "@/server/rule-sets";

type DraftRule = { key: number; text: string };

type SaveFailure = Extract<SaveRuleSetResult, { ok: false }>["reason"];

const saveErrors: Record<SaveFailure, string> = {
  name_required: "Give the rule set a name.",
  name_too_long: `Keep the name under ${MAX_NAME_LENGTH} characters.`,
  no_rules: "Add at least one rule.",
  too_many_rules: `A rule set can hold up to ${MAX_RULES} rules.`,
  rule_empty: "Write something for every rule, or remove the empty ones.",
  rule_too_long: `Keep each rule under ${MAX_RULE_LENGTH} characters.`,
  not_found: "This rule set no longer exists.",
  failed: "The rule set could not be saved. Try again.",
};

export function RuleSetEditor({ ruleSet }: { ruleSet?: RuleSet }) {
  const router = useRouter();
  const nextKey = useRef(ruleSet?.rules.length ?? 1);
  const [name, setName] = useState(ruleSet?.name ?? "");
  const [rules, setRules] = useState<DraftRule[]>(
    ruleSet?.rules.map((rule, key) => ({ key, text: rule.text })) ?? [
      { key: 0, text: "" },
    ],
  );
  const [error, setError] = useState<string | null>(null);
  // The rule just added with "Add rule", so it can take focus
  const [addedKey, setAddedKey] = useState<number | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [saving, startSaving] = useTransition();
  const [deleting, startDeleting] = useTransition();
  const busy = saving || deleting;

  const update = (key: number, patch: Partial<DraftRule>) =>
    setRules((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const move = (index: number, by: -1 | 1) =>
    setRules((rs) => {
      const next = [...rs];
      [next[index], next[index + by]] = [next[index + by], next[index]];
      return next;
    });

  const addRule = () => {
    const key = nextKey.current++;
    setAddedKey(key);
    setRules((rs) => [...rs, { key, text: "" }]);
  };

  const save = () => {
    setError(null);
    startSaving(async () => {
      const result = await saveRuleSetAction({
        id: ruleSet?.id,
        name,
        rules: rules.map(({ text }) => ({ text })),
      });
      if (!result.ok) {
        setError(saveErrors[result.reason]);
        return;
      }
      toast.success("Rule set saved");
      router.push("/rule-sets");
    });
  };

  const remove = () => {
    if (!ruleSet) return;
    startDeleting(async () => {
      const result = await deleteRuleSetAction(ruleSet.id);
      if (!result.ok && result.reason === "failed") {
        setConfirmingDelete(false);
        setError("The rule set could not be deleted. Try again.");
        return;
      }
      toast.success("Rule set deleted");
      router.push("/rule-sets");
    });
  };

  return (
    <form
      className="max-w-3xl"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <div className="flex max-w-md flex-col gap-1.5">
        <Label htmlFor="rule-set-name">Name</Label>
        <Input
          id="rule-set-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={MAX_NAME_LENGTH}
          placeholder="Cold outreach email"
          autoFocus={!ruleSet}
        />
      </div>

      <h2 className="mt-10 text-lg font-semibold tracking-tight">Rules</h2>
      <p className="mt-1 max-w-[65ch] text-sm text-muted-foreground">
        Write each rule so the answer is yes or no: the text either meets it or
        it doesn&apos;t.
      </p>

      <ol className="mt-5 flex flex-col gap-3">
        {rules.map((rule, index) => (
          <li
            key={rule.key}
            className="rounded-lg border bg-card p-3 sm:p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Rule {index + 1}
              </span>
              <div className="flex items-center gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Move rule ${index + 1} up`}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Move rule ${index + 1} down`}
                  disabled={index === rules.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove rule ${index + 1}`}
                  disabled={rules.length === 1}
                  onClick={() =>
                    setRules((rs) => rs.filter((r) => r.key !== rule.key))
                  }
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
            <Textarea
              aria-label={`Rule ${index + 1}`}
              autoFocus={rule.key === addedKey}
              className="mt-2 min-h-0"
              rows={2}
              value={rule.text}
              onChange={(event) => update(rule.key, { text: event.target.value })}
              maxLength={MAX_RULE_LENGTH}
              placeholder="Asks for one specific next step"
            />
          </li>
        ))}
      </ol>

      <Button
        type="button"
        variant="outline"
        className="mt-3"
        disabled={rules.length >= MAX_RULES}
        onClick={addRule}
      >
        <Plus data-icon="inline-start" />
        Add rule
      </Button>

      {error ? (
        <p role="alert" className="mt-6 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center gap-2 border-t pt-6">
        <Button type="submit" size="lg" disabled={busy}>
          {saving ? "Saving…" : "Save rule set"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          disabled={busy}
          onClick={() => router.push("/rule-sets")}
        >
          Cancel
        </Button>
        {ruleSet ? (
          <Button
            type="button"
            variant="destructive"
            size="lg"
            className="ml-auto"
            disabled={busy}
            onClick={() => setConfirmingDelete(true)}
          >
            Delete rule set
          </Button>
        ) : null}
      </div>

      {ruleSet ? (
        <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete “{ruleSet.name}”?</AlertDialogTitle>
              <AlertDialogDescription>
                The rule set and all its rules are removed for good.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>
                Keep rule set
              </AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={deleting}
                onClick={remove}
              >
                {deleting ? "Deleting…" : "Delete rule set"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </form>
  );
}
