import { justOne, tmdb } from './providers.mjs'

const imageFallback = 'https://placehold.co/600x900/1e2024/e2e2e8?text=MovieScope'
const backdropFallback = 'https://placehold.co/1600x900/111317/e2e2e8?text=MovieScope'

function yearFrom(value) {
  const year = Number(String(value || '').slice(0, 4))
  return Number.isFinite(year) ? year : null
}

function normalizeTitle(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLocaleLowerCase('zh-CN')
    .replace(/[\s·•:：,，.。!！?？'"“”‘’\-—_()（）]/g, '')
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
    ratings: { imdb: null, douban: null, tmdb: Number(item.vote_average || 0) || null },
    sources: ['tmdb'],
  }
}

function parseDoubanGenres(subtitle) {
  const parts = String(subtitle || '').split('/').map((item) => item.trim()).filter(Boolean)
  return parts.slice(2, 3).flatMap((item) => item.split(/\s+/)).filter(Boolean).slice(0, 2)
}

function toDoubanMedia(item) {
  return {
    id: `douban:${item.type || 'movie'}:${item.id}`,
    sourceId: item.id,
    mediaType: item.type === 'tv' ? 'tv' : 'movie',
    title: fixMojibake(item.title) || '未命名作品',
    year: yearFrom(fixMojibake(item.card_subtitle)),
    genres: parseDoubanGenres(fixMojibake(item.card_subtitle)),
    poster: item.pic?.large || item.pic?.normal || imageFallback,
    backdrop: null,
    overview: item.episodes_info ? fixMojibake(item.episodes_info) : '',
    ratings: { imdb: null, douban: Number(item.rating?.value || 0) || null, tmdb: null },
    sources: ['douban'],
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
    ratings: { imdb: Number(item.ratingsSummary?.aggregateRating || edge?.node?.chartRating || 0) || null, douban: null, tmdb: null },
    rank: item.ratingsSummary?.topRanking?.rank || null,
    sources: ['imdb'],
  }
}

function mergeRatings(primary, candidates) {
  const title = normalizeTitle(primary.title)
  const matched = candidates.find((candidate) => {
    if (normalizeTitle(candidate.title) !== title) return false
    if (!primary.year || !candidate.year) return true
    return Math.abs(primary.year - candidate.year) <= 1
  })
  if (!matched) return primary
  return {
    ...primary,
    ratings: {
      tmdb: primary.ratings.tmdb ?? matched.ratings.tmdb,
      imdb: primary.ratings.imdb ?? matched.ratings.imdb,
      douban: primary.ratings.douban ?? matched.ratings.douban,
    },
    sources: [...new Set([...primary.sources, ...matched.sources])],
  }
}

async function loadGenres() {
  const [movies, tv] = await Promise.all([
    tmdb('/genre/movie/list', { language: 'zh-CN' }, 7 * 24 * 60 * 60 * 1000),
    tmdb('/genre/tv/list', { language: 'zh-CN' }, 7 * 24 * 60 * 60 * 1000),
  ])
  return {
    movie: new Map((movies.genres || []).map((genre) => [genre.id, genre.name])),
    tv: new Map((tv.genres || []).map((genre) => [genre.id, genre.name])),
  }
}

async function safeSource(name, loader) {
  try {
    return { name, status: 'ok', data: await loader() }
  } catch (error) {
    return { name, status: 'error', error: error instanceof Error ? error.message : String(error), data: null }
  }
}

async function enrichHero(movie, genreMap) {
  try {
    const external = await tmdb(`/movie/${movie.sourceId}/external_ids`, {}, 7 * 24 * 60 * 60 * 1000)
    if (!external.imdb_id) return movie
    const data = await justOne('/api/imdb/title-redux-overview-query/v1', { id: external.imdb_id, languageCountry: 'zh_CN' }, 24 * 60 * 60 * 1000)
    const title = data.title || {}
    return {
      ...movie,
      title: movie.title || fixMojibake(title.titleText?.text),
      ratings: { ...movie.ratings, imdb: Number(title.ratingsSummary?.aggregateRating || 0) || null },
      genres: movie.genres.length ? movie.genres : genreNames(title.genres?.genres?.map((genre) => genre.id), genreMap),
      sources: [...new Set([...movie.sources, 'imdb'])],
    }
  } catch {
    return movie
  }
}

function toNews(edge) {
  const node = edge?.node || {}
  return {
    id: node.id || crypto.randomUUID(),
    category: node.source?.homepage?.label || 'IMDb 新闻',
    title: fixMojibake(node.articleTitle?.plainText) || '影视行业动态',
    summary: fixMojibake(node.text?.plainText).replace(/\s+/g, ' ').slice(0, 180),
    image: node.image?.url || backdropFallback,
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
    safeSource('tmdb-trending', () => tmdb('/trending/movie/week', { language: 'zh-CN' })),
    safeSource('douban-hot-movies', () => justOne('/api/douban/get-recent-hot-movie/v1', { page: 1 })),
    safeSource('douban-hot-tv', () => justOne('/api/douban/get-recent-hot-tv/v1', { page: 1 })),
    safeSource('imdb-top-250', () => justOne('/api/imdb/title-chart-rankings/v1', { rankingsChartType: 'TOP_250', languageCountry: 'zh_CN' }, 60 * 60 * 1000)),
    safeSource('imdb-news', () => justOne('/api/imdb/news-by-category-query/v1', { category: 'MOVIE', languageCountry: 'zh_CN' }, 30 * 60 * 1000)),
  ])

  const source = (name) => sources.find((item) => item.name === name)
  const doubanMovies = (source('douban-hot-movies')?.data?.items || []).map(toDoubanMedia)
  const doubanTv = (source('douban-hot-tv')?.data?.items || []).map(toDoubanMedia)
  const imdbTop = (source('imdb-top-250')?.data?.titleChartRankings?.edges || []).map(toImdbMedia)
  const nowPlaying = (source('tmdb-now-playing')?.data?.results || []).map((item) => toTmdbMedia(item, 'movie', genres.movie)).slice(0, 6).map((item) => mergeRatings(item, doubanMovies))
  const popularMovies = (source('tmdb-popular-movies')?.data?.results || []).map((item) => toTmdbMedia(item, 'movie', genres.movie)).slice(0, 6).map((item) => mergeRatings(item, doubanMovies))
  const popularTvTmdb = (source('tmdb-popular-tv')?.data?.results || []).map((item) => toTmdbMedia(item, 'tv', genres.tv)).slice(0, 6).map((item) => mergeRatings(item, doubanTv))
  const popularTv = popularTvTmdb.length ? popularTvTmdb : doubanTv.slice(0, 6)
  const trending = sample(
    (source('tmdb-trending')?.data?.results || [])
      .map((item) => toTmdbMedia(item, 'movie', genres.movie))
      .filter((item) => item.backdrop && item.title),
    5,
  )
  const hero = await Promise.all(trending.map((movie) => enrichHero(movie, genres.movie)))
  const news = (source('imdb-news')?.data?.news?.edges || []).slice(0, 3).map(toNews)

  return {
    generatedAt: new Date().toISOString(),
    hero,
    sections: {
      nowPlaying,
      topRated: imdbTop.slice(0, 6),
      popularMovies,
      popularTv,
      news,
    },
    sourceMeta: sources.map(({ name, status, error }) => ({ name, status, error: error || null })),
  }
}
