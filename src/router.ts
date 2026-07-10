import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './pages/HomeView.vue'
import SearchView from './pages/SearchView.vue'
import ExploreView from './pages/ExploreView.vue'
import TitleDetailView from './pages/TitleDetailView.vue'
import PersonDetailView from './pages/PersonDetailView.vue'

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to, from, saved) { return saved || { top: 0 } },
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/search', name: 'search', component: SearchView },
    { path: '/explore', name: 'explore', component: ExploreView },
    { path: '/title/:type(movie|tv)/:id', name: 'title', component: TitleDetailView },
    { path: '/person/:id', name: 'person', component: PersonDetailView },
  ],
})
