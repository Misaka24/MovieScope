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
    <main>
      <HomeHeroCarousel :items="data?.hero || []" :loading="loading" />
      <div id="探索" class="mx-auto max-w-[1680px] px-4 py-6 md:px-8 xl:px-10 2xl:px-12">
        <div v-if="error" class="my-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-error/40 bg-error-container/20 p-3 text-sm text-on-error-container"><span>{{ error }}</span><button class="rounded bg-primary-container px-3 py-1.5 text-xs font-bold text-on-primary-container" type="button" @click="reload">重新加载</button></div>
        <div v-else-if="partialFailures.length" class="my-4 rounded-lg border border-primary/20 bg-primary/5 p-2.5 text-xs text-on-surface-variant">部分内容暂时不可用，页面已展示其他可用内容。</div>
        <template v-if="data">
          <MediaSection id="正在上映" title="正在上映" description="院线正在热映的电影。" :items="data.sections.nowPlaying" />
          <MediaSection id="高分榜" title="高分榜" description="IMDb Top 250 榜单中的高分电影。" :items="data.sections.topRated" />
          <MediaSection id="热门电影" title="热门电影" description="近期备受关注的热门电影。" :items="data.sections.popularMovies" />
          <MediaSection id="热门剧集" title="热门剧集" description="近期热度持续上升的剧集。" :items="data.sections.popularTv" />
          <IndustryNewsSection :items="data.sections.news" />
        </template>
        <div v-else class="space-y-10 py-7"><div v-for="index in 4" :key="index"><div class="mb-4 h-6 w-32 animate-pulse rounded bg-white/5"></div><div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 2xl:grid-cols-7 min-[1800px]:grid-cols-8"><div v-for="card in 8" :key="card" class="aspect-[2/3] animate-pulse rounded-lg bg-white/5"></div></div></div></div>
      </div>
    </main>
    <GlobalFooter />
  </div>
</template>
