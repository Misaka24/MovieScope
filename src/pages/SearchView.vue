<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import GlobalHeader from '../components/global/GlobalHeader.vue'
import GlobalFooter from '../components/global/GlobalFooter.vue'
import PageState from '../components/catalog/PageState.vue'
import PaginationBar from '../components/catalog/PaginationBar.vue'
import { useAsyncData } from '../composables/useAsyncData'
import { fetchSearch } from '../services/catalog-api'
import type { CatalogMedia, SearchResult, SearchType } from '../types/catalog'
import { formatCount } from '../utils/format'
import { useAuth } from '../composables/useAuth'
import { mediaApi, profileApi } from '../services/user-api'

const route = useRoute(); const router = useRouter(); const auth=useAuth()
const draft = reactive({ genres: [] as number[], yearFrom: '', yearTo: '', minRating: 0, sort: 'relevance' })
const mobileFilters = ref(false)
const bookmarks = ref<Set<string>>(new Set())
const yearPresets = [
  { label: '近两年', from: new Date().getFullYear() - 1, to: new Date().getFullYear() },
  { label: '2020年代', from: 2020, to: 2029 },
  { label: '2010年代', from: 2010, to: 2019 },
  { label: '2000年代', from: 2000, to: 2009 },
  { label: '经典影片', from: 1900, to: 1999 },
]
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
function clearFilters() { draft.genres=[];draft.yearFrom='';draft.yearTo='';draft.minRating=0;draft.sort='relevance' }
function setYearPreset(from: number, to: number) { draft.yearFrom=String(from);draft.yearTo=String(to) }
function isYearPreset(from: number, to: number) { return draft.yearFrom===String(from)&&draft.yearTo===String(to) }
function ratingSource(item: CatalogMedia) { return item.imdbRating != null ? 'IMDb' : 'TMDB' }
function voteCount(item: CatalogMedia) { return item.imdbRating != null ? item.imdbVoteCount : item.tmdbVoteCount }
function ratingProgress(item: CatalogMedia) { return Math.max(0, Math.min(100, rating(item) * 10)) }
function setPage(next: number) { router.push({ query: { ...route.query, page: Math.max(1, Math.min(data.value?.totalPages || 1, next)) } }) }
function bookmarkKey(item: CatalogMedia) { return item.mediaType + ':' + item.id }
function isBookmarked(item: CatalogMedia) { return bookmarks.value.has(bookmarkKey(item)) }
async function loadBookmarks(){if(!auth.user.value){bookmarks.value=new Set();return}try{const profile=await profileApi.own();bookmarks.value=new Set(profile.entries.filter(entry=>entry.favorite).map(entry=>entry.mediaType+':'+entry.tmdbId))}catch{}}
async function toggleBookmark(item: CatalogMedia){if(!auth.user.value){router.push({name:'auth',query:{mode:'login',redirect:route.fullPath}});return}const value=bookmarkKey(item),active=bookmarks.value.has(value),existing=await mediaApi.get(item.mediaType,item.id);await mediaApi.save(item.mediaType,item.id,{imdbId:item.imdbId,title:item.title,posterUrl:item.poster,releaseYear:item.year,watchStatus:existing?.watchStatus||null,favorite:!active,rating:existing?.rating||null,reviewText:existing?.reviewText||null,containsSpoiler:existing?.containsSpoiler||false});const next=new Set(bookmarks.value);active?next.delete(value):next.add(value);bookmarks.value=next}
onMounted(loadBookmarks)
watch(()=>auth.user.value?.id,loadBookmarks)
function typeLabel(value: SearchType) { return ({multi:'全部',movie:'电影',tv:'剧集',person:'影人',keyword:'关键词'} as Record<string,string>)[value] || '全部' }
watch(q, () => clearFilters())
</script>

<template>
<div class="min-h-screen bg-background text-on-surface"><GlobalHeader />
<main class="mx-auto flex max-w-[1216px] gap-6 px-4 pb-12 pt-[74px] md:px-8">
<button class="fixed bottom-5 right-5 z-30 flex h-11 items-center gap-2 rounded-full bg-primary-container px-4 text-sm font-bold text-on-primary-container shadow-xl lg:hidden" @click="mobileFilters=true"><span class="material-symbols-outlined">tune</span>筛选</button>
<div v-if="mobileFilters" class="fixed inset-0 z-[60] bg-black/65 lg:hidden" @click.self="mobileFilters=false"></div>
<aside :class="mobileFilters ? 'fixed inset-y-0 left-0 z-[70] w-[310px] overflow-y-auto p-4 pt-6' : 'hidden'" class="flex-none bg-background lg:sticky lg:top-[66px] lg:block lg:h-fit lg:w-72 lg:p-0">
<div class="filter-panel space-y-6">
<div class="flex items-center justify-between border-b border-white/10 pb-4"><div><h2 class="text-base font-extrabold">筛选结果</h2><p class="mt-1 text-[11px] text-on-surface-variant">当前页面即时筛选</p></div><button class="rounded px-2 py-1 text-[11px] font-bold text-primary transition-colors hover:bg-primary/10" @click="clearFilters">重置</button></div>
<section><h3 class="filter-title"><span class="material-symbols-outlined">category</span>影视类型</h3><div class="genre-options"><label v-for="genre in genreOptions" :key="genre.id" class="genre-option"><input v-model="draft.genres" :value="genre.id" type="checkbox"><span>{{ genre.name }}</span></label></div></section>
<section><h3 class="filter-title"><span class="material-symbols-outlined">calendar_month</span>发行年份</h3><div class="year-presets"><button v-for="preset in yearPresets" :key="preset.label" type="button" :class="{active:isYearPreset(preset.from,preset.to)}" @click="setYearPreset(preset.from,preset.to)">{{preset.label}}</button></div><div class="year-range"><input v-model="draft.yearFrom" class="filter-input" placeholder="起始年份" inputmode="numeric"><span>至</span><input v-model="draft.yearTo" class="filter-input" placeholder="结束年份" inputmode="numeric"></div></section>
<section><div class="mb-3 flex items-center justify-between"><h3 class="filter-title mb-0"><span class="material-symbols-outlined">star</span>最低评分</h3><strong class="text-sm text-primary">{{ draft.minRating.toFixed(1) }}+</strong></div><input v-model.number="draft.minRating" class="w-full accent-primary-container" min="0" max="10" step="0.5" type="range"><div class="mt-1 flex justify-between text-[10px] text-outline"><span>不限</span><span>10分</span></div></section>
<button class="w-full rounded bg-surface-variant py-2 text-sm font-bold lg:hidden" @click="mobileFilters=false">查看结果</button>
</div></aside>
<section class="min-w-0 flex-1">
<PageState :loading="loading" :error="error" @retry="reload"><template v-if="data">
<div class="mb-6 flex flex-col justify-between gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end"><div><p class="mb-2 text-xs font-bold uppercase tracking-widest text-primary">{{ typeLabel(type) }}搜索</p><h1 class="text-2xl font-extrabold">搜索“{{ q || '全部内容' }}”</h1><p class="mt-2 text-sm text-on-surface-variant">共找到 {{ formatCount(data.totalResults) }} 条结果</p></div><label class="flex items-center gap-2 text-sm text-on-surface-variant">排序<div class="select-shell"><select v-model="draft.sort" class="catalog-select"><option value="relevance">相关度</option><option value="latest">最新发行</option><option value="rating">评分最高</option><option value="popularity">用户热度</option></select><span class="material-symbols-outlined">expand_more</span></div></label></div>
<div v-if="results.length" class="space-y-5">
<template v-for="item in results" :key="item.mediaType+':'+item.id">
<RouterLink v-if="isKeyword(item)" :to="{name:'search',query:{q:item.name,type:'multi'}}" class="flex items-center justify-between rounded-xl border border-white/5 bg-surface-container p-5 hover:bg-surface-container-high"><div><p class="text-xs font-bold uppercase tracking-widest text-primary">关键词</p><h2 class="mt-1 text-xl font-bold">{{item.name}}</h2></div><span class="material-symbols-outlined text-primary">arrow_forward</span></RouterLink>
<RouterLink v-else-if="isPerson(item)" :to="{name:'person',params:{id:item.id}}" class="group flex gap-5 rounded-xl border border-white/5 bg-surface-container p-4 hover:bg-surface-container-high"><img :src="item.profile" :alt="item.name" class="h-36 w-28 rounded-lg object-cover"><div><p class="text-xs font-bold uppercase tracking-widest text-primary">影人 · {{ item.department || '影视工作者' }}</p><h2 class="mt-2 text-xl font-bold group-hover:text-primary">{{ item.name }}</h2><p class="mt-3 line-clamp-2 text-sm text-on-surface-variant">代表作品：{{ item.knownFor.map(media=>media.title).join('、') || '暂无' }}</p></div></RouterLink>
<RouterLink v-else :to="{name:'title',params:{type:item.mediaType,id:item.id}}" class="search-media group grid grid-cols-[112px_1fr] gap-4 sm:grid-cols-[150px_1fr]"><div class="overflow-hidden rounded-lg"><img :src="item.poster" :alt="item.title" class="aspect-[2/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"></div><div class="grid min-w-0 grid-rows-[auto_auto_1fr_auto] py-1"><div class="flex items-start justify-between gap-3"><p class="min-h-5 text-[10px] font-bold uppercase tracking-widest text-primary">{{ item.genres.slice(0,2).join(' · ') || (item.mediaType==='tv'?'剧集':'电影') }}</p><button type="button" class="favorite-button" :class="isBookmarked(item) ? 'is-active' : ''" :aria-label="isBookmarked(item) ? '取消收藏' : '加入收藏'" :title="isBookmarked(item) ? '取消收藏' : '加入收藏'" @click.prevent.stop="toggleBookmark(item)"><span class="material-symbols-outlined">{{isBookmarked(item)?'favorite':'favorite_border'}}</span></button></div><h2 class="min-h-8 truncate text-lg font-bold group-hover:text-primary sm:text-xl">{{ item.title }} <span class="text-on-surface-variant">({{ item.year || '年份暂无' }})</span></h2><p class="mt-2 line-clamp-2 self-start text-sm leading-6 text-on-surface-variant">{{ item.overview || '暂无简介' }}</p><div class="mt-4 flex items-center gap-3"><div v-if="rating(item)" class="rating-ring" :style="{'--rating-progress':ratingProgress(item)+'%'}"><strong>{{rating(item).toFixed(1)}}</strong><small>/10</small></div><div v-if="rating(item)" class="text-xs"><p class="font-black text-primary-container">{{ratingSource(item)}} 评分</p><p class="mt-1 text-on-surface-variant">{{formatCount(voteCount(item))}} 人评分</p></div><span v-else class="text-xs text-outline">暂无评分</span></div></div></RouterLink>
</template></div><div v-else class="rounded-xl border border-dashed border-white/10 py-20 text-center text-on-surface-variant">当前筛选条件下没有结果</div>
<PaginationBar :page="page" :total-pages="data.totalPages" :total-results="data.totalResults" label="条结果" @change="setPage"/>
</template></PageState></section></main><GlobalFooter /></div>
</template>

<style scoped>
.filter-panel{border:1px solid rgba(255,255,255,.1);border-radius:14px;background:linear-gradient(155deg,rgba(45,45,45,.98),rgba(29,29,29,.98));padding:21px;box-shadow:0 18px 44px rgba(0,0,0,.2)}.filter-title{margin-bottom:12px;display:flex;align-items:center;gap:8px;font-size:13px;font-weight:800}.filter-title .material-symbols-outlined{font-size:18px;color:#f5c518}.genre-options{display:grid;max-height:206px;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;overflow-y:auto;padding-right:8px;scrollbar-color:#777 transparent;scrollbar-width:thin}.genre-options::-webkit-scrollbar{width:6px}.genre-options::-webkit-scrollbar-track{border-radius:10px;background:rgba(255,255,255,.035)}.genre-options::-webkit-scrollbar-thumb{border-radius:10px;background:#696969}.genre-options::-webkit-scrollbar-thumb:hover{background:#8a8a8a}.genre-option{min-width:0;cursor:pointer}.genre-option input{position:absolute;opacity:0}.genre-option span{display:block;overflow:hidden;border:1px solid rgba(255,255,255,.1);border-radius:6px;padding:7px 4px;text-align:center;font-size:12px;color:#c9c9cf;text-overflow:ellipsis;white-space:nowrap;transition:.18s}.genre-option:hover span{border-color:rgba(245,197,24,.42);background:rgba(255,255,255,.035);color:#fff}.genre-option input:checked+span{border-color:#f5c518;background:#f5c518;color:#151515;font-weight:800;box-shadow:0 5px 14px rgba(245,197,24,.14)}.year-presets{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.year-presets button{border:1px solid rgba(255,255,255,.09);border-radius:6px;padding:7px 6px;font-size:11px;color:#c5c7ce;transition:.18s}.year-presets button:last-child{grid-column:1/-1}.year-presets button:hover,.year-presets button.active{border-color:rgba(245,197,24,.55);background:rgba(245,197,24,.1);color:#ffe08a}.year-range{margin-top:9px;display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:7px}.year-range>span{font-size:11px;color:#948b73}.filter-input{width:100%;min-width:0;border:1px solid rgba(255,255,255,.1);border-radius:6px;background:#303030;padding:8px 7px;text-align:center;font-size:11px;outline:none;transition:.2s}.filter-input:focus{border-color:#f5c518;box-shadow:0 0 0 3px rgba(245,197,24,.09)}.select-shell{position:relative;min-width:142px}.catalog-select{width:100%;appearance:none;border:1px solid rgba(255,255,255,.12);border-radius:8px;background:linear-gradient(180deg,#303030,#272727);padding:9px 40px 9px 13px;font-size:13px;font-weight:800;color:#fff;outline:none;box-shadow:inset 0 1px rgba(255,255,255,.04);transition:.2s}.select-shell:hover .catalog-select,.catalog-select:focus{border-color:rgba(245,197,24,.65);background:#303030;box-shadow:0 0 0 3px rgba(245,197,24,.08)}.catalog-select option{background:#262626;color:#f1f1f1}.select-shell>.material-symbols-outlined{pointer-events:none;position:absolute;right:11px;top:50%;font-size:19px;color:#f5c518;transform:translateY(-50%);transition:transform .2s}.select-shell:focus-within>.material-symbols-outlined{transform:translateY(-50%) rotate(180deg)}.search-media{overflow:hidden;border:1px solid rgba(255,255,255,.06);border-radius:12px;background:#252525;padding:12px;transition:.3s}.search-media:hover{transform:translateY(-2px);border-color:rgba(245,197,24,.2);background:#2d2d2d;box-shadow:0 18px 35px rgba(0,0,0,.24)}.favorite-button{display:grid;height:34px;width:34px;flex:none;place-items:center;border-radius:50%;color:#999;transition:.2s}.favorite-button:hover,.favorite-button.is-active{background:rgba(245,197,24,.1);color:#f5c518}.favorite-button .material-symbols-outlined{font-size:21px}.rating-ring{--rating-progress:0%;display:grid;height:56px;width:56px;flex:none;place-content:center;border-radius:50%;background:radial-gradient(circle closest-side,#202020 78%,transparent 80% 100%),conic-gradient(#f5c518 var(--rating-progress),rgba(255,255,255,.1) 0);text-align:center;line-height:1}.rating-ring strong{font-size:16px}.rating-ring small{margin-top:2px;font-size:8px;color:#aaa}
</style>
