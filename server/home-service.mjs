import { justOne, tmdb } from "./providers.mjs";
import { CACHE_TTL, titleDataTtlMs } from "./cache-policy.mjs";
import { imdbRatingValue, imdbTitleId } from "./imdb-rating.mjs";

const imageFallback =
  "https://placehold.co/600x900/1e2024/e2e2e8?text=MovieScope";
const backdropFallback =
  "https://placehold.co/1600x900/111317/e2e2e8?text=MovieScope";

function yearFrom(value) {
  const year = Number(String(value || "").slice(0, 4));
  return Number.isFinite(year) ? year : null;
}

function fixMojibake(value) {
  if (!value || typeof value !== "string") return value || "";
  if (!/[ÃÂâèçæ]/.test(value)) return value;
  try {
    return new TextDecoder("utf-8").decode(
      Uint8Array.from(value, (char) => char.charCodeAt(0)),
    );
  } catch {
    return value;
  }
}

function genreNames(ids, map) {
  return (ids || [])
    .map((id) => map.get(id))
    .filter(Boolean)
    .slice(0, 2);
}

export function hasChineseTitle(value) {
  return /\p{Script=Han}/u.test(value || "");
}

export function pickChineseTranslation(translations, mediaType) {
  const field = mediaType === "tv" ? "name" : "title";
  const regionPriority = new Map([
    ["CN", 0],
    ["SG", 1],
    ["TW", 2],
    ["HK", 3],
  ]);
  return (
    (translations || [])
      .filter(
        (item) =>
          item.iso_639_1 === "zh" && hasChineseTitle(item.data?.[field]),
      )
      .sort(
        (left, right) =>
          (regionPriority.get(left.iso_3166_1) ?? 9) -
          (regionPriority.get(right.iso_3166_1) ?? 9),
      )
      .map((item) => item.data[field].trim())
      .find(Boolean) || null
  );
}

function sample(items, size) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled.slice(0, size);
}

export function selectImdbHeroMovies(groups, size = 5) {
  const candidates = new Map();
  for (const items of groups) {
    for (const item of items) {
      if (
        !item.backdrop ||
        item.ratings.imdb == null ||
        item.ratingDisplay.imdb !== "official"
      )
        continue;
      candidates.set(`${item.mediaType}:${item.sourceId}`, item);
    }
  }
  return sample([...candidates.values()], size);
}

function tmdbImage(path, size, fallback) {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : fallback;
}

function toTmdbMedia(item, mediaType, genreMap) {
  const date = mediaType === "tv" ? item.first_air_date : item.release_date;
  return {
    id: `tmdb:${mediaType}:${item.id}`,
    sourceId: item.id,
    mediaType,
    title:
      item.title ||
      item.name ||
      item.original_title ||
      item.original_name ||
      "未命名作品",
    year: yearFrom(date),
    genres: genreNames(item.genre_ids, genreMap),
    poster: tmdbImage(item.poster_path, "w500", imageFallback),
    backdrop: tmdbImage(item.backdrop_path, "original", backdropFallback),
    overview: item.overview || "暂无中文简介。",
    ratings: {
      imdb: null,
      tmdb:
        Number(item.vote_count || 0) > 0
          ? Number(item.vote_average || 0) || null
          : null,
    },
    ratingDisplay: { imdb: "pending" },
    sources: ["tmdb"],
  };
}

function toImdbMedia(edge) {
  const item = edge?.node?.item || edge?.item || edge?.node || {};
  return {
    id: `imdb:${item.id || Math.random()}`,
    sourceId: item.id,
    mediaType: item.titleType?.isSeries ? "tv" : "movie",
    title:
      fixMojibake(item.titleText?.text || item.originalTitleText?.text) ||
      "未命名作品",
    year: item.releaseYear?.year || null,
    genres: [],
    poster: item.primaryImage?.url || imageFallback,
    backdrop: null,
    overview: "",
    ratings: {
      imdb:
        Number(
          item.ratingsSummary?.aggregateRating || edge?.node?.chartRating || 0,
        ) || null,
      tmdb: null,
    },
    ratingDisplay: { imdb: "official" },
    rank: item.ratingsSummary?.topRanking?.rank || null,
    sources: ["imdb"],
  };
}

function chunks(items, size) {
  const result = [];
  for (let index = 0; index < items.length; index += size)
    result.push(items.slice(index, index + size));
  return result;
}

async function localizeTmdbTitle(media) {
  if (hasChineseTitle(media.title)) return media;
  try {
    const response = await tmdb(
      `/${media.mediaType}/${media.sourceId}/translations`,
      {},
      30 * 24 * 60 * 60 * 1000,
    );
    const title = pickChineseTranslation(
      response.translations,
      media.mediaType,
    );
    return title ? { ...media, title } : media;
  } catch {
    return media;
  }
}

async function localizeTmdbGroups(groups) {
  const unique = new Map();
  for (const items of groups) {
    for (const item of items)
      unique.set(`${item.mediaType}:${item.sourceId}`, item);
  }
  const localized = await Promise.all(
    [...unique.values()].map(localizeTmdbTitle),
  );
  const lookup = new Map(
    localized.map((item) => [`${item.mediaType}:${item.sourceId}`, item]),
  );
  return groups.map((items) =>
    items.map(
      (item) => lookup.get(`${item.mediaType}:${item.sourceId}`) || item,
    ),
  );
}

async function localizeImdbTitles(items) {
  return Promise.all(
    items.map(async (media) => {
      if (!String(media.sourceId).startsWith("tt")) return media;
      try {
        const response = await tmdb(
          `/find/${media.sourceId}`,
          {
            external_source: "imdb_id",
            language: "zh-CN",
          },
          30 * 24 * 60 * 60 * 1000,
        );
        const match =
          media.mediaType === "tv"
            ? response.tv_results?.[0]
            : response.movie_results?.[0];
        const title = match?.title || match?.name;
        if (!hasChineseTitle(title)) return media;
        return {
          ...media,
          title: title.trim(),
          sources: [...new Set([...media.sources, "tmdb"])],
        };
      } catch {
        return media;
      }
    }),
  );
}

async function loadImdbTitle(imdbId, releaseDate = null) {
  try {
    return await justOne(
      "/api/imdb/title-redux-overview-query/v1",
      { id: imdbId, languageCountry: "en_US" },
      titleDataTtlMs(releaseDate),
    );
  } catch {
    return null;
  }
}

async function enrichImdbRatings(items, knownRatings = new Map()) {
  const resolved = await Promise.all(
    items.map(async (media) => {
      try {
        const external = await tmdb(
          `/${media.mediaType}/${media.sourceId}/external_ids`,
          {},
          30 * 24 * 60 * 60 * 1000,
        );
        return { media, imdbId: external.imdb_id || null };
      } catch {
        return { media, imdbId: null };
      }
    }),
  );
  const imdbIds = [
    ...new Set(resolved.map((item) => item.imdbId).filter(Boolean)),
  ];
  const dateById = new Map(
    resolved
      .filter((item) => item.imdbId)
      .map((item) => [
        item.imdbId,
        item.media.releaseDate ||
          (item.media.year ? `${item.media.year}-01-01` : null),
      ]),
  );
  const loaded = await Promise.all(
    imdbIds.map((imdbId) => loadImdbTitle(imdbId, dateById.get(imdbId))),
  );
  const titleById = new Map(
    loaded
      .map((value, index) => [imdbIds[index], value])
      .filter(([, value]) => value),
  );
  return resolved.map(({ media, imdbId }) => {
    const imdbRating =
      imdbRatingValue(imdbId ? titleById.get(imdbId) : null) ||
      (imdbId ? knownRatings.get(imdbId) : null) ||
      null;
    if (!imdbRating)
      return {
        ...media,
        ratings: { ...media.ratings, imdb: null },
        ratingDisplay: { ...media.ratingDisplay, imdb: "unavailable" },
      };
    return {
      ...media,
      ratings: { ...media.ratings, imdb: imdbRating },
      ratingDisplay: { ...media.ratingDisplay, imdb: "official" },
      sources: [...new Set([...media.sources, "imdb"])],
    };
  });
}

async function enrichUniqueImdbRatings(groups, knownRatings = new Map()) {
  const unique = new Map();
  for (const items of groups) {
    for (const item of items)
      unique.set(`${item.mediaType}:${item.sourceId}`, item);
  }
  const enriched = await enrichImdbRatings([...unique.values()], knownRatings);
  const lookup = new Map(
    enriched.map((item) => [`${item.mediaType}:${item.sourceId}`, item]),
  );
  return groups.map((items) =>
    items.map(
      (item) => lookup.get(`${item.mediaType}:${item.sourceId}`) || item,
    ),
  );
}

async function loadGenres() {
  const [movies, tv] = await Promise.allSettled([
    tmdb("/genre/movie/list", { language: "zh-CN" }, 7 * 24 * 60 * 60 * 1000),
    tmdb("/genre/tv/list", { language: "zh-CN" }, 7 * 24 * 60 * 60 * 1000),
  ]);
  return {
    movie: new Map(
      (movies.status === "fulfilled" ? movies.value.genres || [] : []).map(
        (genre) => [genre.id, genre.name],
      ),
    ),
    tv: new Map(
      (tv.status === "fulfilled" ? tv.value.genres || [] : []).map((genre) => [
        genre.id,
        genre.name,
      ]),
    ),
  };
}

async function safeSource(name, loader) {
  try {
    return { name, status: "ok", data: await loader() };
  } catch (error) {
    return {
      name,
      status: "error",
      error: error instanceof Error ? error.message : String(error),
      data: null,
    };
  }
}

function toNews(edge) {
  const node = edge?.node || {};
  return {
    id: node.id || crypto.randomUUID(),
    category: node.source?.homepage?.label || "IMDb 新闻",
    title: fixMojibake(node.articleTitle?.plainText) || "影视行业动态",
    summary: fixMojibake(node.text?.plainText)
      .replace(/\s+/g, " ")
      .slice(0, 180),
    image: node.image?.url || null,
    publishedAt: node.date || null,
    url: node.externalUrl || null,
  };
}

export async function getHomeData() {
  const genres = await loadGenres();
  const sources = await Promise.all([
    safeSource("tmdb-now-playing", () =>
      tmdb("/movie/now_playing", { language: "zh-CN", page: 1, region: "CN" }),
    ),
    safeSource("tmdb-popular-movies", () =>
      tmdb("/movie/popular", { language: "zh-CN", page: 1, region: "CN" }),
    ),
    safeSource("tmdb-popular-tv", () =>
      tmdb("/tv/popular", { language: "zh-CN", page: 1 }),
    ),
    safeSource("tmdb-top-rated", () =>
      tmdb(
        "/movie/top_rated",
        { language: "zh-CN", page: 1, region: "CN" },
        60 * 60 * 1000,
      ),
    ),
    safeSource("tmdb-trending", () =>
      tmdb("/trending/movie/week", { language: "zh-CN" }),
    ),
    safeSource("imdb-top-250", () =>
      justOne(
        "/api/imdb/title-chart-rankings/v1",
        { rankingsChartType: "TOP_250", languageCountry: "en_US" },
        CACHE_TTL.top250,
      ),
    ),
    safeSource("imdb-news", () =>
      justOne(
        "/api/imdb/news-by-category-query/v1",
        { category: "MOVIE", languageCountry: "en_US" },
        CACHE_TTL.news,
      ),
    ),
  ]);

  const source = (name) => sources.find((item) => item.name === name);
  const imdbTopBase = (
    source("imdb-top-250")?.data?.titleChartRankings?.edges || []
  ).map(toImdbMedia);
  const nowPlayingRaw = (source("tmdb-now-playing")?.data?.results || []).slice(
    0,
    8,
  );
  const popularMoviesRaw = (
    source("tmdb-popular-movies")?.data?.results || []
  ).slice(0, 8);
  const popularTvRaw = (source("tmdb-popular-tv")?.data?.results || []).slice(
    0,
    8,
  );
  const nowPlayingUnlocalized = nowPlayingRaw.map((item) =>
    toTmdbMedia(item, "movie", genres.movie),
  );
  const popularMoviesUnlocalized = popularMoviesRaw.map((item) =>
    toTmdbMedia(item, "movie", genres.movie),
  );
  const popularTvUnlocalized = popularTvRaw.map((item) =>
    toTmdbMedia(item, "tv", genres.tv),
  );
  const trendingUnlocalized = (source("tmdb-trending")?.data?.results || [])
    .map((item) => toTmdbMedia(item, "movie", genres.movie))
    .filter((item) => item.backdrop && item.title);
  const tmdbTopRatedUnlocalized = (
    source("tmdb-top-rated")?.data?.results || []
  )
    .slice(0, 8)
    .map((item) => ({
      ...toTmdbMedia(item, "movie", genres.movie),
      ratingDisplay: { imdb: "unavailable" },
    }));
  const [imdbTop, localizedGroups] = await Promise.all([
    localizeImdbTitles(imdbTopBase.slice(0, 8)),
    localizeTmdbGroups([
      nowPlayingUnlocalized,
      popularMoviesUnlocalized,
      popularTvUnlocalized,
      trendingUnlocalized,
      tmdbTopRatedUnlocalized,
    ]),
  ]);
  const [
    nowPlayingBase,
    popularMoviesBase,
    popularTvBase,
    trendingCandidates,
    tmdbTopRated,
  ] = localizedGroups;
  const knownImdbRatings = new Map(
    imdbTopBase
      .map((item) => [String(item.sourceId), item.ratings.imdb])
      .filter(([id, rating]) => id.startsWith("tt") && rating != null),
  );
  const [nowPlaying, popularMovies, popularTvTmdb, enrichedTrending] =
    await enrichUniqueImdbRatings(
      [nowPlayingBase, popularMoviesBase, popularTvBase, trendingCandidates],
      knownImdbRatings,
    );
  const popularTv = popularTvTmdb;
  const hero = selectImdbHeroMovies([
    enrichedTrending,
    nowPlaying,
    popularMovies,
  ]);
  const news = (source("imdb-news")?.data?.news?.edges || []).map(toNews);

  return {
    generatedAt: new Date().toISOString(),
    hero,
    sections: {
      nowPlaying,
      topRated: imdbTop.length ? imdbTop.slice(0, 8) : tmdbTopRated,
      popularMovies,
      popularTv,
      news,
    },
    sourceMeta: sources.map(({ name, status, error }) => ({
      name,
      status,
      error: error || null,
    })),
  };
}
