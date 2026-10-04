import type { RuleSet } from "@/lib/rules";

/** The fixed rule set behind the signed-out live demo. */
export const demoRuleSet: RuleSet = {
  id: "demo",
  name: "Cold outreach email",
  rules: [
    { text: "Addresses the recipient by name", children: [] },
    { text: "Says who the sender is and where they work", children: [] },
    { text: "Asks for one specific next step", children: [] },
    { text: "Makes no promise of guaranteed results", children: [] },
    {
      text: "Focuses on the recipient's problem rather than the sender's product",
      children: [],
    },
  ],
};

/** A flawed email, so a first run shows both ticks and crosses. */
export const demoSampleText = `Hi Priya,

Quick one. Our platform does routing, dock slotting and analytics, and customers love it. We guarantee it will cut your freight costs, and I think it could really help Northwind.

Do you have time to chat sometime?

Thanks`;
