import assert from "node:assert/strict";
import { test } from "node:test";
import { noulPassed } from "./check.ts";

test("a rule passes only above 0.5", () => {
  assert.equal(noulPassed(0.51), true);
  assert.equal(noulPassed(0.5), false);
  assert.equal(noulPassed(0.49), false);
});
