import test from 'node:test'
import assert from 'node:assert/strict'
import { imdbRatingValue, imdbTitleId, imdbVoteCountValue } from './imdb-rating.mjs'

test('兼容 imdbapi.dev 新旧评分字段', () => {
  assert.equal(imdbRatingValue({ rating: { aggregateRating: 8.7, voteCount: 1200 } }), 8.7)
  assert.equal(imdbRatingValue({ rating: { aggregate_rating: 8.6, votes_count: 1100 } }), 8.6)
  assert.equal(imdbRatingValue({ ratingsSummary: { aggregateRating: 8.5, voteCount: 1000 } }), 8.5)
  assert.equal(imdbRatingValue({ ratings_summary: { aggregate_rating: 8.4, votes_count: 900 } }), 8.4)
})

test('兼容 IMDb ID 与评分人数命名', () => {
  assert.equal(imdbTitleId({ title_id: 'tt1234567' }), 'tt1234567')
  assert.equal(imdbTitleId({ titleId: 'tt7654321' }), 'tt7654321')
  assert.equal(imdbVoteCountValue({ rating: { votes_count: 12345 } }), 12345)
  assert.equal(imdbVoteCountValue({ ratingsSummary: { voteCount: 54321 } }), 54321)
})

test('拒绝无效 IMDb 评分', () => {
  assert.equal(imdbRatingValue({ rating: { aggregateRating: 0 } }), null)
  assert.equal(imdbRatingValue({ rating: { aggregateRating: 11 } }), null)
  assert.equal(imdbRatingValue(null), null)
})
