<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import GlobalHeader from '../components/global/GlobalHeader.vue'
import GlobalFooter from '../components/global/GlobalFooter.vue'
import PageState from '../components/catalog/PageState.vue'
import { useAsyncData } from '../composables/useAsyncData'
import { fetchSearch } from '../services/catalog-api'
import type { CatalogMedia, SearchResult, SearchType } from '../types/catalog'
import { formatCount, formatRuntime } from '../utils/format'

const route = useRoute(); const router = useRouter()
const draft = reactive({ genres: [] as number[], yearFrom: '', yearTo: '', minRating: 0, list: 'all', sort: 'relevance' })
const mobileFilters = ref(false)
const q = computed(() => typeof route.query.q === 'string' ? route.query.q : '')
const type = computed(() => (typeof route.query.type === 'string' ? route.query.type : 'multi') as SearchType)
const page = computed(() => Number(route.query.page || 1))
const { data, loading, error, reload } = useAsyncData(() => fetchSearch({ query: q.value, type: type.value, page: page.value }), [q, type, page])
const genreOptions = computed(() => type.value === 'tv' ? data.value?.genres.tv || [] : data.value?.genres.movie || [])
const results = computed(() => {
  let items = [...(data.value?.results || [])]
  if (draft.genres.length) items = items.filter((item) => item.mediaType === 'person' || item.mediaType === 'keyword' || item.genres?.some((name) => genreOptions.value.some((genre) => draft.genres.includes(genre.id) && genre.name === name)))
  items = items.filter((item) => item.mediaType === 'person' || item.mediaType === 'keyword' || ((!draft.yearFrom || (item.year || 0) >= Number(draft.yearFrom)) && (!draft.yearTo || (item.year || 9999) <= Number(draft.yearTo)) && (!draft.minRating || (item.imdbRating ?? item.tmdbRating ?? 0) >= draft.minRating)))
  if (draft.sort === 'rating') items.sort((a, b) => rating(b) - rating(a))
  if (draft.sort === 'latest') items.sort((a, b) => yearOf(b) - yearOf(a))
  if (draft.sort === 'popularity') items.sort((a, b) => (isKeyword(b) ? 0 : b.popularity || 0) - (isKeyword(a) ? 0 : a.popularity || 0))
  return items
})
function isPerson(item: SearchResult): item is Extract<SearchResult, { mediaType: 'person' }> { return item.mediaType === 'person' }
function isKeyword(item: SearchResult): item is Extract<SearchResult, { mediaType: 'keyword' }> { return item.mediaType === 'keyword' }
function rating(item: SearchResult) { return isPerson(item) || isKeyword(item) ? 0 : item.imdbRating ?? item.tmdbRating ?? 0 }
function yearOf(item: SearchResult) { return isPerson(item) || isKeyword(item) ? 0 : item.year || 0 }
function clearFilters() { draft.genres=[];draft.yearFrom='';draft.yearTo='';draft.minRating=0;draft.list='all';draft.sort='relevance' }
function setPage(next: number) { router.push({ query: { ...route.query, page: Math.max(1, Math.min(data.value?.totalPages || 1, next)) } }) }
function typeLabel(value: SearchType) { return ({multi:'全部',movie:'电影',tv:'剧集',person:'影人',keyword:'关键词'} as Record<string,string>)[value] || '全部' }
watch(q, () => clearFilters())
</script>

<template>
<div class="min-h-screen bg-background text-on-surface"><GlobalHeader />
<main class="mx-auto flex max-w-[1216px] gap-6 px-4 pb-12 pt-[74px] md:px-8">
<button class="fixed bottom-5 right-5 z-30 flex h-11 items-center gap-2 rounded-full bg-primary-container px-4 text-sm font-bold text-on-primary-container shadow-xl lg:hidden" @click="mobileFilters=true"><span class="material-symbols-outlined">tune</span>筛选</button>
<div v-if="mobileFilters" class="fixed inset-0 z-[60] bg-black/65 lg:hidden" @click.self="mobileFilters=false"></div>
<aside :class="mobileFilters ? 'fixed inset-y-0 left-0 z-[70] w-[290px] overflow-y-auto p-4 pt-6' : 'hidden'" class="flex-none bg-background lg:sticky lg:top-[66px] lg:block lg:h-fit lg:w-60 lg:p-0">
<div class="space-y-7 rounded-xl border border-white/5 bg-surface-container p-5">
<div class="flex items-center justify-between"><h2 class="font-label-caps text-xs font-bold text-primary">筛选</h2><button class="text-[10px] font-bold text-outline hover:text-on-surface" @click="clearFilters">清除全部</button></div>
<section><h3 class="mb-3 text-sm font-bold">类型</h3><div class="max-h-44 space-y-2 overflow-y-auto pr-2"><label v-for="genre in genreOptions" :key="genre.id" class="flex cursor-pointer items-center gap-3 text-sm text-on-surface-variant hover:text-on-surface"><input v-model="draft.genres" :value="genre.id" class="h-4 w-4 accent-primary-container" type="checkbox">{{ genre.name }}</label></div></section>
<section><h3 class="mb-3 text-sm font-bold">发行年份</h3><div class="flex gap-2"><input v-model="draft.yearFrom" class="w-1/2 rounded bg-surface-variant px-3 py-2 text-sm outline-none ring-1 ring-white/5 focus:ring-primary" placeholder="起始" inputmode="numeric"><input v-model="draft.yearTo" class="w-1/2 rounded bg-surface-variant px-3 py-2 text-sm outline-none ring-1 ring-white/5 focus:ring-primary" placeholder="结束" inputmode="numeric"></div></section>
<section><h3 class="mb-3 text-sm font-bold">特别榜单</h3><label class="mb-2 flex items-center gap-3 text-sm text-on-surface-variant"><input v-model="draft.list" value="all" type="radio">全部影视</label><RouterLink to="/?#高分榜" class="flex items-center gap-3 text-sm text-on-surface-variant hover:text-primary"><span class="material-symbols-outlined text-lg">emoji_events</span>IMDb Top 250</RouterLink></section>
<section><h3 class="mb-3 text-sm font-bold">最低评分（{{ draft.minRating.toFixed(1) }}+）</h3><input v-model.number="draft.minRating" class="w-full accent-primary-container" min="0" max="10" step="0.5" type="range"></section>
<button class="w-full rounded bg-surface-variant py-2 text-sm font-bold lg:hidden" @click="mobileFilters=false">查看结果</button>
</div></aside>
<section class="min-w-0 flex-1">
<PageState :loading="loading" :error="error" @retry="reload"><template v-if="data">
<div class="mb-6 flex flex-col justify-between gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end"><div><p class="mb-2 text-xs font-bold uppercase tracking-widest text-primary">{{ typeLabel(type) }}搜索</p><h1 class="text-2xl font-extrabold">搜索“{{ q || '全部内容' }}”</h1><p class="mt-2 text-sm text-on-surface-variant">共找到 {{ formatCount(data.totalResults) }} 条结果</p></div><label class="flex items-center gap-2 text-sm text-on-surface-variant">排序<select v-model="draft.sort" class="rounded border border-white/10 bg-surface-container px-3 py-2 font-bold text-on-surface"><option value="relevance">相关度</option><option value="latest">最新发行</option><option value="rating">评分最高</option><option value="popularity">用户热度</option></select></label></div>
<div v-if="results.length" class="space-y-5">
<template v-for="item in results" :key="item.mediaType+':'+item.id">
<RouterLink v-if="isKeyword(item)" :to="{name:'search',query:{q:item.name,type:'multi'}}" class="flex items-center justify-between rounded-xl border border-white/5 bg-surface-container p-5 hover:bg-surface-container-high"><div><p class="text-xs font-bold uppercase tracking-widest text-primary">关键词</p><h2 class="mt-1 text-xl font-bold">{{item.name}}</h2></div><span class="material-symbols-outlined text-primary">arrow_forward</span></RouterLink>
<RouterLink v-else-if="isPerson(item)" :to="{name:'person',params:{id:item.id}}" class="group flex gap-5 rounded-xl border border-white/5 bg-surface-container p-4 hover:bg-surface-container-high"><img :src="item.profile" :alt="item.name" class="h-36 w-28 rounded-lg object-cover"><div><p class="text-xs font-bold uppercase tracking-widest text-primary">影人 · {{ item.department || '影视工作者' }}</p><h2 class="mt-2 text-xl font-bold group-hover:text-primary">{{ item.name }}</h2><p class="mt-3 line-clamp-2 text-sm text-on-surface-variant">代表作品：{{ item.knownFor.map(media=>media.title).join('、') || '暂无' }}</p></div></RouterLink>
<RouterLink v-else :to="{name:'title',params:{type:item.mediaType,id:item.id}}" class="group grid grid-cols-[112px_1fr] gap-4 rounded-xl border border-white/5 bg-surface-container p-3 hover:bg-surface-container-high sm:grid-cols-[150px_1fr]"><img :src="item.poster" :alt="item.title" class="aspect-[2/3] w-full rounded-lg object-cover"><div class="min-w-0 py-1"><div class="flex items-start justify-between gap-3"><div><p class="text-[10px] font-bold uppercase tracking-widest text-primary">{{ item.genres.slice(0,2).join(' · ') || (item.mediaType==='tv'?'剧集':'电影') }}</p><h2 class="mt-1 text-lg font-bold group-hover:text-primary sm:text-xl">{{ item.title }} <span class="text-on-surface-variant">({{ item.year || '年份暂无' }})</span></h2></div><span class="material-symbols-outlined text-outline">bookmark</span></div><p class="mt-3 line-clamp-3 text-sm leading-6 text-on-surface-variant">{{ item.overview }}</p><div class="mt-4 flex flex-wrap gap-3 text-xs"><span v-if="item.imdbRating!=null" class="rounded bg-[#121212] px-2.5 py-1 font-black text-primary-container">IMDb {{ item.imdbRating.toFixed(1) }} · {{ formatCount(item.imdbVoteCount) }}人</span><span v-else-if="item.tmdbRating!=null" class="rounded bg-[#121212] px-2.5 py-1 font-black text-primary-container">TMDB {{ item.tmdbRating.toFixed(1) }}</span><span>{{ formatRuntime(null) }}</span></div></div></RouterLink>
</template></div><div v-else class="rounded-xl border border-dashed border-white/10 py-20 text-center text-on-surface-variant">当前筛选条件下没有结果</div>
<nav v-if="data.totalPages>1" class="mt-8 flex items-center justify-center gap-2"><button class="h-10 rounded bg-surface-container px-3 disabled:opacity-40" :disabled="page<=1" @click="setPage(page-1)">上一页</button><span class="flex h-10 min-w-10 items-center justify-center rounded bg-primary-container px-3 font-bold text-on-primary-container">{{ page }}</span><span class="text-sm text-on-surface-variant">/ {{ data.totalPages }}</span><button class="h-10 rounded bg-surface-container px-3 disabled:opacity-40" :disabled="page>=data.totalPages" @click="setPage(page+1)">下一页</button></nav>
</template></PageState></section></main><GlobalFooter /></div>
</template>
