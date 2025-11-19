import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import { useTheme } from './composables/useTheme'
import App from './App.vue'

// Global styles - optimized load order
import './assets/styles.css' // Critical custom styles first
import 'primeicons/primeicons.css' // Icons needed for UI
import 'primeflex/primeflex.css' // Utility classes

const app = createApp(App)

app.use(createPinia())
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.dark',
      cssLayer: {
        name: 'primevue',
        order: 'tailwind-base, primevue, tailwind-utilities',
      },
    },
  },
})

// Initialize theme before mounting
const { initTheme } = useTheme()
initTheme()

app.mount('#app')
