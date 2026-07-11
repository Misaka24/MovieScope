import assert from "node:assert/strict";
import test from "node:test";
import { CACHE_TTL, titleDataTtlMs } from "./cache-policy.mjs";

const now = Date.parse("2026-07-12T00:00:00Z");
const daysAgo = (days) => new Date(now - days * CACHE_TTL.day).toISOString();

test("title TTL follows release age", () => {
  assert.equal(titleDataTtlMs(daysAgo(3), now), CACHE_TTL.day);
  assert.equal(titleDataTtlMs(daysAgo(20), now), CACHE_TTL.week);
  assert.equal(titleDataTtlMs(daysAgo(100), now), CACHE_TTL.sixtyDays);
});

test("future and unknown releases use safe TTLs", () => {
  assert.equal(titleDataTtlMs(new Date(now + CACHE_TTL.week).toISOString(), now), CACHE_TTL.day);
  assert.equal(titleDataTtlMs(null, now), CACHE_TTL.sixtyDays);
});
