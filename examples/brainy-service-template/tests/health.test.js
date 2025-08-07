import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'

describe('Health Endpoints', () => {
  let server

  beforeAll(async () => {
    server = app.listen(0) // Use random available port
  })

  afterAll(async () => {
    if (server) {
      server.close()
    }
  })

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/)

      expect(response.status).toBeGreaterThanOrEqual(200)
      expect(response.body).toHaveProperty('status')
      expect(response.body).toHaveProperty('timestamp')
      expect(response.body).toHaveProperty('version')
      expect(response.body).toHaveProperty('services')
      expect(response.body.services).toHaveProperty('brainy')
    })
  })

  describe('GET /health/liveness', () => {
    it('should return liveness status', async () => {
      const response = await request(app)
        .get('/health/liveness')
        .expect(200)
        .expect('Content-Type', /json/)

      expect(response.body).toHaveProperty('alive', true)
      expect(response.body).toHaveProperty('timestamp')
      expect(response.body).toHaveProperty('pid')
      expect(response.body).toHaveProperty('uptime')
    })
  })

  describe('GET /health/readiness', () => {
    it('should return readiness status', async () => {
      const response = await request(app)
        .get('/health/readiness')
        .expect('Content-Type', /json/)

      expect(response.status).toBeGreaterThanOrEqual(200)
      expect(response.body).toHaveProperty('ready')
      expect(response.body).toHaveProperty('timestamp')
      expect(response.body).toHaveProperty('checks')
      expect(response.body.checks).toHaveProperty('brainy')
    })
  })

  describe('GET /health/metrics', () => {
    it('should return system metrics', async () => {
      const response = await request(app)
        .get('/health/metrics')
        .expect(200)
        .expect('Content-Type', /json/)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toHaveProperty('timestamp')
      expect(response.body.data).toHaveProperty('system')
      expect(response.body.data.system).toHaveProperty('process')
    })
  })
})