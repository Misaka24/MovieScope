<script setup lang="ts">
import type { MediaItem } from '../../types/media'

defineProps<{ item: MediaItem }>()
</script>

<template>
  <article class="poster-card group min-w-0 cursor-pointer">
    <div class="relative aspect-[2/3] overflow-hidden rounded-lg border border-white/5 bg-surface-container">
      <img :src="item.poster" :alt="item.title" class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.045]">
      <div class="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-90"></div>
      <div class="absolute right-2 top-2 flex flex-col items-end gap-1.5">
        <span class="rating-badge rounded px-2 py-1 text-[10px] font-black text-primary-container">IMDb {{ item.ratings.imdb.toFixed(1) }}</span>
        <span class="rating-badge rounded px-2 py-1 text-[10px] font-black text-secondary">豆瓣 {{ item.ratings.douban.toFixed(1) }}</span>
      </div>
    </div>
    <h3 class="mt-3 truncate text-base font-bold text-on-surface transition-colors group-hover:text-primary">{{ item.title }}</h3>
    <p class="mt-1 truncate text-sm text-on-surface-variant">{{ item.year }} · {{ item.genres.slice(0, 2).join(' / ') }}</p>
  </article>
</template>