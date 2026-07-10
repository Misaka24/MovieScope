import type { MediaItem } from '../types/media'

export function primaryRatingLabel(item: MediaItem, allowTmdbFallback = true) {
  if (item.ratings.imdb != null) return `IMDb ${item.ratings.imdb.toFixed(1)}`
  if (allowTmdbFallback && item.ratingDisplay.imdb === 'tmdb-fallback' && item.ratings.tmdb != null) {
    return `TMDB ${item.ratings.tmdb.toFixed(1)}`
  }
  return allowTmdbFallback ? 'IMDb 未收录' : ''
}
