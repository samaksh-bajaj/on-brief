import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  buildRuleTree,
  countRules,
  MAX_DEPTH,
  MAX_NAME_LENGTH,
  MAX_RULE_LENGTH,
  MAX_RULES,
  ruleDepth,
  type Rule,
  type RuleRow,
  type RuleSet,
  type RuleSetSummary,
} from "@/lib/rules";

// Every function here runs as the signed-in user, so row level security
// limits it to that user's own rule sets.

export type SaveRuleSetInput = { id?: string; name: string; rules: Rule[] };

export type SaveRuleSetResult =
  | { ok: true; id: string }
  | {
      ok: false;
      reason:
        | "name_required"
        | "name_too_long"
        | "no_rules"
        | "too_many_rules"
        | "too_deep"
        | "rule_empty"
        | "rule_too_long"
        | "not_found"
        | "failed";
    };

export type DeleteRuleSetResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "failed" };

const RULE_COLUMNS = "id, parent_id, text, position";

export async function listRuleSets(): Promise<RuleSetSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rule_sets")
    .select("id, name, rules(parent_id)")
    .order("updated_at", { ascending: false });
  if (error || !data) return [];

  return data.map((set) => ({
    id: set.id as string,
    name: set.name as string,
    ruleCount: (set.rules as { parent_id: string | null }[]).filter(
      (rule) => rule.parent_id === null,
    ).length,
  }));
}

/** Every rule set with its rules, for the check page. */
export async function listRuleSetsWithRules(): Promise<RuleSet[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rule_sets")
    .select(`id, name, rules(${RULE_COLUMNS})`)
    .order("updated_at", { ascending: false });
  if (error || !data) return [];

  return data.map((set) => ({
    id: set.id as string,
    name: set.name as string,
    rules: buildRuleTree(set.rules as RuleRow[]),
  }));
}

export async function getRuleSet(id: string): Promise<RuleSet | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rule_sets")
    .select(`id, name, rules(${RULE_COLUMNS})`)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;

  return {
    id: data.id as string,
    name: data.name as string,
    rules: buildRuleTree(data.rules as RuleRow[]),
  };
}

/** Trims every rule and keeps only the fields we store. */
const clean = (rules: Rule[]): Rule[] =>
  (Array.isArray(rules) ? rules : []).map((rule) => ({
    text: String(rule?.text ?? "").trim(),
    children: clean(rule?.children),
  }));

const some = (rules: Rule[], test: (rule: Rule) => boolean): boolean =>
  rules.some((rule) => test(rule) || some(rule.children, test));

/** Creates a rule set, or replaces the name and rules of an existing one. */
export async function saveRuleSet(
  input: SaveRuleSetInput,
): Promise<SaveRuleSetResult> {
  const name = input.name.trim();
  if (!name) return { ok: false, reason: "name_required" };
  if (name.length > MAX_NAME_LENGTH) return { ok: false, reason: "name_too_long" };

  const rules = clean(input.rules);
  if (!rules.length) return { ok: false, reason: "no_rules" };
  if (ruleDepth(rules) > MAX_DEPTH) return { ok: false, reason: "too_deep" };
  if (countRules(rules) > MAX_RULES) return { ok: false, reason: "too_many_rules" };
  if (some(rules, (rule) => !rule.text)) return { ok: false, reason: "rule_empty" };
  if (some(rules, (rule) => rule.text.length > MAX_RULE_LENGTH)) {
    return { ok: false, reason: "rule_too_long" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_rule_set", {
    p_id: input.id ?? null,
    p_name: name,
    p_rules: rules,
  });
  if (error) {
    const known = (["not_found", "too_deep", "too_many_rules"] as const).find(
      (reason) => error.message.includes(reason),
    );
    return { ok: false, reason: known ?? "failed" };
  }
  return { ok: true, id: data as string };
}

export async function deleteRuleSet(id: string): Promise<DeleteRuleSetResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rule_sets")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) return { ok: false, reason: "failed" };
  if (!data.length) return { ok: false, reason: "not_found" };
  return { ok: true };
}
