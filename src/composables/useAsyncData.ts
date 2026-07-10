import { onMounted, shallowRef, watch, type WatchSource } from 'vue'

export function useAsyncData<T>(loader: () => Promise<T>, sources: WatchSource[] = []) {
  const data = shallowRef<T>()
  const loading = shallowRef(true)
  const error = shallowRef<string>()

  async function load() {
    loading.value = true
    error.value = undefined
    try { data.value = await loader() } catch (reason) { error.value = reason instanceof Error ? reason.message : '数据加载失败' } finally { loading.value = false }
  }

  onMounted(load)
  if (sources.length) watch(sources, load)
  return { data, loading, error, reload: load }
}
