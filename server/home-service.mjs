import { imdbApiDev, justOne, tmdb } from './providers.mjs'

const imageFallback = 'https://placehold.co/600x900/1e2024/e2e2e8?text=MovieScope'
const backdropFallback = 'https://placehold.co/1600x900/111317/e2e2e8?text=MovieScope'

function yearFrom(value) {
  const year = Number(String(value || '').slice(0, 4))
  return Number.isFinite(year) ? year : null
}

function fixMojibake(value) {
  if (!value || typeof value !== 'string') return value || ''
  if (!/[ÃÂâèçæ]/.test(value)) return value
  try {
    return new TextDecoder('utf-8').decode(Uint8Array.from(value, (char) => char.charCodeAt(0)))
  } catch {
    return value
  }
}

function genreNames(ids, map) {
  return (ids || []).map((id) => map.get(id)).filter(Boolean).slice(0, 2)
}

function sample(items, size) {
  const shuffled = [...items]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]]
  }
  return shuffled.slice(0, size)
}

export function selectImdbHeroMovies(groups, size = 5) {
  const candidates = new Map()
  for (const items of groups) {
    for (const item of items) {
      if (!item.backdrop || item.ratings.imdb == null || item.ratingDisplay.imdb !== 'official') continue
      candidates.set(`${item.mediaType}:${item.sourceId}`, item)
    }
  }
  return sample([...candidates.values()], size)
}

function tmdbImage(path, size, fallback) {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : fallback
}

function toTmdbMedia(item, mediaType, genreMap) {
  const date = mediaType === 'tv' ? item.first_air_date : item.release_date
  return {
    id: `tmdb:${mediaType}:${item.id}`,
    sourceId: item.id,
    mediaType,
    title: item.title || item.name || item.original_title || item.original_name || '未命名作品',
    year: yearFrom(date),
    genres: genreNames(item.genre_ids, genreMap),
    poster: tmdbImage(item.poster_path, 'w500', imageFallback),
    backdrop: tmdbImage(item.backdrop_path, 'original', backdropFallback),
    overview: item.overview || '暂无中文简介。',
    ratings: { imdb: null, tmdb: Number(item.vote_count || 0) > 0 ? Number(item.vote_average || 0) || null : null },
    ratingDisplay: { imdb: 'pending' },
    sources: ['tmdb'],
  }
}

function toImdbMedia(edge) {
  const item = edge?.node?.item || edge?.item || edge?.node || {}
  return {
    id: `imdb:${item.id || Math.random()}`,
    sourceId: item.id,
    mediaType: item.titleType?.isSeries ? 'tv' : 'movie',
    title: fixMojibake(item.titleText?.text || item.originalTitleText?.text) || '未命名作品',
    year: item.releaseYear?.year || null,
    genres: [],
    poster: item.primaryImage?.url || imageFallback,
    backdrop: null,
    overview: '',
    ratings: { imdb: Number(item.ratingsSummary?.aggregateRating || edge?.node?.chartRating || 0) || null, tmdb: null },
    ratingDisplay: { imdb: 'official' },
    rank: item.ratingsSummary?.topRanking?.rank || null,
    sources: ['imdb'],
  }
}

function chunks(items, size) {
  const result = []
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size))
  return result
}

async function loadImdbTitleBatch(titleIds) {
  if (!titleIds.length) return []
  try {
    const response = await imdbApiDev('/titles:batchGet', { titleIds }, 24 * 60 * 60 * 1000)
    return response.titles || []
  } catch {
    if (titleIds.length === 1) return []
    const middle = Math.ceil(titleIds.length / 2)
    const results = await Promise.all([
      loadImdbTitleBatch(titleIds.slice(0, middle)),
      loadImdbTitleBatch(titleIds.slice(middle)),
    ])
    return results.flat()
  }
}

async function enrichImdbRatings(items) {
  const resolved = await Promise.all(items.map(async (media) => {
    try {
      const external = await tmdb(`/${media.mediaType}/${media.sourceId}/external_ids`, {}, 7 * 24 * 60 * 60 * 1000)
      return { media, imdbId: external.imdb_id || null }
    } catch {
      return { media, imdbId: null }
    }
  }))
  const imdbIds = [...new Set(resolved.map((item) => item.imdbId).filter(Boolean))]
  const responses = await Promise.all(chunks(imdbIds, 5).map(loadImdbTitleBatch))
  const titleById = new Map(
    responses
      .flat()
      .map((title) => [title.id, title]),
  )
  return resolved.map(({ media, imdbId }) => {
    const title = imdbId ? titleById.get(imdbId) : null
    const imdbRating = Number(title?.rating?.aggregateRating || 0) || null
    if (!imdbRating) return { ...media, ratingDisplay: { ...media.ratingDisplay, imdb: 'tmdb-fallback' } }
    return {
      ...media,
      ratings: { ...media.ratings, imdb: imdbRating },
      ratingDisplay: { ...media.ratingDisplay, imdb: 'official' },
      sources: [...new Set([...media.sources, 'imdb'])],
    }
  })
}

async function enrichUniqueImdbRatings(groups) {
  const unique = new Map()
  for (const items of groups) {
    for (const item of items) unique.set(`${item.mediaType}:${item.sourceId}`, item)
  }
  const enriched = await enrichImdbRatings([...unique.values()])
  const lookup = new Map(enriched.map((item) => [`${item.mediaType}:${item.sourceId}`, item]))
  return groups.map((items) => items.map((item) => lookup.get(`${item.mediaType}:${item.sourceId}`) || item))
}

async function loadGenres() {
  const [movies, tv] = await Promise.allSettled([
    tmdb('/genre/movie/list', { language: 'zh-CN' }, 7 * 24 * 60 * 60 * 1000),
    tmdb('/genre/tv/list', { language: 'zh-CN' }, 7 * 24 * 60 * 60 * 1000),
  ])
  return {
    movie: new Map((movies.status === 'fulfilled' ? movies.value.genres || [] : []).map((genre) => [genre.id, genre.name])),
    tv: new Map((tv.status === 'fulfilled' ? tv.value.genres || [] : []).map((genre) => [genre.id, genre.name])),
  }
}

async function safeSource(name, loader) {
  try {
    return { name, status: 'ok', data: await loader() }
  } catch (error) {
    return { name, status: 'error', error: error instanceof Error ? error.message : String(error), data: null }
  }
}

function toNews(edge) {
  const node = edge?.node || {}
  return {
    id: node.id || crypto.randomUUID(),
    category: node.source?.homepage?.label || 'IMDb 新闻',
    title: fixMojibake(node.articleTitle?.plainText) || '影视行业动态',
    summary: fixMojibake(node.text?.plainText).replace(/\s+/g, ' ').slice(0, 180),
    image: node.image?.url || null,
    publishedAt: node.date || null,
    url: node.externalUrl || null,
  }
}

export async function getHomeData() {
  const genres = await loadGenres()
  const sources = await Promise.all([
    safeSource('tmdb-now-playing', () => tmdb('/movie/now_playing', { language: 'zh-CN', page: 1, region: 'CN' })),
    safeSource('tmdb-popular-movies', () => tmdb('/movie/popular', { language: 'zh-CN', page: 1, region: 'CN' })),
    safeSource('tmdb-popular-tv', () => tmdb('/tv/popular', { language: 'zh-CN', page: 1 })),
    safeSource('tmdb-top-rated', () => tmdb('/movie/top_rated', { language: 'zh-CN', page: 1, region: 'CN' }, 60 * 60 * 1000)),
    safeSource('tmdb-trending', () => tmdb('/trending/movie/week', { language: 'zh-CN' })),
    safeSource('imdb-top-250', () => justOne('/api/imdb/title-chart-rankings/v1', { rankingsChartType: 'TOP_250', languageCountry: 'en_US' }, 7 * 24 * 60 * 60 * 1000)),
    safeSource('imdb-news', () => justOne('/api/imdb/news-by-category-query/v1', { category: 'MOVIE', languageCountry: 'en_US' }, 24 * 60 * 60 * 1000)),
  ])

  const source = (name) => sources.find((item) => item.name === name)
  const imdbTop = (source('imdb-top-250')?.data?.titleChartRankings?.edges || []).map(toImdbMedia)
  const nowPlayingRaw = (source('tmdb-now-playing')?.data?.results || []).slice(0, 6)
  const popularMoviesRaw = (source('tmdb-popular-movies')?.data?.results || []).slice(0, 6)
  const popularTvRaw = (source('tmdb-popular-tv')?.data?.results || []).slice(0, 6)
  const nowPlayingBase = nowPlayingRaw.map((item) => toTmdbMedia(item, 'movie', genres.movie))
  const popularMoviesBase = popularMoviesRaw.map((item) => toTmdbMedia(item, 'movie', genres.movie))
  const popularTvBase = popularTvRaw.map((item) => toTmdbMedia(item, 'tv', genres.tv))
  const trendingCandidates = (source('tmdb-trending')?.data?.results || [])
    .map((item) => toTmdbMedia(item, 'movie', genres.movie))
    .filter((item) => item.backdrop && item.title)
  const [nowPlaying, popularMovies, popularTvTmdb, enrichedTrending] = await enrichUniqueImdbRatings(
    [nowPlayingBase, popularMoviesBase, popularTvBase, trendingCandidates],
  )
  const popularTv = popularTvTmdb
  const hero = selectImdbHeroMovies([enrichedTrending, nowPlaying, popularMovies])
  const tmdbTopRated = (source('tmdb-top-rated')?.data?.results || [])
    .slice(0, 6)
    .map((item) => ({
      ...toTmdbMedia(item, 'movie', genres.movie),
      ratingDisplay: { imdb: 'tmdb-fallback' },
    }))
  const news = (source('imdb-news')?.data?.news?.edges || []).map(toNews)

  return {
    generatedAt: new Date().toISOString(),
    hero,
    sections: {
      nowPlaying,
      topRated: imdbTop.length ? imdbTop.slice(0, 6) : tmdbTopRated,
      popularMovies,
      popularTv,
      news,
    },
    sourceMeta: sources.map(({ name, status, error }) => ({ name, status, error: error || null })),
  }
}
