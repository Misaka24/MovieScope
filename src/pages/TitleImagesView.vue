<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import GlobalHeader from '../components/global/GlobalHeader.vue'
import GlobalFooter from '../components/global/GlobalFooter.vue'
import PageState from '../components/catalog/PageState.vue'
import { useAsyncData } from '../composables/useAsyncData'
import { fetchTitle } from '../services/catalog-api'
const route=useRoute(),type=computed(()=>String(route.params.type)),id=computed(()=>String(route.params.id)),key=computed(()=>type.value+':'+id.value),tab=ref<'backdrops'|'posters'|'logos'>('backdrops')
const {data,loading,error,reload}=useAsyncData(()=>fetchTitle(type.value,id.value),[key])
const current=computed(()=>tab.value==='posters'?data.value?.posters||[]:tab.value==='logos'?data.value?.logos||[]:data.value?.images||[])
</script>
<template><div class="min-h-screen bg-background text-on-surface"><GlobalHeader/><PageState :loading="loading" :error="error" @retry="reload"><template v-if="data"><main class="mx-auto max-w-[1440px] px-4 pb-24 pt-24 md:px-8"><RouterLink :to="{name:'title',params:{type:data.mediaType,id:data.id}}" class="text-sm font-bold text-primary">← 返回详情</RouterLink><div class="mt-7"><p class="text-sm text-on-surface-variant">{{ data.originalTitle }}</p><h1 class="mt-1 text-4xl font-black">{{ data.title }} · 全部图片</h1><p class="mt-3 text-sm text-on-surface-variant">横向剧照 {{ data.images.length }} 张 · 海报 {{ data.posters.length }} 张 · Logo {{ data.logos.length }} 张</p></div><div class="mt-8 flex gap-2"><button v-for="item in [{key:'backdrops',label:'剧照'},{key:'posters',label:'海报'},{key:'logos',label:'Logo'}]" :key="item.key" class="image-tab" :class="tab===item.key?'active':''" @click="tab=item.key as typeof tab">{{ item.label }}</button></div><section class="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4"><a v-for="picture in current" :key="picture.path" :href="picture.path" target="_blank" class="group mb-4 block break-inside-avoid overflow-hidden rounded-xl border border-white/5 bg-surface-container"><img :src="picture.path" :alt="data.title+'图片'" class="h-auto w-full transition duration-500 group-hover:scale-[1.03]"/><div class="flex justify-between px-3 py-2 text-[11px] text-on-surface-variant"><span>{{ picture.width }} × {{ picture.height }}</span><span>查看原图 ↗</span></div></a></section></main></template></PageState><GlobalFooter/></div></template>
<style scoped>.image-tab{border:1px solid rgba(255,255,255,.08);border-radius:9999px;padding:9px 16px;font-size:13px;font-weight:700}.image-tab.active{border-color:rgba(245,197,24,.5);background:rgba(245,197,24,.12);color:#f5c518}</style>
