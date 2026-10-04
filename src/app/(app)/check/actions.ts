"use server";

import { redirect } from "next/navigation";
import { getUserId } from "@/lib/supabase/server";
import { runCheck, type CheckResult } from "@/server/check";

export async function runCheckAction(
  ruleSetId: string,
  text: string,
): Promise<CheckResult> {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  return runCheck({ userId, ruleSetId, text });
}
