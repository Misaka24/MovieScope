<script setup lang="ts">
import type { MediaItem } from '../../types/media'
import MediaPosterCard from './MediaPosterCard.vue'

defineProps<{ id: string; title: string; description: string; items: MediaItem[] }>()

function exploreQuery(id: string) {
  if (id === '热门剧集') return { media: 'tv', sort: 'popularity.desc' }
  if (id === '高分榜') return { media: 'movie', sort: 'vote_average.desc', rating: 8 }
  if (id === '正在上映') return { media: 'movie', sort: 'primary_release_date.desc' }
  return { media: 'movie', sort: 'popularity.desc' }
}
</script>

<template>
  <section :id="id" class="scroll-mt-16 py-8">
    <div class="mb-5 flex items-end justify-between gap-3">
      <div>
        <h2 class="text-xl font-extrabold text-on-surface md:text-2xl">{{ title }}</h2>
        <p class="mt-1.5 text-[13px] text-on-surface-variant">{{ description }}</p>
      </div>
      <RouterLink :to="{ name: 'explore', query: exploreQuery(id) }" class="hidden items-center gap-0.5 text-xs font-bold text-primary hover:underline sm:flex">查看全部<span class="material-symbols-outlined text-base">chevron_right</span></RouterLink>
    </div>
    <div class="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:gap-5 lg:grid-cols-6">
      <MediaPosterCard v-for="item in items" :key="item.id" :item="item" />
    </div>
  </section>
</template>
