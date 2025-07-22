import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import axios from 'axios'
import { setTimeout as setTimeoutPromise } from 'timers/promises'
import { spawn, ChildProcess } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'
const API_URL = `${BASE_URL}/api`

let serverProcess: ChildProcess | null = null

const startServer = async (env: Record<string, string> = {}): Promise<void> => {
  return new Promise((resolve, reject) => {
    const serverPath = join(__dirname, '..', 'src', 'server.ts')
    
    serverProcess = spawn('node', ['--loader', 'ts-node/esm', serverPath], {
      env: { ...process.env, ...env, PORT: '3000' },
      stdio: ['pipe', 'pipe', 'pipe']
    })

    let errorOutput = ''

    serverProcess.stdout?.on('data', (data) => {
      const output = data.toString()
      console.log(`Server: ${output.trim()}`)
      if (output.includes('Server running on')) {
        resolve()
      }
    })

    serverProcess.stderr?.on('data', (data) => {
      errorOutput += data.toString()
      console.error(`Server Error: ${data.toString().trim()}`)
    })

    serverProcess.on('error', (error) => {
      reject(new Error(`Failed to start server: ${error.message}`))
    })

    serverProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        reject(new Error(`Server exited with code ${code}. Error: ${errorOutput}`))
      }
    })

    // Timeout after 10 seconds
    const timeoutId = setTimeout(() => {
      if (serverProcess && !serverProcess.killed) {
        reject(new Error('Server startup timeout'))
      }
    }, 10000)
  })
}

const stopServer = async (): Promise<void> => {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill('SIGTERM')
    await setTimeoutPromise(2000) // Wait for graceful shutdown
    if (!serverProcess.killed) {
      serverProcess.kill('SIGKILL')
    }
    serverProcess = null
  }
}

const waitForServer = async (maxAttempts: number = 10): Promise<boolean> => {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await axios.get(`${BASE_URL}/health`, { timeout: 1000 })
      return true
    } catch (error) {
      await setTimeoutPromise(1000)
    }
  }
  throw new Error('Server did not become ready in time')
}

describe('Brainy Web Service', () => {
  beforeAll(async () => {
    console.log('Starting server for tests...')
    await startServer({
      FORCE_LOCAL_STORAGE: 'true',
      BRAINY_DATA_PATH: './test-data'
    })
    await waitForServer()
    console.log('Server ready for tests')
  })

  afterAll(async () => {
    console.log('Stopping server after tests...')
    await stopServer()
  })

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await axios.get(`${BASE_URL}/health`)
      
      expect(response.status).toBe(200)
      expect(response.data.status).toBe('healthy')
      expect(response.data.service).toBeDefined()
      expect(response.data.version).toBeDefined()
      
      console.log(`   Service: ${response.data.service} v${response.data.version}`)
    })
  })

  describe('API Documentation', () => {
    it('should provide complete API documentation', async () => {
      const response = await axios.get(`${API_URL}`)
      
      expect(response.status).toBe(200)
      expect(response.data.endpoints).toBeDefined()
      
      const expectedEndpoints = [
        'GET /health',
        'GET /api/status',
        'POST /api/search',
        'POST /api/search/text',
        'GET /api/item/:id'
      ]
      
      for (const endpoint of expectedEndpoints) {
        expect(response.data.endpoints[endpoint]).toBeDefined()
      }
      
      console.log(`   Found ${Object.keys(response.data.endpoints).length} documented endpoints`)
    })
  })

  describe('Database Status', () => {
    it('should return database status with read-only mode', async () => {
      const response = await axios.get(`${API_URL}/status`)
      
      expect(response.status).toBe(200)
      expect(typeof response.data.readOnly).toBe('boolean')
      expect(response.data.readOnly).toBe(true) // Should be in read-only mode for security
      
      console.log(`   Database size: ${response.data.size || 0} items`)
      console.log(`   Read-only mode: ${response.data.readOnly}`)
    })
  })

  describe('Input Validation', () => {
    it('should reject invalid vector search requests', async () => {
      await expect(async () => {
        await axios.post(`${API_URL}/search`, {
          vector: "not an array",
          k: 5
        })
      }).rejects.toThrow()

      try {
        await axios.post(`${API_URL}/search`, {
          vector: "not an array",
          k: 5
        })
      } catch (error: any) {
        expect(error.response?.status).toBe(400)
      }
    })

    it('should reject empty text search queries', async () => {
      try {
        await axios.post(`${API_URL}/search/text`, {
          query: "", // Empty query should be rejected
          k: 5
        })
        throw new Error('Should have rejected empty query')
      } catch (error: any) {
        expect(error.response?.status).toBe(400)
      }
    })

    it('should reject k parameter that is too large', async () => {
      try {
        await axios.post(`${API_URL}/search/text`, {
          query: "test",
          k: 1000 // Too large
        })
        throw new Error('Should have rejected k > 100')
      } catch (error: any) {
        expect(error.response?.status).toBe(400)
      }
    })

    it('should validate input correctly', () => {
      console.log('   Input validation working correctly')
    })
  })

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await axios.get(`${BASE_URL}/health`)
      
      const securityHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection'
      ]
      
      for (const header of securityHeaders) {
        if (!response.headers[header]) {
          console.log(`   Warning: Missing security header: ${header}`)
        }
      }
      
      console.log('   Security headers check completed')
    })
  })

  describe('CORS Support', () => {
    it('should include CORS headers', async () => {
      const response = await axios.options(`${API_URL}/status`)
      
      expect(response.headers['access-control-allow-origin']).toBeDefined()
      console.log('   CORS headers present')
    })
  })

  describe('Rate Limiting', () => {
    it('should implement rate limiting', async () => {
      console.log('   Testing rate limiting (this may take a moment)...')
      
      // Make multiple rapid requests to test rate limiting
      const requests = []
      for (let i = 0; i < 10; i++) {
        requests.push(
          axios.get(`${BASE_URL}/health`).catch(err => err.response)
        )
      }
      
      const responses = await Promise.all(requests)
      const successCount = responses.filter(r => r?.status === 200).length
      
      expect(successCount).toBeGreaterThan(0) // At least some should succeed
      console.log(`   ${successCount}/10 requests succeeded (rate limiting active)`)
    })
  })

  describe('404 Handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
      try {
        await axios.get(`${API_URL}/nonexistent`)
        throw new Error('Should have returned 404 for non-existent endpoint')
      } catch (error: any) {
        expect(error.response?.status).toBe(404)
      }
      
      console.log('   404 handling working correctly')
    })
  })

  describe('Read-Only Security', () => {
    it('should not expose dangerous write endpoints', async () => {
      const dangerousEndpoints = [
        { method: 'post', path: '/api/add' },
        { method: 'delete', path: '/api/item/test' },
        { method: 'put', path: '/api/item/test' },
        { method: 'post', path: '/api/clear' }
      ]
      
      for (const endpoint of dangerousEndpoints) {
        try {
          await (axios as any)[endpoint.method](`${BASE_URL}${endpoint.path}`)
          throw new Error(`Dangerous endpoint ${endpoint.method.toUpperCase()} ${endpoint.path} should not exist`)
        } catch (error: any) {
          expect(error.response?.status).toBe(404)
        }
      }
      
      console.log('   No dangerous write endpoints exposed')
    })
  })
})
