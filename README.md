## Transformer Monitoring Dashboard

This project implements the take-home exercise: a small Vue 3 + TypeScript web application
that ingests transformer asset data from JSON and visualises it in a table and line chart.

### Tech stack

- **Framework**: Vue 3 + TypeScript (Vite)
- **UI library**: PrimeVue 4 (`DataTable`, `Chart`) ([PrimeVue DataTable](https://primevue.org/datatable/), [PrimeVue Chart](https://primevue.org/chart/))
- **State management**: Pinia
- **Charts**: Chart.js
- **Containerisation**: Docker + Nginx

### Features

- **Data ingestion**
  - Loads `src/sample-data/sampledata.json` at startup via a small data service.
  - Normalises voltage readings (stored as strings in JSON) to numbers.

- **Transformer table**
  - PrimeVue `DataTable` listing all transformers with **name**, **region**, and **health**.
  - Global search box filtering by any field.
  - Health status dropdown filter for targeted filtering.
  - Sortable columns (Name, Region, Health).
  - Checkbox column for quick selection/deselection.
  - Badge display for health status with visual indicators.
  - Row hover effects with smooth visual feedback.
  - Clicking a row toggles that transformer's inclusion in the chart.
  - Empty state message when no results match filters.

- **Voltage line chart**
  - PrimeVue `Chart` (Chart.js line chart).
  - X‑axis: time (last 10 timestamps), Y‑axis: voltage.
  - One line per transformer with color-coded series.
  - Color-coded transformer selection checkboxes matching chart line colors.
  - Cross-component hover highlighting: hovering over table rows highlights corresponding chart lines.
  - Empty state message when no transformers are selected.
  - Responsive aspect ratio adjusting for mobile and desktop viewports.

- **UI/UX enhancements**
  - Dark mode support with theme-aware chart colors and text.
  - Smooth transitions and animations throughout the interface.

- **State management & persistence**
  - Pinia store holds:
    - Raw transformer data.
    - Table search text and health filter.
    - Selected transformer IDs for the chart.
    - Hovered transformer ID for cross-component highlighting.
  - State is persisted to `localStorage` so table filters and chart selections survive reloads.
  - Uses the `storage` event so updates in one browser tab propagate to others.

### Running the app locally

Prerequisites:

- Node.js 20+
- npm

Install dependencies:

```sh
npm install
```

Start the dev server:

```sh
npm run dev
```

Run type-check and production build:

```sh
npm run build
```

Run ESLint:

```sh
npm run lint
```

### Docker usage

Build the Docker image:

```sh
docker build -t camlin-transformer-dashboard .
```

Run the container:

```sh
docker run -p 4173:80 camlin-transformer-dashboard
```

Or with `docker-compose`:

```sh
docker compose up --build
```

Then open `http://localhost:4173` in your browser.

### Project structure (key files)

- `src/sample-data/sampledata.json` – Transformer dataset (5 assets).
- `src/types.ts` – Shared TypeScript types (`Transformer`, `VoltageReading`).
- `src/services/transformerData.ts` – Data ingestion and normalisation.
- `src/stores/transformerStore.ts` – Pinia store with persisted, cross‑tab state.
- `src/components/TransformerTable.vue` – Table UI.
- `src/components/TransformerChart.vue` – Line chart UI.
- `src/App.vue` – Layout and cross‑tab storage synchronisation.
- `Dockerfile` / `docker-compose.yml` – Containerised deployment.
