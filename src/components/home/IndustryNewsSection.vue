<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import type { IndustryNews } from '../../types/media'

const props = defineProps<{ items: IndustryNews[] }>()
const visibleCount = shallowRef(3)
const loadCount = shallowRef(0)
const visibleItems = computed(() => props.items.slice(0, visibleCount.value))
const hasMore = computed(() => visibleCount.value < props.items.length)

watch(() => props.items, () => {
  visibleCount.value = 3
  loadCount.value = 0
})

function showMore() {
  visibleCount.value = Math.min(visibleCount.value + 6, props.items.length)
  loadCount.value += 1
}

function formatDate(value: string | null) {
  if (!value) return '时间暂无'
  return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}
</script>

<template>
  <section id="影坛动态" class="scroll-mt-16 py-8">
    <div class="mb-5 flex items-end justify-between"><div><h2 class="text-xl font-extrabold text-on-surface md:text-2xl">影坛动态</h2><p class="mt-1.5 text-[13px] text-on-surface-variant">电影行业的最新动态与报道。</p></div></div>
    <div v-if="items.length" class="grid gap-5 lg:grid-cols-3 2xl:gap-6">
      <article v-for="news in visibleItems" :key="news.id" class="group flex min-h-full flex-col overflow-hidden rounded-lg border border-white/5 bg-surface-container-low">
        <div v-if="news.image" class="aspect-[16/9] overflow-hidden"><img :src="news.image" :alt="news.title" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy"></div>
        <div class="flex flex-1 flex-col p-[18px]" :class="{ 'min-h-[230px] justify-center': !news.image }"><div class="mb-2.5 flex items-center justify-between gap-3 text-xs font-bold"><span class="text-primary">{{ news.category }}</span><span class="text-on-surface-variant">{{ formatDate(news.publishedAt) }}</span></div><h3 class="text-[17px] font-extrabold leading-[26px] text-on-surface group-hover:text-primary">{{ news.title }}</h3><p class="mt-2.5 line-clamp-3 text-[13px] leading-[21px] text-on-surface-variant">{{ news.summary }}</p><a v-if="news.url" :href="news.url" target="_blank" rel="noreferrer" class="mt-4 inline-flex items-center gap-1 self-start text-[13px] font-bold text-primary">阅读全文<span class="material-symbols-outlined text-lg">arrow_forward</span></a></div>
      </article>
    </div>
    <div v-if="items.length" class="mt-6 flex justify-center"><button v-if="hasMore && loadCount < 3" type="button" class="news-more" @click="showMore">查看更多<span class="material-symbols-outlined text-lg">expand_more</span></button><RouterLink v-else class="news-more" :to="{name:'news'}">前往新闻中心<span class="material-symbols-outlined text-lg">arrow_forward</span></RouterLink></div>
    <div v-else class="rounded-lg border border-white/5 bg-surface-container-low p-6 text-center text-sm text-on-surface-variant">影坛动态暂不可用。</div>
  </section>
</template>

<style scoped>.news-more{display:inline-flex;height:40px;align-items:center;gap:6px;white-space:nowrap;border-radius:4px;border:1px solid rgba(255,255,255,.15);background:#242424;padding:0 20px;font-size:14px;font-weight:700;transition:border-color .2s,color .2s}.news-more:hover{border-color:rgba(245,197,24,.5);color:#f5c518}</style>
