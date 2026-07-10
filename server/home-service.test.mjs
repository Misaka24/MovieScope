import assert from 'node:assert/strict'
import test from 'node:test'

import { selectImdbHeroMovies } from './home-service.mjs'

function movie(sourceId, imdb, display = 'official', backdrop = '/hero.jpg') {
  return {
    sourceId,
    mediaType: 'movie',
    backdrop,
    ratings: { imdb, tmdb: 8.8 },
    ratingDisplay: { imdb: display },
  }
}

test('Hero 只选择 IMDb 官方评分项目并按影视 ID 去重', () => {
  const official = movie(1, 7.6)
  const selected = selectImdbHeroMovies([
    [official, movie(2, null, 'tmdb-fallback'), movie(3, 8.1, 'pending'), movie(4, 7.9, 'official', null)],
    [official, movie(5, 8.3)],
  ])

  assert.deepEqual(new Set(selected.map((item) => item.sourceId)), new Set([1, 5]))
  assert.ok(selected.every((item) => item.ratings.imdb != null))
  assert.ok(selected.every((item) => item.ratingDisplay.imdb === 'official'))
})
