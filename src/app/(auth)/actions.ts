"use server";

import { redirect } from "next/navigation";
import { signIn, signOut, signUp } from "@/server/auth";

export type AuthFormState = { error: string | null };

const signUpErrors = {
  invalid_email: "Enter a valid email address.",
  password_too_short: "Use a password of at least 8 characters.",
  email_taken: "An account with this email already exists. Log in instead.",
  failed: "The account could not be created. Try again.",
} as const;

const signInErrors = {
  invalid_credentials: "That email and password don't match an account.",
  failed: "Log in failed. Try again.",
} as const;

const read = (formData: FormData) => ({
  email: String(formData.get("email") ?? ""),
  password: String(formData.get("password") ?? ""),
});

export async function signUpAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const result = await signUp(read(formData));
  if (!result.ok) {
    return { error: signUpErrors[result.reason] };
  }
  redirect("/check");
}

export async function signInAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const result = await signIn(read(formData));
  if (!result.ok) {
    return { error: signInErrors[result.reason] };
  }
  redirect("/check");
}

export async function signOutAction() {
  await signOut();
  redirect("/");
}
