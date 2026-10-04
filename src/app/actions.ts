"use server";

import { runDemoCheck, type CheckResult } from "@/server/check";

// Takes the same arguments as the signed-in check so both fit CheckWorkspace.
// The rule set id is ignored: the demo always runs its own fixed rules.
export async function runDemoCheckAction(
  _ruleSetId: string,
  text: string,
): Promise<CheckResult> {
  return runDemoCheck({ text });
}
