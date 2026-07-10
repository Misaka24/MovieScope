<script setup lang="ts">
import { useCinematicScroll } from '../composables/useCinematicScroll'
import HomeTwoHeader from '../components/home-two/HomeTwoHeader.vue'
import HomeTwoHero from '../components/home-two/HomeTwoHero.vue'
import HomeTwoCatalog from '../components/home-two/HomeTwoCatalog.vue'
import HomeTwoEditorial from '../components/home-two/HomeTwoEditorial.vue'
import HomeTwoFooter from '../components/home-two/HomeTwoFooter.vue'

useCinematicScroll()
</script>

<template>
  <div class="home-two-page">
    <HomeTwoHeader />
    <HomeTwoHero />
    <main class="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-20 space-y-24">
      <HomeTwoCatalog />
      <HomeTwoEditorial />
    </main>
    <HomeTwoFooter />
  </div>
</template>
