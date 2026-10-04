// Shared by server and client. No imports, so the tests can run it directly.

export type RuleResult =
  | { type: "noul"; text: string; passed: boolean }
  | { type: "score"; text: string; fill: number };

export const MAX_TEXT_LENGTH = 60_000;
export const DEMO_MAX_TEXT_LENGTH = 5_000;

/** A yes-or-no rule is met when the model thinks "yes" is more likely than not. */
export const NOUL_PASS_THRESHOLD = 0.5;

/**
 * The scale every score rule is judged on, worst to best. Each level names the
 * rule's own terms because the model reads the levels one at a time.
 */
export const SCORE_LEVELS = [
  "The text does not follow the rule at all, or does the opposite of what the rule asks",
  "The text mostly fails the rule and follows it only in a small part",
  "The text follows the rule in some places and breaks it in others",
  "The text mostly follows the rule, with minor lapses",
  "The text follows the rule fully, from start to finish",
] as const;

const clamp01 = (value: number) =>
  Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;

export const noulPassed = (probability: number) =>
  probability > NOUL_PASS_THRESHOLD;

/** Turns a score (0 to the top level number) into how full the bar is, 0 to 1. */
export function scoreToFill(score: number, levelCount: number): number {
  if (levelCount < 2) return 0;
  return clamp01(score / (levelCount - 1));
}

/**
 * The bar's colour for a fill of 0 to 1: red when empty, amber in the middle,
 * green when full, blended continuously in OKLCH so there are no steps.
 */
export function fillToColor(fill: number): string {
  const f = clamp01(fill);
  if (f <= 0.5) {
    const amber = Math.round(f * 2 * 1000) / 10;
    return `color-mix(in oklch, var(--warn) ${amber}%, var(--fail))`;
  }
  const green = Math.round((f - 0.5) * 2 * 1000) / 10;
  return `color-mix(in oklch, var(--pass) ${green}%, var(--warn))`;
}
