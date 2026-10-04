import "server-only";
import {
  APIError,
  AuthenticationError,
  PermissionDeniedError,
  RateLimitError,
  TypeSafeClient,
  noul,
  score,
  type Questions,
} from "@typesafe-ai/sdk";
import {
  noulPassed,
  SCORE_LEVELS,
  scoreToFill,
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

/**
 * Judges a text against every rule in one Jev request. The text is the state
 * and each rule is its own question, so rules are judged independently.
 */
export async function judge(
  apiKey: string,
  text: string,
  rules: Rule[],
): Promise<JudgeResult> {
  const questions: Questions = {};
  rules.forEach((rule, index) => {
    questions[`rule_${index}`] =
      rule.type === "noul"
        ? noul(`Does the text satisfy this rule: "${rule.text}"?`)
        : score(
            `How well does the text follow this rule: "${rule.text}"?`,
            SCORE_LEVELS,
          );
  });

  try {
    const { answers } = await createTypeSafeClient(apiKey).systemOne({
      state: { text },
      questions,
    });

    const results = rules.map((rule, index): RuleResult => {
      const answer = answers[`rule_${index}`];
      if (rule.type === "noul" && answer?.type === "noul") {
        return { type: "noul", text: rule.text, passed: noulPassed(answer.noul) };
      }
      if (rule.type === "score" && answer?.type === "score") {
        return {
          type: "score",
          text: rule.text,
          fill: scoreToFill(answer.score, SCORE_LEVELS.length),
        };
      }
      throw new Error("TypeSafe returned an answer of the wrong type");
    });
    return { ok: true, results };
  } catch (error) {
    return { ok: false, reason: classifyTypeSafeError(error) };
  }
}
