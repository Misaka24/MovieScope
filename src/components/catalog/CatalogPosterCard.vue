<script setup lang="ts">
import type { CatalogMedia } from "../../types/catalog";
defineProps<{ item: CatalogMedia; hideRating?: boolean }>();
</script>

<template>
  <component
    :is="item.source === 'douban' ? 'a' : 'RouterLink'"
    v-bind="
      item.source === 'douban'
        ? { href: item.externalUrl, target: '_blank', rel: 'noreferrer' }
        : {
            to: {
              name: 'title',
              params: { type: item.mediaType, id: item.id },
            },
          }
    "
    class="poster-card group block min-w-0 transition-transform duration-300 hover:-translate-y-1"
  >
    <div
      class="relative aspect-[2/3] overflow-hidden rounded-lg border border-white/5 bg-surface-container"
    >
      <img
        :src="item.poster"
        :alt="item.title"
        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.045]"
        loading="lazy"
      />
      <div
        class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-90"
      ></div>
      <span
        v-if="!hideRating"
        class="rating-badge absolute right-2 top-2 rounded px-2 py-0.5 text-[10px] font-black text-primary-container"
        >{{
          item.source === "douban"
            ? item.doubanRating
              ? `?? ${item.doubanRating.toFixed(1)}`
              : "??????"
            : item.imdbRating != null
              ? `IMDb ${item.imdbRating.toFixed(1)}`
              : "暂无评分"
        }}</span
      >
    </div>
    <h3
      class="mt-2.5 truncate text-[15px] font-bold text-on-surface group-hover:text-primary"
    >
      {{ item.title }}
    </h3>
    <p class="mt-1 truncate text-[13px] text-on-surface-variant">
      {{ item.year || "年份暂无" }} ·
      {{
        item.genres.slice(0, 2).join(" / ") ||
        (item.mediaType === "tv" ? "剧集" : "电影")
      }}
    </p>
  </component>
</template>
