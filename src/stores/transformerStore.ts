import { defineStore } from 'pinia'
import { loadTransformers } from '../services/transformerData'
import type { Transformer, TransformerHealth } from '../types'

const STORAGE_KEY = 'transformer-dashboard-state'

interface TransformerDashboardState {
  transformers: Transformer[]
  selectedTransformerIds: number[]
  tableSearch: string
  healthFilter: TransformerHealth | null
  hoveredTransformerId: number | null
}

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

function loadPersistedState(): TransformerDashboardState | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<TransformerDashboardState>

    const base = getDefaultState()

    return {
      ...base,
      selectedTransformerIds: parsed.selectedTransformerIds ?? base.selectedTransformerIds,
      tableSearch: parsed.tableSearch ?? base.tableSearch,
      healthFilter: (parsed.healthFilter as TransformerHealth | null) ?? null,
    }
  } catch {
    return null
  }
}

function persistState(state: TransformerDashboardState) {
  if (typeof window === 'undefined') return

  const toPersist: Partial<TransformerDashboardState> = {
    selectedTransformerIds: state.selectedTransformerIds,
    tableSearch: state.tableSearch,
    healthFilter: state.healthFilter,
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist))
}

export const useTransformerStore = defineStore('transformers', {
  state: (): TransformerDashboardState =>
    (typeof window !== 'undefined' && loadPersistedState()) || getDefaultState(),
  getters: {
    filteredTransformers(state): Transformer[] {
      const q = state.tableSearch.toLowerCase()
      return state.transformers.filter((t) => {
        const matchesSearch =
          !q ||
          t.name.toLowerCase().includes(q) ||
          t.region.toLowerCase().includes(q) ||
          t.health.toLowerCase().includes(q)

        const matchesHealth = !state.healthFilter || t.health === state.healthFilter

        return matchesSearch && matchesHealth
      })
    },
  },
  actions: {
    setTableSearch(search: string) {
      this.tableSearch = search
      persistState(this.$state)
    },
    setHealthFilter(filter: TransformerHealth | null) {
      this.healthFilter = filter
      persistState(this.$state)
    },
    setHoveredTransformer(assetId: number | null) {
      this.hoveredTransformerId = assetId
    },
    toggleTransformerSelection(assetId: number) {
      if (this.selectedTransformerIds.includes(assetId)) {
        this.selectedTransformerIds = this.selectedTransformerIds.filter((id) => id !== assetId)
      } else {
        this.selectedTransformerIds = [...this.selectedTransformerIds, assetId]
      }
      persistState(this.$state)
    },
    setSelectedTransformerIds(ids: number[]) {
      this.selectedTransformerIds = [...ids]
      persistState(this.$state)
    },
    hydrateFromStorage() {
      const persisted = loadPersistedState()
      if (persisted) {
        this.$patch(persisted)
      }
    },
  },
})
