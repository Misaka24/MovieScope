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
.catalog-poster-grid{display:grid;width:100%;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
@media(min-width:640px){.catalog-poster-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(min-width:768px){.catalog-poster-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:20px}}
@media(min-width:1024px){.catalog-poster-grid{grid-template-columns:repeat(6,minmax(0,1fr))}}
@media(min-width:1536px){.catalog-poster-grid{grid-template-columns:repeat(7,minmax(0,1fr));gap:24px}}
@media(min-width:1800px){.catalog-poster-grid{grid-template-columns:repeat(8,minmax(0,1fr))}}
@media(min-width:2200px){.catalog-poster-grid{grid-template-columns:repeat(10,minmax(0,1fr))}}
@media(min-width:3000px){.catalog-poster-grid{grid-template-columns:repeat(12,minmax(0,1fr))}}
@media(min-width:1024px) and (max-width:1535px){.catalog-poster-grid>:nth-child(n+19){display:none}}
@media(min-width:1536px) and (max-width:1799px){.catalog-poster-grid>:nth-child(n+15){display:none}}
@media(min-width:1800px){.catalog-poster-grid>:nth-child(n+17){display:none}}
@media(min-width:2200px){.catalog-poster-grid>:nth-child(n){display:block}}
</style>
