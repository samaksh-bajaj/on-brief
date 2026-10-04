import { notFound } from "next/navigation";
import { PageHeading } from "@/components/page-heading";
import { RuleSetEditor } from "@/components/rule-set-editor";
import { getRuleSet } from "@/server/rule-sets";

export const metadata = { title: "Edit rule set · OnBrief" };

export default async function EditRuleSetPage({
  params,
}: PageProps<"/rule-sets/[id]">) {
  const { id } = await params;
  const ruleSet = await getRuleSet(id);
  if (!ruleSet) notFound();

  return (
    <>
      <PageHeading title="Edit rule set" />
      <RuleSetEditor ruleSet={ruleSet} />
    </>
  );
}
