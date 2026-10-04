import assert from "node:assert/strict";
import { test } from "node:test";
import { buildResults, collectLeaves, noulPassed } from "./check.ts";
import type { Rule } from "./rules.ts";

const leaf = (text: string): Rule => ({ text, children: [] });

const terms: Rule[] = [
  {
    text: "Terms",
    children: [
      { text: "Delivery time", children: [leaf("Date"), leaf("Time")] },
      leaf("Packaging"),
      leaf("Banking"),
    ],
  },
  leaf("Polite"),
];

test("a rule passes only above 0.5", () => {
  assert.equal(noulPassed(0.51), true);
  assert.equal(noulPassed(0.5), false);
  assert.equal(noulPassed(0.49), false);
});

test("only rules without sub-rules are asked, each with its parents", () => {
  assert.deepEqual(collectLeaves(terms), [
    { text: "Date", ancestors: ["Terms", "Delivery time"] },
    { text: "Time", ancestors: ["Terms", "Delivery time"] },
    { text: "Packaging", ancestors: ["Terms"] },
    { text: "Banking", ancestors: ["Terms"] },
    { text: "Polite", ancestors: [] },
  ]);
});

test("a parent passes when every sub-rule passes", () => {
  const [termsResult, polite] = buildResults(terms, [true, true, true, true, false]);
  assert.equal(termsResult.passed, true);
  assert.equal(termsResult.children[0].passed, true);
  assert.equal(polite.passed, false);
});

test("one failing sub-rule fails every rule above it, and nothing beside it", () => {
  // Date passes, Time fails
  const [termsResult, polite] = buildResults(terms, [true, false, true, true, true]);
  const [delivery, packaging, banking] = termsResult.children;
  assert.equal(termsResult.passed, false);
  assert.equal(delivery.passed, false);
  assert.deepEqual(
    delivery.children.map((child) => child.passed),
    [true, false],
  );
  assert.equal(packaging.passed, true);
  assert.equal(banking.passed, true);
  assert.equal(polite.passed, true);
});

test("results keep the shape and text of the rules", () => {
  const results = buildResults(terms, [true, true, true, true, true]);
  assert.equal(results[0].children[0].children[1].text, "Time");
  assert.deepEqual(results[1], { text: "Polite", passed: true, children: [] });
});

test("a missing answer counts as not met", () => {
  const [result] = buildResults([leaf("a")], []);
  assert.equal(result.passed, false);
});
