import type { HeroMovie, IndustryNews, MediaItem } from '../types/media'

const images = {
  city: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCebOVRaKxEbPKgDxCX20Y10L1hQft2UwbCWdwpq4E0eo-0aerny2CUhODEA38NLGB6zZ-dEHhe56lrIos1G4s_V_MwUK0xSVgsBr3K7s2W6CmGErcP4XKeB1VN2HnqrLZRBOCm8Mq1zSNc0s_3Qt2kITQAQC-MyOqLA0a4bInXP5OuRQrprZ_4t6GV9lrQn4iALnFwwK6x_3-AAqIkNyn8j9ctinWKf_pUlqyrFQWzy584ZNwc68G2',
  cityTwo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDKMTY3bnIoqhnV6RZvxfE0jTHcILPn48zp22j3WhE3bYt2kv6zLSqjdqZpxj3Uqc_wc2AoGj9DOeQ--IUdi7MRdPHXKJHkQrxDL9jHkzHGiqImTIpMaB-Ar-vZ2wBRHBUMTRsbwhAGIKiUxEjkRCJEVIeUIuwHCINr6Ob7xnVGd9R7kyxhJDLZPwLbNeuB43PBl2LGNQ9ylpu56QwhUeCakfGWDU6Chc03e-zArGwldvtzOS9qbv-NIQ',
  p1: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDzDSDwon5jzokDhN2qxGKh3P_1It_QkT8VPGwHxzMRD_CxBdaW7U6AO2yXM4B6eeNRk7zqSM6CRQF5eiVbS92jwE504iyzu20IPYs9BLt3wmH_jLQ8cPXPFfc6GdQVBhjwuu9z4zKFayRNqWpflNaeeYfqjPOk_eVKi2quVEDz9gvAayINSHDlFQtQgBXujn17PGCUuLItjvEejOLF9saugtMRKZtna2ftUeqRH00tFivKJ2IG-oZY',
  p2: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6xJV53mjmxZVB7SipmL3NmHxlyeKylBs-wop52uhcR6q1jnCSnkDjRlaEnRO4uMDwNNeqVonjZzJM6jLuLDEH-QLOE8onjn64KESnJA6dj7sa8zhxBw_hrWqiDmJzlCnwxt57mqv4b4wI9m-OBzKJkdcKC8zteRNzd5GHF2Q0g0xRaHGF1ySAlPMOD7MibE7pU_RXAsbH45GzacSWbaCnG80n0koEjikPbTzFwXoIbMHrMGDIPTwm',
  p3: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBN73q5wXTZv1HUxOUTxPKuMSQTEyuVR9js15Fsl9DpKNpje6PAi8h-ix6A9Z9a1si5381XqkkV2HJ2ng-yz4WifZ7KQfLtwejtjV8ouBVZUv5wesyC4EJ1-1-TSOT2H30vOjTw8Z9QGpDiJ1XiE0I9uxOCC9B75Ez9qPWbiVmMb8Qkt2CP7EE5Hv9R7bf1JlGSb9CAGFgZbQfiKPTxIk75KHb_BD43FJ8RkI0TO2Q8I8XnO4ss8Eo4',
  p4: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAcn_F6MWSZGYieqc2AObrFigbYJknnn7SV11k4o8Y53dU8lMU5PJ-a0sg2_i-vZFFiFd71HY94NKXhlbUYO2k64zmK2o39yyoytrJToxDixL_EigqKr6ZVOdr0jViT0jsvGEFquy6brfJEz7cl0BCzpwmoofuFi62QFTBq86xY3lw6fJKn7RUPbCZ_dS1CPEgcy6ol1JVq718LaSJXTMHu0_ZBEoSq2Vlw7nozL5oTG7Otj5GubXum',
  p5: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDfPGn8CxUVezujFtlI6i0d_1hlfMgfFnYcnFxQkFiDNNkVItll6UQLTHnkmylN5bw9xMCtNGYtJZBncvG40zKwbneMRygggBvcrv8Wogv0e0IYGEwiaMXme3NnjgSr2zvdz78R4Ek57KeNadQ19dp8wUkqQ28qwvIzVJr6BODId8Aw6DrXmjCMnlAlwzTeyrfxhw5svO9p64lN1txcdwbRJ5uF9UmKa_QXbDK3Nec5ZxIZ4Vfw8fMH',
  p6: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBcAMfN1SEbxzNmRvXOwO3WFQWhWMkYDIiYM1WoAGzg3vEnmHqPPL9AvHe17081mdvLIj9Kio3xQiMk7oCMQQTNF-34eXtNhi6WDi3ibqCXiovWIvZz1_qQSUcEp9E259JoL5tE6EwqtSNxwdn0TCrzfPpS5B-Uo6u74SETTFAJs8zQuyl6M6mcgInLvSM30C-p5oBi1BNAiOEzYpLWOJip3WppqQeY-I5-_C5TtBBIfEo1H0dVoTZt',
  p7: 'https://lh3.googleusercontent.com/aida-public/AB6AXuABmhPQpqh0D9rb6sKQEOwCIq_Egm8J02MXdr6Km31XVQi82SIZQtj97lKWDSZxpiBSKWSrDAUYSzmo2WSGRG-rsnEJCc2cgAAFH-xViM_PW6_wG_Y5bMi_KHwGDBbcajBfhabTXmth9LWZZUnd_0914Ix9CUChWqBxvBN4I08_0W0F80tePrs1G2n-LljI_wuixSyLBCCyBtEioh_iuRdXOVNtJDxWwHM539zJPG5TzZxiC3GqCfqb',
  p8: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDHLh_f7a-c8k_8TVQ6QQj5RHDbJKGQhvOZKBmRTaS-70AFTJ64oA6C9FaVVLk7W4FuNh0sse2_UO4SKGP89BcoRDAISrso3Z-xj0hR6b9pZcAiTMo0RzH_vZYWWhOT8NMxe1Yavyfh3hRgnF3rf8EPcQxo-RAheIqHCYbjsbAGXmiL6kW-AiiX-80mfKf4Co0SF2aepTeeELW2xBqfyPKTjHLpw73d_R3WDALeRDgXmDDsc6__S4Ri',
  p9: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-eLZQm6-B69HACp0oaG3RkAzlRQRTlhRI6tBqEPrYpzpCYA-tOq5oGfI858HNn92CH4ST-hkyybmM8bekfqHkErGGeS950hTU2xjxD9MVB6GjzQOirYCOzrunNvUkEf-U-B6aCen1MYk5ed5NOm_r81uSVmPgRvVcufUIaNFSDky8H0O99hRgzXQrPtmKckNW7miJlb7cqmtd8pbo3kMuNGF2V65J5aWXWuJUGJd2r4fRrjh4GH3S',
}

const catalog: MediaItem[] = [
  { id: 1, title: '镀金守卫', year: 2026, genres: ['动作', '冒险'], poster: images.p1, ratings: { imdb: 8.7, douban: 8.9 } },
  { id: 2, title: '永恒峰境', year: 2025, genres: ['剧情', '冒险'], poster: images.p2, ratings: { imdb: 8.9, douban: 9.1 } },
  { id: 3, title: '时空偏移', year: 2026, genres: ['科幻', '悬疑'], poster: images.p3, ratings: { imdb: 8.4, douban: 8.6 } },
  { id: 4, title: '极速临界', year: 2025, genres: ['动作', '犯罪'], poster: images.p4, ratings: { imdb: 8.1, douban: 8.3 } },
  { id: 5, title: '沉默节拍', year: 2024, genres: ['剧情', '音乐'], poster: images.p5, ratings: { imdb: 8.6, douban: 8.8 } },
  { id: 6, title: '暗流之下', year: 2025, genres: ['惊悚', '剧情'], poster: images.p6, ratings: { imdb: 8.2, douban: 8.5 } },
  { id: 7, title: '零号轨道', year: 2026, genres: ['科幻', '冒险'], poster: images.p7, ratings: { imdb: 8.5, douban: 8.7 } },
  { id: 8, title: '氙光漂移', year: 2025, genres: ['科幻', '剧集'], poster: images.p8, ratings: { imdb: 9.0, douban: 8.8 } },
  { id: 9, title: '东京拦截', year: 2026, genres: ['动作', '惊悚'], poster: images.p9, ratings: { imdb: 8.3, douban: 8.4 } },
]

export const nowPlaying = catalog.slice(0, 6)
export const topRated = [catalog[7], catalog[1], catalog[0], catalog[4], catalog[6], catalog[2]]
export const popularMovies = [catalog[2], catalog[3], catalog[5], catalog[8], catalog[0], catalog[6]]
export const popularTv = [catalog[7], catalog[4], catalog[5], catalog[1], catalog[2], catalog[8]]

export const popularHeroPool: HeroMovie[] = [
  { ...catalog[7], title: '霓虹回响：最终边界', backdrop: images.city, genres: ['科幻', '黑色电影'], overview: '在记忆可以像货币一样交易的未来都市，一名调查员追查失踪档案，却发现整座城市的过去正在被重新书写。' },
  { ...catalog[0], title: '镀金守卫', backdrop: images.cityTwo, genres: ['动作', '冒险'], overview: '一支被遗忘的守卫小队重返边境，在旧王朝的废墟中守住最后一道防线。' },
  { ...catalog[1], title: '永恒峰境', backdrop: images.city, genres: ['剧情', '冒险'], overview: '五位登山者在极夜到来前挑战无人抵达的山脊，也重新面对各自未完成的人生。' },
  { ...catalog[2], title: '时空偏移', backdrop: images.cityTwo, genres: ['科幻', '悬疑'], overview: '一次实验让同一座城市出现五条时间线，唯一记得真相的人必须在午夜前找到原点。' },
  { ...catalog[8], title: '东京拦截', backdrop: images.city, genres: ['动作', '惊悚'], overview: '高速列车上的匿名信号引发全城封锁，两名陌生人被迫在失控系统中联手追踪源头。' },
  { ...catalog[4], title: '沉默节拍', backdrop: images.cityTwo, genres: ['剧情', '音乐'], overview: '失去听力的作曲家通过城市震动重新创作，并与一支地下乐团完成最后的现场演出。' },
  { ...catalog[5], title: '暗流之下', backdrop: images.city, genres: ['惊悚', '剧情'], overview: '海港小镇接连出现失踪案，一名记者发现每条线索都指向二十年前被封存的事故。' },
]

export const industryNews: IndustryNews[] = [
  { id: 1, category: '独家报道', title: '《命运之丘》续作确认，原班导演回归', summary: 'IMDb 新闻频道披露项目已经进入前期制作，新故事将延续第一部结尾留下的时间谜团。', image: images.cityTwo, publishedAt: '2 小时前' },
  { id: 2, category: '影展直击', title: '现代黑色电影正在重新定义未来都市', summary: '从摄影、声音到叙事结构，新一代类型片正在将科技焦虑转化为更具人性的银幕表达。', image: images.city, publishedAt: '5 小时前' },
  { id: 3, category: '票房观察', title: '本周全球票房榜迎来三部新片', summary: '动作、动画与悬疑作品同时进入榜单前列，暑期档竞争正式升温。', image: images.p3, publishedAt: '昨天' },
]