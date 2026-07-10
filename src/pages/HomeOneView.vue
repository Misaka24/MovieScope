<script setup lang="ts">
import { useCinematicScroll } from '../composables/useCinematicScroll'
import HomeOneHeader from '../components/home-one/HomeOneHeader.vue'
import HomeOneHero from '../components/home-one/HomeOneHero.vue'
import HomeOneCatalog from '../components/home-one/HomeOneCatalog.vue'
import HomeOneMedia from '../components/home-one/HomeOneMedia.vue'
import HomeOneCommunity from '../components/home-one/HomeOneCommunity.vue'
import HomeOneFooter from '../components/home-one/HomeOneFooter.vue'

useCinematicScroll()
</script>

<template>
  <div class="home-one-page">
    <HomeOneHeader />
    <main>
      <HomeOneHero />
      <HomeOneCatalog />
      <HomeOneMedia />
      <HomeOneCommunity />
    </main>
    <HomeOneFooter />
  </div>
</template>
