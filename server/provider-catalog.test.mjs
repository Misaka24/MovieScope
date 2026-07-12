import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("provider catalog migrates to TMDB and Just One only", async () => {
  const seed = await readFile("db/migrations/003_admin_console.mysql.sql", "utf8");
  const sync = await readFile("db/migrations/006_provider_catalog_sync.mysql.sql", "utf8");
  const providers = await readFile("server/providers.mjs", "utf8");

  assert.match(seed, /\('tmdb','TMDB'/);
  assert.match(seed, /\('justone','Just One API'/);
  assert.doesNotMatch(seed, /\('imdbapi-dev'/);
  assert.doesNotMatch(seed, /\('imdb','Just One API'/);
  assert.match(sync, /provider_key IN \('imdb', 'imdbapi-dev'\)/);
  assert.match(sync, /UPDATE api_cache SET provider = 'justone'/);
  assert.match(providers, /getProviderRuntime\("justone"/);
  assert.match(providers, /provider: "justone"/);
});
