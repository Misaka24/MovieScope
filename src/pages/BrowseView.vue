<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import GlobalHeader from '../components/global/GlobalHeader.vue'
import GlobalFooter from '../components/global/GlobalFooter.vue'
import CatalogPosterGrid from '../components/catalog/CatalogPosterGrid.vue'
import PageState from '../components/catalog/PageState.vue'
import PaginationBar from '../components/catalog/PaginationBar.vue'
import { useAsyncData } from '../composables/useAsyncData'
import { fetchBrowse } from '../services/catalog-api'
const route=useRoute();const router=useRouter();const preset=computed(()=>String(route.params.preset));const page=computed(()=>Number(route.query.page||1));const key=computed(()=>preset.value+':'+page.value)
const {data,loading,error,reload}=useAsyncData(()=>fetchBrowse(preset.value,page.value),[key])
function setPage(value:number){router.push({query:{page:Math.max(1,Math.min(data.value?.totalPages||1,value))}})}
</script>
<template><div class="min-h-screen bg-background text-on-surface"><GlobalHeader/><main class="mx-auto max-w-[1440px] px-5 pb-16 pt-[82px] sm:px-7 lg:px-10 xl:px-12"><PageState :loading="loading" :error="error" @retry="reload"><template v-if="data"><div class="mx-auto max-w-[1120px]"><header class="mb-7 border-b border-white/10 pb-6"><p class="text-xs font-bold uppercase tracking-widest text-primary">MovieScope 榜单</p><h1 class="mt-2 text-3xl font-extrabold md:text-4xl">{{data.title}}</h1><p class="mt-3 text-sm text-on-surface-variant">{{data.description}}</p></header><CatalogPosterGrid :items="data.results" :hide-rating="preset==='upcoming'"/><PaginationBar :page="page" :total-pages="data.totalPages" :total-results="data.totalResults" label="部作品" @change="setPage"/></div></template></PageState></main><GlobalFooter/></div></template>
