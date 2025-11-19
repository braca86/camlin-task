<script setup lang="ts">
import { computed } from 'vue'
import Card from 'primevue/card'
import Chart from 'primevue/chart'
import Checkbox from 'primevue/checkbox'
import { useTransformerStore } from '../stores/transformerStore'
import { useTheme } from '../composables/useTheme'

const store = useTransformerStore()
const { isDark } = useTheme()
const transformers = computed(() => store.filteredTransformers)

/**
 * Sorted array of unique timestamps across all voltage readings
 *
 * Sorting is necessary because:
 * - JSON data may not be in chronological order
 * - Chart x-axis needs consistent time progression
 * - Enables proper line drawing between points
 */
const sortedTimestamps = computed(() => {
  const first = transformers.value[0]
  if (!first) return [] as string[]
  return [...first.lastTenVoltageReadings]
    .map((r) => r.timestamp)
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
})

/**
 * Formatted labels for chart x-axis
 * Converts ISO timestamps to readable date format (e.g., "15 Jan")
 */
const labels = computed(() =>
  sortedTimestamps.value.map((ts) =>
    new Date(ts).toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
    }),
  ),
)

/**
 * Color palette for transformer lines
 * Colors cycle if there are more transformers than colors
 */
const palette = ['#0ea5e9', '#22c55e', '#f97316', '#e11d48', '#8b5cf6']

/**
 * Computes the voltage domain (min/max) across ALL transformers
 *
 * Strategy:
 * - Uses ALL transformers (not just selected/filtered) for consistent y-axis scaling
 * - Prevents axis jumping when toggling series visibility
 * - Adds 10% padding above/below for visual breathing room
 * - Zooms in around actual data range instead of starting at 0
 *
 * Special cases:
 * - Empty data: returns default range [0, 100]
 * - Single value: adds padding to avoid zero-range axis
 */
const voltageDomain = computed(() => {
  const allTransformers = store.transformers || []
  const allVoltages = allTransformers.flatMap((t) =>
    (t.lastTenVoltageReadings || []).map((r) => r.voltage),
  )

  if (!allVoltages.length) {
    return { min: 0, max: 100 }
  }

  let min = Math.min(...allVoltages)
  let max = Math.max(...allVoltages)

  if (min === max) {
    // Avoid zero-range axis by adding padding around the single value
    const padding = min * 0.1 || 10
    min -= padding
    max += padding
  } else {
    // Add 10% padding above and below the data range
    const range = max - min
    const padding = range * 0.1
    min -= padding
    max += padding
  }

  return { min, max }
})

/**
 * Y-axis maximum value rounded up to nearest 5000V increment
 * Provides clean, round numbers on the axis for better readability
 */
const yAxisMax = computed(() => Math.ceil(voltageDomain.value.max / 5000) * 5000)

/**
 * Chart data configuration for Chart.js
 *
 * Builds datasets for each selected transformer with:
 * - Voltage values mapped to sorted timestamps
 * - Dynamic styling based on hover state
 * - Color assignment from palette (cycling if needed)
 *
 * Hover behavior:
 * - When a transformer is hovered (from table):
 *   - Hovered line: Full opacity, thicker border (4px)
 *   - Other lines: Reduced opacity (33% for border, 6% for fill)
 * - When no hover: All lines at full opacity, normal border (2px)
 *
 * This creates a "spotlight" effect that helps users focus on
 * a specific transformer while still seeing context from others.
 */
const chartData = computed(() => {
  const timestamps = sortedTimestamps.value
  const hasHover = store.hoveredTransformerId !== null

  return {
    labels: labels.value,
    datasets: transformers.value
      // Only include transformers that are checked/selected
      .filter((t) => store.selectedTransformerIds.includes(t.assetId))
      .map((t, index) => {
        const isHovered = store.hoveredTransformerId === t.assetId
        const baseColor = palette[index % palette.length]

        return {
          label: t.name,
          // Map each timestamp to its voltage value (or null if missing)
          data: timestamps.map((ts) => {
            const reading = t.lastTenVoltageReadings.find((r) => r.timestamp === ts)
            return reading ? reading.voltage : null
          }),
          // Apply opacity to non-hovered lines when something is hovered
          borderColor: hasHover && !isHovered ? baseColor + '55' : baseColor,
          backgroundColor: hasHover && !isHovered ? baseColor + '11' : baseColor + '33',
          tension: 0.3, // Smooth curves
          fill: false, // No area fill under lines
          borderWidth: isHovered ? 4 : 2, // Thicker line when hovered
          pointRadius: 3,
          pointHoverRadius: isHovered ? 7 : 4, // Larger points when hovered
          pointBackgroundColor: baseColor,
          pointBorderColor: baseColor,
          pointBorderWidth: 2,
        }
      }),
  }
})

/**
 * Chart.js configuration options
 *
 * Features:
 * - Theme-aware colors (dark/light mode support)
 * - Custom tooltip formatting (shows voltage with V suffix)
 * - Hidden legend (using custom checkbox legend below chart)
 * - Multi-point tooltip (shows all series at hovered x-position)
 * - Fixed y-axis max (prevents jumping when toggling series)
 * - Rounded y-axis values (to nearest 1000V for readability)
 * - 5000V step size on y-axis for clean increments
 */
const chartOptions = computed(() => {
  // Adjust colors based on theme for better contrast
  const textColor = isDark.value ? '#d1d5db' : '#6b7280'
  const gridColor = isDark.value ? '#4b5563' : '#e5e7eb'
  const borderColor = isDark.value ? '#6b7280' : '#d1d5db'

  return {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2.5, // Wider chart for time series
    plugins: {
      legend: {
        display: false, // Using custom checkbox legend instead
      },
      tooltip: {
        mode: 'index', // Show all series at same x-position
        intersect: false, // Trigger on x-axis proximity, not exact point hover
        callbacks: {
          // Format tooltip to show voltage with unit and thousands separator
          label: (context: { dataset: { label?: string }; parsed: { y: number } }) => {
            const label = context.dataset.label || ''
            const value = context.parsed.y
            return `${label}: ${value.toLocaleString()}V`
          },
        },
      },
    },
    scales: {
      x: {
        border: {
          color: borderColor,
        },
        grid: {
          color: gridColor,
        },
        ticks: {
          color: textColor,
        },
      },
      y: {
        max: yAxisMax.value, // Fixed max prevents axis jumping
        border: {
          color: borderColor,
        },
        grid: {
          color: gridColor,
        },
        ticks: {
          color: textColor,
          stepSize: 5000, // 5kV increments
          // Round to nearest 1000V and format with thousands separator
          callback: (value: number | string) =>
            `${(Math.round(Number(value) / 1000) * 1000).toLocaleString()}V`,
        },
      },
    },
  }
})

/**
 * Toggles a transformer's visibility in the chart
 */
const onToggleTransformer = (assetId: number) => {
  store.toggleTransformerSelection(assetId)
}

/**
 * Gets the color assigned to a transformer
 * Color is based on the transformer's position in the filtered list
 *
 * @param assetId - Transformer asset ID
 * @returns Hex color string
 */
const getTransformerColor = (assetId: number) => {
  const index = transformers.value.findIndex((t) => t.assetId === assetId)
  return palette[index % palette.length]
}

/**
 * Checks if any filtered transformers are currently selected
 * Used to determine whether to show the chart or empty state
 */
const hasSelectedFilteredTransformers = computed(() => {
  return transformers.value.some((t) => store.selectedTransformerIds.includes(t.assetId))
})
</script>

<template>
  <Card class="h-full flex flex-column">
    <template #title>
      <div class="flex flex-column gap-3">
        <h2 class="text-xl font-semibold m-0">Voltage over Time</h2>
        <p class="text-sm text-color-secondary m-0">
          Each line represents the last 10 voltage readings for a transformer.
        </p>
      </div>
    </template>
    <template #content>
      <div class="flex flex-column mt-3 gap-3">
        <div v-if="!hasSelectedFilteredTransformers" class="text-center p-6">
          <i class="pi pi-chart-line text-6xl text-400 mb-3"></i>
          <p class="text-lg font-medium m-0 mb-2 text-600">No transformers selected</p>
          <p class="text-sm m-0 text-500">Select transformers to view their voltage trends</p>
        </div>
        <div v-else>
          <Chart type="line" :data="chartData" :options="chartOptions" />
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex flex-wrap gap-2 mt-3">
        <label
          v-for="transformer in transformers"
          :key="transformer.assetId"
          class="transformer-checkbox p-2 border-round border-1 flex align-items-center gap-2 text-sm cursor-pointer transition-colors transition-duration-150"
          :aria-label="`Toggle ${transformer.name} in chart`"
          :style="{
            backgroundColor: getTransformerColor(transformer.assetId) + '50',
            borderColor: getTransformerColor(transformer.assetId),
          }"
        >
          <Checkbox
            :model-value="store.selectedTransformerIds.includes(transformer.assetId)"
            :binary="true"
            @update:model-value="onToggleTransformer(transformer.assetId)"
            :input-id="`checkbox-${transformer.assetId}`"
          />
          <span>{{ transformer.name }}</span>
        </label>
      </div>
    </template>
  </Card>
</template>

<style scoped>
.transformer-checkbox:hover {
  filter: brightness(1.1);
}

.transformer-checkbox:focus-within {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
</style>
