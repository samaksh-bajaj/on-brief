"use server";

import { revalidatePath } from "next/cache";
import {
  deleteRuleSet,
  saveRuleSet,
  type DeleteRuleSetResult,
  type SaveRuleSetInput,
  type SaveRuleSetResult,
} from "@/server/rule-sets";

export async function saveRuleSetAction(
  input: SaveRuleSetInput,
): Promise<SaveRuleSetResult> {
  const result = await saveRuleSet(input);
  if (result.ok) revalidatePath("/rule-sets", "layout");
  return result;
}

export async function deleteRuleSetAction(
  id: string,
): Promise<DeleteRuleSetResult> {
  const result = await deleteRuleSet(id);
  if (result.ok) revalidatePath("/rule-sets", "layout");
  return result;
}
