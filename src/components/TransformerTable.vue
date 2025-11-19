<script setup lang="ts">
import { computed } from 'vue'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Badge from 'primevue/badge'
import { useTransformerStore } from '../stores/transformerStore'
import { TransformerHealth } from '../types'
import type { Transformer } from '../types'

const store = useTransformerStore()

/**
 * Two-way computed property for the search input
 * Binds to store and triggers filtering on change
 */
const search = computed({
  get: () => store.tableSearch,
  set: (value: string) => store.setTableSearch(value),
})

/**
 * Two-way computed property for the health filter dropdown
 * Null value means "show all"
 */
const healthFilter = computed<TransformerHealth | null>({
  get: () => store.healthFilter,
  set: (value) => store.setHealthFilter(value),
})

/**
 * Options for the health filter dropdown
 * Includes "All" option (null value) plus all health states
 */
const healthOptions = computed(() => [
  { label: 'All health states', value: null },
  { label: 'Excellent', value: TransformerHealth.Excellent },
  { label: 'Good', value: TransformerHealth.Good },
  { label: 'Fair', value: TransformerHealth.Fair },
  { label: 'Poor', value: TransformerHealth.Poor },
  { label: 'Critical', value: TransformerHealth.Critical },
])

/**
 * Filtered transformer list from store
 * Already filtered by search query and health status
 */
const transformers = computed(() => store.filteredTransformers)

// ==================== Select All Logic ====================

/**
 * True if all currently visible transformers are selected
 * Used to show checked state in the header checkbox
 */
const allVisibleSelected = computed(() => {
  if (transformers.value.length === 0) return false
  return transformers.value.every((t) => store.selectedTransformerIds.includes(t.assetId))
})

/**
 * True if some (but not all) visible transformers are selected
 * Used to show indeterminate state in the header checkbox
 */
const someVisibleSelected = computed(() => {
  if (transformers.value.length === 0) return false
  return transformers.value.some((t) => store.selectedTransformerIds.includes(t.assetId))
})

/**
 * Toggles selection for all visible transformers
 * - If all visible are selected, deselects only the visible ones
 * - If not all visible are selected, selects all visible ones
 * - Preserves selections of transformers not currently visible
 */
const toggleSelectAll = () => {
  const visibleIds = transformers.value.map((t) => t.assetId)
  const otherSelectedIds = store.selectedTransformerIds.filter((id) => !visibleIds.includes(id))

  store.setSelectedTransformerIds(
    allVisibleSelected.value ? otherSelectedIds : [...otherSelectedIds, ...visibleIds],
  )
}

// ==================== Row Interaction Handlers ====================

/**
 * Handles row click to toggle transformer selection
 */
const onRowClick = (event: { data: Transformer }) => {
  store.toggleTransformerSelection(event.data.assetId)
}

/**
 * Handles mouse enter on row to highlight corresponding chart line
 * Only highlights if the transformer is currently selected in the chart
 */
const onRowMouseEnter = (event: { data: Transformer }) => {
  if (!isRowSelected(event.data.assetId)) {
    return
  }
  store.setHoveredTransformer(event.data.assetId)
}

/**
 * Handles mouse leave to clear chart highlighting
 */
const onRowMouseLeave = () => {
  store.setHoveredTransformer(null)
}

/**
 * Checks if a transformer row is currently selected for chart display
 */
const isRowSelected = (assetId: number) => {
  return store.selectedTransformerIds.includes(assetId)
}
</script>

<template>
  <Card>
    <template #title>
      <div class="flex flex-column gap-3">
        <h2 class="text-xl font-semibold m-0">Transformers</h2>
        <p class="text-sm text-color-secondary m-0">
          Search and inspect transformer health across regions.
        </p>
      </div>
    </template>
    <template #content>
      <div
        class="flex flex-column md:flex-row gap-3 mt-2 mb-3 md:align-items-center md:justify-content-between"
      >
        <IconField class="flex-1">
          <InputIcon class="pi pi-search" />
          <InputText
            v-model="search"
            placeholder="Search by name, region, or health"
            class="w-full"
            aria-label="Filter transformers"
          />
        </IconField>
        <Select
          v-model="healthFilter"
          :options="healthOptions"
          option-label="label"
          option-value="value"
          placeholder="Filter by health"
          class="w-full md:w-auto"
          style="min-width: 12rem"
        />
      </div>

      <div v-if="transformers.length === 0" class="text-center p-6">
        <i class="pi pi-inbox text-6xl text-400 mb-3"></i>
        <p class="text-lg font-medium m-0 mb-2 text-600">No transformers found</p>
        <p class="text-sm m-0 text-500">Try adjusting your search or filter criteria</p>
      </div>
      <DataTable
        v-else
        :value="transformers"
        data-key="assetId"
        responsive-layout="scroll"
        class="p-datatable-sm"
        @row-click="onRowClick"
      >
        <Column header="" :style="{ width: '3rem' }">
          <template #header>
            <Checkbox
              :model-value="allVisibleSelected"
              :indeterminate="!allVisibleSelected && someVisibleSelected"
              :binary="true"
              @update:model-value="toggleSelectAll"
              @click.stop
              aria-label="Toggle all transformers in chart"
              input-id="table-checkbox-select-all"
            />
          </template>
          <template #body="slotProps">
            <div @mouseenter="onRowMouseEnter(slotProps)" @mouseleave="onRowMouseLeave">
              <Checkbox
                :model-value="store.selectedTransformerIds.includes(slotProps.data.assetId)"
                :binary="true"
                @update:model-value="store.toggleTransformerSelection(slotProps.data.assetId)"
                @click.stop
                :aria-label="`Toggle ${slotProps.data.name} in chart`"
                :input-id="`table-checkbox-${slotProps.data.assetId}`"
              />
            </div>
          </template>
        </Column>
        <Column field="name" header="Name" sortable>
          <template #body="slotProps">
            <div @mouseenter="onRowMouseEnter(slotProps)" @mouseleave="onRowMouseLeave">
              <span class="font-medium">{{ slotProps.data.name }}</span>
            </div>
          </template>
        </Column>
        <Column field="region" header="Region" sortable>
          <template #body="slotProps">
            <div @mouseenter="onRowMouseEnter(slotProps)" @mouseleave="onRowMouseLeave">
              {{ slotProps.data.region }}
            </div>
          </template>
        </Column>
        <Column field="health" header="Health" sortable>
          <template #body="slotProps">
            <div @mouseenter="onRowMouseEnter(slotProps)" @mouseleave="onRowMouseLeave">
              <Badge :value="slotProps.data.health" severity="secondary" />
            </div>
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>
</template>

<style scoped>
:deep(.p-datatable.p-datatable-striped .p-datatable-tbody > tr),
:deep(.p-datatable .p-datatable-tbody > tr) {
  cursor: pointer;
  transition: background-color 0.15s ease;
}

:deep(.p-datatable.p-datatable-striped .p-datatable-tbody > tr:hover),
:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background-color: rgba(59, 130, 246, 0.08) !important;
}

:deep(.p-datatable.p-datatable-sm .p-datatable-tbody > tr > td) {
  padding: 0 !important;
  height: 2.5rem !important;
}

:deep(.p-datatable.p-datatable-sm .p-datatable-tbody > tr > td > div) {
  height: 100% !important;
  display: flex;
  align-items: center;
  padding-left: 0.5rem;
}
</style>
