<script setup lang="ts">
import GlobalFooter from '../components/global/GlobalFooter.vue'
import GlobalHeader from '../components/global/GlobalHeader.vue'
import HomeHeroCarousel from '../components/home/HomeHeroCarousel.vue'
import IndustryNewsSection from '../components/home/IndustryNewsSection.vue'
import MediaSection from '../components/home/MediaSection.vue'
import { nowPlaying, popularMovies, popularTv, topRated } from '../data/home'
</script>

<template>
  <div class="min-h-screen bg-background text-on-surface">
    <GlobalHeader />
    <main class="pt-16">
      <HomeHeroCarousel />
      <div id="探索" class="mx-auto max-w-container-max px-margin-mobile py-8 md:px-margin-desktop">
        <MediaSection id="正在上映" title="正在上映" description="当前院线正在热映的电影。" :items="nowPlaying" />
        <MediaSection id="高分榜" title="高分榜" description="综合 IMDb 与豆瓣口碑展示的高分作品。" :items="topRated" />
        <MediaSection id="热门电影" title="热门电影" description="TMDB 热门电影与中文口碑补充。" :items="popularMovies" />
        <MediaSection id="热门剧集" title="热门剧集" description="当前最受关注的热门剧集。" :items="popularTv" />
        <IndustryNewsSection />
      </div>
    </main>
    <GlobalFooter />
  </div>
</template>