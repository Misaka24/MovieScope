export function imdbTitleId(value) {
  return value?.id || value?.titleId || value?.title_id || null
}

export function imdbRatingValue(value) {
  const candidates = [
    value?.title?.ratingsSummary?.aggregateRating,
    value?.title?.ratings_summary?.aggregate_rating,
    value?.rating?.aggregateRating,
    value?.rating?.aggregate_rating,
    value?.ratingsSummary?.aggregateRating,
    value?.ratings_summary?.aggregate_rating,
    value?.aggregateRating,
    value?.aggregate_rating,
  ]
  for (const candidate of candidates) {
    const rating = Number(candidate)
    if (Number.isFinite(rating) && rating > 0 && rating <= 10) return rating
  }
  return null
}

export function imdbVoteCountValue(value) {
  const candidates = [
    value?.title?.ratingsSummary?.voteCount,
    value?.title?.ratings_summary?.votes_count,
    value?.rating?.voteCount,
    value?.rating?.votesCount,
    value?.rating?.votes_count,
    value?.ratingsSummary?.voteCount,
    value?.ratings_summary?.votes_count,
    value?.voteCount,
    value?.votes_count,
  ]
  for (const candidate of candidates) {
    const count = Number(candidate)
    if (Number.isFinite(count) && count >= 0) return count
  }
  return null
}
