import { getDatabase } from "./database.mjs";
import { justOne } from "./providers.mjs";
import { CACHE_TTL, titleDataTtlMs } from "./cache-policy.mjs";

const mappingTtlMs = 180 * 24 * 60 * 60 * 1000;
const retryTtlMs = 7 * 24 * 60 * 60 * 1000;
function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[\s·・:：'"“”‘’_()（）\[\]—-]+/g, "");
}
function parseJson(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
function similarity(left, right) {
  const a = normalize(left),
    b = normalize(right);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.9;
  const chars = new Set(a);
  let hit = 0;
  for (const c of b) if (chars.has(c)) hit += 1;
  return hit / Math.max(a.length, b.length);
}
async function searchCandidates(title, originalTitle, year) {
  const queries = [
    title && year ? `${title} ${year}` : null,
    title,
    originalTitle && year ? `${originalTitle} ${year}` : null,
    originalTitle,
  ].filter(Boolean);
  const found = new Map();
  for (const query of queries.slice(0, 3)) {
    try {
      const url = new URL("https://m.douban.com/rexxar/api/v2/search/movie");
      url.searchParams.set("q", query);
      url.searchParams.set("start", "0");
      url.searchParams.set("count", "10");
      const response = await fetch(url, {
        signal: AbortSignal.timeout(12000),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150 Safari/537.36",
          Accept: "application/json,text/plain,*/*",
          "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.7",
          Referer: "https://m.douban.com/movie/",
        },
      });
      if (!response.ok) continue;
      const body = await response.json();
      for (const item of body.items || []) {
        const target = item.target || {};
        const id = String(item.target_id || target.id || "");
        if (!id) continue;
        const subtitle = target.card_subtitle || "";
        const score =
          Math.max(
            similarity(title, target.title),
            similarity(originalTitle, target.title),
          ) + (String(subtitle).includes(String(year)) ? 0.25 : 0);
        const current = found.get(id);
        if (!current || score > current.score)
          found.set(id, { id, title: target.title, subtitle, score });
      }
    } catch {}
  }
  return [...found.values()].sort((a, b) => b.score - a.score).slice(0, 3);
}
async function wikidataDoubanId(imdbId) {
  try {
    const query = `SELECT ?douban WHERE { ?item wdt:P345 "${imdbId}"; wdt:P4529 ?douban. } LIMIT 2`;
    const url = new URL("https://query.wikidata.org/sparql");
    url.searchParams.set("query", query);
    url.searchParams.set("format", "json");
    const response = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: {
        Accept: "application/sparql-results+json",
        "User-Agent": "MovieScope/1.0 (IMDb-Douban mapping)",
      },
    });
    if (!response.ok) return null;
    const values =
      (await response.json())?.results?.bindings
        ?.map((item) => item.douban?.value)
        .filter(Boolean) || [];
    return values.length === 1 ? String(values[0]) : null;
  } catch {
    return null;
  }
}
async function saveMapping(input) {
  const db = await getDatabase();
  await db.query(
    `INSERT INTO media_identity_mappings (imdb_id,media_type,tmdb_id,douban_id,douban_url,match_confidence,verified_imdb_id,status,detail_json,error_message,verified_at,retry_after) VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE tmdb_id=VALUES(tmdb_id),douban_id=VALUES(douban_id),douban_url=VALUES(douban_url),match_confidence=VALUES(match_confidence),verified_imdb_id=VALUES(verified_imdb_id),status=VALUES(status),detail_json=VALUES(detail_json),error_message=VALUES(error_message),verified_at=VALUES(verified_at),retry_after=VALUES(retry_after)`,
    [
      input.imdbId,
      input.mediaType,
      input.tmdbId,
      input.doubanId || null,
      input.doubanId
        ? `https://movie.douban.com/subject/${input.doubanId}/`
        : null,
      input.confidence || 0,
      input.verifiedImdbId || null,
      input.status,
      input.detail ? JSON.stringify(input.detail) : null,
      input.error || null,
      input.status === "verified" ? new Date() : null,
      input.status === "verified"
        ? new Date(Date.now() + mappingTtlMs)
        : new Date(Date.now() + retryTtlMs),
    ],
  );
}
export async function resolveDoubanSubject({
  imdbId,
  mediaType,
  tmdbId,
  title,
  originalTitle,
  year,
  releaseDate,
}) {
  if (!imdbId) return null;
  const db = await getDatabase();
  const result = await db.query(
    "SELECT douban_id doubanId,detail_json detail,status,verified_imdb_id verifiedImdbId,retry_after retryAfter FROM media_identity_mappings WHERE imdb_id=? AND media_type=? LIMIT 1",
    [imdbId, mediaType],
  );
  const row = result.rows[0];
  if (row && row.retryAfter && new Date(row.retryAfter) > new Date())
    return row.status === "verified"
      ? {
          doubanId: row.doubanId,
          detail: parseJson(row.detail),
          verified: true,
        }
      : null;
  const wikidataId = await wikidataDoubanId(imdbId);
  const candidates = wikidataId
    ? [{ id: wikidataId, score: 1, source: "wikidata" }]
    : await searchCandidates(title, originalTitle, year);
  for (const candidate of candidates) {
    try {
      const detail = await justOne(
        "/api/douban/get-subject-detail/v1",
        { subjectId: candidate.id },
        titleDataTtlMs(releaseDate || (year ? `${year}-01-01` : null)),
      );
      if (detail?.imdb === imdbId) {
        await saveMapping({
          imdbId,
          mediaType,
          tmdbId,
          doubanId: candidate.id,
          confidence: Math.min(1, candidate.score),
          verifiedImdbId: detail.imdb,
          status: "verified",
          detail,
        });
        return {
          doubanId: candidate.id,
          detail,
          verified: true,
          source: candidate.source || "search",
        };
      }
    } catch (error) {
      continue;
    }
  }
  await saveMapping({
    imdbId,
    mediaType,
    tmdbId,
    status: "unmatched",
    error: "未找到 IMDb 完全匹配的豆瓣条目",
  });
  return null;
}

const ratingValues = { 力荐: 10, 推荐: 8, 还行: 6, 较差: 4, 很差: 2 };
async function loadPages(path, subjectId, sort, pages, ttlMs) {
  const responses = await Promise.all(
    Array.from({ length: pages }, (_, index) =>
      justOne(path, { subjectId, sort, page: index + 1 }, ttlMs).catch(
        () => null,
      ),
    ),
  );
  return responses.filter(Boolean);
}
async function enrichReview(review) {
  try {
    const detail = await justOne(
      "/api/douban/get-movie-review-detail/v1",
      { reviewId: String(review.cid) },
      CACHE_TTL.immutableReview,
    );
    return {
      ...review,
      fullContent: detail.content || review.description,
      forwardCount: Number(detail.forward_count || 0),
      collectCount: Number(detail.collectCount || 0),
    };
  } catch {
    return { ...review, fullContent: review.description };
  }
}
export async function getDoubanReviewDetail(reviewId) {
  const id = String(reviewId || "").trim();
  if (!/^\d+$/.test(id)) throw new Error("Invalid Douban review ID");
  const detail = await justOne(
    "/api/douban/get-movie-review-detail/v1",
    { reviewId: id },
    CACHE_TTL.immutableReview,
  );
  return {
    id,
    content: detail.content || detail.description || null,
    forwardCount: Number(detail.forward_count || detail.forwardCount || 0),
    collectCount: Number(detail.collect_count || detail.collectCount || 0),
    replyCount: Number(detail.reply_count || detail.replyCount || 0),
  };
}
export async function getDoubanBundle(identity, options = {}) {
  if (!identity?.doubanId) return null;
  const pages = Math.max(
    1,
    Math.min(5, Number(options.pages || process.env.DOUBAN_SYNC_PAGES || 3)),
  );
  const ttlMs = Number(options.ttlMs || CACHE_TTL.sixtyDays);
  const reviewPages = await loadPages(
      "/api/douban/get-movie-reviews/v1",
      identity.doubanId,
      "hot",
      pages,
      ttlMs,
    );
  const reviewList = reviewPages.flatMap((page) => page.reviews || []);
  const uniqueReviews = [
    ...new Map(reviewList.map((item) => [String(item.cid), item])).values(),
  ];
  const prefetched = await Promise.all(
    uniqueReviews.slice(0, 5).map(enrichReview),
  );
  const fullById = new Map(prefetched.map((item) => [String(item.cid), item]));
  const fullReviews = uniqueReviews.map(
    (item) =>
      fullById.get(String(item.cid)) || {
        ...item,
        fullContent: item.description,
      },
  );
  return {
    subjectId: identity.doubanId,
    url: `https://movie.douban.com/subject/${identity.doubanId}/`,
    detail: identity.detail,
    comments: [],
    legacyComments: [], /* deprecated: short comments are intentionally not fetched */ /*
      id: String(item.cid),
      platform: "豆瓣",
      kind: "comment",
      authorId: null,
      author: item.username || "豆瓣用户",
      avatar: item.avatar || null,
      rating: ratingValues[item.rating] || null,
      ratingText: item.rating || null,
      title: null,
      content: item.content || null,
      createdAt: item.time || null,
      spoiler: false,
      language: "zh-CN",
      location: item.location || null,
      upVotes: Number(item.vote_count || 0),
      downVotes: null,
      replyCount: null,
      helpfulness: null,
      hotScore: Number(item.vote_count || 0),
    })), */
    reviews: fullReviews.map((item) => ({
      id: String(item.cid),
      platform: "豆瓣",
      kind: "review",
      url: item.review_url || null,
      authorId: null,
      author: item.username || "豆瓣用户",
      avatar: item.avatar || null,
      rating: ratingValues[item.rating] || null,
      ratingText: item.rating || null,
      title: item.title || null,
      content: item.fullContent || item.description || null,
      createdAt: item.time || null,
      spoiler: String(item.description || "").includes("剧透"),
      language: "zh-CN",
      location: null,
      upVotes: Number(item.upvote_count || 0),
      downVotes: Number(item.downvote_count || 0),
      replyCount: Number(item.reply_count || 0),
      forwardCount: Number(item.forwardCount || 0),
      collectCount: Number(item.collectCount || 0),
      helpfulness: null,
      hotScore:
        Number(item.upvote_count || 0) + Number(item.reply_count || 0) * 2,
    })),
  };
}
