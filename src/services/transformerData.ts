import sampleData from '../sample-data/sampledata.json'
import type { Transformer, VoltageReading, TransformerHealth } from '../types'

// Ingestion layer for transformer data. Currently loads from a local JSON file
// bundled with the app, but can be swapped for an API call in the future.

interface RawVoltageReading {
  timestamp: string
  voltage: string
}

interface RawTransformer {
  assetId: number
  name: string
  region: string
  health: string
  lastTenVoltageReadings: RawVoltageReading[]
}

export function loadTransformers(): Transformer[] {
  // JSON has voltage values as strings, normalise them to numbers here.
  const raw = sampleData as RawTransformer[]

  return raw.map<Transformer>((t) => ({
    assetId: t.assetId,
    name: t.name,
    region: t.region,
    health: t.health as TransformerHealth,
    lastTenVoltageReadings: t.lastTenVoltageReadings.map<VoltageReading>((reading) => ({
      timestamp: reading.timestamp,
      voltage: Number(reading.voltage),
    })),
  }))
}
