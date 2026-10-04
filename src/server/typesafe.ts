import "server-only";
import {
  APIError,
  AuthenticationError,
  PermissionDeniedError,
  RateLimitError,
  TypeSafeClient,
  noul,
  type NoulQuestion,
  type Questions,
} from "@typesafe-ai/sdk";
import {
  buildResults,
  collectLeaves,
  noulPassed,
  type Leaf,
  type RuleResult,
} from "@/lib/check";
import type { Rule } from "@/lib/rules";

export type TypeSafeFailure =
  | "invalid_api_key"
  | "rate_limited"
  | "overloaded"
  | "failed";

export function createTypeSafeClient(apiKey: string) {
  return new TypeSafeClient({ apiKey, timeout: 30_000, logLevel: "off" });
}

export function classifyTypeSafeError(error: unknown): TypeSafeFailure {
  if (error instanceof AuthenticationError) return "invalid_api_key";
  if (error instanceof PermissionDeniedError) return "invalid_api_key";
  if (error instanceof RateLimitError) return "rate_limited";
  if (error instanceof APIError && error.status === 529) return "overloaded";
  return "failed";
}

/** Confirms a key is accepted by TypeSafe. Listing models costs nothing. */
export async function verifyApiKey(
  apiKey: string,
): Promise<{ ok: true } | { ok: false; reason: TypeSafeFailure }> {
  try {
    await createTypeSafeClient(apiKey).models.list();
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: classifyTypeSafeError(error) };
  }
}

export type JudgeResult =
  | { ok: true; results: RuleResult[] }
  | { ok: false; reason: TypeSafeFailure };

const quote = (text: string) => `"${text}"`;

/**
 * The question for one rule. A sub-rule such as "Must include time" means
 * little alone, so it is asked together with the rules it sits under, and the
 * criteria spell out that a match about some unrelated matter does not count.
 * This wording was the most accurate of nine tried against Jev on sample
 * texts; test again on real cases before changing it.
 */
function leafQuestion(leaf: Leaf): NoulQuestion {
  if (!leaf.ancestors.length) {
    return noul(`Does the text satisfy this rule: ${quote(leaf.text)}?`);
  }
  const parent = quote(leaf.ancestors[leaf.ancestors.length - 1]);
  const rule = quote(leaf.text);
  return noul(
    `Rule: ${leaf.ancestors.map(quote).join(", and within it ")}. A specific requirement within that rule: ${rule}. Does the text satisfy this specific requirement as it applies to that rule?`,
    {
      true: `The text satisfies ${rule} as it applies to ${parent}`,
      false: `The text does not satisfy ${rule} as it applies to ${parent}, even if it mentions something similar about an unrelated matter`,
    },
  );
}

/**
 * Judges a text against a rule tree in one Jev request. The text is the
 * state. Only rules without sub-rules are put to the model, each as its own
 * question; a rule with sub-rules is met when all of them are.
 */
export async function judge(
  apiKey: string,
  text: string,
  rules: Rule[],
): Promise<JudgeResult> {
  const leaves = collectLeaves(rules);
  const questions: Questions = {};
  leaves.forEach((leaf, index) => {
    questions[`rule_${index}`] = leafQuestion(leaf);
  });

  try {
    const { answers } = await createTypeSafeClient(apiKey).systemOne({
      state: { text },
      questions,
    });

    const leafPassed = leaves.map((_, index) => {
      const answer = answers[`rule_${index}`];
      if (answer?.type !== "noul") {
        throw new Error("TypeSafe returned an answer of the wrong type");
      }
      return noulPassed(answer.noul);
    });
    return { ok: true, results: buildResults(rules, leafPassed) };
  } catch (error) {
    return { ok: false, reason: classifyTypeSafeError(error) };
  }
}
