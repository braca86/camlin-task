import { ref, watch } from 'vue'

type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'transformer-dashboard-theme'

const isDark = ref<boolean>(false)

// Initialize from localStorage or system preference
const initTheme = () => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    isDark.value = stored === 'dark'
  } else {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  applyTheme(isDark.value)
}

const applyTheme = (dark: boolean) => {
  if (dark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

export function useTheme() {
  // Watch for changes and persist
  watch(isDark, (dark) => {
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light')
    applyTheme(dark)
  })

  const toggleTheme = () => {
    isDark.value = !isDark.value
  }

  const setTheme = (mode: ThemeMode) => {
    isDark.value = mode === 'dark'
  }

  return {
    isDark,
    toggleTheme,
    setTheme,
    initTheme,
  }
}
