#!/usr/bin/env node

// Wrapper to ensure Cortex commands exit properly
import { Cortex } from './dist/cortex/cortex.js'

// Create Cortex instance
const cortex = new Cortex()

// Wrap all methods to ensure process exits
const wrapMethod = (method) => {
  return async (...args) => {
    try {
      await method.call(cortex, ...args)
      // Exit after successful completion
      setTimeout(() => process.exit(0), 100)
    } catch (error) {
      console.error(error)
      process.exit(1)
    }
  }
}

// Export wrapped Cortex
export const wrappedCortex = {
  init: wrapMethod(cortex.init),
  chat: cortex.chat.bind(cortex), // Interactive, handle differently
  add: wrapMethod(cortex.add),
  search: wrapMethod(cortex.search),
  advancedSearch: cortex.advancedSearch.bind(cortex), // Interactive
  addVerb: wrapMethod(cortex.addVerb),
  explore: cortex.explore.bind(cortex), // Interactive
  configSet: wrapMethod(cortex.configSet),
  configGet: wrapMethod(cortex.configGet),
  configList: wrapMethod(cortex.configList),
  migrate: wrapMethod(cortex.migrate),
  stats: wrapMethod(cortex.stats),
  listFields: wrapMethod(cortex.listFields),
  setupLLM: cortex.setupLLM.bind(cortex), // Interactive
  embed: wrapMethod(cortex.embed),
  similarity: wrapMethod(cortex.similarity),
  importEnv: wrapMethod(cortex.importEnv),
  exportEnv: wrapMethod(cortex.exportEnv),
  backup: wrapMethod(cortex.backup),
  restore: wrapMethod(cortex.restore),
  health: wrapMethod(cortex.health),
  delete: wrapMethod(cortex.delete),
  update: wrapMethod(cortex.update)
}

export default wrappedCortex