import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loadTransformers } from '../services/transformerData'
import type { Transformer, TransformerHealth } from '../types'

/**
 * LocalStorage key for persisting dashboard state across sessions
 */
const STORAGE_KEY = 'transformer-dashboard-state'

/**
 * Complete state structure for the transformer dashboard
 * Used for typing the persisted state in localStorage
 */
interface TransformerDashboardState {
  transformers: Transformer[]
  selectedTransformerIds: number[]
  tableSearch: string
  healthFilter: TransformerHealth | null
  hoveredTransformerId: number | null
}

/**
 * Creates the default state for the dashboard
 * Loads transformer data and initializes with all transformers selected
 *
 * @returns Initial state with all transformers loaded and selected
 */
function getDefaultState(): TransformerDashboardState {
  const transformers = loadTransformers()

  return {
    transformers,
    selectedTransformerIds: transformers.map((t) => t.assetId),
    tableSearch: '',
    healthFilter: null,
    hoveredTransformerId: null,
  }
}

/**
 * Attempts to load persisted state from localStorage
 *
 * Only user preferences are persisted (not the transformer data itself):
 * - Selected transformer IDs for chart visibility
 * - Table search query
 * - Health filter selection
 *
 * @returns Partial state object if found and valid, null otherwise
 */
function loadPersistedState(): Partial<TransformerDashboardState> | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<TransformerDashboardState>

    return {
      selectedTransformerIds: parsed.selectedTransformerIds,
      tableSearch: parsed.tableSearch,
      healthFilter: parsed.healthFilter as TransformerHealth | null,
    }
  } catch {
    return null
  }
}

/**
 * Persists user preferences to localStorage
 *
 * This enables:
 * - State preservation across page refreshes
 * - Synchronization across browser tabs via storage events
 *
 * @param selectedTransformerIds - Currently selected transformer IDs
 * @param tableSearch - Current search query
 * @param healthFilter - Current health filter
 */
function persistState(
  selectedTransformerIds: number[],
  tableSearch: string,
  healthFilter: TransformerHealth | null,
) {
  if (typeof window === 'undefined') return

  const toPersist = {
    selectedTransformerIds,
    tableSearch,
    healthFilter,
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist))
}

/**
 * Pinia store for managing transformer dashboard state
 *
 * Handles:
 * - Loading and storing transformer data
 * - Filtering transformers by search query and health status
 * - Managing chart selections (which transformers to display)
 * - Hover state for chart/table interaction
 * - Persisting user preferences to localStorage
 */
export const useTransformerStore = defineStore('transformers', () => {
  // Initialize with default state and merge any persisted preferences
  const defaultState = getDefaultState()
  const persistedState = loadPersistedState()

  // ==================== State ====================

  /** All transformer records loaded from the data source */
  const transformers = ref<Transformer[]>(defaultState.transformers)

  /** Asset IDs of transformers currently selected for chart display */
  const selectedTransformerIds = ref<number[]>(
    persistedState?.selectedTransformerIds ?? defaultState.selectedTransformerIds,
  )

  /** Current search query for filtering the table */
  const tableSearch = ref<string>(persistedState?.tableSearch ?? defaultState.tableSearch)

  /** Current health status filter (null = show all) */
  const healthFilter = ref<TransformerHealth | null>(
    persistedState?.healthFilter ?? defaultState.healthFilter,
  )

  /** Asset ID of the transformer currently being hovered (for chart highlighting) */
  const hoveredTransformerId = ref<number | null>(null)

  // ==================== Computed Properties ====================

  /**
   * Returns transformers filtered by both search query and health status
   *
   * Search matches against: name, region, and health (case-insensitive)
   * Health filter: exact match or null for all
   */
  const filteredTransformers = computed(() => {
    const q = tableSearch.value.toLowerCase()
    return transformers.value.filter((t) => {
      const matchesSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.region.toLowerCase().includes(q) ||
        t.health.toLowerCase().includes(q)

      const matchesHealth = !healthFilter.value || t.health === healthFilter.value

      return matchesSearch && matchesHealth
    })
  })

  // ==================== Actions ====================

  /**
   * Updates the table search query and persists to localStorage
   *
   * @param search - New search query string
   */
  function setTableSearch(search: string) {
    tableSearch.value = search
    persistState(selectedTransformerIds.value, tableSearch.value, healthFilter.value)
  }

  /**
   * Updates the health filter and persists to localStorage
   *
   * @param filter - Health status to filter by, or null to show all
   */
  function setHealthFilter(filter: TransformerHealth | null) {
    healthFilter.value = filter
    persistState(selectedTransformerIds.value, tableSearch.value, healthFilter.value)
  }

  /**
   * Sets the currently hovered transformer for chart highlighting
   * Not persisted - resets on page refresh
   *
   * @param assetId - Asset ID of hovered transformer, or null if none
   */
  function setHoveredTransformer(assetId: number | null) {
    hoveredTransformerId.value = assetId
  }

  /**
   * Toggles a transformer's selection state for chart display
   * If selected, removes it from selection; if not selected, adds it
   * Persists the change to localStorage
   *
   * @param assetId - Asset ID of transformer to toggle
   */
  function toggleTransformerSelection(assetId: number) {
    if (selectedTransformerIds.value.includes(assetId)) {
      selectedTransformerIds.value = selectedTransformerIds.value.filter((id) => id !== assetId)
    } else {
      selectedTransformerIds.value = [...selectedTransformerIds.value, assetId]
    }
    persistState(selectedTransformerIds.value, tableSearch.value, healthFilter.value)
  }

  /**
   * Replaces the entire selection set with a new array of IDs
   * Used for bulk operations like "select all" or "deselect all"
   * Persists the change to localStorage
   *
   * @param ids - Array of asset IDs to select
   */
  function setSelectedTransformerIds(ids: number[]) {
    selectedTransformerIds.value = [...ids]
    persistState(selectedTransformerIds.value, tableSearch.value, healthFilter.value)
  }

  /**
   * Reloads state from localStorage
   * Used to sync state when storage events are fired from other tabs
   * Allows the dashboard to stay synchronized across multiple browser tabs
   */
  function hydrateFromStorage() {
    const persisted = loadPersistedState()
    if (persisted) {
      if (persisted.selectedTransformerIds !== undefined) {
        selectedTransformerIds.value = persisted.selectedTransformerIds
      }
      if (persisted.tableSearch !== undefined) {
        tableSearch.value = persisted.tableSearch
      }
      if (persisted.healthFilter !== undefined) {
        healthFilter.value = persisted.healthFilter
      }
    }
  }

  return {
    // State
    transformers,
    selectedTransformerIds,
    tableSearch,
    healthFilter,
    hoveredTransformerId,
    // Getters
    filteredTransformers,
    // Actions
    setTableSearch,
    setHealthFilter,
    setHoveredTransformer,
    toggleTransformerSelection,
    setSelectedTransformerIds,
    hydrateFromStorage,
  }
})
