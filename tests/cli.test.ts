/**
 * CLI Tests for Brainy 1.0
 * Tests the 9 clean CLI commands
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { execSync } from 'child_process'
import { existsSync, rmSync, mkdirSync } from 'fs'
import path from 'path'

const CLI_PATH = path.resolve('./bin/brainy.js')
const TEST_DB_PATH = path.resolve('./test-cli-db')

describe('Brainy 1.0 CLI Commands', () => {
  
  beforeEach(() => {
    // Clean up any existing test database
    if (existsSync(TEST_DB_PATH)) {
      rmSync(TEST_DB_PATH, { recursive: true, force: true })
    }
    mkdirSync(TEST_DB_PATH, { recursive: true })
  })

  afterEach(() => {
    // Clean up test database after each test
    if (existsSync(TEST_DB_PATH)) {
      rmSync(TEST_DB_PATH, { recursive: true, force: true })
    }
  })

  function runCLI(args: string): string {
    try {
      return execSync(`node ${CLI_PATH} ${args}`, { 
        encoding: 'utf-8',
        cwd: TEST_DB_PATH,
        timeout: 10000 
      })
    } catch (error: any) {
      throw new Error(`CLI command failed: ${error.message}\nOutput: ${error.stdout || error.stderr}`)
    }
  }

  describe('Command 1: brainy init', () => {
    it('should initialize a new brainy database', () => {
      const output = runCLI('init')
      expect(output).toContain('initialized')
    })

    it('should initialize with encryption option', () => {
      const output = runCLI('init --encryption')
      expect(output).toContain('encryption')
    })

    it('should initialize with storage option', () => {
      const output = runCLI('init --storage memory')
      expect(output).toContain('memory')
    })
  })

  describe('Command 2: brainy add', () => {
    beforeEach(() => {
      runCLI('init')
    })

    it('should add data with smart processing by default', () => {
      const output = runCLI('add "John Doe is a software engineer"')
      expect(output).toContain('added')
    })

    it('should add data with literal processing', () => {
      const output = runCLI('add "Raw data" --literal')
      expect(output).toContain('added')
    })

    it('should add data with metadata', () => {
      const output = runCLI('add "Jane Smith" --metadata \'{"role":"manager"}\'')
      expect(output).toContain('added')
    })

    it('should add encrypted data', () => {
      const output = runCLI('add "Sensitive information" --encrypt')
      expect(output).toContain('added')
      expect(output).toContain('encrypted')
    })
  })

  describe('Command 3: brainy search', () => {
    beforeEach(() => {
      runCLI('init')
      runCLI('add "Alice is a data scientist"')
      runCLI('add "Bob is a software engineer"')
      runCLI('add "Charlie works in marketing"')
    })

    it('should search for similar content', () => {
      const output = runCLI('search "data scientist"')
      expect(output).toContain('Alice')
    })

    it('should search with limit', () => {
      const output = runCLI('search "engineer" --limit 1')
      expect(output).toContain('Bob')
    })

    it('should search with metadata filters', () => {
      runCLI('add "David" --metadata \'{"dept":"engineering"}\'')
      const output = runCLI('search "" --filter \'{"dept":"engineering"}\'')
      expect(output).toContain('David')
    })
  })

  describe('Command 4: brainy update', () => {
    let itemId: string

    beforeEach(() => {
      runCLI('init')
      const output = runCLI('add "Original content"')
      const match = output.match(/ID:\s*([a-zA-Z0-9-]+)/)
      itemId = match ? match[1] : ''
    })

    it('should update existing data', () => {
      const output = runCLI(`update ${itemId} --data "Updated content"`)
      expect(output).toContain('updated')
    })

    it('should update with new metadata', () => {
      const output = runCLI(`update ${itemId} --data "Updated content" --metadata '{"version":2}'`)
      expect(output).toContain('updated')
    })
  })

  describe('Command 5: brainy delete', () => {
    let itemId: string

    beforeEach(() => {
      runCLI('init')
      const output = runCLI('add "Content to delete"')
      const match = output.match(/ID:\s*([a-zA-Z0-9-]+)/)
      itemId = match ? match[1] : ''
    })

    it('should soft delete by default', () => {
      const output = runCLI(`delete ${itemId}`)
      expect(output).toContain('deleted')
      
      // Should not appear in search
      const searchOutput = runCLI('search "Content to delete"')
      expect(searchOutput).not.toContain('Content to delete')
    })

    it('should hard delete when specified', () => {
      const output = runCLI(`delete ${itemId} --hard`)
      expect(output).toContain('deleted')
      expect(output).toContain('hard')
    })
  })

  describe('Command 6: brainy import', () => {
    beforeEach(() => {
      runCLI('init')
    })

    it('should import from JSON array string', () => {
      const jsonData = '["Item 1", "Item 2", "Item 3"]'
      const output = runCLI(`import '${jsonData}'`)
      expect(output).toContain('imported')
      expect(output).toContain('3')
    })
  })

  describe('Command 7: brainy status', () => {
    beforeEach(() => {
      runCLI('init')
      runCLI('add "Test data 1"')
      runCLI('add "Test data 2"')
    })

    it('should show database status', () => {
      const output = runCLI('status')
      expect(output).toContain('Status')
      expect(output).toMatch(/\d+/) // Should contain numbers (counts)
    })

    it('should show per-service statistics', () => {
      const output = runCLI('status --detailed')
      expect(output).toContain('Statistics')
    })
  })

  describe('Command 8: brainy config', () => {
    beforeEach(() => {
      runCLI('init')
    })

    it('should set configuration value', () => {
      const output = runCLI('config set api-key "test-key"')
      expect(output).toContain('set')
    })

    it('should get configuration value', () => {
      runCLI('config set test-setting "test-value"')
      const output = runCLI('config get test-setting')
      expect(output).toContain('test-value')
    })

    it('should list all configuration', () => {
      runCLI('config set key1 "value1"')
      runCLI('config set key2 "value2"')
      const output = runCLI('config list')
      expect(output).toContain('key1')
      expect(output).toContain('key2')
    })
  })

  describe('Command 9: brainy chat', () => {
    beforeEach(() => {
      runCLI('init')
      runCLI('add "Alice is a data scientist working on machine learning"')
      runCLI('add "Bob is a software engineer building web applications"')
    })

    it('should provide help when no LLM is configured', () => {
      const output = runCLI('chat "Who is Alice?"')
      // Since no LLM is configured in tests, it should provide helpful guidance
      expect(output).toContain('chat') // Should contain some chat-related response
    })
  })

  describe('CLI Help and Version', () => {
    it('should show help', () => {
      const output = runCLI('--help')
      expect(output).toContain('Usage')
      expect(output).toContain('Commands')
    })

    it('should show version', () => {
      const output = runCLI('--version')
      expect(output).toMatch(/\d+\.\d+\.\d+/) // Should show version number
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid commands gracefully', () => {
      expect(() => {
        runCLI('invalid-command')
      }).toThrow()
    })

    it('should handle missing arguments', () => {
      runCLI('init')
      expect(() => {
        runCLI('add') // Missing data argument
      }).toThrow()
    })
  })
})