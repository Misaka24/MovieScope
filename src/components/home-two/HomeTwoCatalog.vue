<template>
<!-- 热门电影 (TMDB Popular Movie) -->
<section class="space-y-8">
<div class="flex justify-between items-end">
<div>
<h2 class="text-headline-lg font-headline-lg flex items-center gap-3"><span class="w-1.5 h-8 bg-primary rounded-full"></span>热门电影</h2>
<p class="text-on-surface-variant mt-2">实时更新的全网热门院线大片。</p>
</div>
<button class="text-primary hover:underline text-body-md font-semibold">更多电影</button>
</div>
<div class="flex gap-gutter overflow-x-auto pb-4 hide-scrollbar snap-x">
<!-- Poster Card Template -->
<div class="snap-start flex-none w-44 md:w-52 group cursor-pointer">
<div class="relative aspect-[2/3] rounded-xl overflow-hidden shadow-xl poster-hover">
<img class="w-full h-full object-cover transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCr3esw2UZexRli9herbw69dqpi8PrPgLK7cdDUIugQnOp400U8zjEAE6seT7o3g02Je90SlB7mxbm7MAy1MXfwppM5HvKmBzYu6MsaVOhWhO8PRuaupz5eT5fWYpq65MXNqEh2zpAsTXqmTbBkPoRWs1OTnBRkFZDfQiLCj_UeaaZC6iSWE5cQBhJhoRtU3tS5xO12tVcMMm2LNI8cE6vUq8YIrHAmAL2oDvKeTf7j7sKUxmHF8_VMkA"/>
<div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
<div class="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-primary text-[12px] font-bold border border-white/10">
<span class="material-symbols-outlined text-[14px]" style='font-variation-settings: "FILL" 1;'>star</span>
                        8.9
                    </div>
</div>
<div class="mt-3">
<h3 class="font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1">午夜回声</h3>
<p class="text-[12px] text-on-surface-variant">2024 • 悬疑</p>
</div>
</div>
<!-- Repeated Items for Popular Movies -->
<div class="snap-start flex-none w-44 md:w-52 group cursor-pointer">
<div class="relative aspect-[2/3] rounded-xl overflow-hidden shadow-xl poster-hover">
<img class="w-full h-full object-cover transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDaczsEOb6L1qZUnZ3TNFpWs_4LBs5IeS573cbnwF1iFoZ7AaT-2P1m0hUGE--ZOB3NKsSqH9gVh2KZTtIB1nHHQTqXJX-w8Zv5s1Fp2OEYZ36SNnZ3xUZc1O71tBKaEGoHa1vJrBUTWk6P-oMJTUMXKZ_5s_-9gQSbi9BHT9mf9SKu13LTYC2zxnIYvMvsfwALQQW_0bbWFvp8L4HkL7ZPDubrlhTfLt_XIFN3L1mT6S_Tp3wTmIds2g"/>
<div class="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-primary text-[12px] font-bold border border-white/10">
<span class="material-symbols-outlined text-[14px]" style='font-variation-settings: "FILL" 1;'>star</span>
                        7.8
                    </div>
</div>
<div class="mt-3">
<h3 class="font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1">速度：极速追逐</h3>
<p class="text-[12px] text-on-surface-variant">2023 • 动作</p>
</div>
</div>
<!-- More Movie Items... -->
</div>
</section>
<!-- 热门剧集 (TMDB Popular TV) -->
<section class="space-y-8">
<div class="flex justify-between items-end">
<div>
<h2 class="text-headline-lg font-headline-lg flex items-center gap-3"><span class="w-1.5 h-8 bg-primary rounded-full"></span>热门剧集</h2>
<p class="text-on-surface-variant mt-2">口碑爆表，不容错过的精彩剧集。</p>
</div>
<button class="text-primary hover:underline text-body-md font-semibold">更多剧集</button>
</div>
<div class="flex gap-gutter overflow-x-auto pb-4 hide-scrollbar snap-x">
<!-- TV Items -->
<div class="snap-start flex-none w-44 md:w-52 group cursor-pointer">
<div class="relative aspect-[2/3] rounded-xl overflow-hidden shadow-xl poster-hover">
<img class="w-full h-full object-cover transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDDdIOn5AIn8fhmBemCT_EJn1Hk3irUNh6Oai0buKhkfnVgnKTAD5P3u2Mz1YUBkXddpBf6tNzchJD39uAQKFu4bsZ_1pB1HrZVMTZWUruSaB8pmnd7zVrxL1RDgbvkLYLhFVHAtnSXbvSTF4HjRN8xi_v8VDdvEqKaB6nIxoO1JcBldCatteDEcFQz-hxIh_vEsvsVPld-KfEAXUPqOUE3niajTgpcXroqKqKhX1ccqFvG6SoU7eEi-w"/>
<div class="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-primary text-[12px] font-bold border border-white/10">
<span class="material-symbols-outlined text-[14px]" style='font-variation-settings: "FILL" 1;'>star</span>
                        9.2
                    </div>
</div>
<div class="mt-3">
<h3 class="font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1">天空之境</h3>
<p class="text-[12px] text-on-surface-variant">2024 • 奇幻 • 1季</p>
</div>
</div>
<!-- More TV Items... -->
</div>
</section>
</template>
