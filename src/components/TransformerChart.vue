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

const sortedTimestamps = computed(() => {
  const first = transformers.value[0]
  if (!first) return [] as string[]
  return [...first.lastTenVoltageReadings]
    .map((r) => r.timestamp)
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
})

const labels = computed(() =>
  sortedTimestamps.value.map((ts) =>
    new Date(ts).toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
    }),
  ),
)

const palette = ['#0ea5e9', '#22c55e', '#f97316', '#e11d48', '#8b5cf6']

// Compute global min/max voltage across all transformers so the y-axis
// stays consistent regardless of which series are toggled, but zooms
// in around the data instead of starting at 0.
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
    // Avoid zero-range axis
    const padding = min * 0.1 || 10
    min -= padding
    max += padding
  } else {
    const range = max - min
    const padding = range * 0.1
    min -= padding
    max += padding
  }

  return { min, max }
})

const yAxisMax = computed(() => Math.ceil(voltageDomain.value.max / 5000) * 5000)

const chartData = computed(() => {
  const timestamps = sortedTimestamps.value
  const hasHover = store.hoveredTransformerId !== null

  return {
    labels: labels.value,
    datasets: transformers.value
      .filter((t) => store.selectedTransformerIds.includes(t.assetId))
      .map((t, index) => {
        const isHovered = store.hoveredTransformerId === t.assetId
        const baseColor = palette[index % palette.length]

        return {
          label: t.name,
          data: timestamps.map((ts) => {
            const reading = t.lastTenVoltageReadings.find((r) => r.timestamp === ts)
            return reading ? reading.voltage : null
          }),
          // Strong, solid color for hovered, softer for others when something is hovered
          borderColor: hasHover && !isHovered ? baseColor + '55' : baseColor,
          backgroundColor: hasHover && !isHovered ? baseColor + '11' : baseColor + '33',
          tension: 0.3,
          fill: false,
          borderWidth: isHovered ? 4 : 2,
          pointRadius: 3,
          pointHoverRadius: isHovered ? 7 : 4,
          pointBackgroundColor: baseColor,
          pointBorderColor: baseColor,
          pointBorderWidth: 2,
        }
      }),
  }
})

const chartOptions = computed(() => {
  // Brighter colors for dark mode
  const textColor = isDark.value ? '#d1d5db' : '#6b7280'
  const gridColor = isDark.value ? '#4b5563' : '#e5e7eb'
  const borderColor = isDark.value ? '#6b7280' : '#d1d5db'

  // Responsive aspect ratio: smaller on mobile
  const aspectRatio = window.innerWidth < 768 ? 1.5 : 2.5

  return {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio,
    animation: {
      duration: 400,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
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
        max: yAxisMax.value,
        border: {
          color: borderColor,
        },
        grid: {
          color: gridColor,
        },
        ticks: {
          color: textColor,
          stepSize: 5000,
          callback: (value: number | string) =>
            `${(Math.round(Number(value) / 1000) * 1000).toLocaleString()}V`,
        },
      },
    },
  }
})

const onToggleTransformer = (assetId: number) => {
  store.toggleTransformerSelection(assetId)
}

const getTransformerColor = (assetId: number) => {
  const index = transformers.value.findIndex((t) => t.assetId === assetId)
  return palette[index % palette.length]
}
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
        <div v-if="store.selectedTransformerIds.length === 0" class="text-center p-6">
          <i class="pi pi-chart-line text-6xl text-400 mb-3"></i>
          <p class="text-lg font-medium m-0 mb-2 text-600">No transformers selected</p>
          <p class="text-sm m-0 text-500">Select transformers above to view their voltage trends</p>
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
