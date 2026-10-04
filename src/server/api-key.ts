import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyApiKey } from "@/server/typesafe";

// The key is a Vault secret reachable only with the secret key, so every
// function here uses the admin client and must be given a verified user id.

export type ApiKeyStatus = { saved: false } | { saved: true; last4: string };

export type SaveApiKeyResult =
  | { ok: true; last4: string }
  | { ok: false; reason: "empty" | "invalid_api_key" | "unverified" | "failed" };

export type RemoveApiKeyResult = { ok: true } | { ok: false; reason: "failed" };

export async function getApiKeyStatus(userId: string): Promise<ApiKeyStatus> {
  const { data } = await createAdminClient()
    .from("user_api_keys")
    .select("last4")
    .eq("user_id", userId)
    .maybeSingle();
  return data ? { saved: true, last4: data.last4 as string } : { saved: false };
}

/** The decrypted key, for making a TypeSafe call on the user's behalf. */
export async function getApiKey(userId: string): Promise<string | null> {
  const { data, error } = await createAdminClient().rpc("get_typesafe_key", {
    p_user_id: userId,
  });
  if (error) return null;
  return (data as string | null) ?? null;
}

/** Checks the key with TypeSafe, then stores it, replacing any earlier key. */
export async function saveApiKey(input: {
  userId: string;
  key: string;
}): Promise<SaveApiKeyResult> {
  const key = input.key.trim();
  if (!key) return { ok: false, reason: "empty" };

  const verified = await verifyApiKey(key);
  if (!verified.ok) {
    return {
      ok: false,
      reason: verified.reason === "invalid_api_key" ? "invalid_api_key" : "unverified",
    };
  }

  const { error } = await createAdminClient().rpc("set_typesafe_key", {
    p_user_id: input.userId,
    p_key: key,
  });
  if (error) return { ok: false, reason: "failed" };
  return { ok: true, last4: key.slice(-4) };
}

export async function removeApiKey(userId: string): Promise<RemoveApiKeyResult> {
  const { error } = await createAdminClient().rpc("delete_typesafe_key", {
    p_user_id: userId,
  });
  return error ? { ok: false, reason: "failed" } : { ok: true };
}
