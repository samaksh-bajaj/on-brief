"use client";

import { Check, X } from "lucide-react";
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
import { fillToColor, type RuleResult } from "@/lib/check";
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

function Mark({ result }: { result?: RuleResult & { type: "noul" } }) {
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

function ScoreBar({ result }: { result?: RuleResult & { type: "score" } }) {
  const percent = result ? Math.round(result.fill * 100) : 0;
  return (
    <div className="mt-2 flex items-center gap-3">
      <div
        role="meter"
        aria-label="Score"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={result ? percent : undefined}
        aria-valuetext={result ? `${percent} out of 100` : "Not checked yet"}
        className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full transition-[width,background-color] duration-700 ease-out motion-reduce:transition-none"
          style={{
            // A sliver stays visible at zero, so an empty bar still reads as red
            width: result ? `${Math.max(percent, 3)}%` : "0%",
            backgroundColor: fillToColor(result?.fill ?? 0),
          }}
        />
      </div>
      <span
        aria-hidden="true"
        className="w-8 text-right text-sm font-medium tabular-nums text-muted-foreground"
      >
        {result ? percent : "–"}
      </span>
    </div>
  );
}

function RuleRow({ rule, result }: { rule: Rule; result?: RuleResult }) {
  if (rule.type === "noul") {
    return (
      <li className="flex gap-3 py-3.5">
        <Mark result={result?.type === "noul" ? result : undefined} />
        <span>{rule.text}</span>
      </li>
    );
  }
  return (
    <li className="py-3.5">
      <span>{rule.text}</span>
      <ScoreBar result={result?.type === "score" ? result : undefined} />
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
  const [checking, startChecking] = useTransition();

  const ruleSet = ruleSets.find((set) => set.id === ruleSetId) ?? ruleSets[0];
  const tooLong = text.length > maxLength;
  const stale = checked !== null && checked.text !== text;

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
            className="mt-1.5 block min-h-72 w-full resize-y rounded-lg border border-input bg-card px-5 py-4 font-serif text-lg leading-[1.6] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive lg:min-h-[28rem]"
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
                  // Position plus text: results belong to exactly this rule
                  key={`${ruleSet.id}-${index}`}
                  rule={rule}
                  result={checked?.results[index]}
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
