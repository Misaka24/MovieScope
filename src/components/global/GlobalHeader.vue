<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef } from 'vue'

interface SearchType {
  label: string
  icon: string
  hint: string
}

const menuOpen = shallowRef(false)
const searchOpen = shallowRef(false)
const searchType = shallowRef<SearchType>({ label: '全部', icon: 'search', hint: '搜索电影、剧集、影人' })
const root = shallowRef<HTMLElement>()

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
  { icon: 'live_tv', title: '剧集', items: ['热门剧集', '高分剧集', '今日播出', '按类型浏览', '剧集资讯'] },
  { icon: 'explore', title: '探索', items: ['今日趋势', '本周趋势', '观看平台', '地区与年份', '个性化发现'] },
  { icon: 'emoji_events', title: '榜单与活动', items: ['IMDb Top 250', '电影高分榜', '剧集高分榜', '奖项与票房', '影展专题'] },
  { icon: 'person', title: '影人', items: ['热门影人', '导演与编剧', '演员作品', '人物资料'] },
  { icon: 'newspaper', title: '资讯与社区', items: ['影坛动态', '中文短评', '深度影评', '用户评价', '帮助中心'] },
]

function chooseSearchType(type: SearchType) {
  searchType.value = type
  searchOpen.value = false
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
  searchOpen.value = false
}

function toggleSearch() {
  searchOpen.value = !searchOpen.value
  menuOpen.value = false
}

function closePanels(event: MouseEvent) {
  if (root.value?.contains(event.target as Node)) return
  menuOpen.value = false
  searchOpen.value = false
}

function closeOnEscape(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  menuOpen.value = false
  searchOpen.value = false
}

onMounted(() => {
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
    <div class="mx-auto flex h-[50px] w-full max-w-[1216px] items-center gap-2 px-3 md:px-6 lg:px-8">
      <a href="/" class="flex-none rounded bg-primary-container px-2.5 py-1.5 text-[9.5px] font-black leading-none text-on-primary-container shadow-sm">
        MOVIE<br>SCOPE
      </a>

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
          <input class="min-w-0 flex-1 border-0 bg-transparent px-3 text-[13px] text-on-surface outline-none placeholder:text-on-surface-variant focus:ring-0" :placeholder="`在 MOVIESCOPE ${searchType.hint}`" type="search">
          <button class="flex w-9 flex-none items-center justify-center text-on-surface-variant hover:text-primary" type="button" aria-label="搜索">
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
              <a class="flex items-center gap-3 px-4 py-2 text-sm font-semibold text-on-surface hover:bg-white/5" href="#探索">
                <span class="material-symbols-outlined text-xl">manage_search</span>
                高级搜索
                <span class="material-symbols-outlined ml-auto">chevron_right</span>
              </a>
            </div>
          </div>
        </Transition>
      </div>

      <a class="header-action" href="#探索">
        <span class="material-symbols-outlined">explore</span>
        <span class="hidden font-bold md:inline">探索</span>
      </a>
      <button class="header-action hidden md:flex" type="button"><span class="font-bold">登录</span></button>
      <button class="hidden h-[34px] rounded bg-primary-container px-3.5 text-[13px] font-black text-on-primary-container hover:brightness-105 lg:block" type="button">注册</button>
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
              <li v-for="item in group.items" :key="item"><a href="#" class="hover:text-primary">{{ item }}</a></li>
            </ul>
          </section>
        </div>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.header-action { display: flex; height: 34px; flex: none; align-items: center; gap: 5px; border-radius: 4px; padding: 0 9px; color: #e2e2e8; transition: background-color .2s, color .2s; }
.header-action:hover { background: rgba(255, 255, 255, .08); color: #ffe5a0; }
.dropdown-enter-active, .dropdown-leave-active { transition: opacity .16s ease, transform .16s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-8px); }
.menu-enter-active, .menu-leave-active { transition: opacity .22s ease, transform .22s ease; }
.menu-enter-from, .menu-leave-to { opacity: 0; transform: translateY(-12px); }
</style>
