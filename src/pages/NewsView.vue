<script setup lang="ts">
import GlobalHeader from '../components/global/GlobalHeader.vue'
import GlobalFooter from '../components/global/GlobalFooter.vue'
import PageState from '../components/catalog/PageState.vue'
import { useAsyncData } from '../composables/useAsyncData'
import { fetchNews } from '../services/catalog-api'
import { formatDate } from '../utils/format'
const {data,loading,error,reload}=useAsyncData(fetchNews)
</script>
<template><div class="min-h-screen bg-background text-on-surface"><GlobalHeader/><main class="mx-auto max-w-[960px] px-4 pb-16 pt-[82px] md:px-8"><header class="mb-7 border-b border-white/10 pb-6"><p class="text-xs font-bold uppercase tracking-widest text-primary">IMDb 新闻</p><h1 class="mt-2 text-3xl font-extrabold md:text-4xl">影坛动态</h1><p class="mt-3 text-sm text-on-surface-variant">来自真实新闻接口的电影产业、演员与项目动态。</p></header><PageState :loading="loading" :error="error" @retry="reload"><template v-if="data"><div class="divide-y divide-white/10 border-y border-white/10"><article v-for="item in data" :key="item.id" class="py-6"><div class="flex flex-wrap items-center gap-3 text-xs"><span class="font-bold uppercase tracking-widest text-primary">{{item.category}}</span><time class="text-outline">{{formatDate(item.publishedAt)}}</time></div><h2 class="mt-2 text-xl font-extrabold leading-7">{{item.title}}</h2><p class="mt-3 text-sm leading-6 text-on-surface-variant">{{item.summary}}</p><a v-if="item.url" :href="item.url" target="_blank" rel="noreferrer" class="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary">阅读原文<span class="material-symbols-outlined text-lg">open_in_new</span></a></article></div></template></PageState></main><GlobalFooter/></div></template>
