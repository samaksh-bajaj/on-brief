import { AuthForm } from "@/components/auth-form";
import { signUpAction } from "../actions";

export const metadata = { title: "Create account · OnBrief" };

export default function SignupPage() {
  return <AuthForm mode="signup" action={signUpAction} />;
}
