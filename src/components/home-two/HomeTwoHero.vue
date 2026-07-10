<template>
<!-- Hero Section (TMDB Trending) -->
<section class="relative h-screen min-h-[700px] w-full overflow-hidden">
<div class="absolute inset-0 z-0">
<div class="w-full h-full bg-cover bg-center transition-transform duration-1000" id="hero-bg" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuDKMTY3bnIoqhnV6RZvxfE0jTHcILPn48zp22j3WhE3bYt2kv6zLSqjdqZpxj3Uqc_wc2AoGj9DOeQ--IUdi7MRdPHXKJHkQrxDL9jHkzHGiqImTIpMaB-Ar-vZ2wBRHBUMTRsbwhAGIKiUxEjkRCJEVIeUIuwHCINr6Ob7xnVGd9R7kyxhJDLZPwLbNeuB43PBl2LGNQ9ylpu56QwhUeCakfGWDU6Chc03e-zArGwldvtzOS9qbv-NIQ");'></div>
<div class="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent"></div>
<div class="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
</div>
<div class="relative z-10 h-full flex flex-col justify-center px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
<div class="max-w-2xl space-y-6">
<div class="flex items-center gap-4">
<div class="flex items-center gap-1.5 px-3 py-1 bg-primary/20 backdrop-blur-md rounded-lg text-primary border border-primary/30">
<span class="material-symbols-outlined text-[18px]" style='font-variation-settings: "FILL" 1;'>star</span>
<span class="font-bold">豆瓣 8.9</span>
</div>
<div class="text-on-surface-variant text-label-caps font-label-caps">
                    IMDb TOP 10 • 2024 Trending
                </div>
</div>
<h1 class="text-headline-lg md:text-display-hero font-display-hero uppercase">霓虹悖论<br/>THE NEON PARADOX</h1>
<p class="text-body-lg text-on-surface-variant leading-relaxed line-clamp-3">
                在一个记忆可以像货币一样交易的世界里，一名独行侦探发现了一个威胁要抹去人类历史的系统漏洞。
            </p>
<div class="flex flex-wrap items-center gap-4 pt-4">
<button class="primary-gradient text-on-primary-fixed font-bold px-8 py-4 rounded-xl flex items-center gap-2 hover:scale-105 transition-transform shadow-[0_0_20px_rgba(245,197,24,0.3)]">
<span class="material-symbols-outlined" style='font-variation-settings: "FILL" 1;'>play_arrow</span>
                    观看预告
                </button>
<button class="glass-effect text-on-surface font-bold px-8 py-4 rounded-xl flex items-center gap-2 border border-white/10 hover:bg-white/10 transition-all">
                    查看详情
                </button>
</div>
</div>
</div>
</section></template>
