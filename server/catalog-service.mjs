import { justOne, tmdb } from "./providers.mjs";
import {
  imdbRatingValue,
  imdbTitleId,
  imdbVoteCountValue,
} from "./imdb-rating.mjs";
import { getDoubanBundle, resolveDoubanSubject } from "./douban-service.mjs";
import {
  CACHE_TTL,
  awardsTtlMs,
  titleDataTtlMs,
  triviaTtlMs,
} from "./cache-policy.mjs";

const imageFallback =
  "https://placehold.co/600x900/1e2024/e2e2e8?text=MovieScope";
const profileFallback =
  "https://placehold.co/400x500/1e2024/e2e2e8?text=MovieScope";
const backdropFallback =
  "https://placehold.co/1600x900/111317/e2e2e8?text=MovieScope";

function image(path, size, fallback = imageFallback) {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : fallback;
}

function year(value) {
  const parsed = Number(String(value || "").slice(0, 4));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function number(value, fallback = null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mediaTypeOf(item, fallback = "movie") {
  if (item.media_type === "tv" || item.first_air_date || item.name) return "tv";
  if (item.media_type === "person" || item.known_for_department)
    return "person";
  return fallback;
}

function genreNames(ids, genres) {
  const lookup = new Map(genres.map((genre) => [genre.id, genre.name]));
  return (ids || []).map((id) => lookup.get(id)).filter(Boolean);
}

function pagination(response, results) {
  return {
    page: number(response?.page, 1),
    totalPages: Math.min(500, number(response?.total_pages, 1)),
    totalResults: number(response?.total_results, results.length),
    results,
  };
}

function mediaSummary(item, genres = [], fallbackType = "movie") {
  const mediaType = mediaTypeOf(item, fallbackType);
  const date = mediaType === "tv" ? item.first_air_date : item.release_date;
  return {
    id: Number(item.id),
    mediaType,
    title:
      item.title ||
      item.name ||
      item.original_title ||
      item.original_name ||
      "未命名作品",
    originalTitle: item.original_title || item.original_name || null,
    year: year(date),
    releaseDate: date || null,
    overview: item.overview || "暂无中文简介。",
    poster: image(item.poster_path, "w500"),
    backdrop: item.backdrop_path
      ? image(item.backdrop_path, "w1280", backdropFallback)
      : null,
    genres:
      item.genres?.map((genre) => genre.name) ||
      genreNames(item.genre_ids, genres),
    tmdbRating: number(item.vote_average),
    tmdbVoteCount: number(item.vote_count, 0),
    popularity: number(item.popularity, 0),
    adult: Boolean(item.adult),
  };
}

function personSummary(item) {
  return {
    id: Number(item.id),
    mediaType: "person",
    name: item.name || "未命名影人",
    department: item.known_for_department || null,
    profile: image(item.profile_path, "w500", profileFallback),
    popularity: number(item.popularity, 0),
    knownFor: (item.known_for || [])
      .slice(0, 4)
      .map((media) => mediaSummary(media, [], media.media_type || "movie")),
  };
}

async function loadGenres() {
  const [movie, tv] = await Promise.all([
    tmdb("/genre/movie/list", { language: "zh-CN" }, 7 * 24 * 60 * 60 * 1000),
    tmdb("/genre/tv/list", { language: "zh-CN" }, 7 * 24 * 60 * 60 * 1000),
  ]);
  return { movie: movie.genres || [], tv: tv.genres || [] };
}

async function imdbDetails(imdbId, releaseDate = null) {
  if (!imdbId) return null;
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

async function imdbRatingsFor(items) {
  const resolved = await Promise.all(
    items.map(async (item) => {
      if (item.mediaType === "person") return { item, imdbId: null };
      try {
        const external = await tmdb(
          `/${item.mediaType}/${item.id}/external_ids`,
          {},
          30 * 24 * 60 * 60 * 1000,
        );
        return { item, imdbId: external.imdb_id || null };
      } catch {
        return { item, imdbId: null };
      }
    }),
  );
  const ids = [
    ...new Set(resolved.map(({ imdbId }) => imdbId).filter(Boolean)),
  ];
  const releaseDateById = new Map(
    resolved
      .filter(({ imdbId }) => imdbId)
      .map(({ imdbId, item }) => [
        imdbId,
        item.releaseDate || (item.year ? `${item.year}-01-01` : null),
      ]),
  );
  const loaded = await Promise.all(
    ids.map((imdbId) => imdbDetails(imdbId, releaseDateById.get(imdbId))),
  );
  const byId = new Map(
    loaded
      .map((value, index) => [ids[index], value])
      .filter(([, value]) => value),
  );
  return resolved.map(({ item, imdbId }) => {
    const imdb = imdbId ? byId.get(imdbId) : null;
    return {
      ...item,
      imdbId,
      imdbRating: imdbRatingValue(imdb),
      imdbVoteCount: imdbVoteCountValue(imdb),
    };
  });
}

export async function searchCatalog(params) {
  const query = String(params.query || "").trim();
  const type = ["multi", "movie", "tv", "person", "keyword"].includes(
    params.type,
  )
    ? params.type
    : "multi";
  const page = Math.max(1, Math.min(500, number(params.page, 1)));
  if (!query)
    return {
      query,
      type,
      page: 1,
      totalPages: 0,
      totalResults: 0,
      results: [],
      genres: await loadGenres(),
    };
  const path = type === "multi" ? "/search/multi" : `/search/${type}`;
  const response = await tmdb(
    path,
    { query, language: "zh-CN", page, include_adult: false, region: "CN" },
    10 * 60 * 1000,
  );
  const genres = await loadGenres();
  const mapped = (response.results || [])
    .filter(
      (item) =>
        type !== "multi" || ["movie", "tv", "person"].includes(item.media_type),
    )
    .map((item) =>
      type === "keyword"
        ? {
            id: Number(item.id),
            mediaType: "keyword",
            name: item.name || "未命名关键词",
          }
        : mediaTypeOf(item) === "person"
          ? personSummary(item)
          : mediaSummary(
              item,
              genres[mediaTypeOf(item)] || [],
              type === "tv" ? "tv" : "movie",
            ),
    );
  const media = mapped.filter(
    (item) => item.mediaType === "movie" || item.mediaType === "tv",
  );
  const enriched = await imdbRatingsFor(media);
  const ratingByKey = new Map(
    enriched.map((item) => [`${item.mediaType}:${item.id}`, item]),
  );
  return {
    query,
    type,
    genres,
    results: mapped.map(
      (item) => ratingByKey.get(`${item.mediaType}:${item.id}`) || item,
    ),
    ...pagination(
      response,
      mapped.map(
        (item) => ratingByKey.get(`${item.mediaType}:${item.id}`) || item,
      ),
    ),
  };
}

const discoverSorts = new Set([
  "popularity.desc",
  "vote_average.desc",
  "primary_release_date.desc",
  "first_air_date.desc",
  "revenue.desc",
]);

export async function discoverCatalog(params) {
  const mediaType = params.mediaType === "tv" ? "tv" : "movie";
  const page = Math.max(1, Math.min(500, number(params.page, 1)));
  const sortBy = discoverSorts.has(params.sortBy)
    ? params.sortBy
    : "popularity.desc";
  const yearValue = number(params.year);
  const yearFrom = number(params.yearFrom);
  const yearTo = number(params.yearTo);
  const minRating = Math.max(0, Math.min(10, number(params.minRating, 0)));
  const apiParams = {
    language: "zh-CN",
    region: "CN",
    page,
    sort_by: sortBy,
    include_adult: false,
    include_video: false,
    with_genres: params.genres || undefined,
    "vote_average.gte": minRating || undefined,
    "vote_count.gte":
      minRating || sortBy === "vote_average.desc" ? 100 : undefined,
    with_original_language: params.language || undefined,
    with_watch_providers: params.provider || undefined,
    watch_region: params.provider ? params.watchRegion || "CN" : undefined,
  };
  if (yearValue)
    apiParams[
      mediaType === "movie" ? "primary_release_year" : "first_air_date_year"
    ] = yearValue;
  const dateField =
    mediaType === "movie" ? "primary_release_date" : "first_air_date";
  if (!yearValue && yearFrom)
    apiParams[`${dateField}.gte`] = `${yearFrom}-01-01`;
  if (!yearValue && yearTo) apiParams[`${dateField}.lte`] = `${yearTo}-12-31`;
  if (
    sortBy === "primary_release_date.desc" ||
    sortBy === "first_air_date.desc"
  )
    apiParams[`${dateField}.lte`] = new Date().toISOString().slice(0, 10);
  const [response, genres] = await Promise.all([
    tmdb(`/discover/${mediaType}`, apiParams, 15 * 60 * 1000),
    loadGenres(),
  ]);
  const mapped = (response.results || []).map((item) =>
    mediaSummary(item, genres[mediaType], mediaType),
  );
  const results = await imdbRatingsFor(mapped);
  return {
    mediaType,
    sortBy,
    filters: {
      genres: params.genres || "",
      year: yearValue,
      yearFrom,
      yearTo,
      minRating,
      language: params.language || "",
      provider: params.provider || "",
      watchRegion: params.watchRegion || "",
    },
    genres,
    ...pagination(response, results),
  };
}

function videoUrl(video) {
  if (video.site === "YouTube")
    return `https://www.youtube.com/watch?v=${video.key}`;
  if (video.site === "Vimeo") return `https://vimeo.com/${video.key}`;
  return null;
}

function creditsData(credits) {
  return {
    cast: (credits?.cast || []).map((person) => ({
      id: person.id,
      name: person.name,
      character:
        person.character ||
        person.roles
          ?.map((role) => role.character)
          .filter(Boolean)
          .join(" / ") ||
        null,
      profile: image(person.profile_path, "w342", profileFallback),
    })),
    crew: (credits?.crew || []).map((person) => ({
      id: person.id,
      name: person.name,
      job: person.job,
      department: person.department,
      profile: image(person.profile_path, "w342", profileFallback),
    })),
  };
}

function providerOfficialUrl(name, title, fallback) {
  const value = String(name || "").toLowerCase();
  const links = [
    [
      ["netflix"],
      `https://www.netflix.com/search?q=${encodeURIComponent(title)}`,
    ],
    [
      ["disney"],
      `https://www.disneyplus.com/search?q=${encodeURIComponent(title)}`,
    ],
    [
      ["amazon prime", "prime video"],
      `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${encodeURIComponent(title)}`,
    ],
    [
      ["apple tv"],
      `https://tv.apple.com/search?term=${encodeURIComponent(title)}`,
    ],
    [["max", "hbo"], "https://www.max.com/"],
    [["hulu"], `https://www.hulu.com/search?q=${encodeURIComponent(title)}`],
    [["iqiyi", "爱奇艺"], "https://www.iq.com/"],
    [["tencent", "腾讯视频", "wetv"], "https://wetv.vip/"],
    [["youku", "优酷"], "https://www.youku.tv/"],
    [
      ["bilibili", "哔哩哔哩"],
      `https://search.bilibili.com/all?keyword=${encodeURIComponent(title)}`,
    ],
    [["mubi"], "https://mubi.com/"],
    [["paramount"], "https://www.paramountplus.com/"],
    [["peacock"], "https://www.peacocktv.com/"],
  ];
  return (
    links.find(([aliases]) =>
      aliases.some((alias) => value.includes(alias)),
    )?.[1] ||
    fallback ||
    null
  );
}

function providerItems(items, title, fallback) {
  return (items || []).map((provider) => ({
    ...provider,
    officialUrl: providerOfficialUrl(provider.provider_name, title, fallback),
  }));
}

function uniqueImages(items, size, fallback) {
  const seen = new Set();
  return (items || [])
    .filter((item) => {
      if (!item.file_path || seen.has(item.file_path)) return false;
      seen.add(item.file_path);
      return true;
    })
    .map((item) => ({
      path: image(item.file_path, size, fallback),
      width: item.width,
      height: item.height,
    }));
}

export async function getTitleDetails(mediaType, id) {
  if (!["movie", "tv"].includes(mediaType)) throw new Error("不支持的影视类型");
  const append =
    mediaType === "movie"
      ? "credits,videos,images,external_ids,recommendations,similar,watch/providers,release_dates,keywords,reviews"
      : "credits,aggregate_credits,videos,images,external_ids,recommendations,similar,watch/providers,content_ratings,keywords,reviews";
  const details = await tmdb(
    `/${mediaType}/${id}`,
    {
      language: "zh-CN",
      append_to_response: append,
      include_image_language: "zh,en,null",
    },
    6 * 60 * 60 * 1000,
  );
  const fallbackVideos = details.videos?.results?.length
    ? null
    : await tmdb(
        `/${mediaType}/${id}/videos`,
        { language: "en-US" },
        7 * 24 * 60 * 60 * 1000,
      ).catch(() => null);
  const external = details.external_ids || {};
  const imdb = await imdbDetails(
    external.imdb_id,
    details.release_date || details.first_air_date,
  );
  const releaseDates =
    mediaType === "movie"
      ? details.release_dates?.results || []
      : details.content_ratings?.results || [];
  const cnRelease =
    releaseDates.find((item) => item.iso_3166_1 === "CN") ||
    releaseDates.find((item) => item.iso_3166_1 === "US");
  const certification =
    mediaType === "movie"
      ? cnRelease?.release_dates
          ?.map((item) => item.certification)
          .find(Boolean) || null
      : cnRelease?.rating || null;
  const credits = creditsData(
    mediaType === "tv"
      ? details.aggregate_credits || details.credits
      : details.credits,
  );
  const runtime =
    mediaType === "movie" ? details.runtime : details.episode_run_time?.[0];
  const providers =
    details["watch/providers"]?.results?.CN ||
    details["watch/providers"]?.results?.HK ||
    details["watch/providers"]?.results?.TW ||
    null;
  const recommendations = await imdbRatingsFor(
    (details.recommendations?.results || [])
      .slice(0, 12)
      .map((item) => mediaSummary(item, [], mediaType)),
  );
  const similar = await imdbRatingsFor(
    (details.similar?.results || [])
      .slice(0, 12)
      .map((item) => mediaSummary(item, [], mediaType)),
  );
  return {
    ...mediaSummary(details, [], mediaType),
    tagline: details.tagline || null,
    status: details.status || null,
    runtime: number(runtime),
    certification,
    homepage: details.homepage || null,
    imdbId: external.imdb_id || null,
    imdbUrl: external.imdb_id
      ? `https://www.imdb.com/title/${external.imdb_id}/`
      : null,
    imdbRating: imdbRatingValue(imdb),
    imdbVoteCount: imdbVoteCountValue(imdb),
    metacritic: number(
      imdb?.title?.metacritic?.metascore?.score ?? imdb?.metacritic?.score,
    ),
    budget: number(details.budget, 0),
    revenue: number(details.revenue, 0),
    originCountries:
      details.origin_country ||
      details.production_countries?.map((country) => country.iso_3166_1) ||
      [],
    languages: details.spoken_languages?.map((language) => language.name) || [],
    originalLanguage: details.original_language || null,
    productionCompanies:
      details.production_companies?.map((company) => ({
        id: company.id,
        name: company.name,
        logo: company.logo_path ? image(company.logo_path, "w185", null) : null,
      })) || [],
    networks:
      details.networks?.map((network) => ({
        id: network.id,
        name: network.name,
        logo: network.logo_path ? image(network.logo_path, "w185", null) : null,
      })) || [],
    seasons:
      details.seasons?.map((season) => ({
        id: season.id,
        number: season.season_number,
        name: season.name,
        episodes: season.episode_count,
        airDate: season.air_date,
        poster: image(season.poster_path, "w342"),
      })) || [],
    credits,
    videos: (details.videos?.results?.length
      ? details.videos.results
      : fallbackVideos?.results || []
    )
      .map((video) => ({
        id: video.id,
        name: video.name,
        type: video.type,
        official: Boolean(video.official),
        url: videoUrl(video),
        key: video.key,
        site: video.site,
      }))
      .filter((video) => video.url),
    images: uniqueImages(details.images?.backdrops, "w1280", backdropFallback),
    posters: uniqueImages(details.images?.posters, "w500", imageFallback),
    logos: uniqueImages(details.images?.logos, "w500", imageFallback),
    recommendations,
    similar,
    reviews: (details.reviews?.results || []).slice(0, 8).map((review) => ({
      id: review.id,
      author: review.author,
      content: review.content,
      createdAt: review.created_at,
      rating: number(review.author_details?.rating),
    })),
    keywords: (
      details.keywords?.keywords ||
      details.keywords?.results ||
      []
    ).map((keyword) => ({ id: keyword.id, name: keyword.name })),
    watchProviders: providers
      ? {
          link: providers.link,
          flatrate: providerItems(
            providers.flatrate,
            details.title || details.name,
            providers.link,
          ),
          rent: providerItems(
            providers.rent,
            details.title || details.name,
            providers.link,
          ),
          buy: providerItems(
            providers.buy,
            details.title || details.name,
            providers.link,
          ),
        }
      : null,
    createdBy:
      details.created_by?.map((person) => ({
        id: person.id,
        name: person.name,
      })) || [],
    numberOfSeasons: number(details.number_of_seasons),
    numberOfEpisodes: number(details.number_of_episodes),
    lastAirDate: details.last_air_date || null,
    nextEpisodeDate: details.next_episode_to_air?.air_date || null,
  };
}

function justOneModule(result, parser) {
  if (!result) return { status: "unavailable", items: [] };
  try {
    return { status: "ready", ...parser(result) };
  } catch (error) {
    return {
      status: "invalid",
      message: error instanceof Error ? error.message : String(error),
      items: [],
    };
  }
}

async function safeJustOne(path, params, ttlMs) {
  try {
    return { value: await justOne(path, params, ttlMs), error: null };
  } catch (error) {
    return {
      value: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function loadAllTmdbReviews(mediaType, id) {
  const path = `/${mediaType}/${id}/reviews`;
  const ttlMs = 6 * 60 * 60 * 1000;
  try {
    const first = await tmdb(path, { language: "", page: 1 }, ttlMs);
    const totalPages = Math.max(1, Math.min(500, number(first.total_pages, 1)));
    const pages = [first];
    for (let start = 2; start <= totalPages; start += 10) {
      const batch = await Promise.all(
        Array.from(
          { length: Math.min(10, totalPages - start + 1) },
          (_, index) =>
            tmdb(path, { language: "", page: start + index }, ttlMs),
        ),
      );
      pages.push(...batch);
    }
    const tmdbAvatar = (path) => {
      if (!path) return null;
      const normalized = String(path).replace(/^\/(https?:\/\/)/, "$1");
      return /^https?:\/\//.test(normalized)
        ? normalized
        : image(normalized, "w185", null);
    };
    const items = pages
      .flatMap((page) => page.results || [])
      .filter(
        (item, index, all) =>
          all.findIndex((candidate) => candidate.id === item.id) === index,
      )
      .map((item) => ({
        id: String(item.id),
        platform: "TMDB",
        kind: "review",
        authorId: item.author_details?.username || null,
        author:
          item.author_details?.name ||
          item.author ||
          item.author_details?.username ||
          "TMDB 用户",
        username: item.author_details?.username || null,
        avatar: tmdbAvatar(item.author_details?.avatar_path),
        rating: number(item.author_details?.rating),
        title: null,
        content: item.content || null,
        createdAt: item.created_at || null,
        updatedAt: item.updated_at || null,
        spoiler: Boolean(item.spoiler),
        language: item.iso_639_1 || null,
        url: item.url || null,
        location: null,
        upVotes: null,
        downVotes: null,
        helpfulness: null,
        replyCount: null,
        forwardCount: null,
        collectCount: null,
        hotScore: number(item.author_details?.rating, 0),
        rawData: item,
      }));
    return {
      status: "ready",
      pageCount: totalPages,
      totalResults: number(first.total_results, items.length),
      items,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : String(error),
      pageCount: 0,
      totalResults: 0,
      items: [],
    };
  }
}

export async function getExternalTitleReviews(mediaType, id) {
  const details = await tmdb(
    `/${mediaType}/${id}`,
    { language: "zh-CN", append_to_response: "external_ids" },
    30 * 24 * 60 * 60 * 1000,
  );
  const tmdbAudiencePromise = loadAllTmdbReviews(mediaType, id);
  const imdbId = details.external_ids?.imdb_id || details.imdb_id || null;
  if (!imdbId) {
    const tmdbAudience = await tmdbAudiencePromise;
    return {
      imdbId: null,
      critics: { status: "unavailable", items: [] },
      audience: {
        tmdb: tmdbAudience,
        imdb: { status: "unavailable", items: [] },
        douban: { status: "unmapped", items: [] },
      },
      awards: { status: "unavailable" },
      trivia: { status: "unavailable", items: [] },
      doubanRating: null,
      boxOffice: { status: "unavailable", data: null },
      chartRankings: { status: "unavailable", items: [] },
    };
  }
  const params = { id: imdbId, languageCountry: "en_US" };
  const titleTtlMs = titleDataTtlMs(
    details.release_date || details.first_air_date,
  );
  const releaseDate = details.release_date || details.first_air_date;
  const doubanIdentityPromise = resolveDoubanSubject({
    imdbId,
    mediaType,
    tmdbId: Number(id),
    title: details.title || details.name,
    originalTitle: details.original_title || details.original_name,
    year: year(details.release_date || details.first_air_date),
    releaseDate: details.release_date || details.first_air_date || null,
  });
  const [
    criticsResult,
    usersResult,
    awardsResult,
    triviaResult,
    boxOfficeResult,
    doubanIdentity,
    tmdbAudience,
  ] = await Promise.all([
    safeJustOne(
      "/api/imdb/title-critics-review-summary-query/v1",
      params,
      titleTtlMs,
    ),
    safeJustOne(
      "/api/imdb/title-user-reviews-summary-query/v1",
      params,
      titleTtlMs,
    ),
    safeJustOne(
      "/api/imdb/title-awards-summary-query/v1",
      params,
      awardsTtlMs(releaseDate),
    ),
    safeJustOne(
      "/api/imdb/title-did-you-know-query/v1",
      params,
      triviaTtlMs(releaseDate),
    ),
    safeJustOne("/api/imdb/title-box-office-summary/v1", params, titleTtlMs),
    doubanIdentityPromise,
    tmdbAudiencePromise,
  ]);
  const doubanBundle = doubanIdentity
    ? await getDoubanBundle(doubanIdentity, { ttlMs: titleTtlMs })
    : null;
  const metacritic = criticsResult.value?.title?.metacritic;
  const criticReviewItems = [
    ...(metacritic?.reviews?.edges || []).map(({ node }) => ({
      reviewer: node.reviewer || null,
      site: node.site || null,
      score: node.score ?? null,
      quote: node.quote?.value || null,
      language: node.quote?.language || null,
      url: node.url || null,
    })),
    ...(criticsResult.value?.title?.externalLinks?.edges || []).map(
      ({ node }) => ({
        reviewer: null,
        site: node.label || "External review",
        score: null,
        quote: node.label || null,
        language: null,
        url: node.url || null,
      }),
    ),
  ].filter(
    (item, index, items) =>
      items.findIndex(
        (candidate) =>
          candidate.url === item.url && candidate.quote === item.quote,
      ) === index,
  );
  const userEdges =
    usersResult.value?.title?.featuredReviews?.edges ||
    usersResult.value?.title?.reviews?.edges ||
    usersResult.value?.title?.userReviews?.edges ||
    [];
  const award = awardsResult.value?.title || {};
  const boxOffice = boxOfficeResult.value?.title || {};
  const money = (value) =>
    value?.amount == null
      ? null
      : { amount: number(value.amount), currency: value.currency || null };
  return {
    imdbId,
    critics: criticsResult.error
      ? { status: "error", message: criticsResult.error, items: [] }
      : {
          status: "ready",
          score: metacritic?.metascore?.score ?? null,
          reviewCount: metacritic?.metascore?.reviewCount ?? 0,
          url: metacritic?.url || null,
          items: criticReviewItems,
        },
    audience: {
      tmdb: tmdbAudience,
      imdb: usersResult.error
        ? { status: "error", message: usersResult.error, items: [] }
        : {
            status: "ready",
            items: userEdges.map(({ node }) => ({
              id: node.id,
              platform: "IMDb",
              authorId: node.author?.id || null,
              author: node.author?.nickName || "IMDb 用户",
              avatar: null,
              rating: node.authorRating ?? null,
              title: node.summary?.originalText || null,
              content: node.text?.originalText?.plainText || null,
              createdAt: node.submissionDate || null,
              spoiler: Boolean(node.spoiler),
              language: node.language || null,
              upVotes: node.helpfulness?.upVotes ?? null,
              downVotes: node.helpfulness?.downVotes ?? null,
              helpfulness: node.helpfulness?.score ?? null,
              hotScore:
                (node.helpfulness?.upVotes || 0) -
                (node.helpfulness?.downVotes || 0),
            })),
          },
      douban: doubanBundle
        ? {
            status: "ready",
            url: doubanBundle.url,
            items: doubanBundle.reviews,
          }
        : {
            status: "unmapped",
            message: "尚未建立可靠的 IMDb 与豆瓣条目映射",
            items: [],
          },
    },
    awards: awardsResult.error
      ? { status: "error", message: awardsResult.error }
      : {
          status: "ready",
          prestigious: award.prestigiousAwardSummary
            ? {
                name:
                  award.prestigiousAwardSummary.awardNomination?.award?.text ||
                  null,
                wins: award.prestigiousAwardSummary.wins ?? 0,
                nominations: award.prestigiousAwardSummary.nominations ?? 0,
              }
            : null,
          totalWins: award.totalWins?.total ?? null,
          totalNominations: award.totalNominations?.total ?? null,
          topRank: award.ratingsSummary?.topRanking?.rank ?? null,
        },
    trivia: triviaResult.error
      ? { status: "error", message: triviaResult.error, items: [], totals: {} }
      : (() => {
          const title = triviaResult.value?.title || {};
          const interest = (node) => ({
            usersInterested: node.interestScore?.usersInterested ?? null,
            usersVoted: node.interestScore?.usersVoted ?? null,
          });
          const items = [
            ...(title.trivia?.edges || []).map(({ node }) => ({
              id: node.id,
              type: "trivia",
              label: "幕后花絮",
              text: node.text?.plainText || null,
              spoiler: Boolean(node.isSpoiler),
              category: node.category?.text || node.category?.id || null,
              relatedNames: node.relatedNames || null,
              trademark: node.trademark || null,
              ...interest(node),
            })),
            ...(title.quotes?.edges || []).map(({ node }) => ({
              id: node.id,
              type: "quote",
              label: "经典台词",
              text: (node.lines || [])
                .map((line) => line.text)
                .filter(Boolean)
                .join("\n"),
              spoiler: Boolean(node.isSpoiler),
              lines: node.lines || [],
              ...interest(node),
            })),
            ...(title.goofs?.edges || []).map(({ node }) => ({
              id: node.id,
              type: "goof",
              label: "穿帮与细节",
              text: node.text?.plainText || null,
              spoiler: Boolean(node.isSpoiler),
              category: node.category?.text || node.category?.id || null,
              ...interest(node),
            })),
            ...(title.crazyCredits?.edges || []).map(({ node }) => ({
              id: node.id,
              type: "credit",
              label: "特殊演职员表",
              text: node.text?.plainText || null,
              spoiler: false,
              ...interest(node),
            })),
            ...(title.soundtrack?.edges || []).map(({ node }) => ({
              id: node.id,
              type: "soundtrack",
              label: "原声带",
              text: node.text || null,
              spoiler: false,
              comments: (node.comments || [])
                .map((comment) => comment.plainText)
                .filter(Boolean),
            })),
          ];
          return {
            status: "ready",
            items,
            totals: {
              trivia: title.triviaCount?.total ?? null,
              quotes: title.quotesCount?.total ?? null,
              goofs: title.goofsCount?.total ?? null,
            },
          };
        })(),
    doubanRating: doubanBundle
      ? {
          value: number(doubanBundle.detail?.rating),
          count: number(doubanBundle.detail?.rating_count, 0),
          url: doubanBundle.url,
          subjectId: doubanBundle.subjectId,
        }
      : null,
    boxOffice: boxOfficeResult.error
      ? { status: "error", message: boxOfficeResult.error, data: null }
      : {
          status: "ready",
          data: {
            budget: money(boxOffice.budget?.totalBudget),
            openingWeekends: (boxOffice.openingWeekendGrosses?.edges || []).map(
              ({ node }) => ({
                ...money(node?.gross?.total),
                date: node?.weekendStartDate || null,
              }),
            ),
            domestic: money(boxOffice.domesticGross?.total),
            worldwide: money(boxOffice.worldwideGross?.total),
          },
        },
    chartRankings: { status: "unavailable", items: [] },
  };
}

export async function resolveTitleId(mediaType, externalId) {
  if (!["movie", "tv"].includes(mediaType)) throw new Error("不支持的影视类型");
  if (/^\d+$/.test(String(externalId)))
    return { mediaType, id: Number(externalId) };
  if (!/^tt\d+$/.test(String(externalId))) throw new Error("无法识别的影视 ID");
  const response = await tmdb(
    `/find/${externalId}`,
    { external_source: "imdb_id", language: "zh-CN" },
    30 * 24 * 60 * 60 * 1000,
  );
  const match =
    mediaType === "tv" ? response.tv_results?.[0] : response.movie_results?.[0];
  if (!match?.id) throw new Error("未找到对应的 TMDB 影视条目");
  return { mediaType, id: match.id };
}

export async function getPersonDetails(id) {
  const details = await tmdb(
    `/person/${id}`,
    {
      language: "zh-CN",
      append_to_response: "combined_credits,images,external_ids",
    },
    12 * 60 * 60 * 1000,
  );
  const credits = [
    ...(details.combined_credits?.cast || []),
    ...(details.combined_credits?.crew || []),
  ]
    .filter((item) => ["movie", "tv"].includes(item.media_type))
    .sort(
      (left, right) => number(right.popularity, 0) - number(left.popularity, 0),
    );
  const unique = new Map();
  for (const credit of credits)
    unique.set(
      `${credit.media_type}:${credit.id}`,
      mediaSummary(credit, [], credit.media_type),
    );
  const enrichedCredits = await imdbRatingsFor([...unique.values()]);
  return {
    id: details.id,
    name: details.name,
    alsoKnownAs: details.also_known_as || [],
    biography: details.biography || "暂无中文人物简介。",
    birthday: details.birthday || null,
    deathday: details.deathday || null,
    placeOfBirth: details.place_of_birth || null,
    department: details.known_for_department || null,
    profile: image(details.profile_path, "h632", profileFallback),
    imdbId: details.external_ids?.imdb_id || null,
    imdbUrl: details.external_ids?.imdb_id
      ? `https://www.imdb.com/name/${details.external_ids.imdb_id}/`
      : null,
    gender: details.gender || 0,
    popularity: number(details.popularity, 0),
    homepage: details.homepage || null,
    images: (details.images?.profiles || []).map((item) =>
      image(item.file_path, "h632", profileFallback),
    ),
    credits: enrichedCredits,
    movieCredits: enrichedCredits.filter((item) => item.mediaType === "movie"),
    tvCredits: enrichedCredits.filter((item) => item.mediaType === "tv"),
    creditCount: enrichedCredits.length,
  };
}

export async function getCatalogOptions() {
  const [genres, languages] = await Promise.all([
    loadGenres(),
    tmdb("/configuration/languages", {}, 30 * 24 * 60 * 60 * 1000),
  ]);
  return {
    genres,
    languages: (Array.isArray(languages) ? languages : [])
      .filter((language) => language.iso_639_1)
      .map((language) => ({
        code: language.iso_639_1,
        name: language.name || language.english_name,
      })),
  };
}

function imdbChartItem(edge) {
  const item = edge?.node?.item || edge?.item || edge?.node || {};
  return {
    id: item.id,
    mediaType: item.titleType?.isSeries ? "tv" : "movie",
    title: item.titleText?.text || item.originalTitleText?.text || "未命名作品",
    originalTitle: item.originalTitleText?.text || null,
    year: number(item.releaseYear?.year),
    releaseDate: null,
    overview: item.plot?.plotText?.plainText || "",
    poster: item.primaryImage?.url || imageFallback,
    backdrop: null,
    genres: (item.genres?.genres || [])
      .map((genre) => genre.text)
      .filter(Boolean),
    tmdbRating: null,
    tmdbVoteCount: 0,
    popularity: 0,
    adult: false,
    imdbId: item.id,
    imdbRating: number(item.ratingsSummary?.aggregateRating),
    imdbVoteCount: number(item.ratingsSummary?.voteCount),
  };
}

function doubanHotItem(item, mediaType) {
  const yearMatch = String(item.card_subtitle || "").match(/(19|20)\d{2}/);
  return {
    id: Number(item.id),
    mediaType,
    title: item.title || "?????",
    originalTitle: null,
    year: yearMatch ? Number(yearMatch[0]) : null,
    releaseDate: null,
    overview: item.card_subtitle || "",
    poster: item.pic?.large || item.pic?.normal || imageFallback,
    backdrop: null,
    genres: [],
    tmdbRating: null,
    tmdbVoteCount: 0,
    popularity: 0,
    adult: false,
    imdbId: null,
    imdbRating: null,
    imdbVoteCount: null,
    doubanId: String(item.id),
    doubanRating: number(item.rating?.value),
    doubanVoteCount: number(item.rating?.count, 0),
    externalUrl: `https://movie.douban.com/subject/${item.id}/`,
    source: "douban",
  };
}

export async function getPopularBySource(
  mediaType,
  source = "tmdb",
  pageValue = 1,
) {
  if (!["movie", "tv"].includes(mediaType)) throw new Error("??????????");
  if (source !== "douban")
    return getBrowsePage(
      mediaType === "movie" ? "popular-movies" : "popular-tv",
      pageValue,
    );
  const path =
    mediaType === "movie"
      ? "/api/douban/get-recent-hot-movie/v1"
      : "/api/douban/get-recent-hot-tv/v1";
  const response = await justOne(path, {}, CACHE_TTL.recentHot);
  const results = (response.items || []).map((item) =>
    doubanHotItem(item, mediaType),
  );
  return {
    source: "douban",
    preset: mediaType === "movie" ? "popular-movies" : "popular-tv",
    title: mediaType === "movie" ? "????" : "????",
    description: "????????",
    genres: { movie: [], tv: [] },
    mediaType,
    page: 1,
    totalPages: 1,
    totalResults: results.length,
    results,
  };
}

const browsePresets = {
  "now-playing": {
    title: "正在上映",
    description: "当前院线正在上映的电影。",
    path: "/movie/now_playing",
    mediaType: "movie",
    params: { region: "CN" },
  },
  upcoming: {
    title: "即将上映",
    description: "即将在院线与流媒体上线的电影。",
    path: "/movie/upcoming",
    mediaType: "movie",
    params: { region: "CN" },
  },
  "popular-movies": {
    title: "热门电影",
    description: "近期最受观众关注的热门电影。",
    path: "/movie/popular",
    mediaType: "movie",
  },
  "top-movies": {
    title: "高分电影",
    description: "汇集长期保持高口碑的电影作品。",
    path: "/movie/top_rated",
    mediaType: "movie",
  },
  "popular-tv": {
    title: "热门剧集",
    description: "近期热度持续上升的电视剧与网络剧。",
    path: "/tv/popular",
    mediaType: "tv",
  },
  "top-tv": {
    title: "高分剧集",
    description: "汇集长期保持高口碑的剧集作品。",
    path: "/tv/top_rated",
    mediaType: "tv",
  },
  "airing-today": {
    title: "今日播出",
    description: "今天有新集数播出的剧集。",
    path: "/tv/airing_today",
    mediaType: "tv",
    params: { timezone: "Asia/Shanghai" },
  },
  "trending-day": {
    title: "今日趋势",
    description: "过去一天内热度增长最快的影视作品。",
    path: "/trending/all/day",
    mediaType: "multi",
  },
  "trending-week": {
    title: "本周趋势",
    description: "过去一周内最受关注的影视作品。",
    path: "/trending/all/week",
    mediaType: "multi",
  },
};

export async function getBrowsePage(preset, pageValue) {
  const imdbChart = {
    "imdb-top-250": {
      type: "TOP_250",
      title: "IMDb Top 250",
      description: "IMDb 用户长期评分形成的经典电影榜单",
    },
    "imdb-top-250-tv": {
      type: "TOP_250_TV",
      title: "IMDb 剧集 Top 250",
      description: "IMDb 用户长期评分形成的经典剧集榜单",
    },
  }[preset];
  if (imdbChart) {
    const response = await justOne(
      "/api/imdb/title-chart-rankings/v1",
      { rankingsChartType: imdbChart.type, languageCountry: "en_US" },
      CACHE_TTL.top250,
    );
    const all = (response.titleChartRankings?.edges || []).map(imdbChartItem);
    const page = Math.max(1, Math.min(10, number(pageValue, 1)));
    const size = 25;
    const genres = await loadGenres();
    const results = await Promise.all(
      all.slice((page - 1) * size, page * size).map(async (item) => {
        try {
          const found = await tmdb(
            `/find/${item.imdbId}`,
            { external_source: "imdb_id", language: "zh-CN" },
            30 * 24 * 60 * 60 * 1000,
          );
          const match =
            item.mediaType === "tv"
              ? found.tv_results?.[0]
              : found.movie_results?.[0];
          if (!match) return item;
          return {
            ...item,
            title: match.title || match.name || item.title,
            poster: image(match.poster_path, "w500", item.poster),
            backdrop: match.backdrop_path
              ? image(match.backdrop_path, "w1280", null)
              : null,
            genres: genreNames(match.genre_ids, genres[item.mediaType] || []),
          };
        } catch {
          return item;
        }
      }),
    );
    return {
      preset,
      title: imdbChart.title,
      description: imdbChart.description,
      page,
      totalPages: Math.ceil(all.length / size),
      totalResults: all.length,
      results,
      genres,
    };
  }
  const config = browsePresets[preset];
  if (!config) throw new Error("不存在的榜单类型");
  const page = Math.max(1, Math.min(500, number(pageValue, 1)));
  const requestPages =
    preset === "upcoming"
      ? [page, page + 1, page + 2, page + 3, page + 4]
      : [page];
  const [responses, genres] = await Promise.all([
    Promise.all(
      requestPages.map((requestPage) =>
        tmdb(
          config.path,
          {
            language: "zh-CN",
            page: requestPage,
            ...(preset === "upcoming" ? {} : config.params || {}),
          },
          15 * 60 * 1000,
        ),
      ),
    ),
    loadGenres(),
  ]);
  const response = responses[0];
  if (preset === "upcoming")
    response.results = responses
      .flatMap((item) => item.results || [])
      .sort((left, right) =>
        String(left.release_date || "").localeCompare(
          String(right.release_date || ""),
        ),
      );
  const today = new Date().toISOString().slice(0, 10);
  const mapped = (response.results || [])
    .filter((item) => item.media_type !== "person")
    .filter(
      (item) =>
        preset !== "upcoming" ||
        (item.release_date && item.release_date >= today),
    )
    .map((item) => {
      const mediaType =
        config.mediaType === "multi" ? mediaTypeOf(item) : config.mediaType;
      return mediaSummary(item, genres[mediaType] || [], mediaType);
    });
  const results =
    preset === "upcoming"
      ? mapped.slice(0, 20).map((item) => ({
          ...item,
          imdbRating: null,
          imdbVoteCount: null,
          tmdbRating: null,
          tmdbVoteCount: 0,
        }))
      : await imdbRatingsFor(mapped.slice(0, 20));
  return {
    preset,
    title: config.title,
    description: config.description,
    ...pagination(response, results),
  };
}

async function getPopularCreators(page) {
  const source = await tmdb(
    "/movie/popular",
    { language: "zh-CN", page, region: "CN" },
    30 * 60 * 1000,
  );
  const movies = (source.results || []).slice(0, 14);
  const credits = await Promise.allSettled(
    movies.map((movie) =>
      tmdb(
        `/movie/${movie.id}/credits`,
        { language: "zh-CN" },
        24 * 60 * 60 * 1000,
      ),
    ),
  );
  const people = new Map();
  credits.forEach((result, index) => {
    if (result.status !== "fulfilled") return;
    const movie = mediaSummary(movies[index], [], "movie");
    for (const person of result.value.crew || []) {
      if (
        !["Director", "Writer", "Screenplay", "Story"].includes(person.job) ||
        !person.id
      )
        continue;
      const existing = people.get(person.id) || {
        id: person.id,
        mediaType: "person",
        name: person.name || "未命名影人",
        department:
          person.department ||
          (person.job === "Director" ? "Directing" : "Writing"),
        profile: image(person.profile_path, "w342", profileFallback),
        popularity: number(person.popularity, 0),
        knownFor: [],
      };
      if (!existing.knownFor.some((item) => item.id === movie.id))
        existing.knownFor.push(movie);
      people.set(person.id, existing);
    }
  });
  const results = [...people.values()]
    .sort(
      (left, right) =>
        right.knownFor.length - left.knownFor.length ||
        right.popularity - left.popularity,
    )
    .slice(0, 30);
  return {
    page,
    totalPages: Math.min(number(source.total_pages, 1), 500),
    totalResults: results.length,
    results,
  };
}

export async function getPopularPeople(pageValue, departmentValue = "") {
  const page = Math.max(1, Math.min(500, number(pageValue, 1)));
  if (departmentValue === "Creators") return getPopularCreators(page);
  const sourcePages =
    departmentValue === "Acting"
      ? [page * 3 - 2, page * 3 - 1, page * 3]
      : [page];
  const settled = await Promise.allSettled(
    sourcePages.map((sourcePage) =>
      tmdb(
        "/person/popular",
        { language: "zh-CN", page: sourcePage },
        30 * 60 * 1000,
      ),
    ),
  );
  const responses = settled
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);
  if (!responses.length)
    throw (
      settled.find((result) => result.status === "rejected")?.reason ||
      new Error("热门影人数据暂不可用")
    );
  const people = responses
    .flatMap((response) => response.results || [])
    .map(personSummary)
    .filter(
      (person) =>
        departmentValue !== "Acting" || person.department === "Acting",
    );
  return {
    page,
    totalPages:
      departmentValue === "Acting"
        ? Math.ceil(Math.min(number(responses[0]?.total_pages, 500), 500) / 3)
        : Math.min(number(responses[0]?.total_pages, 1), 500),
    totalResults:
      departmentValue === "Acting"
        ? people.length
        : number(responses[0]?.total_results, people.length),
    results: people.slice(0, 30),
  };
}

export async function getWatchProviders() {
  const [movie, tv] = await Promise.all([
    tmdb(
      "/watch/providers/movie",
      { language: "zh-CN" },
      7 * 24 * 60 * 60 * 1000,
    ),
    tmdb("/watch/providers/tv", { language: "zh-CN" }, 7 * 24 * 60 * 60 * 1000),
  ]);
  const merged = new Map();
  const regionalMovie = (movie.results || []).filter(
    (item) =>
      item.display_priorities?.CN != null ||
      item.display_priorities?.HK != null ||
      item.display_priorities?.TW != null,
  );
  const regionalTv = (tv.results || []).filter(
    (item) =>
      item.display_priorities?.CN != null ||
      item.display_priorities?.HK != null ||
      item.display_priorities?.TW != null,
  );
  for (const item of [...regionalMovie, ...regionalTv]) {
    const existing = merged.get(item.provider_id);
    merged.set(item.provider_id, {
      id: item.provider_id,
      name: item.provider_name,
      logo: image(item.logo_path, "w185", imageFallback),
      displayPriority: Math.min(
        existing?.displayPriority ?? 9999,
        item.display_priorities?.CN ??
          item.display_priorities?.HK ??
          item.display_priorities?.TW ??
          item.display_priority ??
          9999,
      ),
      regions: [
        ...new Set([
          ...(existing?.regions || []),
          ...(item.display_priorities?.CN != null ? ["CN"] : []),
          ...(item.display_priorities?.HK != null ? ["HK"] : []),
          ...(item.display_priorities?.TW != null ? ["TW"] : []),
        ]),
      ],
      officialUrl: providerOfficialUrl(item.provider_name),
      media: [
        ...new Set([
          ...(existing?.media || []),
          ...(regionalMovie.some(
            (value) => value.provider_id === item.provider_id,
          )
            ? ["movie"]
            : []),
          ...(regionalTv.some((value) => value.provider_id === item.provider_id)
            ? ["tv"]
            : []),
        ]),
      ],
    });
  }
  return [...merged.values()].sort(
    (left, right) => left.displayPriority - right.displayPriority,
  );
}

function cleanNewsText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function getIndustryNews() {
  const response = await justOne(
    "/api/imdb/news-by-category-query/v1",
    { category: "MOVIE", languageCountry: "en_US" },
    CACHE_TTL.news,
  );
  return (response.news?.edges || []).map((edge) => {
    const node = edge.node || {};
    return {
      id: node.id || crypto.randomUUID(),
      category: node.source?.homepage?.label || "IMDb 新闻",
      title: cleanNewsText(node.articleTitle?.plainText) || "影视行业动态",
      summary: cleanNewsText(node.text?.plainText).slice(0, 260),
      image: node.image?.url || null,
      publishedAt: node.date || null,
      url: node.externalUrl || null,
    };
  });
}
