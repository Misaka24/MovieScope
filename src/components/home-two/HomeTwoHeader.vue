<template>
<!-- TopNavBar -->
<header class="fixed top-0 w-full z-50 border-b border-white/10 shadow-2xl">
<div class="bg-[#121212] w-full">
<div class="flex items-center h-14 px-margin-mobile md:px-margin-desktop w-full max-w-container-max mx-auto gap-4">
<div class="flex items-center gap-4 flex-none">
<div class="h-8 w-auto cursor-pointer hover:opacity-80 transition-opacity">
<img alt="moviescope" class="h-full w-auto object-contain" src="https://lh3.googleusercontent.com/aida/AP1WRLsNgeyvtkxIx01SVhcD6SHiVZZmPshmwFVr9jWqp_ZmyIwpnvJza330eCJ0TTPR_GXM7xA0GakE72gL-3qPDnYw0h_eQ1FEsnNL-tu3NexVfoakrMiLaOi6sAewmw8f0gmyNflBL8FcPZp7lalLKWllXUvfyE6nBDm_IVaGzzeQOtbgkeJwelMGNPY9r4HBn1LidxmQ8boMLO065BZYJDhfQq8BnFZbfFj1uMEdD-cvnTY3RaZzqpDW0-w"/>
</div>
<button class="flex items-center gap-1 hover:bg-white/10 px-3 py-2 rounded transition-colors hover:text-primary">
<span class="material-symbols-outlined">menu</span>
<span class="font-bold text-body-md hidden md:block">菜单</span>
</button>
</div>
<div class="flex-grow flex items-center">
<div class="flex w-full bg-surface-container-high rounded overflow-hidden h-8 border border-white/10 focus-within:border-primary/50 transition-all">
<button class="flex items-center gap-1 px-3 text-on-surface-variant bg-surface-container-high border-r border-white/10 hover:bg-surface-container-highest transition-colors">
<span class="text-sm font-bold">全部</span>
<span class="material-symbols-outlined text-sm">arrow_drop_down</span>
</button>
<input class="flex-grow bg-transparent border-none focus:ring-0 text-on-surface text-body-md px-3 placeholder:text-on-surface-variant" placeholder="搜索 CINEPREMIERE" type="text"/>
<button class="px-3 text-on-surface-variant hover:text-primary transition-colors">
<span class="material-symbols-outlined">search</span>
</button>
</div>
</div>
<div class="flex items-center gap-4 flex-none">
<button class="flex items-center gap-1 hover:bg-white/10 px-3 py-2 rounded transition-colors hover:text-primary">
<span class="material-symbols-outlined">add</span>
<span class="font-bold text-body-md hidden md:block">待播清单</span>
</button>
<button class="font-bold text-body-md hover:bg-white/10 px-3 py-2 rounded transition-colors">登录</button>
<div class="flex items-center gap-1 cursor-pointer hover:bg-white/10 px-2 py-2 rounded transition-colors">
<span class="font-bold text-body-md">ZH</span>
<span class="material-symbols-outlined text-sm">arrow_drop_down</span>
</div>
</div>
</div>
</div>
</header>
</template>
