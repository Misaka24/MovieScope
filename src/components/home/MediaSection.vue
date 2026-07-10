<script setup lang="ts">
import type { MediaItem } from '../../types/media'
import MediaPosterCard from './MediaPosterCard.vue'

defineProps<{ id: string; title: string; description: string; items: MediaItem[] }>()
</script>

<template>
  <section :id="id" class="scroll-mt-20 py-10">
    <div class="mb-7 flex items-end justify-between gap-4">
      <div>
        <h2 class="text-2xl font-extrabold text-on-surface md:text-3xl">{{ title }}</h2>
        <p class="mt-2 text-sm text-on-surface-variant">{{ description }}</p>
      </div>
      <a href="#" class="hidden items-center gap-1 text-sm font-bold text-primary hover:underline sm:flex">查看全部<span class="material-symbols-outlined text-lg">chevron_right</span></a>
    </div>
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-6">
      <MediaPosterCard v-for="item in items" :key="item.id" :item="item" />
    </div>
  </section>
</template>