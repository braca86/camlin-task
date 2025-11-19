import { ref, watch } from 'vue'

/**
 * Theme mode type - supports light and dark themes
 */
type ThemeMode = 'light' | 'dark'

/**
 * LocalStorage key for persisting theme preference
 */
const STORAGE_KEY = 'transformer-dashboard-theme'

/**
 * Reactive state tracking whether dark mode is active
 * Shared across all instances of useTheme composable
 */
const isDark = ref<boolean>(false)

/**
 * Initializes theme from localStorage or falls back to system preference
 * Should be called once during app initialization
 */
const initTheme = () => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    isDark.value = stored === 'dark'
  } else {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  applyTheme(isDark.value)
}

/**
 * Applies the theme to the document by toggling the 'dark' class
 * PrimeVue and custom styles use this class for theme-aware styling
 *
 * @param dark - Whether dark mode should be active
 */
const applyTheme = (dark: boolean) => {
  if (dark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

/**
 * Composable for managing application theme (light/dark mode)
 *
 * Features:
 * - Persists theme preference to localStorage
 * - Detects system theme preference on first load
 * - Reactive theme state shared across components
 * - Applies theme via CSS class on document root
 *
 * @returns Theme state and control functions
 */
export function useTheme() {
  watch(isDark, (dark) => {
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light')
    applyTheme(dark)
  })

  /**
   * Toggles between light and dark mode
   */
  const toggleTheme = () => {
    isDark.value = !isDark.value
  }

  /**
   * Sets the theme to a specific mode
   *
   * @param mode - Theme mode to activate ('light' or 'dark')
   */
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
