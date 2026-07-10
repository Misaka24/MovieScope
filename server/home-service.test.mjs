import assert from 'node:assert/strict'
import test from 'node:test'

import { hasChineseTitle, pickChineseTranslation, selectImdbHeroMovies } from './home-service.mjs'

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

test('中文标题识别并按简体地区优先选择 TMDB 译名', () => {
  assert.equal(hasChineseTitle('肖申克的救赎'), true)
  assert.equal(hasChineseTitle('प्रीतम और पेड्रो'), false)
  assert.equal(pickChineseTranslation([
    { iso_3166_1: 'TW', iso_639_1: 'zh', data: { title: '刺激1995' } },
    { iso_3166_1: 'CN', iso_639_1: 'zh', data: { title: '肖申克的救赎' } },
  ], 'movie'), '肖申克的救赎')
  assert.equal(pickChineseTranslation([
    { iso_3166_1: 'CN', iso_639_1: 'zh', data: { name: '' } },
  ], 'tv'), null)
})
