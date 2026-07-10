<template>
<!-- Bento Section: Top Rated & News -->
<section class="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
<!-- 新闻区 (IMDb News) -->
<div class="lg:col-span-8 space-y-8">
<div>
<h2 class="text-headline-lg font-headline-lg flex items-center gap-3"><span class="w-1.5 h-8 bg-primary rounded-full"></span>影坛动态</h2>
<p class="text-on-surface-variant mt-2">源自 IMDb 的最新电影资讯与深度报道。</p>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
<!-- News Card 1 -->
<article class="group bg-surface-container rounded-2xl overflow-hidden border border-white/5 hover:border-primary/20 transition-all flex flex-col">
<div class="aspect-video overflow-hidden">
<img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYon2rXrETtfjSqYg3XAnBJz-8-XqkXNkA97rvfotMI6DAM2AbFC0YHyoUUUiI4xtzP-1Ddtl0WBIk74vuxQ3Gnd_La9lFKQjQvfZkr5phMWDsWbHEthNYvcOBcQbdMCQzh5MxImJJt5xeoHQXqs6CZm0odj9oY70ZKjeF7F11ZwzVEIaV6ZFL4dpMX_EFDVrF5rfT7E1GbJvBE3COt-kOCPpQYQ3-PkAytfmGFGTJdGdNwloq615qew"/>
</div>
<div class="p-6 flex flex-col flex-grow">
<span class="text-primary text-[12px] font-bold tracking-wider mb-2 uppercase">独家报道</span>
<h3 class="text-xl font-bold group-hover:text-primary transition-colors line-clamp-2">《命运之丘》续作确认：马库斯·索恩回归执导</h3>
<p class="text-on-surface-variant mt-3 text-sm line-clamp-3">IMDb 独家消息，备受赞誉的史诗科幻大作《命运之丘》今日宣布正式开启续集开发工作。原班制作团队将悉数回归...</p>
<a class="mt-auto pt-6 flex items-center gap-2 text-primary font-bold text-sm" href="#">阅读原文 <span class="material-symbols-outlined text-[16px]">arrow_forward</span></a>
</div>
</article>
<!-- News Card 2 -->
<article class="group bg-surface-container rounded-2xl overflow-hidden border border-white/5 hover:border-primary/20 transition-all flex flex-col">
<div class="aspect-video overflow-hidden">
<img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDM6Yjnx6geXfCGxsjdf6z_g2uX2f7WiHUzLsy_Ez4WCJQBjF6gEW--Z7KmRzYPa_U2P6hKSZXSPZtj15Sbaqc_Ap98ANY34qJRgZCTwALRdw1LvfHOetKayOxhbSzMtilVS-E_KWlEbmAlfyOYPcN18oPFkNZ3Wz-X9cDaRo_pF8Hufx4L18yv7TKyXmef1poK1F-UcEGNRFodWY6HgexOBHFkiZ9kXNPckB3C0BYXJWIU3hodi2jnow"/>
</div>
<div class="p-6 flex flex-col flex-grow">
<span class="text-primary text-[12px] font-bold tracking-wider mb-2 uppercase">影展直击</span>
<h3 class="text-xl font-bold group-hover:text-primary transition-colors line-clamp-2">现代黑色电影的复兴：从《钢筋丛林》看类型片演变</h3>
<p class="text-on-surface-variant mt-3 text-sm line-clamp-3">在超级英雄大片的主导下，冷峻写实的黑色电影正在经历一场意想不到的复兴。我们将深入剖析近期热门作品...</p>
<a class="mt-auto pt-6 flex items-center gap-2 text-primary font-bold text-sm" href="#">阅读原文 <span class="material-symbols-outlined text-[16px]">arrow_forward</span></a>
</div>
</article>
</div>
</div>
<!-- 高分榜 (TMDB Top Rated) -->
<div class="lg:col-span-4 bg-surface-container-high rounded-3xl p-8 space-y-8 shadow-2xl h-fit sticky top-24 border border-white/5">
<div>
<h2 class="text-xl font-bold flex items-center justify-between">
                    经典高分榜
                    <span class="material-symbols-outlined text-primary">emoji_events</span>
</h2>
<div class="h-1 w-12 bg-primary mt-2 rounded-full"></div>
<p class="text-on-surface-variant text-sm mt-3">基于全球影迷评分的影史杰作。</p>
</div>
<div class="space-y-6">
<!-- Top Rated Items -->
<div class="flex items-center gap-4 group cursor-pointer">
<span class="text-4xl font-black text-outline-variant italic opacity-30 group-hover:opacity-100 transition-opacity w-8">1</span>
<div class="w-12 h-16 rounded-lg overflow-hidden bg-surface-variant flex-none">
<img class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBUTzREM1jTJJHHqZzNitLLLtNkW_JvieNv1pr9IUpvJieDCdouloeoFcPTV7TeHMz1P0M4_LJzzgwFKRDGOHhHo4wkvPnKPwrNUelj1VtebekksaRd8ZxShwWgc6YJS6f_vhwy2V9T20ok-mgWN6mZZJNmjlYUcg8qfT_KcAKYrs9R-_JjU-GtGB96Y6yCHbVc6FdaeN5jXd3oEkApfoKA5NCni57E9rRWV-6fSKBYx33I4u62nIe3CQ"/>
</div>
<div class="flex-grow min-w-0">
<h4 class="font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1">黄金蕾丝</h4>
<p class="text-[12px] text-on-surface-variant">评分 9.6 • 剧情</p>
</div>
</div>
<!-- More items... -->
<div class="flex items-center gap-4 group cursor-pointer">
<span class="text-4xl font-black text-outline-variant italic opacity-30 group-hover:opacity-100 transition-opacity w-8">2</span>
<div class="w-12 h-16 rounded-lg overflow-hidden bg-surface-variant flex-none">
<img class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKq7EvcN0WfLxwTGQYlsbiym0qiirsWKKoTlBel9JOkWzP57JtcyTTCYrr-tk2eMg9NTWIpopUmrIbKnDIAWPAJMMx4POmww4TMhqqZzBnXpst_LccH4fWRH-2QFKr1yQWJgzUx81AEiYIEdlcYFdLqIVWKDfXPsU_lSl2Yv6Fao_fQyVY3z-WBZ7TTX9XVQzZKx6nEtxv3haMrbADAYTEtkDxQUkyqUr8brr11jb8-fmd8ViOFa6JLg"/>
</div>
<div class="flex-grow min-w-0">
<h4 class="font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1">沉默回响</h4>
<p class="text-[12px] text-on-surface-variant">评分 9.4 • 恐怖</p>
</div>
</div>
</div>
<button class="w-full py-4 border-2 border-primary/20 rounded-xl font-bold text-primary hover:bg-primary/10 transition-colors">
                查看 TOP 250
            </button>
</div>
</section>
</template>
