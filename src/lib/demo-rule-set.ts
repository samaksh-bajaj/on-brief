import type { RuleSet } from "@/lib/rules";

/** The fixed rule set behind the signed-out live demo. */
export const demoRuleSet: RuleSet = {
  id: "demo",
  name: "Cold outreach email",
  rules: [
    { type: "noul", text: "Addresses the recipient by name" },
    { type: "noul", text: "Says who the sender is and where they work" },
    { type: "noul", text: "Asks for one specific next step" },
    { type: "noul", text: "Makes no promise of guaranteed results" },
    { type: "score", text: "Gets to the point quickly" },
    { type: "score", text: "Sounds written by a person, not a template" },
    {
      type: "score",
      text: "Focuses on the recipient's problem rather than the sender's product",
    },
  ],
};

/** A flawed email, so a first run shows ticks, crosses and part-filled bars. */
export const demoSampleText = `Hi Priya,

Quick one. Our platform does routing, dock slotting and analytics, and customers love it. We guarantee it will cut your freight costs, and I think it could really help Northwind.

Do you have time to chat sometime?

Thanks`;
