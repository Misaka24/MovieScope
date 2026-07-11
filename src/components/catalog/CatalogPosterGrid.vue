<script setup lang="ts">
import type { CatalogMedia } from '../../types/catalog'
import CatalogPosterCard from './CatalogPosterCard.vue'

defineProps<{ items: CatalogMedia[]; hideRating?: boolean }>()
</script>

<template>
  <div class="catalog-poster-grid">
    <CatalogPosterCard
      v-for="item in items"
      :key="item.mediaType + ':' + item.id"
      :item="item"
      :hide-rating="hideRating"
    />
  </div>
</template>

<style scoped>
.catalog-poster-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:16px;row-gap:24px}
@media(min-width:640px){.catalog-poster-grid{grid-template-columns:repeat(3,minmax(0,1fr));column-gap:18px}}
@media(min-width:768px){.catalog-poster-grid{grid-template-columns:repeat(4,minmax(0,1fr));column-gap:20px}}
@media(min-width:1024px){.catalog-poster-grid{grid-template-columns:repeat(5,minmax(0,1fr));column-gap:22px;row-gap:28px}}
</style>
