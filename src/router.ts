import { createRouter, createWebHistory } from 'vue-router'
export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to, from, saved) { return saved || { top: 0 } },
  routes: [
    { path: '/', name: 'home', component: () => import('./pages/HomeView.vue') },
    { path: '/search', name: 'search', component: () => import('./pages/SearchView.vue') },
    { path: '/explore', name: 'explore', component: () => import('./pages/ExploreView.vue') },
    { path: '/title/:type(movie|tv)/:id', name: 'title', component: () => import('./pages/TitleDetailView.vue') },
    { path: '/person/:id', name: 'person', component: () => import('./pages/PersonDetailView.vue') },
    { path: '/browse/:preset', name: 'browse', component: () => import('./pages/BrowseView.vue') },
    { path: '/people', name: 'people', component: () => import('./pages/PeopleView.vue') },
    { path: '/notice', name: 'notice', component: () => import('./pages/NoticeView.vue') },
    { path: '/providers', name: 'providers', component: () => import('./pages/ProvidersView.vue') },
    { path: '/news', name: 'news', component: () => import('./pages/NewsView.vue') },
    { path: '/auth', name: 'auth', component: () => import('./pages/AuthView.vue') },
    { path: '/me', name: 'profile', component: () => import('./pages/ProfileView.vue') },
    { path: '/users/:username', name: 'public-profile', component: () => import('./pages/PublicProfileView.vue') },
    { path: '/admin', name: 'admin', component: () => import('./pages/AdminView.vue') },
  ],
})
