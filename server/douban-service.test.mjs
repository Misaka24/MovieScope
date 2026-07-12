import test from "node:test";
import assert from "node:assert/strict";
import { extractImdbIds, isStrictDoubanFallback } from "./douban-service.mjs";

test("从豆瓣详情的嵌套字段提取 IMDb ID", () => {
  assert.deepEqual(
    extractImdbIds({ info: { IMDb: "tt1234567" }, extra: ["imdb: TT7654321"] }),
    ["tt1234567", "tt7654321"],
  );
});

test("详情没有 IMDb 字段时允许严格标题年份回退", () => {
  assert.equal(
    isStrictDoubanFallback({
      candidate: { title: "霸王别姬", subtitle: "1993 / 中国大陆", score: 1.25 },
      detail: { title: "霸王别姬", year: "1993", type: "movie" },
      title: "霸王别姬",
      originalTitle: "Farewell My Concubine",
      year: 1993,
      mediaType: "movie",
    }),
    true,
  );
});

test("IMDb 冲突或年份不符时拒绝标题回退", () => {
  const base = {
    candidate: { title: "同名电影", subtitle: "2020", score: 1.25 },
    title: "同名电影",
    originalTitle: "Same Name",
    year: 2020,
    mediaType: "movie",
  };
  assert.equal(
    isStrictDoubanFallback({ ...base, detail: { title: "同名电影", year: 2020, imdb: "tt9999999" } }),
    false,
  );
  assert.equal(
    isStrictDoubanFallback({ ...base, detail: { title: "同名电影", year: 2010 } }),
    false,
  );
});
