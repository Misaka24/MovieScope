import { loadEnv } from "../server/env.mjs";
import { tmdb } from "../server/providers.mjs";

loadEnv();

const startedAt = performance.now();
const response = await tmdb(
  "/configuration",
  { deploymentProbe: Date.now() },
  1000,
);

if (!Array.isArray(response.images?.backdrop_sizes)) {
  throw new Error("TMDB configuration response is incomplete");
}

console.log(
  JSON.stringify({
    status: "ok",
    latencyMs: Math.round(performance.now() - startedAt),
    cache: response._cache,
  }),
);
