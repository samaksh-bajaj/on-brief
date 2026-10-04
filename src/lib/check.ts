// Shared by server and client. No imports, so the tests can run it directly.

export type RuleResult = { text: string; passed: boolean };

export const MAX_TEXT_LENGTH = 60_000;
export const DEMO_MAX_TEXT_LENGTH = 5_000;

/** A rule is met when the model thinks "yes" is more likely than not. */
export const NOUL_PASS_THRESHOLD = 0.5;

export const noulPassed = (probability: number) =>
  probability > NOUL_PASS_THRESHOLD;
