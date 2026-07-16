import { loadEnv } from "../server/env.mjs";
import { getDatabase } from "../server/database.mjs";
import { tmdb } from "../server/providers.mjs";

loadEnv();

const startedAt = performance.now();
try {
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
} finally {
  const database = await getDatabase();
  await database.close();
}
