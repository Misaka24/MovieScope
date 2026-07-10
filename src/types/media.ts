export interface RatingPair {
  imdb: number
  douban: number
}

export interface MediaItem {
  id: number
  title: string
  year: number
  genres: string[]
  poster: string
  ratings: RatingPair
}

export interface HeroMovie extends MediaItem {
  backdrop: string
  overview: string
}

export interface IndustryNews {
  id: number
  category: string
  title: string
  summary: string
  image: string
  publishedAt: string
}