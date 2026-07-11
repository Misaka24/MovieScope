<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import GlobalHeader from "../components/global/GlobalHeader.vue";
import GlobalFooter from "../components/global/GlobalFooter.vue";
import CatalogPosterGrid from "../components/catalog/CatalogPosterGrid.vue";
import PageState from "../components/catalog/PageState.vue";
import PaginationBar from "../components/catalog/PaginationBar.vue";
import { useAsyncData } from "../composables/useAsyncData";
import { fetchBrowse, fetchPopularBySource } from "../services/catalog-api";
const route = useRoute(),
  router = useRouter(),
  preset = computed(() => String(route.params.preset)),
  page = computed(() => Number(route.query.page || 1)),
  source = computed<"tmdb" | "douban">(() =>
    route.query.source === "douban" ? "douban" : "tmdb",
  ),
  isPopular = computed(() =>
    ["popular-movies", "popular-tv"].includes(preset.value),
  ),
  key = computed(() => `${preset.value}:${page.value}:${source.value}`);
const { data, loading, error, reload } = useAsyncData(
  () =>
    isPopular.value
      ? fetchPopularBySource(
          preset.value === "popular-tv" ? "tv" : "movie",
          source.value,
          page.value,
        )
      : fetchBrowse(preset.value, page.value),
  [key],
);
function setPage(value: number) {
  router.push({
    query: {
      ...route.query,
      page: Math.max(1, Math.min(data.value?.totalPages || 1, value)),
    },
  });
}
function setSource(value: "tmdb" | "douban") {
  router.push({ query: { source: value, page: 1 } });
}
</script>
<template>
  <div class="min-h-screen bg-background text-on-surface">
    <GlobalHeader />
    <main
      class="mx-auto max-w-[1216px] px-4 pb-16 pt-[82px] md:px-8 2xl:max-w-[1480px]"
    >
      <PageState :loading="loading" :error="error" @retry="reload"
        ><template v-if="data"
          ><header class="mb-7 border-b border-white/10 pb-6">
            <div class="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p
                  class="text-xs font-black uppercase tracking-widest text-primary"
                >
                  MovieScope Charts
                </p>
                <h1 class="mt-2 text-3xl font-extrabold md:text-4xl">
                  {{
                    data.title ||
                    (preset === "popular-tv"
                      ? "&#28909;&#38376;&#21095;&#38598;"
                      : "&#28909;&#38376;&#30005;&#24433;")
                  }}
                </h1>
                <p class="mt-3 text-sm text-on-surface-variant">
                  {{
                    data.description ||
                    (source === "douban"
                      ? "&#35910;&#29923;&#36817;&#26399;&#28909;&#38376;&#27036;&#21333;"
                      : "TMDB &#28909;&#24230;&#27036;&#21333;")
                  }}
                </p>
              </div>
              <div v-if="isPopular" class="source-tabs">
                <button
                  :class="source === 'tmdb' ? 'active' : ''"
                  @click="setSource('tmdb')"
                >
                  TMDB</button
                ><button
                  :class="source === 'douban' ? 'active' : ''"
                  @click="setSource('douban')"
                >
                  &#35910;&#29923;
                </button>
              </div>
            </div>
          </header>
          <CatalogPosterGrid
            :items="data.results"
            :hide-rating="preset === 'upcoming'" /><PaginationBar
            v-if="source === 'tmdb'"
            :page="page"
            :total-pages="data.totalPages"
            :total-results="data.totalResults"
            label="&#37096;&#20316;&#21697;"
            @change="setPage" /></template
      ></PageState>
    </main>
    <GlobalFooter />
  </div>
</template>
<style scoped>
.source-tabs {
  display: flex;
  gap: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px;
}
.source-tabs button {
  border-radius: 999px;
  padding: 8px 18px;
  font-size: 12px;
  font-weight: 900;
  transition: 0.2s;
}
.source-tabs button.active {
  background: #f5c518;
  color: #111317;
  box-shadow: 0 5px 18px rgba(245, 197, 24, 0.18);
}
</style>
