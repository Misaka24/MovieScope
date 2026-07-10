<script setup lang="ts">
import { watch } from 'vue'
import { popularHeroPool } from '../../data/home'
import { useHeroCarousel } from '../../composables/useHeroCarousel'

const { movies, activeIndex, activeMovie, loading, select, markLoaded } = useHeroCarousel(popularHeroPool)

watch(activeIndex, () => {
  loading.value = true
})
</script>

<template>
  <section class="relative h-[calc(100svh-4rem)] min-h-[620px] max-h-[900px] w-full overflow-hidden bg-surface-container-lowest">
    <Transition name="hero-image" mode="out-in">
      <img :key="activeMovie.id" :src="activeMovie.backdrop" :alt="activeMovie.title" class="absolute inset-0 h-full w-full object-cover object-center" @load="markLoaded">
    </Transition>
    <div class="absolute inset-0 bg-gradient-to-r from-[#0c0e12] via-[#0c0e12]/60 to-transparent"></div>
    <div class="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/20"></div>
    <div v-if="loading" class="absolute inset-0 animate-pulse bg-surface-container-lowest/55"></div>

    <div class="relative z-10 mx-auto flex h-full max-w-container-max items-end px-margin-mobile pb-20 md:px-margin-desktop md:pb-24">
      <Transition name="hero-copy" mode="out-in">
        <div :key="activeMovie.id" class="max-w-3xl">
          <div class="mb-5 flex flex-wrap gap-2">
            <span v-for="genre in activeMovie.genres.slice(0, 2)" :key="genre" class="rounded border border-primary/35 bg-black/40 px-3 py-1 font-label-caps text-[11px] font-bold text-primary backdrop-blur-md">{{ genre }}</span>
          </div>
          <h1 class="text-4xl font-extrabold leading-tight text-white md:text-6xl lg:text-7xl">{{ activeMovie.title }}</h1>
          <div class="mt-5 flex flex-wrap items-center gap-4 text-sm font-semibold text-on-surface-variant">
            <span>{{ activeMovie.year }}</span>
            <span>IMDb {{ activeMovie.ratings.imdb.toFixed(1) }}</span>
            <span>豆瓣 {{ activeMovie.ratings.douban.toFixed(1) }}</span>
          </div>
          <p class="mt-5 max-w-2xl text-base leading-7 text-on-surface-variant md:text-lg">{{ activeMovie.overview }}</p>
          <div class="mt-8 flex flex-wrap gap-3">
            <button class="flex items-center gap-2 rounded bg-primary-container px-6 py-3 font-extrabold text-on-primary-container hover:brightness-105" type="button"><span class="material-symbols-outlined">info</span>查看详情</button>
            <a class="flex items-center gap-2 rounded border border-white/20 bg-black/30 px-6 py-3 font-bold text-white backdrop-blur-md hover:bg-white/10" href="#正在上映"><span class="material-symbols-outlined">explore</span>开始探索</a>
          </div>
        </div>
      </Transition>
    </div>

    <div class="absolute bottom-6 right-4 z-20 flex gap-2 md:right-10">
      <button v-for="(movie, index) in movies" :key="movie.id" type="button" class="h-1.5 rounded-full transition-all duration-300" :class="index === activeIndex ? 'w-10 bg-primary-container' : 'w-5 bg-white/35 hover:bg-white/60'" :aria-label="`切换到${movie.title}`" @click="select(index)"></button>
    </div>
  </section>
</template>

<style scoped>
.hero-image-enter-active, .hero-image-leave-active { transition: opacity .65s ease, transform .9s ease; }
.hero-image-enter-from { opacity: 0; transform: scale(1.035); }
.hero-image-leave-to { opacity: 0; transform: scale(1.015); }
.hero-copy-enter-active, .hero-copy-leave-active { transition: opacity .42s ease, transform .42s ease; }
.hero-copy-enter-from { opacity: 0; transform: translateY(20px); }
.hero-copy-leave-to { opacity: 0; transform: translateY(-12px); }
</style>