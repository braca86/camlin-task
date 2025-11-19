export interface VoltageReading {
  timestamp: string
  voltage: number
}

export enum TransformerHealth {
  Excellent = 'Excellent',
  Good = 'Good',
  Fair = 'Fair',
  Poor = 'Poor',
  Critical = 'Critical',
}

export interface Transformer {
  assetId: number
  name: string
  region: string
  health: TransformerHealth
  lastTenVoltageReadings: VoltageReading[]
}

export type TransformerDataset = Transformer[]
