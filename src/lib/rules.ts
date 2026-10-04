// Shared by server and client. No server-only imports here.

/** Every rule is a yes-or-no judgment: the text either meets it or doesn't. */
export type Rule = { text: string };

export type RuleSet = { id: string; name: string; rules: Rule[] };

export type RuleSetSummary = { id: string; name: string; ruleCount: number };

export const MAX_RULES = 60;
export const MAX_RULE_LENGTH = 500;
export const MAX_NAME_LENGTH = 80;

export function describeRuleCount(count: number) {
  if (!count) return "No rules";
  return `${count} ${count === 1 ? "rule" : "rules"}`;
}
