<template>
<!-- Top Rated Movies (IMDb Style) -->
<section class="py-stack-lg px-margin-desktop max-w-container-max mx-auto">
<div class="flex justify-between items-end mb-8">
<div>
<h2 class="text-headline-md font-headline-md text-on-surface mb-2">Top Rated Movies</h2>
<p class="text-on-surface-variant font-body-sm">The best of cinema as voted by the CineScope community.</p>
</div>
<a class="text-primary font-label-caps text-label-caps flex items-center gap-1 hover:underline" href="#">View All <span class="material-symbols-outlined text-sm">chevron_right</span></a>
</div>
<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-gutter">
<!-- Movie Card 1 -->
<div class="poster-card group cursor-pointer">
<div class="relative aspect-[2/3] rounded-lg overflow-hidden mb-4 border border-white/5">
<img class="w-full h-full object-cover" data-alt="A portrait-style movie poster featuring a majestic mountain range under a star-filled indigo sky. Subtle cinematic lighting highlights the rugged peaks. The style is professional and polished, with deep blacks and rich blue tones, suitable for a high-end drama film. 2:3 aspect ratio." src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6xJV53mjmxZVB7SipmL3NmHxlyeKylBs-wop52uhcR6q1jnCSnkDjRlaEnRO4uMDwNNeqVonjZzJM6jLuLDEH-QLOE8onjn64KESnJA6dj7sa8zhxBw_hrWqiDmJzlCnwxt57mqv4b4wI9m-OBzKJkdcKC8zteRNzd5GHF2Q0g0xRaHGF1ySAlPMOD7MibE7pU_RXAsbH45GzacSWbaCnG80n0koEjikPbTzFwXoIbMHrMGDIPTwm"/>
<div class="absolute top-2 right-2 flex flex-col gap-1 items-end">
<div class="rating-badge px-2 py-1 rounded text-[10px] font-bold text-primary-container flex items-center gap-1">
<span class="material-symbols-outlined text-[12px]" style="font-variation-settings: 'FILL' 1;">star</span> 8.9 IMDb
                            </div>
<div class="rating-badge px-2 py-1 rounded text-[10px] font-bold text-secondary flex items-center gap-1">
<span class="material-symbols-outlined text-[12px]">eco</span> 96% Fresh
                            </div>
</div>
<div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
<span class="material-symbols-outlined text-white text-5xl">play_circle</span>
</div>
</div>
<h3 class="font-headline-sm text-on-surface text-body-md truncate">Eternal Summits</h3>
<p class="text-on-surface-variant text-body-sm">2023 • 2h 14m</p>
</div>
<!-- Movie Card 2 -->
<div class="poster-card group cursor-pointer">
<div class="relative aspect-[2/3] rounded-lg overflow-hidden mb-4 border border-white/5">
<img class="w-full h-full object-cover" data-alt="A professional movie poster showcasing a close-up of a vintage pocket watch floating in a dark, swirling void of golden sand. Warm, dramatic lighting focuses on the intricate metallic details. The color palette is rich gold and deep charcoal, creating a sense of mystery and time-travel fantasy. 2:3 aspect ratio." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBN73q5wXTZv1HUxOUTxPKuMSQTEyuVR9js15Fsl9DpKNpje6PAi8h-ix6A9Z9a1si5381XqkkV2HJ2ng-yz4WifZ7KQfLtwejtjV8ouBVZUv5wesyC4EJ1-1-TSOT2H30vOjTw8Z9QGpDiJ1XiE0I9uxOCC9B75Ez9qPWbiVmMb8Qkt2CP7EE5Hv9R7bf1JlGSb9CAGFgZbQfiKPTxIk75KHb_BD43FJ8RkI0TO2Q8I8XnO4ss8Eo4"/>
<div class="absolute top-2 right-2 flex flex-col gap-1 items-end">
<div class="rating-badge px-2 py-1 rounded text-[10px] font-bold text-primary-container flex items-center gap-1">
<span class="material-symbols-outlined text-[12px]" style="font-variation-settings: 'FILL' 1;">star</span> 8.7 IMDb
                            </div>
<div class="rating-badge px-2 py-1 rounded text-[10px] font-bold text-secondary flex items-center gap-1">
<span class="material-symbols-outlined text-[12px]">eco</span> 92% Fresh
                            </div>
</div>
<div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
<span class="material-symbols-outlined text-white text-5xl">play_circle</span>
</div>
</div>
<h3 class="font-headline-sm text-on-surface text-body-md truncate">Temporal Shift</h3>
<p class="text-on-surface-variant text-body-sm">2024 • 1h 58m</p>
</div>
<!-- Repeating for layout -->
<div class="poster-card group cursor-pointer">
<div class="relative aspect-[2/3] rounded-lg overflow-hidden mb-4 border border-white/5">
<img class="w-full h-full object-cover" data-alt="Cinematic movie poster with a minimalist red and white design featuring the silhouette of a high-speed train cutting through a blizzard. Dark, moody atmosphere with heavy contrast. The style is sharp and corporate modern, with a cold color temperature dominated by blues and greys. 2:3 aspect ratio." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAcn_F6MWSZGYieqc2AObrFigbYJknnn7SV11k4o8Y53dU8lMU5PJ-a0sg2_i-vZFFiFd71HY94NKXhlbUYO2k64zmK2o39yyoytrJToxDixL_EigqKr6ZVOdr0jViT0jsvGEFquy6brfJEz7cl0BCzpwmoofuFi62QFTBq86xY3lw6fJKn7RUPbCZ_dS1CPEgcy6ol1JVq718LaSJXTMHu0_ZBEoSq2Vlw7nozL5oTG7Otj5GubXum"/>
<div class="absolute top-2 right-2 flex flex-col gap-1 items-end">
<div class="rating-badge px-2 py-1 rounded text-[10px] font-bold text-primary-container flex items-center gap-1">
<span class="material-symbols-outlined text-[12px]" style="font-variation-settings: 'FILL' 1;">star</span> 8.5 IMDb
                            </div>
<div class="rating-badge px-2 py-1 rounded text-[10px] font-bold text-secondary flex items-center gap-1">
<span class="material-symbols-outlined text-[12px]">eco</span> 88% Fresh
                            </div>
</div>
</div>
<h3 class="font-headline-sm text-on-surface text-body-md truncate">Velocity Point</h3>
<p class="text-on-surface-variant text-body-sm">2024 • 2h 05m</p>
</div>
<div class="poster-card group cursor-pointer">
<div class="relative aspect-[2/3] rounded-lg overflow-hidden mb-4 border border-white/5">
<img class="w-full h-full object-cover" data-alt="A striking portrait of a professional dancer mid-leap against a dark teal background with atmospheric stage lighting. Vibrant streaks of light follow the movement. The aesthetic is high-fashion and artistic, with a rich palette of deep greens and glowing teals. 2:3 aspect ratio." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDfPGn8CxUVezujFtlI6i0d_1hlfMgfFnYcnFxQkFiDNNkVItll6UQLTHnkmylN5bw9xMCtNGYtJZBncvG40zKwbneMRygggBvcrv8Wogv0e0IYGEwiaMXme3NnjgSr2zvdz78R4Ek57KeNadQ19dp8wUkqQ28qwvIzVJr6BODId8Aw6DrXmjCMnlAlwzTeyrfxhw5svO9p64lN1txcdwbRJ5uF9UmKa_QXbDK3Nec5ZxIZ4Vfw8fMH"/>
<div class="absolute top-2 right-2 flex flex-col gap-1 items-end">
<div class="rating-badge px-2 py-1 rounded text-[10px] font-bold text-primary-container flex items-center gap-1">
<span class="material-symbols-outlined text-[12px]" style="font-variation-settings: 'FILL' 1;">star</span> 8.2 IMDb
                            </div>
<div class="rating-badge px-2 py-1 rounded text-[10px] font-bold text-secondary flex items-center gap-1">
<span class="material-symbols-outlined text-[12px]">eco</span> 94% Fresh
                            </div>
</div>
</div>
<h3 class="font-headline-sm text-on-surface text-body-md truncate">Rhythm of Silence</h3>
<p class="text-on-surface-variant text-body-sm">2023 • 1h 45m</p>
</div>
<div class="poster-card group cursor-pointer">
<div class="relative aspect-[2/3] rounded-lg overflow-hidden mb-4 border border-white/5">
<img class="w-full h-full object-cover" data-alt="A dark and moody crime thriller movie poster showing a rain-drenched detective's hat resting on a cobblestone street under a single yellow streetlight. High contrast, heavy shadows, and a desaturated blue-grey color palette with one focal point of warm yellow light. 2:3 aspect ratio." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBcAMfN1SEbxzNmRvXOwO3WFQWhWMkYDIiYM1WoAGzg3vEnmHqPPL9AvHe17081mdvLIj9Kio3xQiMk7oCMQQTNF-34eXtNhi6WDi3ibqCXiovWIvZz1_qQSUcEp9E259JoL5tE6EwqtSNxwdn0TCrzfPpS5B-Uo6u74SETTFAJs8zQuyl6M6mcgInLvSM30C-p5oBi1BNAiOEzYpLWOJip3WppqQeY-I5-_C5TtBBIfEo1H0dVoTZt"/>
<div class="absolute top-2 right-2 flex flex-col gap-1 items-end">
<div class="rating-badge px-2 py-1 rounded text-[10px] font-bold text-primary-container flex items-center gap-1">
<span class="material-symbols-outlined text-[12px]" style="font-variation-settings: 'FILL' 1;">star</span> 8.0 IMDb
                            </div>
<div class="rating-badge px-2 py-1 rounded text-[10px] font-bold text-secondary flex items-center gap-1">
<span class="material-symbols-outlined text-[12px]">eco</span> 81% Fresh
                            </div>
</div>
</div>
<h3 class="font-headline-sm text-on-surface text-body-md truncate">Undercurrent</h3>
<p class="text-on-surface-variant text-body-sm">2024 • 2h 30m</p>
</div>
<div class="poster-card group cursor-pointer">
<div class="relative aspect-[2/3] rounded-lg overflow-hidden mb-4 border border-white/5">
<img class="w-full h-full object-cover" data-alt="An expansive sci-fi movie poster featuring a massive spherical spaceship hovering over a desolate desert planet at dusk. The sky is a gradient of deep orange and purple. The style is epic and grand, with detailed textures and a cinematic atmosphere. 2:3 aspect ratio." src="https://lh3.googleusercontent.com/aida-public/AB6AXuABmhPQpqh0D9rb6sKQEOwCIq_Egm8J02MXdr6Km31XVQi82SIZQtj97lKWDSZxpiBSKWSrDAUYSzmo2WSGRG-rsnEJCc2cgAAFH-xViM_PW6_wG_Y5bMi_KHwGDBbcajBfhabTXmth9LWZZUnd_0914Ix9CUChWqBxvBN4I08_0W0F80tePrs1G2n-LljI_wuixSyLBCCyBtEioh_iuRdXOVNtJDxWwHM539zJPG5TzZxiC3GqCfqb"/>
<div class="absolute top-2 right-2 flex flex-col gap-1 items-end">
<div class="rating-badge px-2 py-1 rounded text-[10px] font-bold text-primary-container flex items-center gap-1">
<span class="material-symbols-outlined text-[12px]" style="font-variation-settings: 'FILL' 1;">star</span> 7.9 IMDb
                            </div>
<div class="rating-badge px-2 py-1 rounded text-[10px] font-bold text-secondary flex items-center gap-1">
<span class="material-symbols-outlined text-[12px]">eco</span> 85% Fresh
                            </div>
</div>
</div>
<h3 class="font-headline-sm text-on-surface text-body-md truncate">Orbit Zero</h3>
<p class="text-on-surface-variant text-body-sm">2024 • 2h 10m</p>
</div>
</div>
</section>
<!-- Hot in Theaters (Douban Style horizontal scroll) -->
<section class="py-stack-lg px-margin-desktop max-w-container-max mx-auto"><div class="flex justify-between items-end mb-8"><div><h2 class="text-headline-md font-headline-md text-on-surface mb-2">正在上映</h2><p class="text-on-surface-variant font-body-sm">影院热映中的精彩影片。</p></div><a class="text-primary font-label-caps text-label-caps flex items-center gap-1 hover:underline" href="#">查看全部 <span class="material-symbols-outlined text-sm">chevron_right</span></a></div><div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-gutter"><div class="poster-card group cursor-pointer"><div class="relative aspect-[2/3] rounded-lg overflow-hidden mb-4 border border-white/5"><img class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDzDSDwon5jzokDhN2qxGKh3P_1It_QkT8VPGwHxzMRD_CxBdaW7U6AO2yXM4B6eeNRk7zqSM6CRQF5eiVbS92jwE504iyzu20IPYs9BLt3wmH_jLQ8cPXPFfc6GdQVBhjwuu9z4zKFayRNqWpflNaeeYfqjPOk_eVKi2quVEDz9gvAayINSHDlFQtQgBXujn17PGCUuLItjvEejOLF9saugtMRKZtna2ftUeqRH00tFivKJ2IG-oZY"/><div class="absolute top-2 right-2 flex flex-col gap-1 items-end"><div class="rating-badge px-2 py-1 rounded text-[10px] font-bold text-primary-container flex items-center gap-1"><span class="material-symbols-outlined text-[12px]" style="font-variation-settings: 'FILL' 1;">star</span> 9.4</div><div class="rating-badge px-2 py-1 rounded text-[10px] font-bold text-secondary flex items-center gap-1"><span class="material-symbols-outlined text-[12px]">star_half</span> 8.8 豆瓣</div></div></div><h3 class="font-headline-sm text-on-surface text-body-md truncate">The Gilded Guard</h3><p class="text-on-surface-variant text-body-sm">2024 • 动作</p></div></div></section><section class="py-stack-lg px-margin-desktop max-w-container-max mx-auto"><div class="flex justify-between items-end mb-8"><div><h2 class="text-headline-md font-headline-md text-on-surface mb-2">热门电影</h2><p class="text-on-surface-variant font-body-sm">本周最受关注的电影作品。</p></div><a class="text-primary font-label-caps text-label-caps flex items-center gap-1 hover:underline" href="#">查看全部 <span class="material-symbols-outlined text-sm">chevron_right</span></a></div><div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-gutter"><div class="poster-card group cursor-pointer"><div class="relative aspect-[2/3] rounded-lg overflow-hidden mb-4 border border-white/5"><img class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6xJV53mjmxZVB7SipmL3NmHxlyeKylBs-wop52uhcR6q1jnCSnkDjRlaEnRO4uMDwNNeqVonjZzJM6jLuLDEH-QLOE8onjn64KESnJA6dj7sa8zhxBw_hrWqiDmJzlCnwxt57mqv4b4wI9m-OBzKJkdcKC8zteRNzd5GHF2Q0g0xRaHGF1ySAlPMOD7MibE7pU_RXAsbH45GzacSWbaCnG80n0koEjikPbTzFwXoIbMHrMGDIPTwm"/><div class="absolute top-2 right-2 flex flex-col gap-1 items-end"><div class="rating-badge px-2 py-1 rounded text-[10px] font-bold text-primary-container flex items-center gap-1"><span class="material-symbols-outlined text-[12px]" style="font-variation-settings: 'FILL' 1;">star</span> 8.9</div><div class="rating-badge px-2 py-1 rounded text-[10px] font-bold text-secondary flex items-center gap-1"><span class="material-symbols-outlined text-[12px]">star_half</span> 9.1 豆瓣</div></div></div><h3 class="font-headline-sm text-on-surface text-body-md truncate">Eternal Summits</h3><p class="text-on-surface-variant text-body-sm">2023 • 剧情</p></div></div></section><section class="py-stack-lg px-margin-desktop max-w-container-max mx-auto"><div class="flex justify-between items-end mb-8"><div><h2 class="text-headline-md font-headline-md text-on-surface mb-2">热门剧集</h2><p class="text-on-surface-variant font-body-sm">正在热播的口碑好剧。</p></div><a class="text-primary font-label-caps text-label-caps flex items-center gap-1 hover:underline" href="#">查看全部 <span class="material-symbols-outlined text-sm">chevron_right</span></a></div><div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-gutter"><div class="poster-card group cursor-pointer"><div class="relative aspect-[2/3] rounded-lg overflow-hidden mb-4 border border-white/5"><img class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDHLh_f7a-c8k_8TVQ6QQj5RHDbJKGQhvOZKBmRTaS-70AFTJ64oA6C9FaVVLk7W4FuNh0sse2_UO4SKGP89BcoRDAISrso3Z-xj0hR6b9pZcAiTMo0RzH_vZYWWhOT8NMxe1Yavyfh3hRgnF3rf8EPcQxo-RAheIqHCYbjsbAGXmiL6kW-AiiX-80mfKf4Co0SF2aepTeeELW2xBqfyPKTjHLpw73d_R3WDALeRDgXmDDsc6__S4Ri"/><div class="absolute top-2 right-2 flex flex-col gap-1 items-end"><div class="rating-badge px-2 py-1 rounded text-[10px] font-bold text-primary-container flex items-center gap-1"><span class="material-symbols-outlined text-[12px]" style="font-variation-settings: 'FILL' 1;">star</span> 9.2</div><div class="rating-badge px-2 py-1 rounded text-[10px] font-bold text-secondary flex items-center gap-1"><span class="material-symbols-outlined text-[12px]">star_half</span> 8.5 豆瓣</div></div></div><h3 class="font-headline-sm text-on-surface text-body-md truncate">Xenon Drift</h3><p class="text-on-surface-variant text-body-sm">2024 • 科幻</p></div></div></section>
</template>
