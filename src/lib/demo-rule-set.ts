import type { Rule, RuleSet } from "@/lib/rules";

const rule = (text: string, children: Rule[] = []): Rule => ({ text, children });

/** The fixed rule set behind the signed-out live demo. */
export const demoRuleSet: RuleSet = {
  id: "demo",
  name: "Cold outreach email",
  rules: [
    rule("Addresses the recipient by name"),
    rule("Says who is writing", [
      rule("Gives the sender's name"),
      rule("Names the sender's company"),
    ]),
    rule("Asks for one specific next step", [
      rule("Proposes a specific day or time"),
      rule("Says how long it will take"),
    ]),
    rule("Makes no promise of guaranteed results"),
    rule("Focuses on the recipient's problem rather than the sender's product"),
  ],
};

/**
 * A flawed email: each rule with sub-rules is half met, so opening it shows
 * one tick and one cross.
 */
export const demoSampleText = `Hi Priya,

Quick one. Our platform does routing, dock slotting and analytics, and customers love it. We guarantee it will cut your freight costs, and I think it could really help Northwind.

Do you have 15 minutes to chat sometime?

Thanks,
Dan`;
