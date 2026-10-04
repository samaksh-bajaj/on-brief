import { signOutAction } from "@/app/(auth)/actions";
import { PageHeading } from "@/components/page-heading";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Settings · OnBrief" };

export default function SettingsPage() {
  return (
    <>
      <PageHeading
        title="Settings"
        description="Your TypeSafe API key and your account."
      />
      <form action={signOutAction}>
        <Button type="submit" variant="outline">
          Log out
        </Button>
      </form>
    </>
  );
}
