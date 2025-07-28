import { Reporter, File, Task, TaskResult, Vitest, TaskResultPack, RunnerTaskEventPack as TaskEventPack } from 'vitest'

/**
 * PrettyReporter - A visually appealing reporter for Vitest
 * 
 * This reporter creates a visually enhanced summary of test results
 * with colors, symbols, and formatted output.
 */
export default class PrettyReporter implements Reporter {
  private startTime: number = 0
  private testResults: Map<string, { passed: number, failed: number, skipped: number, duration: number }> = new Map()
  private totalTests: { passed: number, failed: number, skipped: number } = { passed: 0, failed: 0, skipped: 0 }
  private failedTests: Array<{ file: string, name: string, error: string }> = []
  private ctx: Vitest | undefined

  onInit(ctx: Vitest): void {
    this.ctx = ctx
    this.startTime = Date.now()
    console.log('\n🧠 \x1b[36mBrainy Test Suite\x1b[0m - Starting tests...\n')
  }

  onFinished(files?: File[] | undefined): void {
    const duration = Date.now() - this.startTime
    this.printSummary(duration)
  }

  onTaskUpdate(packs: TaskResultPack[], events: TaskEventPack[]): void {
    for (const [id, result, meta] of packs) {
      if (result) {
        // Find the task in the state manager
        if (this.ctx?.state) {
          try {
            // We need to handle the entity type carefully
            const entity = this.ctx.state.getReportedEntity(id as unknown as Task)
            
            // Skip if entity doesn't exist or doesn't have the right properties
            if (!entity || typeof entity !== 'object') continue
            
            // Check if it has the necessary properties to be treated as a Task
            if ('type' in entity && 
                'name' in entity && 
                'file' in entity && 
                entity.file && 
                typeof entity.file === 'object' &&
                'filepath' in entity.file) {
              // Process the task with the right type
              this.processTask({
                id: id,
                name: entity.name as string,
                type: entity.type as any,
                file: entity.file as any,
                mode: (entity as any).mode || 'run',
                result: result
              } as unknown as Task)
            }
          } catch (error) {
            console.warn(`Error processing task ${id}:`, error)
          }
        }
      }
    }
  }

  onCollected(files?: File[] | undefined): void {
    if (files) {
      for (const file of files) {
        this.testResults.set(file.filepath, { passed: 0, failed: 0, skipped: 0, duration: 0 })
        
        // Count tests in each file
        if (file.tasks) {
          this.countTestsInTasks(file.tasks)
        }
      }
    }
  }
  
  private countTestsInTasks(tasks: Task[]): void {
    for (const task of tasks) {
      if (task.type === 'test') {
        this.processTask(task)
      } else if (task.tasks) {
        // Recursively process nested tasks (like in describe blocks)
        this.countTestsInTasks(task.tasks)
      }
    }
  }

  private processTask(task: Task): void {
    if (!task || !task.file) return

    // For test collection phase, we just want to count the test
    if (task.type === 'test') {
      // Make sure we have a valid file path
      if (!task.file.filepath) return

      const fileResult = this.testResults.get(task.file.filepath) || { 
        passed: 0, failed: 0, skipped: 0, duration: 0 
      }

      // During collection, we don't have results yet, so just count the test
      // The actual pass/fail status will be updated during task updates
      if (!task.result) {
        // Just count it as a test, state will be updated later
        console.log(`Counting test: ${task.name} in ${task.file.name}`)
      } else if (task.result.state === 'pass') {
        fileResult.passed++
        this.totalTests.passed++
        console.log(`Passed test: ${task.name}`)
      } else if (task.result.state === 'fail') {
        fileResult.failed++
        this.totalTests.failed++
        this.failedTests.push({
          file: task.file.name,
          name: task.name,
          error: task.result?.errors?.[0]?.message || 'Unknown error'
        })
        console.log(`Failed test: ${task.name}`)
      } else if (task.mode === 'skip' || task.result.state === 'skip') {
        fileResult.skipped++
        this.totalTests.skipped++
        console.log(`Skipped test: ${task.name}`)
      }

      if (task.result?.duration) {
        fileResult.duration += task.result.duration
      }

      this.testResults.set(task.file.filepath, fileResult)
    }
  }

  private printSummary(duration: number): void {
    const durationStr = this.formatDuration(duration)
    const totalTests = this.totalTests.passed + this.totalTests.failed + this.totalTests.skipped
    
    console.log('\n')
    console.log('━'.repeat(80))
    console.log(`\n\x1b[1m\x1b[36m📊 TEST SUMMARY REPORT\x1b[0m`)
    console.log('━'.repeat(80))
    
    // Print overall stats
    console.log(`\n\x1b[1mTest Run Completed in:\x1b[0m ${durationStr}`)
    console.log(`\x1b[1mDate:\x1b[0m ${new Date().toLocaleString()}`)
    console.log(`\x1b[1mTotal Test Files:\x1b[0m ${this.testResults.size}`)
    console.log(`\x1b[1mTotal Tests:\x1b[0m ${totalTests}`)
    
    // Print test status counts with colors and symbols
    console.log(`\n\x1b[1mResults:\x1b[0m`)
    console.log(`  \x1b[32m✓ Passed:\x1b[0m ${this.totalTests.passed}`)
    console.log(`  \x1b[31m✗ Failed:\x1b[0m ${this.totalTests.failed}`)
    console.log(`  \x1b[33m○ Skipped:\x1b[0m ${this.totalTests.skipped}`)
    
    // Print file results in a table format
    console.log('\n\x1b[1mTest Files:\x1b[0m')
    console.log('┌' + '─'.repeat(50) + '┬' + '─'.repeat(10) + '┬' + '─'.repeat(10) + '┬' + '─'.repeat(10) + '┐')
    console.log('│ \x1b[1mFile\x1b[0m' + ' '.repeat(46) + '│ \x1b[1mPassed\x1b[0m' + ' '.repeat(4) + '│ \x1b[1mFailed\x1b[0m' + ' '.repeat(4) + '│ \x1b[1mSkipped\x1b[0m' + ' '.repeat(3) + '│')
    console.log('├' + '─'.repeat(50) + '┼' + '─'.repeat(10) + '┼' + '─'.repeat(10) + '┼' + '─'.repeat(10) + '┤')
    
    // Sort files by name for consistent output
    const sortedFiles = Array.from(this.testResults.entries()).sort((a, b) => {
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
    if (this.totalTests.failed > 0) {
      console.log('\x1b[41m\x1b[37m FAILED \x1b[0m Some tests failed. Check the report above for details.')
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
