<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import GlobalHeader from '../components/global/GlobalHeader.vue'
import GlobalFooter from '../components/global/GlobalFooter.vue'
import CatalogPosterCard from '../components/catalog/CatalogPosterCard.vue'
import PageState from '../components/catalog/PageState.vue'
import { useAsyncData } from '../composables/useAsyncData'
import { fetchBrowse } from '../services/catalog-api'
const route=useRoute();const router=useRouter();const preset=computed(()=>String(route.params.preset));const page=computed(()=>Number(route.query.page||1));const key=computed(()=>preset.value+':'+page.value)
const {data,loading,error,reload}=useAsyncData(()=>fetchBrowse(preset.value,page.value),[key])
function setPage(value:number){router.push({query:{page:Math.max(1,Math.min(data.value?.totalPages||1,value))}})}
</script>
<template><div class="min-h-screen bg-background text-on-surface"><GlobalHeader/><main class="mx-auto max-w-[1216px] px-4 pb-16 pt-[82px] md:px-8"><PageState :loading="loading" :error="error" @retry="reload"><template v-if="data"><header class="mb-7 border-b border-white/10 pb-6"><p class="text-xs font-bold uppercase tracking-widest text-primary">MovieScope 榜单</p><h1 class="mt-2 text-3xl font-extrabold md:text-4xl">{{data.title}}</h1><p class="mt-3 text-sm text-on-surface-variant">{{data.description}}</p></header><div class="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"><CatalogPosterCard v-for="item in data.results" :key="item.mediaType+item.id" :item="item"/></div><nav v-if="data.totalPages>1" class="mt-10 flex items-center justify-center gap-2"><button class="rounded bg-surface-container px-4 py-2 disabled:opacity-40" :disabled="page<=1" @click="setPage(page-1)">上一页</button><span class="rounded bg-primary-container px-4 py-2 font-bold text-on-primary-container">{{page}}</span><span class="text-sm text-on-surface-variant">/ {{data.totalPages}}</span><button class="rounded bg-surface-container px-4 py-2 disabled:opacity-40" :disabled="page>=data.totalPages" @click="setPage(page+1)">下一页</button></nav></template></PageState></main><GlobalFooter/></div></template>
