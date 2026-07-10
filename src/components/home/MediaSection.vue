<script setup lang="ts">
import type { MediaItem } from '../../types/media'
import MediaPosterCard from './MediaPosterCard.vue'

defineProps<{ id: string; title: string; description: string; items: MediaItem[] }>()
</script>

<template>
  <section :id="id" class="scroll-mt-16 py-7">
    <div class="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 class="text-xl font-extrabold text-on-surface md:text-2xl">{{ title }}</h2>
        <p class="mt-1 text-xs text-on-surface-variant">{{ description }}</p>
      </div>
      <a href="#" class="hidden items-center gap-0.5 text-xs font-bold text-primary hover:underline sm:flex">查看全部<span class="material-symbols-outlined text-base">chevron_right</span></a>
    </div>
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-6">
      <MediaPosterCard v-for="item in items" :key="item.id" :item="item" />
    </div>
  </section>
</template>
