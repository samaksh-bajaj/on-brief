import "server-only";
import {
  DEMO_MAX_TEXT_LENGTH,
  MAX_TEXT_LENGTH,
  type RuleResult,
} from "@/lib/check";
import { demoRuleSet } from "@/lib/demo-rule-set";
import { getApiKey } from "@/server/api-key";
import { getRuleSet } from "@/server/rule-sets";
import { judge, type TypeSafeFailure } from "@/server/typesafe";

export type CheckResult =
  | { ok: true; results: RuleResult[] }
  | {
      ok: false;
      reason:
        | "empty_text"
        | "text_too_long"
        | "not_found"
        | "no_rules"
        | "no_api_key"
        | "demo_unavailable"
        | TypeSafeFailure;
    };

/**
 * Checks a text against one of the user's rule sets with their own TypeSafe
 * key. Nothing about the check is stored: not the text, not the results.
 */
export async function runCheck(input: {
  userId: string;
  ruleSetId: string;
  text: string;
}): Promise<CheckResult> {
  const text = input.text.trim();
  if (!text) return { ok: false, reason: "empty_text" };
  if (text.length > MAX_TEXT_LENGTH) return { ok: false, reason: "text_too_long" };

  // Read as the signed-in user, so only their own rule sets can be found
  const ruleSet = await getRuleSet(input.ruleSetId);
  if (!ruleSet) return { ok: false, reason: "not_found" };
  if (!ruleSet.rules.length) return { ok: false, reason: "no_rules" };

  const apiKey = await getApiKey(input.userId);
  if (!apiKey) return { ok: false, reason: "no_api_key" };

  return judge(apiKey, text, ruleSet.rules);
}

/**
 * The signed-out live demo: the visitor's text against the fixed demo rule
 * set, paid for by the site owner's key. The rules never come from the
 * browser, so the key can only be spent on this one rule set.
 */
export async function runDemoCheck(input: { text: string }): Promise<CheckResult> {
  const text = input.text.trim();
  if (!text) return { ok: false, reason: "empty_text" };
  if (text.length > DEMO_MAX_TEXT_LENGTH) {
    return { ok: false, reason: "text_too_long" };
  }

  const apiKey = process.env.TYPESAFE_DEMO_API_KEY;
  if (!apiKey) return { ok: false, reason: "demo_unavailable" };

  const result = await judge(apiKey, text, demoRuleSet.rules);
  // A visitor can't fix the owner's key, so don't send them to Settings
  if (!result.ok && result.reason === "invalid_api_key") {
    return { ok: false, reason: "demo_unavailable" };
  }
  return result;
}
