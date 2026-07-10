<script setup lang="ts">
import {onMounted,ref} from 'vue'
const announcement=ref('')
onMounted(async()=>{try{const response=await fetch('/api/v1/settings/public',{headers:{Accept:'application/json'}}),body=await response.json(),item=body?.data?.site_announcement;if(item?.enabled&&item.text)announcement.value=String(item.text)}catch{announcement.value=''}})
</script>
<template><div v-if="announcement" class="site-announcement"><span class="material-symbols-outlined">campaign</span><p>{{announcement}}</p><button aria-label="关闭公告" @click="announcement=''">×</button></div><RouterView /></template>
<style scoped>.site-announcement{position:fixed;z-index:90;top:58px;left:50%;display:flex;width:min(720px,calc(100% - 30px));transform:translateX(-50%);align-items:center;gap:10px;border:1px solid rgba(245,197,24,.25);border-radius:8px;background:rgba(29,32,37,.96);padding:10px 13px;box-shadow:0 12px 35px rgba(0,0,0,.35);backdrop-filter:blur(12px)}.site-announcement span{color:#f5c518;font-size:18px}.site-announcement p{flex:1;font-size:11px;line-height:1.5}.site-announcement button{color:#8f939d;font-size:18px}</style>
