export type MediaType = "movie" | "tv";
export type SearchType = "multi" | "movie" | "tv" | "person" | "keyword";

export interface CatalogMedia {
  id: number;
  mediaType: MediaType;
  title: string;
  originalTitle: string | null;
  year: number | null;
  releaseDate: string | null;
  overview: string;
  poster: string;
  backdrop: string | null;
  genres: string[];
  originalLanguage?: string | null;
  tmdbRating: number | null;
  tmdbVoteCount: number;
  popularity: number;
  adult: boolean;
  imdbId?: string | null;
  imdbRating?: number | null;
  imdbVoteCount?: number | null;
}

export interface CatalogPersonSummary {
  id: number;
  mediaType: "person";
  name: string;
  department: string | null;
  profile: string;
  popularity: number;
  knownFor: CatalogMedia[];
}

export interface CatalogKeywordSummary {
  id: number;
  mediaType: "keyword";
  name: string;
}

export type SearchResult =
  CatalogMedia | CatalogPersonSummary | CatalogKeywordSummary;

export interface Genre {
  id: number;
  name: string;
}
export interface GenreGroups {
  movie: Genre[];
  tv: Genre[];
}

export interface CatalogPage<T = CatalogMedia> {
  page: number;
  totalPages: number;
  totalResults: number;
  results: T[];
  genres: GenreGroups;
}

export interface SearchData extends CatalogPage<SearchResult> {
  query: string;
  type: SearchType;
}

export interface DiscoverData extends CatalogPage<CatalogMedia> {
  mediaType: MediaType;
  sortBy: string;
  filters: {
    genres: string;
    year: number | null;
    yearFrom: number | null;
    yearTo: number | null;
    minRating: number;
    language: string;
    provider: string;
    watchRegion: string;
  };
}

export interface BrowseData extends CatalogPage<CatalogMedia> {
  preset: string;
  title: string;
  description: string;
}
export type PeoplePageData = Omit<CatalogPage<CatalogPersonSummary>, "genres">;
export interface WatchProvider {
  id: number;
  name: string;
  logo: string;
  officialUrl: string | null;
  regions: string[];
  displayPriority: number;
  media: MediaType[];
}
export interface NewsItem {
  id: string;
  category: string;
  title: string;
  summary: string;
  image: string | null;
  publishedAt: string | null;
  url: string | null;
}

export interface CreditPerson {
  id: number;
  name: string;
  profile: string;
  character?: string | null;
  job?: string;
  department?: string;
}
export interface MediaImage {
  path: string;
  width: number;
  height: number;
}
export interface Review {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  rating: number | null;
}

export interface TitleDetails extends CatalogMedia {
  tagline: string | null;
  status: string | null;
  runtime: number | null;
  certification: string | null;
  homepage: string | null;
  imdbId: string | null;
  imdbUrl: string | null;
  imdbRating: number | null;
  imdbVoteCount: number | null;
  metacritic: number | null;
  budget: number;
  revenue: number;
  originCountries: string[];
  languages: string[];
  productionCompanies: Array<{ id: number; name: string; logo: string | null }>;
  networks: Array<{ id: number; name: string; logo: string | null }>;
  seasons: Array<{
    id: number;
    number: number;
    name: string;
    episodes: number;
    airDate: string | null;
    poster: string;
  }>;
  credits: { cast: CreditPerson[]; crew: CreditPerson[] };
  videos: Array<{
    id: string;
    name: string;
    type: string;
    official: boolean;
    url: string;
    key: string;
    site: string;
  }>;
  images: MediaImage[];
  posters: MediaImage[];
  logos: MediaImage[];
  recommendations: CatalogMedia[];
  similar: CatalogMedia[];
  reviews: Review[];
  keywords: Array<{ id: number; name: string }>;
  watchProviders: {
    link: string;
    flatrate: Array<{
      provider_id: number;
      provider_name: string;
      logo_path: string;
      officialUrl: string | null;
    }>;
    rent: Array<{
      provider_id: number;
      provider_name: string;
      logo_path: string;
      officialUrl: string | null;
    }>;
    buy: Array<{
      provider_id: number;
      provider_name: string;
      logo_path: string;
      officialUrl: string | null;
    }>;
  } | null;
  createdBy: Array<{ id: number; name: string }>;
  numberOfSeasons: number | null;
  numberOfEpisodes: number | null;
  lastAirDate: string | null;
  nextEpisodeDate: string | null;
}

export interface PersonDetails {
  id: number;
  name: string;
  alsoKnownAs: string[];
  biography: string;
  birthday: string | null;
  deathday: string | null;
  placeOfBirth: string | null;
  department: string | null;
  profile: string;
  imdbId: string | null;
  imdbUrl: string | null;
  images: string[];
  credits: CatalogMedia[];
}
