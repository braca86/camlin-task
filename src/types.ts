/**
 * Represents a single voltage reading at a specific point in time
 */
export interface VoltageReading {
  timestamp: string
  voltage: number
}

/**
 * Enum representing the health status of a transformer
 * Health states are ordered from best to worst condition
 */
export enum TransformerHealth {
  Excellent = 'Excellent',
  Good = 'Good',
  Fair = 'Fair',
  Poor = 'Poor',
  Critical = 'Critical',
}

/**
 * Represents a power transformer asset with its metadata and recent voltage history
 */
export interface Transformer {
  assetId: number
  name: string
  region: string
  health: TransformerHealth
  lastTenVoltageReadings: VoltageReading[]
}

/**
 * Type alias for a collection of transformer records
 */
export type TransformerDataset = Transformer[]
