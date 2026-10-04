// Shared by server and client. No runtime imports, so the tests can load it.

/**
 * A yes-or-no judgment: the text either meets the rule or doesn't. A rule
 * with sub-rules is met only when every one of its sub-rules is met.
 */
export type Rule = { text: string; children: Rule[] };

export type RuleSet = { id: string; name: string; rules: Rule[] };

/** `ruleCount` counts top-level rules only. */
export type RuleSetSummary = { id: string; name: string; ruleCount: number };

/** A rule as stored: one row, pointing at its parent. */
export type RuleRow = {
  id: string;
  parent_id: string | null;
  text: string;
  position: number;
};

/** All rules in a set, sub-rules included. */
export const MAX_RULES = 60;
/** A top-level rule is level 1. */
export const MAX_DEPTH = 4;
export const MAX_RULE_LENGTH = 500;
export const MAX_NAME_LENGTH = 80;

export function describeRuleCount(count: number) {
  if (!count) return "No rules";
  return `${count} ${count === 1 ? "rule" : "rules"}`;
}

/** Turns stored rows into a tree, with siblings in `position` order. */
export function buildRuleTree(rows: RuleRow[]): Rule[] {
  const byParent = new Map<string | null, RuleRow[]>();
  for (const row of rows) {
    const siblings = byParent.get(row.parent_id) ?? [];
    siblings.push(row);
    byParent.set(row.parent_id, siblings);
  }
  const build = (parentId: string | null): Rule[] =>
    (byParent.get(parentId) ?? [])
      .sort((a, b) => a.position - b.position)
      .map((row) => ({ text: row.text, children: build(row.id) }));
  return build(null);
}

/** Every rule in the tree, sub-rules included. */
export function countRules(rules: Rule[]): number {
  return rules.reduce((sum, rule) => sum + 1 + countRules(rule.children), 0);
}

/** How many levels the tree has: 0 when empty, 1 when no rule has sub-rules. */
export function ruleDepth(rules: Rule[]): number {
  return rules.reduce(
    (deepest, rule) => Math.max(deepest, 1 + ruleDepth(rule.children)),
    0,
  );
}
