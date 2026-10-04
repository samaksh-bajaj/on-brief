import "server-only";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export const MIN_PASSWORD_LENGTH = 8;

export type Credentials = { email: string; password: string };

export type SignUpResult =
  | { ok: true }
  | {
      ok: false;
      reason: "invalid_email" | "password_too_short" | "email_taken" | "failed";
    };

export type SignInResult =
  | { ok: true }
  | { ok: false; reason: "invalid_credentials" | "failed" };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Creates an account and signs it in. We cannot send email, so the account
 * is created through the admin API with its email already confirmed.
 */
export async function signUp(input: Credentials): Promise<SignUpResult> {
  const email = input.email.trim().toLowerCase();
  if (!EMAIL.test(email)) return { ok: false, reason: "invalid_email" };
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, reason: "password_too_short" };
  }

  const { error } = await createAdminClient().auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
  });
  if (error) {
    if (error.code === "email_exists") return { ok: false, reason: "email_taken" };
    if (error.code === "weak_password") {
      return { ok: false, reason: "password_too_short" };
    }
    return { ok: false, reason: "failed" };
  }

  const signedIn = await signIn({ email, password: input.password });
  return signedIn.ok ? { ok: true } : { ok: false, reason: "failed" };
}

export async function signIn(input: Credentials): Promise<SignInResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: input.email.trim().toLowerCase(),
    password: input.password,
  });
  if (!error) return { ok: true };
  return {
    ok: false,
    reason: error.code === "invalid_credentials" ? "invalid_credentials" : "failed",
  };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export type DeleteAccountResult = { ok: true } | { ok: false; reason: "failed" };

/**
 * Deletes the account and everything it owns. Rule sets, rules and the stored
 * API key (with its Vault secret) go with it through cascades in the database.
 */
export async function deleteAccount(userId: string): Promise<DeleteAccountResult> {
  const { error } = await createAdminClient().auth.admin.deleteUser(userId);
  if (error) return { ok: false, reason: "failed" };

  // The session now points at a user that no longer exists; drop the cookies.
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  return { ok: true };
}
