import assert from "node:assert/strict";
import test from "node:test";
import {
  CACHE_TTL,
  awardsTtlMs,
  titleDataTtlMs,
  triviaTtlMs,
} from "./cache-policy.mjs";

const now = Date.parse("2026-07-12T00:00:00Z");
const daysAgo = (days) => new Date(now - days * CACHE_TTL.day).toISOString();

test("title TTL follows release age", () => {
  assert.equal(titleDataTtlMs(daysAgo(14), now), CACHE_TTL.day);
  assert.equal(titleDataTtlMs(daysAgo(20), now), CACHE_TTL.week);
  assert.equal(titleDataTtlMs(daysAgo(75), now), CACHE_TTL.thirtyDays);
  assert.equal(titleDataTtlMs(daysAgo(100), now), CACHE_TTL.sixtyDays);
});

test("future and unknown releases use safe TTLs", () => {
  assert.equal(titleDataTtlMs(new Date(now + CACHE_TTL.week).toISOString(), now), CACHE_TTL.day);
  assert.equal(titleDataTtlMs(null, now), CACHE_TTL.sixtyDays);
});

test("awards and trivia use their independent TTL policies", () => {
  assert.equal(awardsTtlMs(daysAgo(180), now), CACHE_TTL.week);
  assert.equal(awardsTtlMs(daysAgo(181), now), CACHE_TTL.fortyFiveDays);
  assert.equal(triviaTtlMs(daysAgo(30), now), CACHE_TTL.week);
  assert.equal(triviaTtlMs(daysAgo(31), now), CACHE_TTL.fortyFiveDays);
  assert.equal(triviaTtlMs(daysAgo(200), now), CACHE_TTL.fortyFiveDays);
});
