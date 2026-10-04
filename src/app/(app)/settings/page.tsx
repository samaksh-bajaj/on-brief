import { redirect } from "next/navigation";
import { signOutAction } from "@/app/(auth)/actions";
import { ApiKeyForm } from "@/components/api-key-form";
import { DeleteAccount } from "@/components/delete-account";
import { PageHeading } from "@/components/page-heading";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/supabase/server";
import { getApiKeyStatus } from "@/server/api-key";

export const metadata = { title: "Settings · OnBrief" };

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t py-8 first:border-t-0 first:pt-0">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 mb-5 max-w-[65ch] text-muted-foreground">
        {description}
      </p>
      {children}
    </section>
  );
}

export default async function SettingsPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const keyStatus = await getApiKeyStatus(user.id);

  return (
    <>
      <PageHeading title="Settings" />
      <div className="max-w-3xl">
        <Section
          title="TypeSafe API key"
          description="Checks run on your own TypeSafe key, so you pay TypeSafe directly for what you use. The key is stored encrypted and is never shown again after you save it."
        >
          <ApiKeyForm status={keyStatus} />
        </Section>

        <Section
          title="Log out"
          description={
            <>
              You are logged in as{" "}
              <span className="font-medium text-foreground">{user.email}</span>.
            </>
          }
        >
          <form action={signOutAction}>
            <Button type="submit" variant="outline">
              Log out
            </Button>
          </form>
        </Section>

        <Section
          title="Delete account"
          description="Removes your account, your rule sets and your saved API key for good."
        >
          <DeleteAccount />
        </Section>
      </div>
    </>
  );
}
