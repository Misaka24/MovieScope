<script setup lang="ts">
import type { IndustryNews } from '../../types/media'

defineProps<{ items: IndustryNews[] }>()

function formatDate(value: string | null) {
  if (!value) return '时间暂无'
  return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}
</script>

<template>
  <section id="影坛动态" class="scroll-mt-16 py-7">
    <div class="mb-4 flex items-end justify-between"><div><h2 class="text-xl font-extrabold text-on-surface md:text-2xl">影坛动态</h2><p class="mt-1 text-xs text-on-surface-variant">电影行业的最新动态与报道。</p></div></div>
    <div v-if="items.length" class="grid gap-4 lg:grid-cols-3">
      <article v-for="news in items" :key="news.id" class="group overflow-hidden rounded-lg border border-white/5 bg-surface-container-low">
        <div class="aspect-[16/9] overflow-hidden"><img :src="news.image" :alt="news.title" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy"></div>
        <div class="p-4"><div class="mb-2 flex items-center justify-between gap-3 text-[11px] font-bold"><span class="text-primary">{{ news.category }}</span><span class="text-on-surface-variant">{{ formatDate(news.publishedAt) }}</span></div><h3 class="text-base font-extrabold leading-6 text-on-surface group-hover:text-primary">{{ news.title }}</h3><p class="mt-2 line-clamp-3 text-xs leading-5 text-on-surface-variant">{{ news.summary }}</p><a v-if="news.url" :href="news.url" target="_blank" rel="noreferrer" class="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary">阅读全文<span class="material-symbols-outlined text-base">arrow_forward</span></a></div>
      </article>
    </div>
    <div v-else class="rounded-lg border border-white/5 bg-surface-container-low p-6 text-center text-sm text-on-surface-variant">影坛动态暂不可用。</div>
  </section>
</template>
