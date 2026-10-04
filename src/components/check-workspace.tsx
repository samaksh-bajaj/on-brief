"use client";

import { Check, ChevronDown, X } from "lucide-react";
import Link from "next/link";
import { useId, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RuleResult } from "@/lib/check";
import type { Rule, RuleSet } from "@/lib/rules";
import { cn } from "@/lib/utils";
import type { CheckResult } from "@/server/check";

type Failure = Extract<CheckResult, { ok: false }>["reason"];

const failureMessages: Record<Failure, string> = {
  empty_text: "Paste some text to check.",
  text_too_long: "This text is over the length limit. Shorten it and check again.",
  not_found: "This rule set no longer exists. Pick another one.",
  no_rules: "This rule set has no rules yet. Add one, then check again.",
  no_api_key: "Checks need your TypeSafe API key.",
  invalid_api_key: "TypeSafe rejected your saved API key.",
  rate_limited:
    "TypeSafe is limiting requests right now. Wait a moment and check again.",
  overloaded: "TypeSafe is overloaded right now. Check again in a moment.",
  demo_unavailable:
    "The live demo is unavailable right now. Create an account to check text with your own key.",
  failed: "The check could not be completed. Try again.",
};

const needsSettings = (reason: Failure) =>
  reason === "no_api_key" || reason === "invalid_api_key";

/** Tick, cross, or an empty dashed circle before a check has run. */
function Mark({ result }: { result?: RuleResult }) {
  if (!result) {
    return (
      <span
        aria-hidden="true"
        className="mt-0.5 size-5 shrink-0 rounded-full border border-dashed border-input"
      />
    );
  }
  return (
    <span
      className={cn(
        "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-white",
        result.passed ? "bg-pass" : "bg-fail",
      )}
    >
      {result.passed ? (
        <Check aria-hidden="true" className="size-3.5" strokeWidth={3} />
      ) : (
        <X aria-hidden="true" className="size-3.5" strokeWidth={3} />
      )}
      <span className="sr-only">{result.passed ? "Met:" : "Not met:"}</span>
    </span>
  );
}

type RowProps = {
  rule: Rule;
  result?: RuleResult;
  /** Where the rule sits in the tree, such as "0.2.1" */
  path: string;
  expanded: Set<string>;
  onToggle: (path: string) => void;
  nested?: boolean;
};

/**
 * One rule. A rule with sub-rules is a button: closed, it carries the mark
 * for all its sub-rules together; open, it gives the mark up to them.
 */
function RuleRow({ rule, result, path, expanded, onToggle, nested }: RowProps) {
  const padding = nested ? "py-2" : "py-3.5";

  if (!rule.children.length) {
    return (
      <li className={cn("flex gap-3", padding)}>
        <Mark result={result} />
        <span>{rule.text}</span>
      </li>
    );
  }

  const open = expanded.has(path);
  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => onToggle(path)}
        className={cn(
          "flex w-full gap-3 rounded-sm text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          padding,
        )}
      >
        {open ? (
          // Keeps the text aligned with its neighbours while the mark is gone
          <span aria-hidden="true" className="size-5 shrink-0" />
        ) : (
          <Mark result={result} />
        )}
        <span className="flex-1">{rule.text}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "mt-0.5 size-5 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <ul className="pb-1.5 pl-8">
          {rule.children.map((child, index) => (
            <RuleRow
              key={index}
              rule={child}
              result={result?.children[index]}
              path={`${path}.${index}`}
              expanded={expanded}
              onToggle={onToggle}
              nested
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function CheckWorkspace({
  ruleSets,
  run,
  maxLength,
  initialText = "",
  notice,
}: {
  ruleSets: RuleSet[];
  run: (ruleSetId: string, text: string) => Promise<CheckResult>;
  maxLength: number;
  initialText?: string;
  /** Shown above the workspace, for example when no API key is saved. */
  notice?: React.ReactNode;
}) {
  const textId = useId();
  const [ruleSetId, setRuleSetId] = useState(ruleSets[0]?.id ?? "");
  const [text, setText] = useState(initialText);
  const [checked, setChecked] = useState<{
    text: string;
    results: RuleResult[];
  } | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  // Which rules with sub-rules are open, by path. Kept across re-checks.
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [checking, startChecking] = useTransition();

  const ruleSet = ruleSets.find((set) => set.id === ruleSetId) ?? ruleSets[0];
  const tooLong = text.length > maxLength;
  const stale = checked !== null && checked.text !== text;

  const toggle = (path: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (!next.delete(path)) next.add(path);
      return next;
    });

  const check = () => {
    setFailure(null);
    startChecking(async () => {
      const result = await run(ruleSet.id, text);
      if (result.ok) {
        setChecked({ text, results: result.results });
      } else {
        setFailure(result.reason);
      }
    });
  };

  return (
    <div>
      {notice}
      <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          <label htmlFor={textId} className="text-sm font-medium">
            Text to check
          </label>
          <textarea
            id={textId}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Paste your text here."
            spellCheck={false}
            aria-invalid={tooLong ? true : undefined}
            className="mt-1.5 block min-h-56 w-full resize-y rounded-lg border border-input bg-card px-5 py-4 font-serif text-lg leading-[1.6] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive lg:min-h-[28rem]"
          />
          <p
            className={cn(
              "mt-1.5 text-sm text-muted-foreground",
              tooLong && "text-destructive",
            )}
          >
            {text.length.toLocaleString("en")} of{" "}
            {maxLength.toLocaleString("en")} characters
            {tooLong ? ". Shorten the text to check it." : ""}
          </p>
        </div>

        <div>
          {ruleSets.length > 1 ? (
            <>
              <span id={`${textId}-set`} className="text-sm font-medium">
                Rule set
              </span>
              <Select
                value={ruleSet.id}
                onValueChange={(value) => {
                  if (!value) return;
                  setRuleSetId(value);
                  setChecked(null);
                  setFailure(null);
                  setExpanded(new Set());
                }}
                items={ruleSets.map((set) => ({ value: set.id, label: set.name }))}
              >
                <SelectTrigger
                  aria-labelledby={`${textId}-set`}
                  className="mt-1.5 w-full bg-card"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ruleSets.map((set) => (
                    <SelectItem key={set.id} value={set.id}>
                      {set.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          ) : (
            <p className="text-sm font-medium">
              Rule set:{" "}
              <span className="font-semibold text-foreground">{ruleSet.name}</span>
            </p>
          )}

          <Button
            type="button"
            size="lg"
            className="mt-3 w-full"
            disabled={checking || tooLong || !text.trim()}
            onClick={check}
          >
            {checking ? "Checking…" : checked ? "Check again" : "Check text"}
          </Button>

          {failure ? (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {failureMessages[failure]}{" "}
              {needsSettings(failure) ? (
                <Link href="/settings" className="font-medium underline underline-offset-4">
                  Open Settings
                </Link>
              ) : null}
            </p>
          ) : null}

          <div aria-live="polite" aria-busy={checking}>
            <ul
              className={cn(
                "mt-4 divide-y border-t transition-opacity motion-reduce:transition-none",
                (stale || checking) && "opacity-50",
              )}
            >
              {ruleSet.rules.map((rule, index) => (
                <RuleRow
                  key={`${ruleSet.id}-${index}`}
                  rule={rule}
                  result={checked?.results[index]}
                  path={String(index)}
                  expanded={expanded}
                  onToggle={toggle}
                />
              ))}
            </ul>
            {stale && !checking ? (
              <p className="mt-3 text-sm text-muted-foreground">
                The text has changed since this check. Check again to update the
                results.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
