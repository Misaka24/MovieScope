<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import GlobalHeader from "../components/global/GlobalHeader.vue";
import GlobalFooter from "../components/global/GlobalFooter.vue";
import CatalogPosterCard from "../components/catalog/CatalogPosterCard.vue";
import PageState from "../components/catalog/PageState.vue";
import { useAsyncData } from "../composables/useAsyncData";
import { fetchPerson } from "../services/catalog-api";
import { formatDate } from "../utils/format";
const route = useRoute(),
  id = computed(() => String(route.params.id)),
  tab = ref<"all" | "movie" | "tv">("all");
const { data, loading, error, reload } = useAsyncData(
  () => fetchPerson(id.value),
  [id],
);
const works = computed(() =>
  tab.value === "movie"
    ? data.value?.movieCredits || []
    : tab.value === "tv"
      ? data.value?.tvCredits || []
      : data.value?.credits || [],
);
const age = computed(() => {
  if (!data.value?.birthday) return null;
  const end = data.value.deathday ? new Date(data.value.deathday) : new Date();
  const birth = new Date(data.value.birthday);
  let value = end.getFullYear() - birth.getFullYear();
  if (
    end.getMonth() < birth.getMonth() ||
    (end.getMonth() === birth.getMonth() && end.getDate() < birth.getDate())
  )
    value--;
  return value;
});
</script>
<template>
  <div class="min-h-screen bg-background text-on-surface">
    <GlobalHeader />
    <main class="pb-24 pt-[50px]">
      <PageState :loading="loading" :error="error" @retry="reload"
        ><template v-if="data"
          ><section class="person-hero">
            <div class="person-glow"></div>
            <div
              class="relative mx-auto grid max-w-[1216px] gap-10 px-4 py-14 md:grid-cols-[300px_1fr] md:px-8"
            >
              <div class="group">
                <div
                  class="overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
                >
                  <img
                    :src="data.profile"
                    :alt="data.name"
                    class="aspect-[4/5] w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                </div>
                <div class="mt-4 grid grid-cols-2 gap-3">
                  <a
                    v-if="data.imdbUrl"
                    :href="data.imdbUrl"
                    target="_blank"
                    rel="noreferrer"
                    class="person-link"
                    ><span>在 IMDb 查看</span
                    ><span class="material-symbols-outlined">open_in_new</span></a
                  ><a
                    v-if="data.homepage"
                    :href="data.homepage"
                    target="_blank"
                    rel="noreferrer"
                    class="person-link"
                    ><span>官方网站</span
                    ><span class="material-symbols-outlined">open_in_new</span></a
                  >
                </div>
              </div>
              <div class="self-end">
                <p
                  class="text-xs font-black uppercase tracking-[.24em] text-primary"
                >
                  {{ data.department || "Film professional" }}
                </p>
                <h1 class="mt-3 text-5xl font-black md:text-7xl">
                  {{ data.name }}
                </h1>
                <p
                  v-if="data.alsoKnownAs.length"
                  class="mt-4 max-w-3xl text-sm leading-6 text-on-surface-variant"
                >
                  {{ data.alsoKnownAs.slice(0, 8).join(" ? ") }}
                </p>
                <div
                  class="mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4"
                >
                  <div class="stat">
                    <strong>{{ data.creditCount }}</strong
                    ><span>&#20851;&#32852;&#20316;&#21697;</span>
                  </div>
                  <div class="stat">
                    <strong>{{ data.movieCredits.length }}</strong
                    ><span>&#30005;&#24433;</span>
                  </div>
                  <div class="stat">
                    <strong>{{ data.tvCredits.length }}</strong
                    ><span>&#21095;&#38598;</span>
                  </div>
                  <div class="stat">
                    <strong>{{ age ?? "?" }}</strong
                    ><span>{{
                      data.deathday ? "&#20139;&#24180;" : "&#24180;&#40836;"
                    }}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <div class="mx-auto max-w-[1216px] px-4 md:px-8">
            <section class="mt-12 grid gap-8 lg:grid-cols-[1fr_300px]">
              <div>
                <h2 class="person-title">&#20154;&#29289;&#31616;&#20171;</h2>
                <p
                  class="mt-5 whitespace-pre-line text-[15px] leading-8 text-on-surface-variant"
                >
                  {{ data.biography }}
                </p>
              </div>
              <dl class="bio-card">
                <div>
                  <dt>&#20986;&#29983;&#26085;&#26399;</dt>
                  <dd>{{ formatDate(data.birthday) }}</dd>
                </div>
                <div v-if="data.deathday">
                  <dt>&#36893;&#19990;&#26085;&#26399;</dt>
                  <dd>{{ formatDate(data.deathday) }}</dd>
                </div>
                <div>
                  <dt>&#20986;&#29983;&#22320;</dt>
                  <dd>{{ data.placeOfBirth || "&#26242;&#26080;" }}</dd>
                </div>
                <div>
                  <dt>IMDb ID</dt>
                  <dd>{{ data.imdbId || "&#26242;&#26080;" }}</dd>
                </div>
              </dl>
            </section>
            <section v-if="data.images.length > 1" class="mt-16">
              <h2 class="person-title">&#20154;&#29289;&#24433;&#20687;</h2>
              <div class="mt-6 flex gap-4 overflow-x-auto pb-5">
                <a
                  v-for="picture in data.images"
                  :key="picture"
                  :href="picture"
                  target="_blank"
                  class="group w-40 flex-none overflow-hidden rounded-xl"
                  ><img
                    :src="picture"
                    class="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-110"
                /></a>
              </div>
            </section>
            <section class="mt-16">
              <div class="flex flex-wrap items-end justify-between gap-5">
                <div>
                  <h2 class="person-title">&#20851;&#32852;&#24433;&#35270;</h2>
                  <p class="mt-2 text-sm text-on-surface-variant">
                    按作品关注度排序，优先展示 IMDb 评分。
                  </p>
                </div>
                <div class="person-tabs">
                  <button
                    :class="tab === 'all' ? 'active' : ''"
                    @click="tab = 'all'"
                  >
                    &#20840;&#37096;</button
                  ><button
                    :class="tab === 'movie' ? 'active' : ''"
                    @click="tab = 'movie'"
                  >
                    &#30005;&#24433;</button
                  ><button
                    :class="tab === 'tv' ? 'active' : ''"
                    @click="tab = 'tv'"
                  >
                    &#21095;&#38598;
                  </button>
                </div>
              </div>
              <TransitionGroup
                name="work"
                tag="div"
                class="mt-7 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
                ><CatalogPosterCard
                  v-for="item in works"
                  :key="item.mediaType + item.id"
                  :item="item"
              /></TransitionGroup>
            </section></div></template
      ></PageState>
    </main>
    <GlobalFooter />
  </div>
</template>
<style scoped>
.person-hero {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(
      circle at 70% 25%,
      rgba(245, 197, 24, 0.1),
      transparent 38%
    ),
    linear-gradient(180deg, #181a1f, #111317);
}
.person-glow {
  position: absolute;
  left: 12%;
  top: 20%;
  width: 260px;
  height: 260px;
  border-radius: 999px;
  background: rgba(245, 197, 24, 0.08);
  filter: blur(90px);
}
.person-link {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  padding: 12px;
  font-size: 12px;
  font-weight: 900;
  transition: 0.25s;
  gap: 6px;
}
.person-link .material-symbols-outlined { font-size: 16px; }
.person-link:hover {
  background: #f5c518;
  color: #111317;
  transform: translateY(-2px);
}
.stat {
  display: flex;
  flex-direction: column;
  border-left: 2px solid rgba(245, 197, 24, 0.55);
  padding: 9px 13px;
  background: rgba(255, 255, 255, 0.025);
}
.stat strong {
  font-size: 24px;
  color: #f5c518;
}
.stat span {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.55);
}
.person-title {
  font-size: 25px;
  font-weight: 900;
}
.bio-card {
  display: grid;
  gap: 0;
  overflow: hidden;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.035);
}
.bio-card div {
  padding: 15px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.055);
}
.bio-card div:last-child {
  border: 0;
}
.bio-card dt {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}
.bio-card dd {
  margin-top: 5px;
  font-size: 13px;
  font-weight: 800;
}
.person-tabs {
  display: flex;
  gap: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px;
}
.person-tabs button {
  border-radius: 999px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 900;
  transition: 0.2s;
}
.person-tabs button.active {
  background: #f5c518;
  color: #111317;
}
.work-enter-active,
.work-leave-active {
  transition: 0.3s;
}
.work-enter-from,
.work-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
