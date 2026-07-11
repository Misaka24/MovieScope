<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'

interface SearchType {
  label: string
  icon: string
  hint: string
}

const menuOpen = shallowRef(false)
const searchOpen = shallowRef(false)
const searchType = shallowRef<SearchType>({ label: '全部', icon: 'search', hint: '搜索电影、剧集、影人' })
const root = shallowRef<HTMLElement>()
const query = shallowRef('')
const router = useRouter()
const route = useRoute()
const notice = shallowRef('')
const accountOpen = shallowRef(false)
const auth = useAuth()

const searchTypes: SearchType[] = [
  { label: '全部', icon: 'search', hint: '搜索电影、剧集、影人' },
  { label: '影视作品', icon: 'movie', hint: '搜索电影或剧集' },
  { label: '电影', icon: 'theaters', hint: '搜索电影' },
  { label: '剧集', icon: 'live_tv', hint: '搜索电视剧或网络剧' },
  { label: '影人', icon: 'group', hint: '搜索演员、导演或编剧' },
  { label: '关键词', icon: 'label', hint: '按关键词搜索' },
]

const menuGroups = [
  { icon: 'movie', title: '电影', items: ['正在上映', '即将上映', '热门电影', '高分电影', '按类型浏览'] },
  { icon: 'live_tv', title: '剧集', items: ['热门剧集', '高分剧集', '今日播出', '按类型浏览'] },
  { icon: 'explore', title: '探索', items: ['今日趋势', '本周趋势', '观看平台', '地区与年份'] },
  { icon: 'emoji_events', title: '榜单', items: ['IMDb Top 250', '电影票房榜'] },
  { icon: 'person', title: '影人', items: ['热门影人', '热门演员', '导演与编剧'] },
  { icon: 'newspaper', title: '资讯', items: ['影坛动态'] },
]

function chooseSearchType(type: SearchType) {
  searchType.value = type
  searchOpen.value = false
  accountOpen.value = false
}

function search() {
  const value = query.value.trim()
  if (!value) return
  const typeMap: Record<string, string> = { '全部': 'multi', '影视作品': 'multi', '电影': 'movie', '剧集': 'tv', '影人': 'person', '关键词': 'keyword' }
  router.push({ name: 'search', query: { q: value, type: typeMap[searchType.value.label] || 'multi' } })
}

function openMenuItem(group: string, item: string) {
  menuOpen.value = false
  const routes: Record<string, Parameters<typeof router.push>[0]> = {
    '电影/正在上映': { name: 'browse', params: { preset: 'now-playing' } },
    '电影/即将上映': { name: 'browse', params: { preset: 'upcoming' } },
    '电影/热门电影': { name: 'browse', params: { preset: 'popular-movies' } },
    '电影/高分电影': { name: 'browse', params: { preset: 'top-movies' } },
    '电影/按类型浏览': { name: 'explore', query: { media: 'movie' } },
    '剧集/热门剧集': { name: 'browse', params: { preset: 'popular-tv' } },
    '剧集/高分剧集': { name: 'browse', params: { preset: 'top-tv' } },
    '剧集/今日播出': { name: 'browse', params: { preset: 'airing-today' } },
    '剧集/按类型浏览': { name: 'explore', query: { media: 'tv' } },
    '探索/今日趋势': { name: 'browse', params: { preset: 'trending-day' } },
    '探索/本周趋势': { name: 'browse', params: { preset: 'trending-week' } },
    '探索/观看平台': { name: 'providers' },
    '探索/地区与年份': { name: 'explore' },
    '榜单/IMDb Top 250': { name: 'browse', params: { preset: 'imdb-top-250' } },
    '榜单/电影票房榜': { name: 'explore', query: { media: 'movie', sort: 'revenue.desc' } },
    '影人/热门影人': { name: 'people' },
    '影人/热门演员': { name: 'people', query: { department: 'Acting' } },
    '影人/导演与编剧': { name: 'people', query: { department: 'Creators' } },
    '资讯/影坛动态': { name: 'news' },
  }
  const target = routes[`${group}/${item}`]
  if (target) return router.push(target)
  return router.push({ name: 'notice', query: { title: item, message: `${item}需要用户系统、社区数据或后续专题接口支持，当前尚未开放。` } })
}

async function signOut() { await auth.logout(); accountOpen.value=false; router.push('/') }

function toggleMenu() {
  menuOpen.value = !menuOpen.value
  searchOpen.value = false
}

function toggleSearch() {
  searchOpen.value = !searchOpen.value
  menuOpen.value = false
  accountOpen.value = false
}

function closePanels(event: MouseEvent) {
  if (root.value?.contains(event.target as Node)) return
  menuOpen.value = false
  searchOpen.value = false
  accountOpen.value = false
}

function closeOnEscape(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  menuOpen.value = false
  searchOpen.value = false
  accountOpen.value = false
}

onMounted(() => {
  query.value = typeof route.query.q === 'string' ? route.query.q : ''
  document.addEventListener('click', closePanels)
  document.addEventListener('keydown', closeOnEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closePanels)
  document.removeEventListener('keydown', closeOnEscape)
})
</script>

<template>
  <header ref="root" class="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#121212] shadow-2xl">
    <div class="mx-auto flex h-[50px] w-full max-w-[1440px] items-center gap-2 px-3 md:px-6">
      <RouterLink to="/" class="flex-none rounded bg-primary-container px-2.5 py-1.5 text-[9.5px] font-black leading-none text-on-primary-container shadow-sm">
        MOVIE<br>SCOPE
      </RouterLink>

      <button class="header-action" type="button" :aria-expanded="menuOpen" @click.stop="toggleMenu">
        <span class="material-symbols-outlined text-xl">menu</span>
        <span class="hidden text-sm font-bold sm:inline">菜单</span>
      </button>

      <div class="relative min-w-0 flex-1">
        <div class="flex h-[34px] w-full items-stretch overflow-visible rounded bg-surface-container-high ring-1 ring-white/10 focus-within:ring-primary/60">
          <button class="flex flex-none items-center gap-0.5 border-r border-white/10 px-2.5 text-on-surface-variant hover:bg-surface-container-highest" type="button" :aria-expanded="searchOpen" @click.stop="toggleSearch">
            <span class="hidden text-[13px] font-bold sm:inline">{{ searchType.label }}</span>
            <span class="material-symbols-outlined text-base">arrow_drop_down</span>
          </button>
          <input v-model="query" class="min-w-0 flex-1 border-0 bg-transparent px-3 text-[13px] text-on-surface outline-none placeholder:text-on-surface-variant focus:ring-0" :placeholder="`在 MOVIESCOPE ${searchType.hint}`" type="search" @keydown.enter="search">
          <button class="flex w-9 flex-none items-center justify-center text-on-surface-variant hover:text-primary" type="button" aria-label="搜索" @click="search">
            <span class="material-symbols-outlined text-xl leading-none">search</span>
          </button>
        </div>

        <Transition name="dropdown">
          <div v-if="searchOpen" class="absolute left-0 top-10 z-50 w-64 overflow-hidden rounded-lg border border-white/10 bg-[#1d1d1d] py-1.5 shadow-2xl">
            <button v-for="type in searchTypes" :key="type.label" type="button" class="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-on-surface hover:bg-white/5" :class="{ 'text-primary': searchType.label === type.label }" @click="chooseSearchType(type)">
              <span class="material-symbols-outlined text-xl">{{ type.icon }}</span>
              <span class="font-semibold">{{ type.label }}</span>
            </button>
            <div class="mt-2 border-t border-white/10 pt-2">
              <RouterLink class="flex items-center gap-3 px-4 py-2 text-sm font-semibold text-on-surface hover:bg-white/5" to="/explore" @click="searchOpen=false">
                <span class="material-symbols-outlined text-xl">manage_search</span>
                高级搜索
                <span class="material-symbols-outlined ml-auto">chevron_right</span>
              </RouterLink>
            </div>
          </div>
        </Transition>
      </div>

      <RouterLink class="header-action" to="/explore">
        <span class="material-symbols-outlined text-xl">explore</span>
        <span class="hidden text-sm font-bold md:inline">探索</span>
      </RouterLink>
      <template v-if="!auth.user.value"><RouterLink class="header-action hidden md:flex" :to="{name:'auth',query:{mode:'login'}}"><span class="text-sm font-bold">登录</span></RouterLink><RouterLink class="hidden h-[34px] items-center rounded bg-primary-container px-3.5 text-sm font-bold text-on-primary-container hover:brightness-105 lg:flex" :to="{name:'auth',query:{mode:'register'}}">注册</RouterLink></template>
      <div v-else class="relative"><button type="button" class="flex h-[36px] items-center gap-2 rounded px-2 hover:bg-white/5" @click.stop="accountOpen=!accountOpen;menuOpen=false;searchOpen=false"><img :src="auth.user.value.avatarUrl" class="h-7 w-7 rounded-full object-cover"><span class="hidden max-w-24 truncate text-sm font-bold md:block">{{auth.user.value.displayName}}</span><span class="material-symbols-outlined text-base">arrow_drop_down</span></button><Transition name="dropdown"><div v-if="accountOpen" class="absolute right-0 top-11 z-50 w-52 overflow-hidden rounded-lg border border-white/10 bg-[#1d1d1d] py-1.5 shadow-2xl"><RouterLink class="account-item" to="/me" @click="accountOpen=false"><span class="material-symbols-outlined">account_circle</span>个人主页</RouterLink><RouterLink class="account-item" :to="{name:'public-profile',params:{username:auth.user.value.username}}" @click="accountOpen=false"><span class="material-symbols-outlined">public</span>公开主页</RouterLink><RouterLink v-if="auth.user.value.role==='admin'" class="account-item" to="/admin" @click="accountOpen=false"><span class="material-symbols-outlined">admin_panel_settings</span>管理后台</RouterLink><button class="account-item w-full" @click="signOut"><span class="material-symbols-outlined">logout</span>退出登录</button></div></Transition></div>
    </div>

    <Transition name="menu">
      <div v-if="menuOpen" class="absolute inset-x-0 top-[50px] max-h-[calc(100vh-50px)] overflow-y-auto border-b border-white/10 bg-[#191919] shadow-2xl">
        <div class="mx-auto grid max-w-[1120px] grid-cols-1 gap-x-10 gap-y-6 px-5 py-7 sm:grid-cols-2 lg:grid-cols-3">
          <section v-for="group in menuGroups" :key="group.title">
            <h2 class="mb-2.5 flex items-center gap-2 text-base font-extrabold text-on-surface">
              <span class="material-symbols-outlined text-xl text-primary">{{ group.icon }}</span>
              {{ group.title }}
            </h2>
            <ul class="space-y-2 pl-7 text-sm text-on-surface-variant">
              <li v-for="item in group.items" :key="item"><button type="button" class="hover:text-primary" @click="openMenuItem(group.title, item)">{{ item }}</button></li>
            </ul>
          </section>
        </div>
      </div>
    </Transition>
    <div v-if="notice" class="absolute right-4 top-[58px] rounded-lg border border-primary/25 bg-[#242424] px-4 py-3 text-xs font-semibold text-on-surface shadow-2xl" aria-live="polite">{{ notice }}</div>
  </header>
</template>

<style scoped>
.header-action { display: flex; height: 34px; flex: none; align-items: center; gap: 5px; border-radius: 4px; padding: 0 9px; color: #e2e2e8; transition: background-color .2s, color .2s; }
.header-action:hover { background: rgba(255, 255, 255, .08); color: #ffe5a0; }
.account-item{display:flex;align-items:center;gap:10px;padding:10px 14px;text-align:left;font-size:13px;font-weight:600;color:#e2e2e8}.account-item:hover{background:rgba(255,255,255,.06);color:#f5c518}.account-item .material-symbols-outlined{font-size:19px}
.dropdown-enter-active, .dropdown-leave-active { transition: opacity .16s ease, transform .16s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-8px); }
.menu-enter-active, .menu-leave-active { transition: opacity .22s ease, transform .22s ease; }
.menu-enter-from, .menu-leave-to { opacity: 0; transform: translateY(-12px); }
</style>
