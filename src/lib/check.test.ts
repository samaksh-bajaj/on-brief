import assert from "node:assert/strict";
import { test } from "node:test";
import { fillToColor, noulPassed, scoreToFill } from "./check.ts";

test("a yes-or-no rule passes only above 0.5", () => {
  assert.equal(noulPassed(0.51), true);
  assert.equal(noulPassed(0.5), false);
  assert.equal(noulPassed(0.49), false);
});

test("score maps onto a 0 to 1 fill for a five-level scale", () => {
  assert.equal(scoreToFill(0, 5), 0);
  assert.equal(scoreToFill(2, 5), 0.5);
  assert.equal(scoreToFill(4, 5), 1);
  assert.equal(scoreToFill(1.05, 3), 0.525);
});

test("fill is clamped and survives bad input", () => {
  assert.equal(scoreToFill(9, 5), 1);
  assert.equal(scoreToFill(-1, 5), 0);
  assert.equal(scoreToFill(Number.NaN, 5), 0);
  assert.equal(scoreToFill(1, 1), 0);
});

test("colour is red when empty, amber in the middle, green when full", () => {
  assert.equal(fillToColor(0), "color-mix(in oklch, var(--warn) 0%, var(--fail))");
  assert.equal(fillToColor(0.5), "color-mix(in oklch, var(--warn) 100%, var(--fail))");
  assert.equal(fillToColor(1), "color-mix(in oklch, var(--pass) 100%, var(--warn))");
});

test("colour changes continuously, with no jump at the midpoint", () => {
  assert.equal(fillToColor(0.25), "color-mix(in oklch, var(--warn) 50%, var(--fail))");
  assert.equal(fillToColor(0.75), "color-mix(in oklch, var(--pass) 50%, var(--warn))");
  // Just either side of the middle is almost pure amber both ways
  assert.equal(fillToColor(0.499), "color-mix(in oklch, var(--warn) 99.8%, var(--fail))");
  assert.equal(fillToColor(0.501), "color-mix(in oklch, var(--pass) 0.2%, var(--warn))");
  assert.notEqual(fillToColor(0.62), fillToColor(0.7));
});
