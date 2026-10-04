"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { AuthFormState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const copy = {
  signup: {
    title: "Create your account",
    submit: "Create account",
    pending: "Creating account…",
    switchText: "Already have an account?",
    switchLabel: "Log in",
    switchHref: "/login",
  },
  login: {
    title: "Log in",
    submit: "Log in",
    pending: "Logging in…",
    switchText: "New to OnBrief?",
    switchLabel: "Create an account",
    switchHref: "/signup",
  },
} as const;

export function AuthForm({
  mode,
  action,
}: {
  mode: keyof typeof copy;
  action: (prev: AuthFormState, formData: FormData) => Promise<AuthFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  // Controlled so the email survives a failed attempt (forms reset after an action)
  const [email, setEmail] = useState("");
  const text = copy[mode];

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight">{text.title}</h1>
      <form action={formAction} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            minLength={mode === "signup" ? 8 : undefined}
            aria-describedby={mode === "signup" ? "password-hint" : undefined}
            required
          />
          {mode === "signup" ? (
            <p id="password-hint" className="text-sm text-muted-foreground">
              At least 8 characters. Keep it somewhere safe: OnBrief can&apos;t
              send email, so a forgotten password can&apos;t be reset.
            </p>
          ) : null}
        </div>
        {state.error ? (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? text.pending : text.submit}
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted-foreground">
        {text.switchText}{" "}
        <Link
          href={text.switchHref}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {text.switchLabel}
        </Link>
      </p>
    </div>
  );
}
