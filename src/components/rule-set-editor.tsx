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
  countRules,
  MAX_DEPTH,
  MAX_NAME_LENGTH,
  MAX_RULE_LENGTH,
  MAX_RULES,
  type Rule,
  type RuleSet,
} from "@/lib/rules";
import type { SaveRuleSetResult } from "@/server/rule-sets";
import { cn } from "@/lib/utils";

/** A rule being edited. `key` is stable for React and for finding the node. */
type Draft = { key: number; text: string; children: Draft[] };

type SaveFailure = Extract<SaveRuleSetResult, { ok: false }>["reason"];

const saveErrors: Record<SaveFailure, string> = {
  name_required: "Give the rule set a name.",
  name_too_long: `Keep the name under ${MAX_NAME_LENGTH} characters.`,
  no_rules: "Add at least one rule.",
  too_many_rules: `A rule set can hold up to ${MAX_RULES} rules, counting sub-rules.`,
  too_deep: `Sub-rules can go ${MAX_DEPTH} levels deep at most.`,
  rule_empty: "Write something for every rule, or remove the empty ones.",
  rule_too_long: `Keep each rule under ${MAX_RULE_LENGTH} characters.`,
  not_found: "This rule set no longer exists.",
  failed: "The rule set could not be saved. Try again.",
};

// Tree helpers. Each returns a new tree and leaves the old one untouched.

const mapNode = (
  drafts: Draft[],
  key: number,
  change: (draft: Draft) => Draft,
): Draft[] =>
  drafts.map((draft) =>
    draft.key === key
      ? change(draft)
      : { ...draft, children: mapNode(draft.children, key, change) },
  );

const removeNode = (drafts: Draft[], key: number): Draft[] =>
  drafts
    .filter((draft) => draft.key !== key)
    .map((draft) => ({ ...draft, children: removeNode(draft.children, key) }));

/** Swaps a rule with the sibling before (-1) or after (1) it. */
const moveNode = (drafts: Draft[], key: number, by: -1 | 1): Draft[] => {
  const index = drafts.findIndex((draft) => draft.key === key);
  if (index === -1) {
    return drafts.map((draft) => ({
      ...draft,
      children: moveNode(draft.children, key, by),
    }));
  }
  const target = index + by;
  if (target < 0 || target >= drafts.length) return drafts;
  const next = [...drafts];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

const countDrafts = (drafts: Draft[]): number =>
  drafts.reduce((sum, draft) => sum + 1 + countDrafts(draft.children), 0);

const toRules = (drafts: Draft[]): Rule[] =>
  drafts.map((draft) => ({
    text: draft.text,
    children: toRules(draft.children),
  }));

/** Drafts for the rules being edited, keyed 0, 1, 2… in reading order. */
function initialDrafts(ruleSet?: RuleSet): Draft[] {
  let key = 0;
  const toDrafts = (list: Rule[]): Draft[] =>
    list.map((rule) => ({
      key: key++,
      text: rule.text,
      children: toDrafts(rule.children),
    }));
  return ruleSet ? toDrafts(ruleSet.rules) : [{ key: 0, text: "", children: [] }];
}

type NodeProps = {
  draft: Draft;
  /** "1", "1.2", "1.2.1": the rule's place in the tree */
  number: string;
  depth: number;
  index: number;
  siblingCount: number;
  canRemove: boolean;
  canAdd: boolean;
  focusKey: number | null;
  onText: (key: number, text: string) => void;
  onMove: (key: number, by: -1 | 1) => void;
  onRemove: (key: number) => void;
  onAddChild: (key: number) => void;
};

function RuleNode(props: NodeProps) {
  const { draft, number, depth, index, siblingCount } = props;
  const name = depth === 1 ? `rule ${number}` : `sub-rule ${number}`;

  return (
    <li
      className={
        depth === 1 ? "rounded-lg border bg-card p-3 sm:p-4" : undefined
      }
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          {depth === 1 ? `Rule ${number}` : number}
        </span>
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Move ${name} up`}
            disabled={index === 0}
            onClick={() => props.onMove(draft.key, -1)}
          >
            <ArrowUp />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Move ${name} down`}
            disabled={index === siblingCount - 1}
            onClick={() => props.onMove(draft.key, 1)}
          >
            <ArrowDown />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={
              draft.children.length
                ? `Remove ${name} and its sub-rules`
                : `Remove ${name}`
            }
            disabled={!props.canRemove}
            onClick={() => props.onRemove(draft.key)}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
      <Textarea
        aria-label={depth === 1 ? `Rule ${number}` : `Sub-rule ${number}`}
        autoFocus={draft.key === props.focusKey}
        className="mt-1 min-h-0"
        rows={depth === 1 ? 2 : 1}
        value={draft.text}
        onChange={(event) => props.onText(draft.key, event.target.value)}
        maxLength={MAX_RULE_LENGTH}
        placeholder={
          depth === 1
            ? "Must include terms and conditions"
            : "Must include delivery time"
        }
      />

      {draft.children.length ? (
        <ol className="mt-3 ml-1 flex flex-col gap-3 border-l-2 pl-3 sm:ml-2 sm:pl-4">
          {draft.children.map((child, childIndex) => (
            <RuleNode
              {...props}
              key={child.key}
              draft={child}
              number={`${number}.${childIndex + 1}`}
              depth={depth + 1}
              index={childIndex}
              siblingCount={draft.children.length}
              canRemove
            />
          ))}
        </ol>
      ) : null}

      {depth < MAX_DEPTH ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "mt-2 text-muted-foreground",
            draft.children.length && "ml-1 sm:ml-2",
          )}
          disabled={!props.canAdd}
          aria-label={`Add a sub-rule to ${name}`}
          onClick={() => props.onAddChild(draft.key)}
        >
          <Plus data-icon="inline-start" />
          {/* Once a rule has sub-rules, say which rule the button belongs to */}
          {draft.children.length
            ? `Add sub-rule to ${depth === 1 ? `rule ${number}` : number}`
            : "Add sub-rule"}
        </Button>
      ) : null}
    </li>
  );
}

export function RuleSetEditor({ ruleSet }: { ruleSet?: RuleSet }) {
  const router = useRouter();
  const [name, setName] = useState(ruleSet?.name ?? "");
  const [rules, setRules] = useState<Draft[]>(() => initialDrafts(ruleSet));
  // Initial drafts took keys 0 to n-1; new ones continue from n
  const nextKey = useRef(ruleSet ? countRules(ruleSet.rules) : 1);
  const [error, setError] = useState<string | null>(null);
  // The rule just added, so it can take focus
  const [addedKey, setAddedKey] = useState<number | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [saving, startSaving] = useTransition();
  const [deleting, startDeleting] = useTransition();
  const busy = saving || deleting;
  const canAdd = countDrafts(rules) < MAX_RULES;

  const newDraft = (): Draft => {
    const key = nextKey.current++;
    setAddedKey(key);
    return { key, text: "", children: [] };
  };

  const addRule = () => {
    const draft = newDraft();
    setRules((current) => [...current, draft]);
  };

  const addChild = (parentKey: number) => {
    const draft = newDraft();
    setRules((current) =>
      mapNode(current, parentKey, (parent) => ({
        ...parent,
        children: [...parent.children, draft],
      })),
    );
  };

  const save = () => {
    setError(null);
    startSaving(async () => {
      const result = await saveRuleSetAction({
        id: ruleSet?.id,
        name,
        rules: toRules(rules),
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
          placeholder="Supplier quote"
          autoFocus={!ruleSet}
        />
      </div>

      <h2 className="mt-10 text-lg font-semibold tracking-tight">Rules</h2>
      <p className="mt-1 max-w-[65ch] text-sm text-muted-foreground">
        Write each rule so the answer is yes or no: the text either meets it or
        it doesn&apos;t. Break a broad rule into sub-rules to see exactly which
        part is missing. A rule with sub-rules is met only when every sub-rule
        is met.
      </p>

      <ol className="mt-5 flex flex-col gap-3">
        {rules.map((draft, index) => (
          <RuleNode
            key={draft.key}
            draft={draft}
            number={String(index + 1)}
            depth={1}
            index={index}
            siblingCount={rules.length}
            canRemove={rules.length > 1}
            canAdd={canAdd}
            focusKey={addedKey}
            onText={(key, text) =>
              setRules((current) =>
                mapNode(current, key, (node) => ({ ...node, text })),
              )
            }
            onMove={(key, by) =>
              setRules((current) => moveNode(current, key, by))
            }
            onRemove={(key) => setRules((current) => removeNode(current, key))}
            onAddChild={addChild}
          />
        ))}
      </ol>

      <Button
        type="button"
        variant="outline"
        className="mt-3"
        disabled={!canAdd}
        onClick={addRule}
      >
        <Plus data-icon="inline-start" />
        Add rule
      </Button>
      {canAdd ? null : (
        <p className="mt-2 text-sm text-muted-foreground">
          This rule set has reached the limit of {MAX_RULES} rules, counting
          sub-rules.
        </p>
      )}

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
