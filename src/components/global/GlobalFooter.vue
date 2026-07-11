<template>
  <footer class="border-t border-white/5 bg-surface-container-lowest">
    <div class="mx-auto grid max-w-[1440px] gap-8 px-4 py-9 md:grid-cols-4 md:px-6">
      <div>
        <div class="text-lg font-black text-primary">MOVIESCOPE</div>
        <p class="mt-3 text-[13px] leading-[21px] text-on-surface-variant">为电影爱好者提供搜索、发现、评分与观影记录服务。</p>
      </div>
      <div><h2 class="text-[15px] font-extrabold">浏览</h2><div class="mt-3 space-y-2 text-[13px] text-on-surface-variant"><RouterLink class="block hover:text-primary" :to="{name:'explore',query:{media:'movie',sort:'primary_release_date.desc'}}">正在上映</RouterLink><RouterLink class="block hover:text-primary" :to="{name:'explore',query:{media:'movie'}}">热门电影</RouterLink><RouterLink class="block hover:text-primary" :to="{name:'explore',query:{media:'tv'}}">热门剧集</RouterLink></div></div>
      <div><h2 class="text-[15px] font-extrabold">内容</h2><div class="mt-3 space-y-2 text-[13px] text-on-surface-variant"><RouterLink class="block hover:text-primary" to="/?#高分榜">高分榜</RouterLink><RouterLink class="block hover:text-primary" to="/?#影坛动态">影坛动态</RouterLink><RouterLink class="block hover:text-primary" :to="{name:'search',query:{q:'演员',type:'person'}}">影人资料</RouterLink></div></div>
      <div><h2 class="text-[15px] font-extrabold">支持</h2><div class="mt-3 space-y-2 text-[13px] text-on-surface-variant"><RouterLink class="block hover:text-primary" to="/">关于我们</RouterLink><RouterLink class="block hover:text-primary" to="/">隐私协议</RouterLink></div></div>
    </div>
    <div class="border-t border-white/5 px-4 py-4.5 text-center text-xs text-on-surface-variant">© 2026 MovieScope。保留所有权利。</div>
  </footer>
</template>
