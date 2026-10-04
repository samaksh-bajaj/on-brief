import { Plus } from "lucide-react";
import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { buttonVariants } from "@/components/ui/button";
import { describeRuleCounts } from "@/lib/rules";
import { listRuleSets } from "@/server/rule-sets";

export const metadata = { title: "Rule sets · OnBrief" };

export default async function RuleSetsPage() {
  const ruleSets = await listRuleSets();

  return (
    <>
      <PageHeading
        title="Rule sets"
        description="A rule set is a list of rules you check text against."
      >
        <Link href="/rule-sets/new" className={buttonVariants({ size: "lg" })}>
          <Plus data-icon="inline-start" />
          New rule set
        </Link>
      </PageHeading>

      {ruleSets.length ? (
        <ul className="max-w-3xl divide-y rounded-lg border bg-card">
          {ruleSets.map((set) => (
            <li key={set.id}>
              <Link
                href={`/rule-sets/${set.id}`}
                className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-4 py-3.5 outline-none hover:bg-muted focus-visible:bg-muted"
              >
                <span className="font-medium">{set.name}</span>
                <span className="text-sm text-muted-foreground">
                  {describeRuleCounts(set.noulCount, set.scoreCount)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="max-w-[60ch] text-muted-foreground">
          You have no rule sets yet. Create one to start checking text: for
          example, the house rules for a product announcement or a sales email.
        </p>
      )}
    </>
  );
}
