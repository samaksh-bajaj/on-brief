"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/supabase/server";
import {
  removeApiKey,
  saveApiKey,
  type RemoveApiKeyResult,
  type SaveApiKeyResult,
} from "@/server/api-key";
import { deleteAccount, type DeleteAccountResult } from "@/server/auth";

export async function saveApiKeyAction(key: string): Promise<SaveApiKeyResult> {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  const result = await saveApiKey({ userId, key });
  if (result.ok) revalidatePath("/settings");
  return result;
}

export async function removeApiKeyAction(): Promise<RemoveApiKeyResult> {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  const result = await removeApiKey(userId);
  if (result.ok) revalidatePath("/settings");
  return result;
}

export async function deleteAccountAction(): Promise<DeleteAccountResult> {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  const result = await deleteAccount(userId);
  if (!result.ok) return result;
  redirect("/");
}
