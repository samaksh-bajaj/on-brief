import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckWorkspace } from "@/components/check-workspace";
import { PageHeading } from "@/components/page-heading";
import { buttonVariants } from "@/components/ui/button";
import { MAX_TEXT_LENGTH } from "@/lib/check";
import { getUserId } from "@/lib/supabase/server";
import { getApiKeyStatus } from "@/server/api-key";
import { listRuleSetsWithRules } from "@/server/rule-sets";
import { runCheckAction } from "./actions";

export const metadata = { title: "Check text · OnBrief" };

export default async function CheckPage() {
  const userId = await getUserId();
  if (!userId) redirect("/login");

  const [ruleSets, keyStatus] = await Promise.all([
    listRuleSetsWithRules(),
    getApiKeyStatus(userId),
  ]);

  if (!ruleSets.length) {
    return (
      <>
        <PageHeading title="Check text" />
        <p className="max-w-[60ch] text-muted-foreground">
          You need a rule set before you can check anything. A rule set is the
          list of rules your text has to meet.
        </p>
        <Link
          href="/rule-sets/new"
          className={buttonVariants({ size: "lg", className: "mt-5" })}
        >
          Create your first rule set
        </Link>
      </>
    );
  }

  return (
    <>
      <PageHeading title="Check text" />
      <CheckWorkspace
        ruleSets={ruleSets}
        run={runCheckAction}
        maxLength={MAX_TEXT_LENGTH}
        notice={
          keyStatus.saved ? null : (
            <p className="mb-6 rounded-lg border border-warn/50 bg-warn/10 px-4 py-3 text-sm">
              Checks run on your own TypeSafe API key, and you haven&apos;t saved
              one yet.{" "}
              <Link
                href="/settings"
                className="font-medium underline underline-offset-4"
              >
                Add your key in Settings
              </Link>
            </p>
          )
        }
      />
    </>
  );
}
