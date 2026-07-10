import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './pages/HomeView.vue'
import SearchView from './pages/SearchView.vue'
import ExploreView from './pages/ExploreView.vue'
import TitleDetailView from './pages/TitleDetailView.vue'
import PersonDetailView from './pages/PersonDetailView.vue'
import BrowseView from './pages/BrowseView.vue'
import PeopleView from './pages/PeopleView.vue'
import NoticeView from './pages/NoticeView.vue'
import ProvidersView from './pages/ProvidersView.vue'
import NewsView from './pages/NewsView.vue'

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to, from, saved) { return saved || { top: 0 } },
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/search', name: 'search', component: SearchView },
    { path: '/explore', name: 'explore', component: ExploreView },
    { path: '/title/:type(movie|tv)/:id', name: 'title', component: TitleDetailView },
    { path: '/person/:id', name: 'person', component: PersonDetailView },
    { path: '/browse/:preset', name: 'browse', component: BrowseView },
    { path: '/people', name: 'people', component: PeopleView },
    { path: '/notice', name: 'notice', component: NoticeView },
    { path: '/providers', name: 'providers', component: ProvidersView },
    { path: '/news', name: 'news', component: NewsView },
  ],
})
