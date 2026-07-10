import { computed, onBeforeUnmount, onMounted, shallowRef } from 'vue'
import type { HeroMovie } from '../types/media'

function shuffle<T>(items: readonly T[]) {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[target]] = [copy[target], copy[index]]
  }
  return copy
}

export function useHeroCarousel(pool: readonly HeroMovie[]) {
  const movies = shallowRef<HeroMovie[]>(shuffle(pool).slice(0, 5))
  const activeIndex = shallowRef(0)
  const loading = shallowRef(true)
  let timer: ReturnType<typeof setInterval> | undefined

  const activeMovie = computed(() => movies.value[activeIndex.value])

  function select(index: number) {
    activeIndex.value = index
  }

  function next() {
    activeIndex.value = (activeIndex.value + 1) % movies.value.length
  }

  function markLoaded() {
    loading.value = false
  }

  onMounted(() => {
    timer = setInterval(next, 7000)
  })

  onBeforeUnmount(() => {
    if (timer) clearInterval(timer)
  })

  return { movies, activeIndex, activeMovie, loading, select, markLoaded }
}