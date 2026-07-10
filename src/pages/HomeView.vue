<script setup lang="ts">
import GlobalFooter from '../components/global/GlobalFooter.vue'
import GlobalHeader from '../components/global/GlobalHeader.vue'
import HomeHeroCarousel from '../components/home/HomeHeroCarousel.vue'
import IndustryNewsSection from '../components/home/IndustryNewsSection.vue'
import MediaSection from '../components/home/MediaSection.vue'
import { useHomeData } from '../composables/useHomeData'

const { data, loading, error, partialFailures, reload } = useHomeData()
</script>

<template>
  <div class="min-h-screen bg-background text-on-surface">
    <GlobalHeader />
    <main class="pt-16">
      <HomeHeroCarousel :items="data?.hero || []" :loading="loading" />
      <div id="探索" class="mx-auto max-w-container-max px-margin-mobile py-8 md:px-margin-desktop">
        <div v-if="error" class="my-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-error/40 bg-error-container/20 p-4 text-on-error-container"><span>{{ error }}</span><button class="rounded bg-primary-container px-4 py-2 font-bold text-on-primary-container" type="button" @click="reload">重新加载</button></div>
        <div v-else-if="partialFailures.length" class="my-6 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-on-surface-variant">部分数据源暂时不可用，页面已展示其他可用真实数据。</div>
        <template v-if="data">
          <MediaSection id="正在上映" title="正在上映" description="TMDB 中国地区当前院线上映电影。" :items="data.sections.nowPlaying" />
          <MediaSection id="高分榜" title="高分榜" description="IMDb Top 250 榜单中的高分电影。" :items="data.sections.topRated" />
          <MediaSection id="热门电影" title="热门电影" description="TMDB 热门电影，并在可靠匹配时补充豆瓣评分。" :items="data.sections.popularMovies" />
          <MediaSection id="热门剧集" title="热门剧集" description="TMDB 热门剧集，并在可靠匹配时补充豆瓣评分。" :items="data.sections.popularTv" />
          <IndustryNewsSection :items="data.sections.news" />
        </template>
        <div v-else class="space-y-16 py-10"><div v-for="index in 4" :key="index"><div class="mb-6 h-8 w-40 animate-pulse rounded bg-white/5"></div><div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"><div v-for="card in 6" :key="card" class="aspect-[2/3] animate-pulse rounded-lg bg-white/5"></div></div></div></div>
      </div>
    </main>
    <GlobalFooter />
  </div>
</template>