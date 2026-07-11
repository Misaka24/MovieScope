<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useHeroCarousel } from '../../composables/useHeroCarousel'
import type { HeroMovie } from '../../types/media'
import { primaryRatingLabel } from '../../utils/ratings'

const props = defineProps<{ items: HeroMovie[]; loading: boolean }>()
const { movies, activeIndex, activeMovie, imageLoading, select, markLoaded } = useHeroCarousel(() => props.items)
const ready = computed(() => Boolean(activeMovie.value))
const loadedImages = ref(new Set<string>())
const displayedMovieId = ref<string | null>(null)
const activeImageReady = computed(() => loadedImages.value.has(activeMovie.value?.id || ''))

watch(activeMovie, (movie) => {
  if (movie && loadedImages.value.has(movie.id)) displayedMovieId.value = movie.id
})

function handleImageLoad(id: string) {
  loadedImages.value = new Set([...loadedImages.value, id])
  if (activeMovie.value?.id === id) displayedMovieId.value = id
  if (activeMovie.value?.id === id) markLoaded()
}

</script>

<template>
  <section class="relative h-[100svh] min-h-[560px] w-full overflow-hidden bg-surface-container-lowest">
    <template v-if="ready">
      <div class="absolute inset-0 bg-surface-container-lowest">
        <img
          v-for="movie in movies"
          :key="movie.id"
          :src="movie.backdrop"
          :alt="movie.title"
          class="hero-backdrop absolute inset-0 h-full w-full object-cover object-center"
          :class="movie.id === displayedMovieId ? 'is-active' : ''"
          @load="handleImageLoad(movie.id)"
        >
      </div>
      <div class="absolute inset-0 bg-gradient-to-r from-[#0c0e12] via-[#0c0e12]/60 to-transparent"></div>
      <div class="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/20"></div>
      <div v-if="imageLoading && !activeImageReady" class="absolute inset-0 bg-surface-container-lowest/35 transition-opacity duration-300"></div>

      <div class="relative z-10 mx-auto flex h-full max-w-[1216px] items-end px-4 pb-16 pt-14 md:px-8 md:pb-[68px] 2xl:max-w-[1480px] 2xl:px-10 min-[1800px]:max-w-[1680px] min-[1800px]:px-12">
        <div class="hero-copy-stage grid w-full max-w-[680px]">
          <div
            v-for="movie in movies"
            :key="movie.id"
            class="hero-copy-panel col-start-1 row-start-1 self-end"
            :class="movie.id === displayedMovieId ? 'is-active' : ''"
          >
            <div class="mb-3.5 flex flex-wrap gap-1.5"><span v-for="genre in movie.genres.slice(0, 2)" :key="genre" class="rounded border border-primary/35 bg-black/40 px-2.5 py-0.5 font-label-caps text-[10px] font-bold text-primary backdrop-blur-md">{{ genre }}</span></div>
            <h1 class="text-3xl font-extrabold leading-tight text-white md:text-5xl lg:text-6xl">{{ movie.title }}</h1>
            <div class="mt-4 flex flex-wrap items-center gap-3.5 text-[13px] font-semibold text-on-surface-variant">
              <span>{{ movie.year || '年份暂无' }}</span><span>{{ primaryRatingLabel(movie, false) }}</span>
            </div>
            <p class="mt-4 max-w-[620px] text-[15px] leading-[25px] text-on-surface-variant md:text-base">{{ movie.overview }}</p>
            <div class="mt-6 flex flex-wrap gap-2.5"><RouterLink :to="{ name: 'title', params: { type: movie.mediaType, id: movie.sourceId } }" class="inline-flex h-10 min-w-[126px] flex-none items-center justify-center gap-1.5 whitespace-nowrap rounded bg-primary-container px-4 text-[15px] font-extrabold text-on-primary-container"><span class="material-symbols-outlined flex-none text-xl">info</span><span class="flex-none">查看详情</span></RouterLink><RouterLink class="inline-flex h-10 min-w-[132px] flex-none items-center justify-center gap-1.5 whitespace-nowrap rounded border border-white/20 bg-black/30 px-4 text-[15px] font-bold text-white backdrop-blur-md" to="/explore"><span class="material-symbols-outlined flex-none text-xl">explore</span><span class="flex-none">开始探索</span></RouterLink></div>
          </div>
        </div>
      </div>
      <div class="absolute bottom-4 right-4 z-20 flex gap-1.5 md:right-7"><button v-for="(movie, index) in movies" :key="movie.id" type="button" class="h-1 rounded-full transition-all duration-300" :class="index === activeIndex ? 'w-8 bg-primary-container' : 'w-4 bg-white/35'" :aria-label="`切换到${movie.title}`" @click="select(index)"></button></div>
    </template>
    <div v-else class="absolute inset-0 animate-pulse bg-gradient-to-br from-surface-container to-surface-container-lowest"><div class="absolute bottom-24 left-4 h-48 w-[min(80%,640px)] rounded bg-white/5 md:left-10"></div></div>
  </section>
</template>

<style scoped>
.hero-backdrop {
  opacity: 0;
  transform: scale(1.025);
  transition: opacity .8s cubic-bezier(.4, 0, .2, 1), transform 7.5s linear;
  will-change: opacity, transform;
  backface-visibility: hidden;
}
.hero-backdrop.is-active {
  opacity: 1;
  transform: scale(1);
}
.hero-copy-stage { min-height: 330px; }
.hero-copy-panel {
  pointer-events: none;
  opacity: 0;
  transform: translate3d(0, 14px, 0);
  transition: opacity .5s cubic-bezier(.4, 0, .2, 1), transform .55s cubic-bezier(.2, 0, 0, 1);
  will-change: opacity, transform;
}
.hero-copy-panel.is-active {
  z-index: 1;
  pointer-events: auto;
  opacity: 1;
  transform: translate3d(0, 0, 0);
}
@media (max-width: 767px) { .hero-copy-stage { min-height: 360px; } }
@media (prefers-reduced-motion: reduce) {
  .hero-backdrop, .hero-copy-panel { transition-duration: .01ms; }
}
</style>
