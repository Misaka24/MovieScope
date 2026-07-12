const dayMs = 24 * 60 * 60 * 1000;

export const CACHE_TTL = {
  day: dayMs,
  week: 7 * dayMs,
  thirtyDays: 30 * dayMs,
  fortyFiveDays: 45 * dayMs,
  sixtyDays: 60 * dayMs,
  top250: 7 * dayMs,
  recentHot: 3 * dayMs,
  news: dayMs,
  immutableReview: 10 * 365 * dayMs,
};

export function titleDataTtlMs(releaseDate, now = Date.now()) {
  const timestamp = Date.parse(String(releaseDate || ""));
  if (!Number.isFinite(timestamp)) return CACHE_TTL.sixtyDays;
  const ageMs = Math.max(0, now - timestamp);
  if (ageMs <= 14 * CACHE_TTL.day) return CACHE_TTL.day;
  if (ageMs <= CACHE_TTL.sixtyDays) return CACHE_TTL.week;
  if (ageMs <= 90 * CACHE_TTL.day) return CACHE_TTL.thirtyDays;
  return CACHE_TTL.sixtyDays;
}

export function awardsTtlMs(releaseDate, now = Date.now()) {
  const timestamp = Date.parse(String(releaseDate || ""));
  if (!Number.isFinite(timestamp)) return CACHE_TTL.fortyFiveDays;
  return Math.max(0, now - timestamp) <= 180 * CACHE_TTL.day
    ? CACHE_TTL.week
    : CACHE_TTL.fortyFiveDays;
}

export function triviaTtlMs(releaseDate, now = Date.now()) {
  const timestamp = Date.parse(String(releaseDate || ""));
  if (!Number.isFinite(timestamp)) return CACHE_TTL.fortyFiveDays;
  return Math.max(0, now - timestamp) <= CACHE_TTL.thirtyDays
    ? CACHE_TTL.week
    : CACHE_TTL.fortyFiveDays;
}
