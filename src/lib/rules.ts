// Shared by server and client. No server-only imports here.

export type RuleType = "noul" | "score";

export type Rule = { type: RuleType; text: string };

export type RuleSet = { id: string; name: string; rules: Rule[] };

export type RuleSetSummary = {
  id: string;
  name: string;
  noulCount: number;
  scoreCount: number;
};

export const MAX_RULES = 30;
export const MAX_RULE_LENGTH = 500;
export const MAX_NAME_LENGTH = 80;

/** What people see instead of the model's own names for the two types. */
export const ruleTypeLabels: Record<RuleType, string> = {
  noul: "Yes or no",
  score: "Score",
};

export function describeRuleCounts(noulCount: number, scoreCount: number) {
  const parts: string[] = [];
  if (noulCount) parts.push(`${noulCount} yes-or-no`);
  if (scoreCount) parts.push(`${scoreCount} score`);
  if (!parts.length) return "No rules";
  const total = noulCount + scoreCount;
  return `${parts.join(", ")} ${total === 1 ? "rule" : "rules"}`;
}
