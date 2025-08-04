/**
 * Distributed module exports
 */

export { DistributedConfigManager } from './configManager.js'
export { HashPartitioner, AffinityPartitioner } from './hashPartitioner.js'
export { 
  BaseOperationalMode,
  ReaderMode,
  WriterMode,
  HybridMode,
  OperationalModeFactory
} from './operationalModes.js'
export { DomainDetector } from './domainDetector.js'
export { HealthMonitor } from './healthMonitor.js'

export type {
  HealthMetrics,
  HealthStatus
} from './healthMonitor.js'

export type {
  DomainPattern
} from './domainDetector.js'