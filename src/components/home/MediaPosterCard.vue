<script setup lang="ts">
import type { MediaItem } from '../../types/media'
import { primaryRatingLabel } from '../../utils/ratings'

defineProps<{ item: MediaItem }>()
</script>

<template>
  <article class="poster-card group min-w-0 cursor-pointer">
    <div class="relative aspect-[2/3] overflow-hidden rounded-lg border border-white/5 bg-surface-container">
      <img :src="item.poster" :alt="item.title" class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.045]" loading="lazy">
      <div class="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-90"></div>
      <div class="absolute right-2 top-2"><span class="rating-badge rounded px-2 py-0.5 text-[10px] font-black text-primary-container">{{ primaryRatingLabel(item) }}</span></div>
    </div>
    <h3 class="mt-2.5 truncate text-[15px] font-bold text-on-surface transition-colors group-hover:text-primary">{{ item.title }}</h3>
    <p class="mt-1 truncate text-[13px] text-on-surface-variant">{{ item.year || '年份暂无' }} · {{ item.genres.length ? item.genres.slice(0, 2).join(' / ') : item.mediaType === 'tv' ? '剧集' : '电影' }}</p>
  </article>
</template>
