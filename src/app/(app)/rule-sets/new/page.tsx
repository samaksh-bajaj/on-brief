import { PageHeading } from "@/components/page-heading";
import { RuleSetEditor } from "@/components/rule-set-editor";

export const metadata = { title: "New rule set · OnBrief" };

export default function NewRuleSetPage() {
  return (
    <>
      <PageHeading title="New rule set" />
      <RuleSetEditor />
    </>
  );
}
