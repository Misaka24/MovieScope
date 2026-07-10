import { imdbApiDev, tmdb } from './providers.mjs'

const imageFallback = 'https://placehold.co/600x900/1e2024/e2e2e8?text=MovieScope'
const profileFallback = 'https://placehold.co/400x500/1e2024/e2e2e8?text=MovieScope'
const backdropFallback = 'https://placehold.co/1600x900/111317/e2e2e8?text=MovieScope'

function image(path, size, fallback = imageFallback) {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : fallback
}

function year(value) {
  const parsed = Number(String(value || '').slice(0, 4))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function number(value, fallback = null) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function mediaTypeOf(item, fallback = 'movie') {
  if (item.media_type === 'tv' || item.first_air_date || item.name) return 'tv'
  if (item.media_type === 'person' || item.known_for_department) return 'person'
  return fallback
}

function genreNames(ids, genres) {
  const lookup = new Map(genres.map((genre) => [genre.id, genre.name]))
  return (ids || []).map((id) => lookup.get(id)).filter(Boolean)
}

function mediaSummary(item, genres = [], fallbackType = 'movie') {
  const mediaType = mediaTypeOf(item, fallbackType)
  const date = mediaType === 'tv' ? item.first_air_date : item.release_date
  return {
    id: Number(item.id),
    mediaType,
    title: item.title || item.name || item.original_title || item.original_name || '未命名作品',
    originalTitle: item.original_title || item.original_name || null,
    year: year(date),
    releaseDate: date || null,
    overview: item.overview || '暂无中文简介。',
    poster: image(item.poster_path, 'w500'),
    backdrop: item.backdrop_path ? image(item.backdrop_path, 'w1280', backdropFallback) : null,
    genres: item.genres?.map((genre) => genre.name) || genreNames(item.genre_ids, genres),
    tmdbRating: number(item.vote_average),
    tmdbVoteCount: number(item.vote_count, 0),
    popularity: number(item.popularity, 0),
    adult: Boolean(item.adult),
  }
}

function personSummary(item) {
  return {
    id: Number(item.id),
    mediaType: 'person',
    name: item.name || '未命名影人',
    department: item.known_for_department || null,
    profile: image(item.profile_path, 'w500', profileFallback),
    popularity: number(item.popularity, 0),
    knownFor: (item.known_for || []).slice(0, 4).map((media) => mediaSummary(media, [], media.media_type || 'movie')),
  }
}

async function loadGenres() {
  const [movie, tv] = await Promise.all([
    tmdb('/genre/movie/list', { language: 'zh-CN' }, 7 * 24 * 60 * 60 * 1000),
    tmdb('/genre/tv/list', { language: 'zh-CN' }, 7 * 24 * 60 * 60 * 1000),
  ])
  return { movie: movie.genres || [], tv: tv.genres || [] }
}

async function imdbDetails(imdbId) {
  if (!imdbId) return null
  try {
    return await imdbApiDev(`/titles/${imdbId}`, {}, 24 * 60 * 60 * 1000)
  } catch {
    return null
  }
}

async function imdbRatingsFor(items) {
  const resolved = await Promise.all(items.map(async (item) => {
    if (item.mediaType === 'person') return { item, imdbId: null }
    try {
      const external = await tmdb(`/${item.mediaType}/${item.id}/external_ids`, {}, 7 * 24 * 60 * 60 * 1000)
      return { item, imdbId: external.imdb_id || null }
    } catch {
      return { item, imdbId: null }
    }
  }))
  return Promise.all(resolved.map(async ({ item, imdbId }) => {
    if (!imdbId) return { ...item, imdbId: null, imdbRating: null, imdbVoteCount: null }
    const imdb = await imdbDetails(imdbId)
    return {
      ...item,
      imdbId,
      imdbRating: number(imdb?.rating?.aggregateRating),
      imdbVoteCount: number(imdb?.rating?.voteCount),
    }
  }))
}

function pagination(response, results) {
  return {
    page: number(response.page, 1),
    totalPages: Math.min(number(response.total_pages, 1), 500),
    totalResults: number(response.total_results, results.length),
    results,
  }
}

export async function searchCatalog(params) {
  const query = String(params.query || '').trim()
  const type = ['multi', 'movie', 'tv', 'person', 'keyword'].includes(params.type) ? params.type : 'multi'
  const page = Math.max(1, Math.min(500, number(params.page, 1)))
  if (!query) return { query, type, page: 1, totalPages: 0, totalResults: 0, results: [], genres: await loadGenres() }
  const path = type === 'multi' ? '/search/multi' : `/search/${type}`
  const response = await tmdb(path, { query, language: 'zh-CN', page, include_adult: false, region: 'CN' }, 10 * 60 * 1000)
  const genres = await loadGenres()
  const mapped = (response.results || []).filter((item) => type !== 'multi' || ['movie', 'tv', 'person'].includes(item.media_type))
    .map((item) => type === 'keyword'
      ? { id: Number(item.id), mediaType: 'keyword', name: item.name || '未命名关键词' }
      : mediaTypeOf(item) === 'person' ? personSummary(item) : mediaSummary(item, genres[mediaTypeOf(item)] || [], type === 'tv' ? 'tv' : 'movie'))
  const media = mapped.filter((item) => item.mediaType === 'movie' || item.mediaType === 'tv')
  const enriched = await imdbRatingsFor(media.slice(0, 10))
  const ratingByKey = new Map(enriched.map((item) => [`${item.mediaType}:${item.id}`, item]))
  return { query, type, genres, ...pagination(response, mapped.map((item) => ratingByKey.get(`${item.mediaType}:${item.id}`) || item)) }
}

const discoverSorts = new Set(['popularity.desc', 'vote_average.desc', 'primary_release_date.desc', 'first_air_date.desc', 'revenue.desc'])

export async function discoverCatalog(params) {
  const mediaType = params.mediaType === 'tv' ? 'tv' : 'movie'
  const page = Math.max(1, Math.min(500, number(params.page, 1)))
  const sortBy = discoverSorts.has(params.sortBy) ? params.sortBy : 'popularity.desc'
  const yearValue = number(params.year)
  const minRating = Math.max(0, Math.min(10, number(params.minRating, 0)))
  const apiParams = {
    language: 'zh-CN', region: 'CN', page, sort_by: sortBy,
    include_adult: false, include_video: false,
    with_genres: params.genres || undefined,
    'vote_average.gte': minRating || undefined,
    'vote_count.gte': minRating ? 100 : undefined,
    with_original_language: params.language || undefined,
  }
  if (yearValue) apiParams[mediaType === 'movie' ? 'primary_release_year' : 'first_air_date_year'] = yearValue
  const [response, genres] = await Promise.all([
    tmdb(`/discover/${mediaType}`, apiParams, 15 * 60 * 1000),
    loadGenres(),
  ])
  const mapped = (response.results || []).map((item) => mediaSummary(item, genres[mediaType], mediaType))
  const results = await imdbRatingsFor(mapped.slice(0, 12))
  return { mediaType, sortBy, filters: { genres: params.genres || '', year: yearValue, minRating, language: params.language || '' }, genres, ...pagination(response, results) }
}

function videoUrl(video) {
  if (video.site === 'YouTube') return `https://www.youtube.com/watch?v=${video.key}`
  if (video.site === 'Vimeo') return `https://vimeo.com/${video.key}`
  return null
}

function creditsData(credits) {
  return {
    cast: (credits?.cast || []).slice(0, 18).map((person) => ({ id: person.id, name: person.name, character: person.character || null, profile: image(person.profile_path, 'w342', profileFallback) })),
    crew: (credits?.crew || []).filter((person) => ['Director', 'Writer', 'Screenplay', 'Creator'].includes(person.job)).slice(0, 12).map((person) => ({ id: person.id, name: person.name, job: person.job, department: person.department, profile: image(person.profile_path, 'w342', profileFallback) })),
  }
}

export async function getTitleDetails(mediaType, id) {
  if (!['movie', 'tv'].includes(mediaType)) throw new Error('不支持的影视类型')
  const append = mediaType === 'movie'
    ? 'credits,videos,images,external_ids,recommendations,similar,watch/providers,release_dates,keywords,reviews'
    : 'credits,videos,images,external_ids,recommendations,similar,watch/providers,content_ratings,keywords,reviews'
  const details = await tmdb(`/${mediaType}/${id}`, { language: 'zh-CN', append_to_response: append, include_image_language: 'zh,null' }, 6 * 60 * 60 * 1000)
  const external = details.external_ids || {}
  const imdb = await imdbDetails(external.imdb_id)
  const releaseDates = mediaType === 'movie' ? details.release_dates?.results || [] : details.content_ratings?.results || []
  const cnRelease = releaseDates.find((item) => item.iso_3166_1 === 'CN') || releaseDates.find((item) => item.iso_3166_1 === 'US')
  const certification = mediaType === 'movie'
    ? cnRelease?.release_dates?.map((item) => item.certification).find(Boolean) || null
    : cnRelease?.rating || null
  const credits = creditsData(details.credits)
  const runtime = mediaType === 'movie' ? details.runtime : details.episode_run_time?.[0]
  const providers = details['watch/providers']?.results?.CN || null
  return {
    ...mediaSummary(details, [], mediaType),
    tagline: details.tagline || null,
    status: details.status || null,
    runtime: number(runtime),
    certification,
    homepage: details.homepage || null,
    imdbId: external.imdb_id || null,
    imdbUrl: external.imdb_id ? `https://www.imdb.com/title/${external.imdb_id}/` : null,
    imdbRating: number(imdb?.rating?.aggregateRating),
    imdbVoteCount: number(imdb?.rating?.voteCount),
    metacritic: number(imdb?.metacritic?.score),
    budget: number(details.budget, 0),
    revenue: number(details.revenue, 0),
    originCountries: details.origin_country || details.production_countries?.map((country) => country.iso_3166_1) || [],
    languages: details.spoken_languages?.map((language) => language.name) || [],
    productionCompanies: details.production_companies?.map((company) => ({ id: company.id, name: company.name, logo: company.logo_path ? image(company.logo_path, 'w185', null) : null })) || [],
    networks: details.networks?.map((network) => ({ id: network.id, name: network.name, logo: network.logo_path ? image(network.logo_path, 'w185', null) : null })) || [],
    seasons: details.seasons?.map((season) => ({ id: season.id, number: season.season_number, name: season.name, episodes: season.episode_count, airDate: season.air_date, poster: image(season.poster_path, 'w342') })) || [],
    credits,
    videos: (details.videos?.results || []).map((video) => ({ id: video.id, name: video.name, type: video.type, official: Boolean(video.official), url: videoUrl(video), key: video.key, site: video.site })).filter((video) => video.url),
    images: (details.images?.backdrops || []).slice(0, 12).map((item) => ({ path: image(item.file_path, 'w1280', backdropFallback), width: item.width, height: item.height })),
    recommendations: (details.recommendations?.results || []).slice(0, 12).map((item) => mediaSummary(item, [], mediaType)),
    similar: (details.similar?.results || []).slice(0, 12).map((item) => mediaSummary(item, [], mediaType)),
    reviews: (details.reviews?.results || []).slice(0, 8).map((review) => ({ id: review.id, author: review.author, content: review.content, createdAt: review.created_at, rating: number(review.author_details?.rating) })),
    keywords: (details.keywords?.keywords || details.keywords?.results || []).map((keyword) => ({ id: keyword.id, name: keyword.name })),
    watchProviders: providers ? { link: providers.link, flatrate: providers.flatrate || [], rent: providers.rent || [], buy: providers.buy || [] } : null,
  }
}

export async function getPersonDetails(id) {
  const details = await tmdb(`/person/${id}`, { language: 'zh-CN', append_to_response: 'combined_credits,images,external_ids' }, 12 * 60 * 60 * 1000)
  const credits = [...(details.combined_credits?.cast || []), ...(details.combined_credits?.crew || [])]
    .filter((item) => ['movie', 'tv'].includes(item.media_type))
    .sort((left, right) => number(right.popularity, 0) - number(left.popularity, 0))
  const unique = new Map()
  for (const credit of credits) unique.set(`${credit.media_type}:${credit.id}`, mediaSummary(credit, [], credit.media_type))
  return {
    id: details.id,
    name: details.name,
    alsoKnownAs: details.also_known_as || [],
    biography: details.biography || '暂无中文人物简介。',
    birthday: details.birthday || null,
    deathday: details.deathday || null,
    placeOfBirth: details.place_of_birth || null,
    department: details.known_for_department || null,
    profile: image(details.profile_path, 'h632', profileFallback),
    imdbId: details.external_ids?.imdb_id || null,
    imdbUrl: details.external_ids?.imdb_id ? `https://www.imdb.com/name/${details.external_ids.imdb_id}/` : null,
    images: (details.images?.profiles || []).slice(0, 12).map((item) => image(item.file_path, 'h632', profileFallback)),
    credits: [...unique.values()].slice(0, 24),
  }
}

export async function getCatalogOptions() {
  const [genres, languages] = await Promise.all([
    loadGenres(),
    tmdb('/configuration/languages', {}, 30 * 24 * 60 * 60 * 1000),
  ])
  return {
    genres,
    languages: (Array.isArray(languages) ? languages : []).filter((language) => language.iso_639_1).map((language) => ({ code: language.iso_639_1, name: language.name || language.english_name })),
  }
}
