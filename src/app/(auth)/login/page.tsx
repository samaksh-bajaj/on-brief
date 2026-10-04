import { AuthForm } from "@/components/auth-form";
import { signInAction } from "../actions";

export const metadata = { title: "Log in · OnBrief" };

export default function LoginPage() {
  return <AuthForm mode="login" action={signInAction} />;
}
