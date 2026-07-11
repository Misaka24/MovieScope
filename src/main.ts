import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import { useAuth } from './composables/useAuth'
import './style.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/inter/800.css'
import '@fontsource/jetbrains-mono/600.css'
import 'material-symbols/outlined.css'

const app=createApp(App).use(router)
useAuth().refresh()
app.mount('#app')
