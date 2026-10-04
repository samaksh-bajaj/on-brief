import assert from "node:assert/strict";
import { test } from "node:test";
import { buildRuleTree, countRules, ruleDepth, type Rule } from "./rules.ts";

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

test("rows become a tree, ordered by position within each parent", () => {
  const rows = [
    { id: "t", parent_id: "d", text: "Time", position: 2 },
    { id: "p", parent_id: "a", text: "Packaging", position: 2 },
    { id: "z", parent_id: null, text: "Polite", position: 2 },
    { id: "d", parent_id: "a", text: "Delivery time", position: 1 },
    { id: "a", parent_id: null, text: "Terms", position: 1 },
    { id: "b", parent_id: "a", text: "Banking", position: 3 },
    { id: "e", parent_id: "d", text: "Date", position: 1 },
  ];
  assert.deepEqual(buildRuleTree(rows), terms);
});

test("no rows give an empty tree", () => {
  assert.deepEqual(buildRuleTree([]), []);
});

test("counting includes sub-rules at every level", () => {
  assert.equal(countRules(terms), 7);
  assert.equal(countRules([]), 0);
});

test("depth counts levels, starting at 1 for a flat list", () => {
  assert.equal(ruleDepth([]), 0);
  assert.equal(ruleDepth([leaf("a"), leaf("b")]), 1);
  assert.equal(ruleDepth(terms), 3);
});
