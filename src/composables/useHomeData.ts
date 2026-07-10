import { computed, onMounted, shallowRef } from 'vue'
import { fetchHomeData } from '../services/home-api'
import type { HomeData } from '../types/media'

export function useHomeData() {
  const data = shallowRef<HomeData>()
  const loading = shallowRef(true)
  const error = shallowRef<string>()

  const partialFailures = computed(() => data.value?.sourceMeta.filter((source) => source.status === 'error') || [])

  async function load() {
    loading.value = true
    error.value = undefined
    try {
      data.value = await fetchHomeData()
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : '首页数据加载失败'
    } finally {
      loading.value = false
    }
  }

  onMounted(load)
  return { data, loading, error, partialFailures, reload: load }
}