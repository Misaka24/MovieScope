<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import GlobalHeader from "../components/global/GlobalHeader.vue";
import GlobalFooter from "../components/global/GlobalFooter.vue";
import CatalogPosterCard from "../components/catalog/CatalogPosterCard.vue";
import PageState from "../components/catalog/PageState.vue";
import { useAsyncData } from "../composables/useAsyncData";
import {
  fetchDoubanReviewDetail,
  fetchExternalReviews,
  fetchTitle,
} from "../services/catalog-api";
import type { ExternalReviewsData } from "../types/catalog";
import {
  formatCount,
  formatDate,
  formatMoney,
  formatRuntime,
} from "../utils/format";
import { useAuth } from "../composables/useAuth";
import { mediaApi, type MediaEntry } from "../services/user-api";
const route = useRoute(),
  router = useRouter(),
  auth = useAuth(),
  type = computed(() => String(route.params.type)),
  id = computed(() => String(route.params.id)),
  key = computed(() => type.value + ":" + id.value);
const { data, loading, error, reload } = useAsyncData(
  () => fetchTitle(type.value, id.value),
  [key],
);
const moreDetails = ref(false),
  playingTrailer = ref(false),
  hoveredRating = ref(0),
  audienceSource = ref<"imdb" | "douban">("imdb"),
  audienceSort = ref<"hot" | "time">("hot"),
  audienceSpoiler = ref<"all" | "exclude" | "only">("all"),
  audienceVisible = ref(5),
  communitySort = ref<"hot" | "time">("hot"),
  communitySpoiler = ref<"all" | "exclude" | "only">("all"),
  communityVisible = ref(5),
  criticsVisible = ref(5),
  externalLoading = ref(false),
  externalReviews = ref<ExternalReviewsData | null>(null),
  userRating = ref(0),
  watchState = ref(""),
  favorite = ref(false),
  reviewText = ref(""),
  containsSpoiler = ref(false),
  interactionNotice = ref(""),
  communityReviews = ref<MediaEntry[]>([]);
const loadingReviewIds = ref(new Set<string>());
const cast = computed(() => data.value?.credits.cast.slice(0, 12) || []);
const images = computed(() => data.value?.images.slice(0, 6) || []);
const trailer = computed(
  () =>
    data.value?.videos.find((v) => v.type === "Trailer" && v.official) ||
    data.value?.videos.find((v) => v.type === "Trailer") ||
    data.value?.videos[0],
);
const trailerEmbed = computed(() => {
  const video = trailer.value;
  if (!video) return null;
  if (video.site === "YouTube")
    return `https://www.youtube-nocookie.com/embed/${video.key}?autoplay=1&rel=0`;
  if (video.site === "Vimeo")
    return `https://player.vimeo.com/video/${video.key}?autoplay=1`;
  return video.url;
});
const ratingPreview = computed(() => hoveredRating.value || userRating.value);
const allAudienceItems = computed(() => {
  const items = [
    ...(externalReviews.value?.audience[audienceSource.value].items || []),
  ].filter(
    (item) =>
      audienceSpoiler.value === "all" ||
      (audienceSpoiler.value === "only" ? item.spoiler : !item.spoiler),
  );
  return items.sort((a, b) =>
    audienceSort.value === "time"
      ? String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
      : b.hotScore - a.hotScore ||
        String(b.createdAt || "").localeCompare(String(a.createdAt || "")),
  );
});
const audienceItems = computed(() =>
  allAudienceItems.value.slice(0, audienceVisible.value),
);
const criticItems = computed(
  () =>
    externalReviews.value?.critics.items.slice(0, criticsVisible.value) || [],
);
const imdbReviewsUrl = computed(() =>
  data.value?.imdbId
    ? `https://www.imdb.com/title/${data.value.imdbId}/reviews/`
    : null,
);
const imdbCriticsUrl = computed(
  () =>
    externalReviews.value?.critics.url ||
    (data.value?.imdbId
      ? `https://www.imdb.com/title/${data.value.imdbId}/externalreviews/`
      : null),
);
const boxOfficeMetrics = computed(() => {
  const source = externalReviews.value?.boxOffice.data as
    Record<string, any> | null | undefined;
  if (!source) return [];
  const rows: Array<{ label: string; value: string }> = [];
  const walk = (value: any, label = "") => {
    if (rows.length >= 8 || value == null) return;
    if (typeof value === "number" || typeof value === "string") {
      if (label && String(value).trim())
        rows.push({
          label,
          value: typeof value === "number" ? formatMoney(value) : String(value),
        });
      return;
    }
    if (typeof value === "object")
      for (const [key, child] of Object.entries(value))
        walk(child, key.replace(/([A-Z])/g, " $1").replace(/_/g, " "));
  };
  walk(source);
  return rows;
});
const chartRankingItems = computed(
  () => externalReviews.value?.chartRankings.items || [],
);
const allCommunityReviews = computed(() =>
  [...communityReviews.value]
    .filter(
      (item) =>
        communitySpoiler.value === "all" ||
        (communitySpoiler.value === "only"
          ? item.containsSpoiler
          : !item.containsSpoiler),
    )
    .sort((a, b) =>
      communitySort.value === "time"
        ? String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""))
        : Number(b.rating || 0) - Number(a.rating || 0) ||
          String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")),
    ),
);
const visibleCommunityReviews = computed(() =>
  allCommunityReviews.value.slice(0, communityVisible.value),
);
const directors = computed(
  () =>
    data.value?.credits.crew.filter((person) => person.job === "Director") ||
    [],
);
const writers = computed(
  () =>
    data.value?.credits.crew.filter((person) =>
      ["Writer", "Screenplay", "Story", "Teleplay", "Creator"].includes(
        person.job || "",
      ),
    ) || [],
);
const related = computed(() =>
  (data.value?.recommendations.length
    ? data.value.recommendations
    : data.value?.similar || []
  ).slice(0, 6),
);
const countryNames: Record<string, string> = {
  CN: "中国大陆",
  US: "美国",
  GB: "英国",
  JP: "日本",
  KR: "韩国",
  FR: "法国",
  DE: "德国",
  CA: "加拿大",
  HK: "中国香港",
  TW: "中国台湾",
};
const statusNames: Record<string, string> = {
  Released: "已上映",
  "Post Production": "后期制作",
  "In Production": "制作中",
  Planned: "已计划",
  Canceled: "已取消",
  Returning: "连载中",
  Ended: "已完结",
};
const countries = computed(
  () =>
    data.value?.originCountries
      .map((code) => countryNames[code] || code)
      .join("、") || "暂无",
);
const statusText = computed(
  () => statusNames[data.value?.status || ""] || data.value?.status || "暂无",
);
async function loadInteraction() {
  if (!data.value) return;
  try {
    communityReviews.value = await mediaApi.reviews(
      data.value.mediaType,
      data.value.id,
    );
  } catch {
    communityReviews.value = [];
  }
  if (!auth.user.value) {
    watchState.value = "";
    userRating.value = 0;
    favorite.value = false;
    reviewText.value = "";
    return;
  }
  try {
    const entry = await mediaApi.get(data.value.mediaType, data.value.id);
    watchState.value = entry?.watchStatus || "";
    userRating.value = entry?.rating || 0;
    favorite.value = entry?.favorite || false;
    reviewText.value = entry?.reviewText || "";
    containsSpoiler.value = entry?.containsSpoiler || false;
  } catch {}
}
watch(key, () => {
  playingTrailer.value = false;
  externalReviews.value = null;
  audienceVisible.value = 5;
  criticsVisible.value = 5;
});
watch([audienceSource, audienceSort, audienceSpoiler], () => {
  audienceVisible.value = 5;
});
watch([communitySort, communitySpoiler], () => {
  communityVisible.value = 5;
});
watch(
  () => data.value?.id,
  (value) => {
    if (value) void loadExternalReviews();
  },
);
watch([key, () => data.value?.id, () => auth.user.value?.id], loadInteraction, {
  immediate: true,
});
function requireLogin() {
  if (auth.user.value) return true;
  router.push({
    name: "auth",
    query: { mode: "login", redirect: route.fullPath },
  });
  return false;
}
async function saveInteraction(patch: Record<string, unknown> = {}) {
  if (!data.value || !requireLogin()) return;
  const body = {
    imdbId: data.value.imdbId,
    title: data.value.title,
    posterUrl: data.value.poster,
    releaseYear: data.value.year,
    genres: data.value.genres,
    originalLanguage: data.value.originalLanguage,
    originCountry: data.value.originCountries?.[0] || null,
    watchStatus: watchState.value || null,
    favorite: favorite.value,
    rating: userRating.value || null,
    reviewText: reviewText.value || null,
    containsSpoiler: containsSpoiler.value,
    ...patch,
  };
  const entry = await mediaApi.save(data.value.mediaType, data.value.id, body);
  watchState.value = entry.watchStatus || "";
  userRating.value = entry.rating || 0;
  favorite.value = entry.favorite;
  reviewText.value = entry.reviewText || "";
  containsSpoiler.value = entry.containsSpoiler;
  interactionNotice.value = "已保存到个人主页";
  communityReviews.value = await mediaApi.reviews(
    data.value.mediaType,
    data.value.id,
  );
  setTimeout(() => (interactionNotice.value = ""), 1800);
}
async function setWatch(value: string) {
  if (!requireLogin()) return;
  watchState.value = watchState.value === value ? "" : value;
  await saveInteraction();
}
async function loadExternalReviews() {
  if (!data.value || externalLoading.value || externalReviews.value) return;
  externalLoading.value = true;
  try {
    externalReviews.value = await fetchExternalReviews(
      data.value.mediaType,
      data.value.id,
    );
  } finally {
    externalLoading.value = false;
  }
}
async function rate(value: number) {
  if (!requireLogin()) return;
  userRating.value = value;
  await saveInteraction();
}
async function toggleFavorite() {
  if (!requireLogin()) return;
  favorite.value = !favorite.value;
  await saveInteraction();
}
async function saveReview() {
  await saveInteraction();
}
async function loadFullReview(
  review: ExternalReviewsData["audience"]["douban"]["items"][number],
  event: Event,
) {
  if (
    !(event.currentTarget as HTMLDetailsElement).open ||
    review.kind !== "review" ||
    loadingReviewIds.value.has(review.id)
  )
    return;
  loadingReviewIds.value.add(review.id);
  loadingReviewIds.value = new Set(loadingReviewIds.value);
  try {
    const detail = await fetchDoubanReviewDetail(review.id);
    review.content = detail.content || review.content;
    review.forwardCount = detail.forwardCount;
    review.collectCount = detail.collectCount;
    review.replyCount = detail.replyCount;
  } finally {
    loadingReviewIds.value.delete(review.id);
    loadingReviewIds.value = new Set(loadingReviewIds.value);
  }
}
</script>

<template>
  <div class="min-h-screen bg-background text-on-surface">
    <GlobalHeader />
    <PageState :loading="loading" :error="error" @retry="reload"
      ><template v-if="data"
        ><main class="pb-16 pt-[50px]">
          <section
            class="relative h-[calc(100vh-50px)] min-h-[680px] w-full overflow-hidden"
          >
            <template v-if="playingTrailer && trailerEmbed">
              <iframe
                :src="trailerEmbed"
                :title="trailer?.name || data.title + '预告片'"
                class="absolute inset-0 h-full w-full bg-black"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowfullscreen
              ></iframe>
              <button
                class="absolute right-5 top-5 z-20 flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-sm font-bold backdrop-blur hover:bg-black"
                @click="playingTrailer = false"
              >
                <span class="material-symbols-outlined">close</span>退出预告片
              </button>
            </template>
            <template v-else>
              <img
                :src="data.backdrop || data.images[0]?.path || data.poster"
                :alt="data.title + '横向背景'"
                class="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-[10000ms] hover:scale-105"
              />
              <div
                class="absolute inset-0 bg-gradient-to-r from-background/95 via-background/45 to-transparent"
              ></div>
              <div
                class="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-black/20"
              ></div>
              <div
                class="relative mx-auto flex h-full max-w-[1216px] flex-col justify-end px-4 pb-12 md:px-8"
              >
                <div class="grid grid-cols-12 items-end gap-6">
                  <div class="col-span-3 hidden md:block lg:col-span-2">
                    <div
                      class="aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-surface-container shadow-2xl"
                    >
                      <img
                        :src="data.poster"
                        :alt="data.title"
                        class="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                    </div>
                  </div>
                  <div class="col-span-12 md:col-span-9 lg:col-span-10">
                    <div
                      class="mb-4 flex flex-wrap items-center gap-3 text-sm text-on-surface-variant"
                    >
                      <span
                        class="rounded bg-primary-container/20 px-2.5 py-0.5 text-xs font-bold tracking-wider text-primary"
                        >{{ data.certification || "未分级" }}</span
                      ><span>{{ formatDate(data.releaseDate) }}</span
                      ><span
                        class="h-1 w-1 rounded-full bg-on-surface-variant"
                      ></span
                      ><span>{{ formatRuntime(data.runtime) }}</span>
                    </div>
                    <h1
                      class="text-4xl font-extrabold tracking-tight md:text-6xl"
                    >
                      {{ data.title }}
                    </h1>
                    <p
                      v-if="
                        data.originalTitle && data.originalTitle !== data.title
                      "
                      class="mt-2 text-xl font-medium text-on-surface-variant md:text-2xl"
                    >
                      {{ data.originalTitle }}
                    </p>
                    <blockquote
                      v-if="data.tagline"
                      class="mt-4 max-w-2xl border-l-2 border-primary/70 pl-4 text-sm italic text-on-surface-variant"
                    >
                      “{{ data.tagline }}”
                    </blockquote>
                    <div class="mt-6 flex flex-wrap items-center gap-4">
                      <div class="flex flex-wrap gap-2">
                        <RouterLink
                          v-for="genre in data.genres"
                          :key="genre"
                          :to="{
                            name: 'search',
                            query: { q: genre, type: data.mediaType },
                          }"
                          class="rounded-full border border-white/5 bg-surface-container-highest/50 px-3 py-1 text-xs transition-colors hover:border-primary/40 hover:text-primary"
                          >{{ genre }}</RouterLink
                        >
                      </div>
                      <div
                        class="mx-2 hidden h-6 w-px bg-white/10 sm:block"
                      ></div>
                      <button
                        class="detail-action bg-primary-container text-on-primary-container hover:bg-primary"
                        :class="
                          watchState === 'want' ? 'ring-2 ring-primary/70' : ''
                        "
                        @click="setWatch('want')"
                      >
                        <span class="material-symbols-outlined">{{
                          watchState === "want" ? "check" : "add"
                        }}</span
                        >{{ watchState === "want" ? "已想看" : "想看" }}</button
                      ><button
                        v-if="trailer"
                        class="detail-action border border-white/10 bg-white/10 hover:bg-white/20"
                        @click="playingTrailer = true"
                      >
                        <span class="material-symbols-outlined">play_arrow</span
                        >播放预告片</button
                      ><button
                        class="detail-action border border-white/5 bg-white/5 hover:bg-white/10"
                        :class="
                          watchState === 'watching'
                            ? 'ring-2 ring-primary/70'
                            : ''
                        "
                        @click="setWatch('watching')"
                      >
                        <span class="material-symbols-outlined"
                          >play_circle</span
                        >{{
                          watchState === "watching" ? "正在看" : "在看"
                        }}</button
                      ><button
                        class="detail-action border border-white/5 bg-white/5 hover:bg-white/10"
                        :class="
                          watchState === 'watched'
                            ? 'ring-2 ring-primary/70'
                            : ''
                        "
                        @click="setWatch('watched')"
                      >
                        <span class="material-symbols-outlined">visibility</span
                        >{{
                          watchState === "watched" ? "已看过" : "看过"
                        }}</button
                      ><button
                        class="detail-action border border-white/5 bg-white/5 hover:bg-white/10"
                        :class="
                          favorite ? 'ring-2 ring-primary/70 text-primary' : ''
                        "
                        @click="toggleFavorite"
                      >
                        <span class="material-symbols-outlined">{{
                          favorite ? "favorite" : "favorite_border"
                        }}</span
                        >{{ favorite ? "已收藏" : "收藏" }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </section>
          <section class="mx-auto max-w-[1216px] px-4 pb-24 pt-20 md:px-8">
            <div class="grid grid-cols-1 gap-12 lg:grid-cols-12">
              <div class="min-w-0 space-y-12 lg:col-span-8">
                <section>
                  <h2 class="section-title">剧情简介<span></span></h2>
                  <p
                    class="text-lg leading-relaxed tracking-wide text-on-surface-variant"
                  >
                    {{ data.overview || "暂无中文剧情简介。" }}
                  </p>
                </section>
                <section v-if="data.credits.cast.length">
                  <div class="mb-6 flex items-end justify-between">
                    <h2 class="text-2xl font-bold">演职员表</h2>
                    <RouterLink
                      :to="{
                        name: 'title-credits',
                        params: { type: data.mediaType, id: data.id },
                      }"
                      class="text-sm font-bold text-primary hover:underline"
                      >查看完整演职员表</RouterLink
                    >
                  </div>
                  <div
                    class="cast-strip -mx-4 flex gap-6 overflow-x-auto px-4 pb-5"
                  >
                    <RouterLink
                      v-for="person in cast"
                      :key="person.id"
                      :to="{ name: 'person', params: { id: person.id } }"
                      class="group w-36 flex-shrink-0"
                      ><div
                        class="mb-3 aspect-[4/5] overflow-hidden rounded-xl bg-surface-container"
                      >
                        <img
                          :src="person.profile"
                          :alt="person.name"
                          class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                      <p
                        class="truncate text-sm font-bold transition-colors group-hover:text-primary"
                      >
                        {{ person.name }}
                      </p>
                      <p
                        v-if="person.character"
                        class="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-primary/90"
                      >
                        <span
                          class="mr-1 text-[10px] font-black tracking-wider text-on-surface-variant"
                          >&#39280;&#28436;</span
                        >{{ person.character }}
                      </p>
                      <p
                        v-else
                        class="truncate text-xs text-on-surface-variant"
                      >
                        {{ person.character || person.job || "演职人员" }}
                      </p></RouterLink
                    >
                  </div>
                </section>
                <section v-if="data.images.length">
                  <div class="mb-6 flex items-end justify-between">
                    <h2 class="text-2xl font-bold">剧照与图片</h2>
                    <RouterLink
                      :to="{
                        name: 'title-images',
                        params: { type: data.mediaType, id: data.id },
                      }"
                      class="text-sm font-bold text-primary hover:underline"
                      >查看全部 {{ data.images.length }} 张</RouterLink
                    >
                  </div>
                  <div class="grid grid-cols-2 gap-3 md:grid-cols-3">
                    <a
                      v-for="picture in images"
                      :key="picture.path"
                      :href="picture.path"
                      target="_blank"
                      class="group overflow-hidden rounded-xl bg-surface-container"
                      ><img
                        :src="picture.path"
                        :alt="data.title + '剧照'"
                        class="aspect-video h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    /></a>
                  </div>
                </section>
                <section class="pt-16">
                  <h2 class="section-title">影评与评价<span></span></h2>
                  <div
                    v-if="externalLoading"
                    class="rounded-xl border border-white/5 bg-surface-container p-5 text-sm text-on-surface-variant"
                  >
                    正在读取缓存中的外部评价…
                  </div>
                </section>
                <section v-if="communityReviews.length">
                  <div class="mb-6 grid gap-4 sm:grid-cols-2">
                    <div class="review-control">
                      <span>&#25490;&#24207;&#26041;&#24335;</span>
                      <div>
                        <button
                          class="review-filter"
                          :class="communitySort === 'hot' ? 'active' : ''"
                          @click="communitySort = 'hot'"
                        >
                          &#28909;&#24230;</button
                        ><button
                          class="review-filter"
                          :class="communitySort === 'time' ? 'active' : ''"
                          @click="communitySort = 'time'"
                        >
                          &#26102;&#38388;
                        </button>
                      </div>
                    </div>
                    <div class="review-control">
                      <span>&#21095;&#36879;&#31579;&#36873;</span>
                      <div>
                        <button
                          class="review-filter"
                          :class="communitySpoiler === 'all' ? 'active' : ''"
                          @click="communitySpoiler = 'all'"
                        >
                          &#20840;&#37096;</button
                        ><button
                          class="review-filter"
                          :class="
                            communitySpoiler === 'exclude' ? 'active' : ''
                          "
                          @click="communitySpoiler = 'exclude'"
                        >
                          &#19981;&#21547;&#21095;&#36879;</button
                        ><button
                          class="review-filter"
                          :class="communitySpoiler === 'only' ? 'active' : ''"
                          @click="communitySpoiler = 'only'"
                        >
                          &#20165;&#21095;&#36879;
                        </button>
                      </div>
                    </div>
                  </div>
                  <h2 class="section-title">本站的影评<span></span></h2>
                  <div class="space-y-5">
                    <article
                      v-for="entry in visibleCommunityReviews"
                      :key="entry.id"
                      class="border-b border-white/5 pb-5"
                    >
                      <div class="flex items-center justify-between gap-4">
                        <RouterLink
                          :to="{
                            name: 'public-profile',
                            params: { username: entry.user?.username },
                          }"
                          class="flex items-center gap-3 font-bold hover:text-primary"
                          ><img
                            :src="entry.user?.avatarUrl"
                            class="h-8 w-8 rounded-full object-cover"
                          />{{ entry.user?.displayName }}</RouterLink
                        ><strong v-if="entry.rating" class="text-primary"
                          >{{ entry.rating }} / 10</strong
                        >
                      </div>
                      <p
                        v-if="entry.containsSpoiler"
                        class="mt-3 text-xs font-bold text-red-300"
                      >
                        含剧透
                      </p>
                      <p
                        class="mt-2 whitespace-pre-line text-sm leading-6 text-on-surface-variant"
                      >
                        {{ entry.reviewText }}
                      </p>
                      <time class="mt-3 block text-xs text-outline">{{
                        formatDate(entry.updatedAt)
                      }}</time>
                    </article>
                  </div>
                  <button
                    v-if="communityVisible < allCommunityReviews.length"
                    class="load-more-button"
                    @click="communityVisible += 5"
                  >
                    &#26597;&#30475;&#26356;&#22810;&#26412;&#31449;&#30701;&#35780;&#65288;{{
                      allCommunityReviews.length - communityVisible
                    }}&#65289;
                  </button>
                </section>
                <section v-if="data.reviews.length">
                  <h2 class="section-title">TMDB 用户评论<span></span></h2>
                  <div class="space-y-5">
                    <article
                      v-for="review in data.reviews"
                      :key="review.id"
                      class="border-b border-white/5 pb-5"
                    >
                      <div class="flex justify-between">
                        <b>{{ review.author }}</b
                        ><strong v-if="review.rating" class="text-primary"
                          >{{ review.rating }} / 10</strong
                        >
                      </div>
                      <p
                        class="mt-3 line-clamp-5 whitespace-pre-line text-sm leading-6 text-on-surface-variant"
                      >
                        {{ review.content }}
                      </p>
                      <time class="mt-3 block text-xs text-outline">{{
                        formatDate(review.createdAt)
                      }}</time>
                    </article>
                  </div>
                </section>
                <section v-if="externalReviews">
                  <h2 class="section-title">影迷评价<span></span></h2>
                  <div class="mb-6 grid gap-4 sm:grid-cols-3">
                    <div class="review-control">
                      <span>评论平台</span>
                      <div>
                        <button
                          class="review-filter"
                          :class="audienceSource === 'imdb' ? 'active' : ''"
                          @click="audienceSource = 'imdb'"
                        >
                          IMDb</button
                        ><button
                          class="review-filter"
                          :class="audienceSource === 'douban' ? 'active' : ''"
                          @click="audienceSource = 'douban'"
                        >
                          豆瓣
                        </button>
                      </div>
                    </div>
                    <div class="review-control">
                      <span>&#21095;&#36879;&#31579;&#36873;</span>
                      <div>
                        <button
                          class="review-filter"
                          :class="audienceSpoiler === 'all' ? 'active' : ''"
                          @click="audienceSpoiler = 'all'"
                        >
                          &#20840;&#37096;
                        </button>
                        <button
                          class="review-filter"
                          :class="audienceSpoiler === 'exclude' ? 'active' : ''"
                          @click="audienceSpoiler = 'exclude'"
                        >
                          &#19981;&#21547;&#21095;&#36879;
                        </button>
                        <button
                          class="review-filter"
                          :class="audienceSpoiler === 'only' ? 'active' : ''"
                          @click="audienceSpoiler = 'only'"
                        >
                          &#20165;&#21095;&#36879;
                        </button>
                      </div>
                    </div>
                    <div class="review-control">
                      <span>排序方式</span>
                      <div>
                        <button
                          class="review-filter"
                          :class="audienceSort === 'hot' ? 'active' : ''"
                          @click="audienceSort = 'hot'"
                        >
                          热度</button
                        ><button
                          class="review-filter"
                          :class="audienceSort === 'time' ? 'active' : ''"
                          @click="audienceSort = 'time'"
                        >
                          时间
                        </button>
                      </div>
                    </div>
                  </div>
                  <div v-if="audienceItems.length" class="space-y-5">
                    <article
                      v-for="review in audienceItems"
                      :key="review.platform + ':' + review.id"
                      class="review-card"
                    >
                      <div
                        class="flex flex-wrap items-start justify-between gap-4"
                      >
                        <div class="flex items-center gap-3">
                          <img
                            v-if="review.avatar"
                            :src="review.avatar"
                            class="h-10 w-10 rounded-full object-cover"
                          />
                          <div
                            v-else
                            class="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-highest font-bold text-primary"
                          >
                            {{ review.author.slice(0, 1).toUpperCase() }}
                          </div>
                          <div>
                            <b>{{ review.author }}</b>
                            <p class="text-xs text-on-surface-variant">
                              {{ review.platform
                              }}<template v-if="review.kind">
                                ·
                                {{
                                  review.kind === "review" ? "长篇影评" : "短评"
                                }}</template
                              ><template v-if="review.location">
                                · {{ review.location }}</template
                              ><template v-if="review.createdAt">
                                · {{ formatDate(review.createdAt) }}</template
                              >
                            </p>
                          </div>
                        </div>
                        <strong v-if="review.rating" class="text-primary"
                          >{{ review.rating }} / 10</strong
                        >
                      </div>
                      <h3 v-if="review.title" class="mt-4 font-bold">
                        {{ review.title }}
                      </h3>
                      <details
                        class="review-text mt-3"
                        @toggle="loadFullReview(review, $event)"
                      >
                        <summary class="cursor-pointer text-sm text-primary">
                          展开完整评价
                        </summary>
                        <p
                          class="mt-3 whitespace-pre-line text-sm leading-7 text-on-surface-variant"
                        >
                          {{ review.content }}
                        </p>
                      </details>
                      <div
                        class="mt-4 flex flex-wrap gap-4 text-xs text-on-surface-variant"
                      >
                        <span
                          v-if="
                            review.kind !== 'review' && review.upVotes != null
                          "
                          >👍 {{ formatCount(review.upVotes) }}</span
                        ><span v-if="review.downVotes != null"
                          >👎 {{ formatCount(review.downVotes) }}</span
                        ><span v-if="review.replyCount != null"
                          >回复 {{ formatCount(review.replyCount) }}</span
                        ><span v-if="review.forwardCount != null"
                          >转发 {{ formatCount(review.forwardCount) }}</span
                        ><span v-if="review.collectCount != null"
                          >收藏 {{ formatCount(review.collectCount) }}</span
                        ><span v-if="review.helpfulness != null"
                          >有用度
                          {{ Math.round(review.helpfulness * 100) }}%</span
                        ><span v-if="review.spoiler" class="text-red-300"
                          >含剧透</span
                        >
                      </div>
                    </article>
                  </div>
                  <div
                    v-else
                    class="rounded-xl border border-white/5 bg-surface-container p-5 text-sm text-on-surface-variant"
                  >
                    {{
                      externalReviews.audience[audienceSource].message ||
                      "暂无该来源评价数据"
                    }}
                  </div>
                  <button
                    v-if="audienceVisible < allAudienceItems.length"
                    class="load-more-button"
                    @click="audienceVisible += 5"
                  >
                    查看更多评价（{{
                      allAudienceItems.length - audienceVisible
                    }}）
                  </button>
                  <a
                    v-else-if="audienceSource === 'imdb' && imdbReviewsUrl"
                    :href="imdbReviewsUrl"
                    target="_blank"
                    rel="noreferrer"
                    class="load-more-button block text-center"
                    >&#22312; IMDb
                    &#26597;&#30475;&#26356;&#22810;&#29992;&#25143;&#35780;&#20215;
                    ?</a
                  >
                </section>
                <section v-if="externalReviews?.critics.items.length">
                  <div class="mb-6 flex items-end justify-between">
                    <h2 class="section-title !mb-0">影评人评论<span></span></h2>
                    <div class="text-right">
                      <strong class="text-2xl text-primary">{{
                        externalReviews.critics.score ?? "—"
                      }}</strong>
                      <p class="text-xs text-on-surface-variant">
                        Metacritic ·
                        {{ externalReviews.critics.reviewCount }} 篇
                      </p>
                    </div>
                  </div>
                  <div class="space-y-4">
                    <article
                      v-for="(review, index) in criticItems"
                      :key="index"
                      class="review-card"
                    >
                      <div class="flex justify-between gap-4">
                        <div>
                          <b>{{ review.site || "专业媒体" }}</b>
                          <p class="text-xs text-on-surface-variant">
                            {{ review.reviewer || "署名影评人" }}
                          </p>
                        </div>
                        <strong v-if="review.score != null" class="text-primary"
                          >{{ review.score }} / 100</strong
                        >
                      </div>
                      <blockquote
                        class="mt-4 border-l-2 border-primary/60 pl-4 text-sm italic leading-7 text-on-surface-variant"
                      >
                        {{ review.quote }}
                      </blockquote>
                      <a
                        v-if="review.url"
                        :href="review.url"
                        target="_blank"
                        rel="noreferrer"
                        class="mt-3 inline-flex text-xs font-bold text-primary"
                        >阅读来源 ↗</a
                      >
                    </article>
                  </div>
                  <button
                    v-if="criticsVisible < externalReviews.critics.items.length"
                    class="load-more-button"
                    @click="criticsVisible += 5"
                  >
                    查看更多影评人评论（{{
                      externalReviews.critics.items.length - criticsVisible
                    }}）
                  </button>
                  <a
                    v-else-if="imdbCriticsUrl"
                    :href="imdbCriticsUrl"
                    target="_blank"
                    rel="noreferrer"
                    class="load-more-button block text-center"
                    >&#22312; IMDb
                    &#26597;&#30475;&#26356;&#22810;&#24433;&#35780;&#20154;&#35780;&#35770;
                    ?</a
                  >
                </section>
                <section v-if="related.length">
                  <h2 class="section-title">
                    相似{{ data.mediaType === "tv" ? "剧集" : "电影" }}推荐<span
                    ></span>
                  </h2>
                  <div
                    class="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6"
                  >
                    <CatalogPosterCard
                      v-for="item in related"
                      :key="item.id"
                      :item="item"
                    />
                  </div>
                </section>
              </div>
              <aside class="min-w-0 space-y-8 lg:col-span-4">
                <section
                  class="space-y-6 rounded-2xl border border-white/5 bg-surface-container p-6"
                >
                  <h3 class="panel-title">媒体口碑</h3>
                  <a
                    v-if="data.imdbUrl"
                    :href="data.imdbUrl"
                    target="_blank"
                    class="group flex items-center justify-between"
                    ><div class="flex items-center gap-4">
                      <div
                        class="flex h-10 w-10 items-center justify-center rounded bg-[#F5C518] text-xs font-bold text-black"
                      >
                        IMDb
                      </div>
                      <div>
                        <div>
                          <strong class="text-xl">{{
                            data.imdbRating?.toFixed(1) || "暂无"
                          }}</strong
                          ><span class="text-xs text-on-surface-variant">
                            /10</span
                          >
                        </div>
                        <p
                          class="text-[10px] uppercase tracking-wider text-on-surface-variant"
                        >
                          {{ formatCount(data.imdbVoteCount) }} 人评分
                        </p>
                      </div>
                    </div>
                    <span
                      class="material-symbols-outlined text-on-surface-variant group-hover:text-primary"
                      >open_in_new</span
                    ></a
                  >
                  <p v-else class="text-sm text-on-surface-variant">
                    IMDb 暂未收录评分
                  </p>

                  <div
                    class="flex items-center justify-between border-t border-white/5 pt-5"
                  >
                    <div class="flex items-center gap-4">
                      <div
                        class="flex h-10 w-10 items-center justify-center rounded bg-[#00B51D] text-xs font-bold text-white"
                      >
                        豆瓣
                      </div>
                      <div>
                        <div>
                          <strong class="text-xl">{{
                            externalReviews?.doubanRating?.value?.toFixed(1) ||
                            "暂无"
                          }}</strong
                          ><span class="text-xs text-on-surface-variant">
                            /10</span
                          >
                        </div>
                        <p
                          class="text-[10px] uppercase tracking-wider text-on-surface-variant"
                        >
                          {{
                            externalReviews?.doubanRating
                              ? formatCount(
                                  externalReviews.doubanRating.count,
                                ) + " 人评分"
                              : "等待可靠条目映射"
                          }}
                        </p>
                      </div>
                    </div>
                    <a
                      v-if="externalReviews?.doubanRating?.url"
                      :href="externalReviews.doubanRating.url"
                      target="_blank"
                      rel="noreferrer"
                      class="material-symbols-outlined text-on-surface-variant hover:text-primary"
                      >open_in_new</a
                    >
                  </div>
                </section>
                <section
                  class="space-y-5 rounded-2xl border border-white/5 bg-surface-container p-6"
                >
                  <div class="flex items-center justify-between">
                    <h3 class="panel-title">你的互动</h3>
                    <span
                      v-if="interactionNotice"
                      class="text-xs text-primary"
                      >{{ interactionNotice }}</span
                    >
                  </div>
                  <p class="text-sm text-on-surface-variant">为这部作品评分</p>
                  <div class="flex flex-wrap">
                    <button
                      v-for="star in 10"
                      :key="star"
                      class="rating-star material-symbols-outlined text-xl"
                      :class="
                        star <= ratingPreview ? 'text-primary' : 'text-outline'
                      "
                      @mouseenter="hoveredRating = star"
                      @mouseleave="hoveredRating = 0"
                      @focus="hoveredRating = star"
                      @blur="hoveredRating = 0"
                      @click="rate(star)"
                    >
                      star
                    </button>
                  </div>
                  <textarea
                    v-model="reviewText"
                    class="min-h-24 w-full rounded-lg border border-white/10 bg-surface-container-high p-3 text-sm outline-none focus:border-primary/50"
                    maxlength="5000"
                    placeholder="写下你的短评…"
                  ></textarea
                  ><label
                    class="flex items-center gap-2 text-xs text-on-surface-variant"
                    ><input
                      v-model="containsSpoiler"
                      type="checkbox"
                      class="accent-primary"
                    />短评包含剧透</label
                  ><button
                    class="w-full rounded-lg bg-primary-container py-3 font-bold text-on-primary-container hover:bg-primary"
                    @click="saveReview"
                  >
                    保存评分与短评
                  </button>
                </section>
                <section class="space-y-6 py-4">
                  <h3 class="panel-title border-b border-white/10 pb-2">
                    {{ data.mediaType === "tv" ? "剧集" : "电影" }}详情
                  </h3>
                  <dl class="space-y-4 text-sm">
                    <div class="detail-pair">
                      <dt>上映日期</dt>
                      <dd>{{ formatDate(data.releaseDate) }}</dd>
                    </div>
                    <div class="detail-pair">
                      <dt>状态</dt>
                      <dd>{{ statusText }}</dd>
                    </div>
                    <div class="detail-pair">
                      <dt>制作公司</dt>
                      <dd>
                        {{
                          data.productionCompanies
                            .map((c) => c.name)
                            .join("、") || "暂无"
                        }}
                      </dd>
                    </div>
                    <div class="detail-pair">
                      <dt>国家 / 地区</dt>
                      <dt class="!block">&#23548;&#28436;</dt>
                      <dd>
                        {{
                          directors.map((person) => person.name).join(" / ") ||
                          "?"
                        }}
                      </dd>
                    </div>
                    <div class="detail-pair">
                      <dt>&#32534;&#21095;</dt>
                      <dd>
                        {{
                          writers.map((person) => person.name).join(" / ") ||
                          "?"
                        }}
                      </dd>
                    </div>
                    <div class="detail-pair">
                      <dt>&#22269;&#23478; / &#22320;&#21306;</dt>
                      <dd>{{ countries }}</dd>
                    </div>
                    <div class="detail-pair">
                      <dt>语言</dt>
                      <dd>{{ data.languages.join("、") || "暂无" }}</dd>
                    </div>
                    <div class="detail-pair">
                      <dt>时长</dt>
                      <dd>{{ formatRuntime(data.runtime) }}</dd>
                    </div>
                    <div class="detail-pair">
                      <dt>分级</dt>
                      <dd>{{ data.certification || "未分级" }}</dd>
                    </div>
                    <template v-if="data.mediaType === 'tv'"
                      ><div class="detail-pair">
                        <dt>主创</dt>
                        <dd>
                          {{
                            data.createdBy.map((p) => p.name).join("、") ||
                            "暂无"
                          }}
                        </dd>
                      </div>
                      <div class="detail-pair">
                        <dt>季数 / 集数</dt>
                        <dd>
                          {{ data.numberOfSeasons || "暂无" }} 季 ·
                          {{ data.numberOfEpisodes || "暂无" }} 集
                        </dd>
                      </div>
                      <div class="detail-pair">
                        <dt>最后播出</dt>
                        <dd>{{ formatDate(data.lastAirDate) }}</dd>
                      </div>
                      <div v-if="data.nextEpisodeDate" class="detail-pair">
                        <dt>下一集</dt>
                        <dd>{{ formatDate(data.nextEpisodeDate) }}</dd>
                      </div></template
                    ><template v-if="moreDetails"
                      ><div class="detail-pair">
                        <dt>预算</dt>
                        <dd>{{ formatMoney(data.budget) }}</dd>
                      </div>
                      <div class="detail-pair">
                        <dt>票房</dt>
                        <dd>{{ formatMoney(data.revenue) }}</dd>
                      </div>
                      <div class="detail-pair">
                        <dt>IMDb ID</dt>
                        <dd>{{ data.imdbId || "暂无" }}</dd>
                      </div>
                      <div v-if="data.networks.length" class="detail-pair">
                        <dt>播出平台</dt>
                        <dd>
                          {{ data.networks.map((n) => n.name).join("、") }}
                        </dd>
                      </div></template
                    >
                  </dl>
                  <button
                    class="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/5 bg-surface-container-low py-4 text-sm font-bold text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-on-surface"
                    @click="moreDetails = !moreDetails"
                  >
                    {{ moreDetails ? "收起更多信息" : "显示更多信息"
                    }}<span
                      class="material-symbols-outlined"
                      :class="moreDetails ? 'rotate-180' : ''"
                      >expand_more</span
                    >
                  </button>
                </section>
                <section
                  v-if="externalReviews?.awards.status === 'ready'"
                  class="rounded-2xl border border-white/5 bg-surface-container p-6"
                >
                  <h3 class="panel-title">奖项与成就</h3>
                  <div class="mt-5 grid grid-cols-2 gap-3">
                    <div class="metric-card">
                      <strong>{{
                        externalReviews.awards.totalWins ?? "—"
                      }}</strong
                      ><span>获奖</span>
                    </div>
                    <div class="metric-card">
                      <strong>{{
                        externalReviews.awards.totalNominations ?? "—"
                      }}</strong
                      ><span>提名</span>
                    </div>
                  </div>
                  <p
                    v-if="externalReviews.awards.prestigious"
                    class="mt-4 text-sm text-on-surface-variant"
                  >
                    {{ externalReviews.awards.prestigious.name }}：{{
                      externalReviews.awards.prestigious.wins
                    }}
                    次获奖，{{ externalReviews.awards.prestigious.nominations }}
                    次提名
                  </p>
                  <p
                    v-if="externalReviews.awards.topRank"
                    class="mt-2 text-sm text-primary"
                  >
                    IMDb 榜单最高排名 #{{ externalReviews.awards.topRank }}
                  </p>
                </section>
                <section
                  v-if="boxOfficeMetrics.length"
                  class="rounded-2xl border border-white/5 bg-surface-container p-6"
                >
                  <h3 class="panel-title">
                    IMDb &#31080;&#25151;&#25688;&#35201;
                  </h3>
                  <div class="mt-5 grid grid-cols-2 gap-3">
                    <div
                      v-for="metric in boxOfficeMetrics"
                      :key="metric.label"
                      class="metric-card"
                    >
                      <strong class="!text-lg">{{ metric.value }}</strong
                      ><span>{{ metric.label }}</span>
                    </div>
                  </div>
                </section>
                <section
                  v-if="chartRankingItems.length"
                  class="rounded-2xl border border-white/5 bg-surface-container p-6"
                >
                  <h3 class="panel-title">
                    IMDb &#27036;&#21333;&#25490;&#21517;
                  </h3>
                  <div class="mt-4 space-y-3">
                    <div
                      v-for="(ranking, index) in chartRankingItems"
                      :key="index"
                      class="flex items-center justify-between rounded-xl bg-white/[.025] px-4 py-3 text-sm"
                    >
                      <span>{{
                        (ranking as any).node?.chart?.title ||
                        (ranking as any).chart?.title ||
                        (ranking as any).chartType ||
                        "IMDb Chart"
                      }}</span
                      ><strong class="text-primary"
                        >#{{
                          (ranking as any).node?.rank ||
                          (ranking as any).rank ||
                          (ranking as any).node?.currentRank ||
                          "?"
                        }}</strong
                      >
                    </div>
                  </div>
                </section>
                <section
                  v-if="externalReviews?.trivia.items.length"
                  class="rounded-2xl border border-white/5 bg-surface-container p-6"
                >
                  <h3 class="panel-title">你知道吗</h3>
                  <div
                    class="mt-3 flex flex-wrap gap-3 text-xs text-on-surface-variant"
                  >
                    <span v-if="externalReviews.trivia.totals?.trivia"
                      >花絮 {{ externalReviews.trivia.totals.trivia }}</span
                    ><span v-if="externalReviews.trivia.totals?.quotes"
                      >台词 {{ externalReviews.trivia.totals.quotes }}</span
                    ><span v-if="externalReviews.trivia.totals?.goofs"
                      >穿帮 {{ externalReviews.trivia.totals.goofs }}</span
                    >
                  </div>
                  <div class="mt-5 space-y-4">
                    <details
                      v-for="item in externalReviews.trivia.items"
                      :key="item.id"
                      class="rounded-xl bg-surface-container-high p-4"
                    >
                      <summary class="cursor-pointer font-bold text-primary">
                        {{ item.label
                        }}<span
                          v-if="item.category"
                          class="ml-2 text-xs font-normal text-on-surface-variant"
                          >{{ item.category }}</span
                        >
                      </summary>
                      <p
                        v-if="item.spoiler"
                        class="mt-3 text-xs font-bold text-red-300"
                      >
                        含剧透
                      </p>
                      <blockquote
                        v-if="item.type === 'quote'"
                        class="mt-3 border-l-2 border-primary/60 pl-3 text-sm italic leading-6 text-on-surface-variant"
                      >
                        “{{ item.text }}”
                      </blockquote>
                      <p
                        v-else
                        class="mt-3 whitespace-pre-line text-sm leading-6 text-on-surface-variant"
                      >
                        {{ item.text }}
                      </p>
                      <div
                        v-if="item.comments?.length"
                        class="mt-3 space-y-1 text-xs text-on-surface-variant"
                      >
                        <p v-for="comment in item.comments" :key="comment">
                          {{ comment }}
                        </p>
                      </div>
                      <div class="mt-3 flex gap-3 text-[11px] text-outline">
                        <span v-if="item.usersInterested != null"
                          >感兴趣 {{ formatCount(item.usersInterested) }}</span
                        ><span v-if="item.usersVoted != null"
                          >投票 {{ formatCount(item.usersVoted) }}</span
                        >
                      </div>
                    </details>
                  </div>
                </section>
                <div class="flex gap-4">
                  <a
                    v-if="data.homepage"
                    :href="data.homepage"
                    target="_blank"
                    class="side-action"
                    ><span class="material-symbols-outlined text-[18px]"
                      >public</span
                    >官方网站</a
                  >
                </div>
              </aside>
            </div>
          </section>
        </main></template
      ></PageState
    ><GlobalFooter />
  </div>
</template>
<style scoped>
.detail-action {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  gap: 8px;
  border-radius: 9999px;
  padding: 0 18px;
  font-weight: 700;
  transition: all 0.18s ease;
}
.section-title {
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: 700;
}
.section-title span {
  height: 1px;
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
}
.panel-title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #c5c7ce;
}
.detail-pair {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.detail-pair dt {
  flex: none;
  color: #c5c7ce;
}
.detail-pair dt:has(+ dt) {
  display: none;
}
.detail-pair dd {
  max-width: 70%;
  text-align: right;
}
.side-action {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  background: #1d2025;
  padding: 12px;
  font-size: 12px;
  font-weight: 700;
  transition: background-color 0.18s;
}
.side-action:hover {
  background: #282a30;
}
.interaction-button {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 10px;
  font-size: 13px;
  font-weight: 700;
  transition: 0.18s;
}
.interaction-button:hover {
  border-color: rgba(245, 197, 24, 0.4);
  color: #f5c518;
}
.interaction-button.active {
  background: #f5c518;
  color: #111;
  border-color: #f5c518;
}
.no-scrollbar {
  scrollbar-width: none;
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.rating-star {
  transition:
    transform 0.18s ease,
    color 0.18s ease,
    filter 0.18s ease;
  transform-origin: center bottom;
}
.rating-star:hover,
.rating-star:focus-visible {
  transform: translateY(-5px) scale(1.3);
  filter: drop-shadow(0 6px 10px rgba(245, 197, 24, 0.35));
}
.cast-strip {
  scrollbar-width: thin;
  scrollbar-color: rgba(245, 197, 24, 0.45) rgba(255, 255, 255, 0.05);
  scroll-snap-type: x proximity;
}
.cast-strip > * {
  scroll-snap-align: start;
}
.review-filter,
.review-select {
  border: 0;
  border-radius: 9999px;
  background: var(--color-surface-container, #202228);
  padding: 7px 12px;
  font-size: 12px;
  color: inherit;
}
.review-filter.active {
  background: #f5c518;
  color: #111317;
  box-shadow: 0 5px 18px rgba(245, 197, 24, 0.18);
}
.review-card {
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.025);
  padding: 20px;
}
.review-text:not([open]) p {
  display: none;
}
.metric-card {
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.035);
  padding: 16px;
}
.metric-card strong {
  color: #f5c518;
  font-size: 28px;
}
.metric-card span {
  color: rgba(255, 255, 255, 0.55);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.review-control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 0;
}
.review-control > span {
  font-size: 12px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.58);
}
.review-control > div {
  display: flex;
  gap: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.045);
  padding: 3px;
}
.load-more-button {
  margin-top: 20px;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 12px;
  font-size: 13px;
  font-weight: 800;
  transition: 0.2s;
}
.load-more-button:hover {
  border-color: rgba(245, 197, 24, 0.4);
  color: #f5c518;
  background: rgba(245, 197, 24, 0.06);
}
</style>
