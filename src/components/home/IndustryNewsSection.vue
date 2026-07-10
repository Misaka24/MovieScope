<script setup lang="ts">
import { industryNews } from '../../data/home'
</script>

<template>
  <section id="影坛动态" class="scroll-mt-20 py-10">
    <div class="mb-7 flex items-end justify-between">
      <div>
        <h2 class="text-2xl font-extrabold text-on-surface md:text-3xl">影坛动态</h2>
        <p class="mt-2 text-sm text-on-surface-variant">来自 IMDb 新闻与行业资讯的数据展示区域。</p>
      </div>
      <a href="#" class="hidden items-center gap-1 text-sm font-bold text-primary hover:underline sm:flex">更多动态<span class="material-symbols-outlined text-lg">chevron_right</span></a>
    </div>
    <div class="grid gap-5 lg:grid-cols-3">
      <article v-for="news in industryNews" :key="news.id" class="group overflow-hidden rounded-lg border border-white/5 bg-surface-container-low">
        <div class="aspect-[16/9] overflow-hidden"><img :src="news.image" :alt="news.title" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"></div>
        <div class="p-5">
          <div class="mb-3 flex items-center justify-between gap-3 text-xs font-bold"><span class="text-primary">{{ news.category }}</span><span class="text-on-surface-variant">{{ news.publishedAt }}</span></div>
          <h3 class="text-lg font-extrabold leading-7 text-on-surface group-hover:text-primary">{{ news.title }}</h3>
          <p class="mt-3 text-sm leading-6 text-on-surface-variant">{{ news.summary }}</p>
          <a href="#" class="mt-5 inline-flex items-center gap-1 text-sm font-bold text-primary">阅读全文<span class="material-symbols-outlined text-lg">arrow_forward</span></a>
        </div>
      </article>
    </div>
  </section>
</template>