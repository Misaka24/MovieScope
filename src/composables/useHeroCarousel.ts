import { computed, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'
import type { HeroMovie } from '../types/media'

function shuffle<T>(items: readonly T[]) {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[target]] = [copy[target], copy[index]]
  }
  return copy
}

export function useHeroCarousel(input: () => readonly HeroMovie[]) {
  const movies = shallowRef<HeroMovie[]>([])
  const activeIndex = shallowRef(0)
  const imageLoading = shallowRef(true)
  let timer: ReturnType<typeof setInterval> | undefined

  const activeMovie = computed(() => movies.value[activeIndex.value])

  watch(input, (items) => {
    movies.value = shuffle(items).slice(0, 5)
    activeIndex.value = 0
    imageLoading.value = true
  }, { immediate: true })

  function select(index: number) {
    activeIndex.value = index
  }

  function next() {
    if (!movies.value.length) return
    activeIndex.value = (activeIndex.value + 1) % movies.value.length
  }

  function markLoaded() {
    imageLoading.value = false
  }

  watch(activeIndex, () => {
    imageLoading.value = true
  })

  onMounted(() => {
    timer = setInterval(next, 7000)
  })

  onBeforeUnmount(() => {
    if (timer) clearInterval(timer)
  })

  return { movies, activeIndex, activeMovie, imageLoading, select, markLoaded }
}