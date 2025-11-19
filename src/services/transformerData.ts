import sampleData from '../sample-data/sampledata.json'
import type { Transformer, VoltageReading, TransformerHealth } from '../types'

/**
 * Data ingestion layer for transformer data.
 *
 * Currently loads from a local JSON file bundled with the app,
 * but can be swapped for an API call in the future by modifying
 * the loadTransformers function implementation.
 */

/**
 * Raw voltage reading as it appears in the JSON data source
 * Note: voltage is stored as a string and requires conversion to number
 */
interface RawVoltageReading {
  timestamp: string
  voltage: string
}

/**
 * Raw transformer data structure from the JSON source
 * Represents the untransformed data before type normalization
 */
interface RawTransformer {
  assetId: number
  name: string
  region: string
  health: string
  lastTenVoltageReadings: RawVoltageReading[]
}

/**
 * Loads and normalizes transformer data from the data source
 *
 * Performs the following transformations:
 * 1. Converts voltage values from strings to numbers
 * 2. Converts health status strings to TransformerHealth enum
 * 3. Validates and structures data according to Transformer interface
 *
 * @returns Array of normalized Transformer objects ready for use
 */
export function loadTransformers(): Transformer[] {
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
