export interface RatingSet {
  imdb: number | null
  tmdb: number | null
}

export type RatingDisplayMode = 'official' | 'pending' | 'unavailable'

export interface MediaItem {
  id: string
  sourceId: string | number
  mediaType: 'movie' | 'tv'
  title: string
  year: number | null
  genres: string[]
  poster: string
  backdrop: string | null
  overview: string
  ratings: RatingSet
  ratingDisplay: {
    imdb: RatingDisplayMode
  }
  sources: string[]
  rank?: number | null
}

export interface HeroMovie extends MediaItem {
  backdrop: string
}

export interface IndustryNews {
  id: string
  category: string
  title: string
  summary: string
  image: string | null
  publishedAt: string | null
  url: string | null
}

export interface HomeData {
  generatedAt: string
  hero: HeroMovie[]
  sections: {
    nowPlaying: MediaItem[]
    topRated: MediaItem[]
    popularMovies: MediaItem[]
    popularTv: MediaItem[]
    news: IndustryNews[]
  }
  sourceMeta: Array<{ name: string; status: 'ok' | 'error'; error: string | null }>
}
