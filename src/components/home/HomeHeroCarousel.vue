<script setup lang="ts">
import { computed } from 'vue'
import { useHeroCarousel } from '../../composables/useHeroCarousel'
import type { HeroMovie } from '../../types/media'

const props = defineProps<{ items: HeroMovie[]; loading: boolean }>()
const { movies, activeIndex, activeMovie, imageLoading, select, markLoaded } = useHeroCarousel(() => props.items)
const ready = computed(() => Boolean(activeMovie.value))

function primaryRating(movie: HeroMovie) {
  if (movie.ratings.imdb != null) return `IMDb ${movie.ratings.imdb.toFixed(1)}`
  if (movie.ratings.tmdb != null) return `TMDB ${movie.ratings.tmdb.toFixed(1)}`
  return '评分未收录'
}
</script>

<template>
  <section class="relative h-[100svh] min-h-[560px] w-full overflow-hidden bg-surface-container-lowest">
    <template v-if="ready">
      <Transition name="hero-image" appear>
        <img :key="activeMovie.id" :src="activeMovie.backdrop" :alt="activeMovie.title" class="absolute inset-0 h-full w-full object-cover object-center" @load="markLoaded">
      </Transition>
      <div class="absolute inset-0 bg-gradient-to-r from-[#0c0e12] via-[#0c0e12]/60 to-transparent"></div>
      <div class="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/20"></div>
      <div v-if="imageLoading" class="absolute inset-0 animate-pulse bg-surface-container-lowest/55"></div>

      <div class="relative z-10 mx-auto flex h-full max-w-[1216px] items-end px-4 pb-16 pt-14 md:px-8 md:pb-[68px]">
        <Transition name="hero-copy" appear>
          <div :key="activeMovie.id" class="max-w-[680px]">
            <div class="mb-3.5 flex flex-wrap gap-1.5"><span v-for="genre in activeMovie.genres.slice(0, 2)" :key="genre" class="rounded border border-primary/35 bg-black/40 px-2.5 py-0.5 font-label-caps text-[10px] font-bold text-primary backdrop-blur-md">{{ genre }}</span></div>
            <h1 class="text-3xl font-extrabold leading-tight text-white md:text-5xl lg:text-6xl">{{ activeMovie.title }}</h1>
            <div class="mt-4 flex flex-wrap items-center gap-3.5 text-[13px] font-semibold text-on-surface-variant">
              <span>{{ activeMovie.year || '年份暂无' }}</span><span>{{ primaryRating(activeMovie) }}</span>
            </div>
            <p class="mt-4 max-w-[620px] text-[15px] leading-[25px] text-on-surface-variant md:text-base">{{ activeMovie.overview }}</p>
            <div class="mt-6 flex flex-wrap gap-2.5"><button class="inline-flex h-10 min-w-[126px] flex-none items-center justify-center gap-1.5 whitespace-nowrap rounded bg-primary-container px-4 text-[15px] font-extrabold text-on-primary-container" type="button"><span class="material-symbols-outlined flex-none text-xl">info</span><span class="flex-none">查看详情</span></button><a class="inline-flex h-10 min-w-[132px] flex-none items-center justify-center gap-1.5 whitespace-nowrap rounded border border-white/20 bg-black/30 px-4 text-[15px] font-bold text-white backdrop-blur-md" href="#正在上映"><span class="material-symbols-outlined flex-none text-xl">explore</span><span class="flex-none">开始探索</span></a></div>
          </div>
        </Transition>
      </div>
      <div class="absolute bottom-4 right-4 z-20 flex gap-1.5 md:right-7"><button v-for="(movie, index) in movies" :key="movie.id" type="button" class="h-1 rounded-full transition-all duration-300" :class="index === activeIndex ? 'w-8 bg-primary-container' : 'w-4 bg-white/35'" :aria-label="`切换到${movie.title}`" @click="select(index)"></button></div>
    </template>
    <div v-else class="absolute inset-0 animate-pulse bg-gradient-to-br from-surface-container to-surface-container-lowest"><div class="absolute bottom-24 left-4 h-48 w-[min(80%,640px)] rounded bg-white/5 md:left-10"></div></div>
  </section>
</template>

<style scoped>
.hero-image-enter-active, .hero-image-leave-active { transition: opacity .65s ease, transform .9s ease; }
.hero-image-enter-from { opacity: 0; transform: scale(1.035); }
.hero-image-leave-to { opacity: 0; transform: scale(1.015); }
.hero-image-leave-active { position: absolute; inset: 0; }
.hero-copy-enter-active, .hero-copy-leave-active { transition: opacity .42s ease, transform .42s ease; }
.hero-copy-enter-from { opacity: 0; transform: translateY(20px); }
.hero-copy-leave-to { opacity: 0; transform: translateY(-12px); }
.hero-copy-leave-active { position: absolute; bottom: 4rem; }
</style>
