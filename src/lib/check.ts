// Shared by server and client. No runtime imports, so the tests can load it.
import type { Rule } from "./rules.ts";

/** Mirrors the rule tree. A rule with sub-rules passes only if they all do. */
export type RuleResult = {
  text: string;
  passed: boolean;
  children: RuleResult[];
};

/** A rule without sub-rules: the only kind the model is asked about. */
export type Leaf = {
  text: string;
  /** The rules it sits under, outermost first. Empty for a top-level rule. */
  ancestors: string[];
};

export const MAX_TEXT_LENGTH = 60_000;
export const DEMO_MAX_TEXT_LENGTH = 5_000;

/** A rule is met when the model thinks "yes" is more likely than not. */
export const NOUL_PASS_THRESHOLD = 0.5;

export const noulPassed = (probability: number) =>
  probability > NOUL_PASS_THRESHOLD;

/** The rules to put to the model, in depth-first order. */
export function collectLeaves(rules: Rule[], ancestors: string[] = []): Leaf[] {
  return rules.flatMap((rule) =>
    rule.children.length
      ? collectLeaves(rule.children, [...ancestors, rule.text])
      : [{ text: rule.text, ancestors }],
  );
}

/**
 * Rebuilds the tree with a result on every rule. `leafPassed` holds one answer
 * per leaf, in the order `collectLeaves` returns them.
 */
export function buildResults(rules: Rule[], leafPassed: boolean[]): RuleResult[] {
  let next = 0;
  const build = (rule: Rule): RuleResult => {
    if (!rule.children.length) {
      return { text: rule.text, passed: leafPassed[next++] === true, children: [] };
    }
    const children = rule.children.map(build);
    return {
      text: rule.text,
      passed: children.every((child) => child.passed),
      children,
    };
  };
  return rules.map(build);
}
