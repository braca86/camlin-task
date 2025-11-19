<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import Button from 'primevue/button'
import TransformerTable from './components/TransformerTable.vue'
import TransformerChart from './components/TransformerChart.vue'
import { useTransformerStore } from './stores/transformerStore'
import { useTheme } from './composables/useTheme'

const store = useTransformerStore()
const { isDark, toggleTheme } = useTheme()

/**
 * Handles storage events from other browser tabs
 * When another tab modifies the transformer dashboard state,
 * this handler syncs the current tab's state to match
 *
 * @param event - StorageEvent containing the modified key
 */
const onStorage = (event: StorageEvent) => {
  if (event.key === 'transformer-dashboard-state') {
    store.hydrateFromStorage()
  }
}

// Set up cross-tab synchronization on mount
onMounted(() => {
  window.addEventListener('storage', onStorage)
})

// Clean up event listener on unmount
onBeforeUnmount(() => {
  window.removeEventListener('storage', onStorage)
})
</script>

<template>
  <div class="min-h-screen p-4 surface-ground">
    <div class="max-w-screen-xl mx-auto">
      <header class="mb-4 flex justify-content-between align-items-start gap-3">
        <div>
          <h1 class="text-3xl font-bold m-0 mb-2 text-900">Transformer Monitoring Dashboard</h1>
          <p class="text-base m-0 text-600">
            Visualise transformer health and voltage trends across regions.
          </p>
        </div>
        <Button
          :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'"
          @click="toggleTheme"
          rounded
          text
          severity="secondary"
          :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        />
      </header>
      <main>
        <div class="grid">
          <div class="col-12 lg:col-5">
            <TransformerTable />
          </div>
          <div class="col-12 lg:col-7">
            <TransformerChart />
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
