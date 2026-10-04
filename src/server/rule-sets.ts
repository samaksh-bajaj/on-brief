import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  MAX_NAME_LENGTH,
  MAX_RULE_LENGTH,
  MAX_RULES,
  type Rule,
  type RuleSet,
  type RuleSetSummary,
  type RuleType,
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
        | "rule_empty"
        | "rule_too_long"
        | "not_found"
        | "failed";
    };

export type DeleteRuleSetResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "failed" };

const isRuleType = (value: unknown): value is RuleType =>
  value === "noul" || value === "score";

export async function listRuleSets(): Promise<RuleSetSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rule_sets")
    .select("id, name, rules(type)")
    .order("updated_at", { ascending: false });
  if (error || !data) return [];

  return data.map((set) => {
    const rules = set.rules as { type: RuleType }[];
    return {
      id: set.id as string,
      name: set.name as string,
      noulCount: rules.filter((r) => r.type === "noul").length,
      scoreCount: rules.filter((r) => r.type === "score").length,
    };
  });
}

export async function getRuleSet(id: string): Promise<RuleSet | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rule_sets")
    .select("id, name, rules(type, text, position)")
    .eq("id", id)
    .order("position", { referencedTable: "rules" })
    .maybeSingle();
  if (error || !data) return null;

  return {
    id: data.id as string,
    name: data.name as string,
    rules: (data.rules as Rule[]).map(({ type, text }) => ({ type, text })),
  };
}

/** Creates a rule set, or replaces the name and rules of an existing one. */
export async function saveRuleSet(
  input: SaveRuleSetInput,
): Promise<SaveRuleSetResult> {
  const name = input.name.trim();
  if (!name) return { ok: false, reason: "name_required" };
  if (name.length > MAX_NAME_LENGTH) return { ok: false, reason: "name_too_long" };

  const rules = input.rules.map((rule) => ({
    type: rule.type,
    text: String(rule.text ?? "").trim(),
  }));
  if (!rules.length) return { ok: false, reason: "no_rules" };
  if (rules.length > MAX_RULES) return { ok: false, reason: "too_many_rules" };
  if (rules.some((r) => !r.text || !isRuleType(r.type))) {
    return { ok: false, reason: "rule_empty" };
  }
  if (rules.some((r) => r.text.length > MAX_RULE_LENGTH)) {
    return { ok: false, reason: "rule_too_long" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_rule_set", {
    p_id: input.id ?? null,
    p_name: name,
    p_rules: rules,
  });
  if (error) {
    return {
      ok: false,
      reason: error.message.includes("not_found") ? "not_found" : "failed",
    };
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
