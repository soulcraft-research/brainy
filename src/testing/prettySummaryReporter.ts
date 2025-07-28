import { Reporter, File, Task, TaskResult, Vitest, TaskResultPack, RunnerTaskEventPack as TaskEventPack } from 'vitest'

/**
 * PrettySummaryReporter - A visually appealing summary reporter for Vitest
 * 
 * This reporter creates a visually enhanced summary of test results
 * with colors, symbols, and formatted output at the end of the test run.
 */
export default class PrettySummaryReporter implements Reporter {
  private startTime: number = 0
  private testFiles: string[] = []
  private testCounts = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  }
  private fileResults: Map<string, { passed: number, failed: number, skipped: number }> = new Map()
  private failedTests: Array<{ file: string, name: string, error: string }> = []
  private ctx: Vitest | undefined

  onInit(ctx: Vitest): void {
    this.ctx = ctx
    this.startTime = Date.now()
    console.log('\n🧠 \x1b[36mBrainy Test Suite\x1b[0m - Starting tests...\n')
  }

  onCollected(files?: File[]): void {
    if (files && files.length > 0) {
      for (const file of files) {
        this.testFiles.push(file.filepath)
        
        // Initialize file results
        const fileResult = { passed: 0, failed: 0, skipped: 0 }
        this.fileResults.set(file.filepath, fileResult)
        
        // Count tests in this file and update total count
        const countTests = (tasks: Task[]) => {
          for (const task of tasks) {
            if (task.type === 'test') {
              // Count the test based on its mode
              this.testCounts.total++
              
              if (task.mode === 'skip') {
                fileResult.skipped++
                this.testCounts.skipped++
              } else {
                // Initially mark as passed, will be updated if it fails
                fileResult.passed++
                this.testCounts.passed++
              }
            }
            // Check if task is a Suite which has tasks property
            if ('tasks' in task && Array.isArray(task.tasks) && task.tasks.length > 0) {
              countTests(task.tasks)
            }
          }
        }
        
        if (file.tasks) {
          countTests(file.tasks)
        }
      }
    }
  }

  onFinished(files?: File[]): void {
    const duration = Date.now() - this.startTime
    this.printSummary(duration)
  }

  onTaskUpdate(packs: TaskResultPack[], events: TaskEventPack[]): void {
    for (const [id, result, meta] of packs) {
      if (!result) continue
      
      // Find the task in the state manager
      if (!this.ctx?.state) continue
      
      try {
        const entity = this.ctx.state.getReportedEntity(id as unknown as Task)
        if (!entity || !('type' in entity) || entity.type !== 'test') continue
        
        // Safely access file properties
        if (!('file' in entity) || !entity.file) continue
        
        const file = entity.file as { filepath: string; name: string }
        const filepath = file.filepath
        const fileName = file.name
        
        // Get file results (should already be initialized in onCollected)
        if (!this.fileResults.has(filepath)) {
          // If for some reason the file wasn't processed in onCollected, initialize it now
          this.fileResults.set(filepath, { passed: 0, failed: 0, skipped: 0 })
          if (!this.testFiles.includes(filepath)) {
            this.testFiles.push(filepath)
          }
        }
        
        const fileResult = this.fileResults.get(filepath)!
        
        // Only handle failures - we already counted passes during collection
        if (result.state === 'fail') {
          // Update counts: decrement passed, increment failed
          fileResult.passed--
          fileResult.failed++
          this.testCounts.passed--
          this.testCounts.failed++
          
          // Track the failed test
          this.failedTests.push({
            file: fileName,
            name: entity.name,
            error: result.errors?.[0]?.message || 'Unknown error'
          })
        }
      } catch (error) {
        console.warn(`Error processing task ${id}:`, error)
      }
    }
  }

  private printSummary(duration: number): void {
    const durationStr = this.formatDuration(duration)
    
    console.log('\n')
    console.log('━'.repeat(80))
    console.log(`\n\x1b[1m\x1b[36m📊 TEST SUMMARY REPORT\x1b[0m`)
    console.log('━'.repeat(80))
    
    // Print overall stats
    console.log(`\n\x1b[1mTest Run Completed in:\x1b[0m ${durationStr}`)
    console.log(`\x1b[1mDate:\x1b[0m ${new Date().toLocaleString()}`)
    console.log(`\x1b[1mTotal Test Files:\x1b[0m ${this.testFiles.length}`)
    console.log(`\x1b[1mTotal Tests:\x1b[0m ${this.testCounts.total}`)
    
    // Print test status counts with colors and symbols
    console.log(`\n\x1b[1mResults:\x1b[0m`)
    console.log(`  \x1b[32m✓ Passed:\x1b[0m ${this.testCounts.passed}`)
    console.log(`  \x1b[31m✗ Failed:\x1b[0m ${this.testCounts.failed}`)
    console.log(`  \x1b[33m○ Skipped:\x1b[0m ${this.testCounts.skipped}`)
    
    // Print file results in a table format
    console.log('\n\x1b[1mTest Files:\x1b[0m')
    console.log('┌' + '─'.repeat(50) + '┬' + '─'.repeat(10) + '┬' + '─'.repeat(10) + '┬' + '─'.repeat(10) + '┐')
    console.log('│ \x1b[1mFile\x1b[0m' + ' '.repeat(46) + '│ \x1b[1mPassed\x1b[0m' + ' '.repeat(4) + '│ \x1b[1mFailed\x1b[0m' + ' '.repeat(4) + '│ \x1b[1mSkipped\x1b[0m' + ' '.repeat(3) + '│')
    console.log('├' + '─'.repeat(50) + '┼' + '─'.repeat(10) + '┼' + '─'.repeat(10) + '┼' + '─'.repeat(10) + '┤')
    
    // Sort files by name for consistent output
    const sortedFiles = Array.from(this.fileResults.entries()).sort((a, b) => {
      const fileNameA = a[0].split('/').pop() || ''
      const fileNameB = b[0].split('/').pop() || ''
      return fileNameA.localeCompare(fileNameB)
    })
    
    for (const [filepath, results] of sortedFiles) {
      const fileName = filepath.split('/').pop() || filepath
      const truncatedName = this.truncateString(fileName, 48)
      const passedStr = `\x1b[32m${results.passed}\x1b[0m`
      const failedStr = results.failed > 0 ? `\x1b[31m${results.failed}\x1b[0m` : `${results.failed}`
      const skippedStr = results.skipped > 0 ? `\x1b[33m${results.skipped}\x1b[0m` : `${results.skipped}`
      
      console.log(`│ ${truncatedName}${' '.repeat(50 - truncatedName.length)}│ ${passedStr}${' '.repeat(10 - passedStr.length + 9)}│ ${failedStr}${' '.repeat(10 - failedStr.length + 9)}│ ${skippedStr}${' '.repeat(10 - skippedStr.length + 9)}│`)
    }
    
    console.log('└' + '─'.repeat(50) + '┴' + '─'.repeat(10) + '┴' + '─'.repeat(10) + '┴' + '─'.repeat(10) + '┘')
    
    // Print failed tests if any
    if (this.failedTests.length > 0) {
      console.log('\n\x1b[1m\x1b[31m❌ Failed Tests:\x1b[0m')
      for (let i = 0; i < this.failedTests.length; i++) {
        const { file, name, error } = this.failedTests[i]
        console.log(`\n  ${i + 1}. \x1b[1m${file}\x1b[0m: ${name}`)
        console.log(`     \x1b[31m${error}\x1b[0m`)
      }
    }
    
    // Print final status
    console.log('\n')
    if (this.testCounts.failed > 0) {
      console.log('\x1b[41m\x1b[37m FAILED \x1b[0m Some tests failed. Check the report above for details.')
    } else if (this.testCounts.total === 0) {
      console.log('\x1b[43m\x1b[30m WARNING \x1b[0m No tests were run!')
    } else {
      console.log('\x1b[42m\x1b[30m PASSED \x1b[0m All tests passed successfully!')
    }
    console.log('\n')
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`
    }
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes === 0) {
      return `${seconds}.${Math.floor((ms % 1000) / 100)}s`
    }
    
    return `${minutes}m ${remainingSeconds}s`
  }

  private truncateString(str: string, maxLength: number): string {
    if (str.length <= maxLength) {
      return str
    }
    return str.substring(0, maxLength - 3) + '...'
  }
}
