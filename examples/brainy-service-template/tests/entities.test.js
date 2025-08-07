import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'

describe('Entity Endpoints', () => {
  let server
  let testEntityId

  beforeAll(async () => {
    server = app.listen(0)
    // Wait for Brainy to initialize
    await new Promise(resolve => setTimeout(resolve, 2000))
  })

  afterAll(async () => {
    if (server) {
      server.close()
    }
  })

  describe('POST /api/entities', () => {
    it('should create a new entity', async () => {
      const entityData = {
        data: { name: 'Test Entity', type: 'test' },
        metadata: { category: 'test' }
      }

      const response = await request(app)
        .post('/api/entities')
        .send(entityData)
        .expect(201)
        .expect('Content-Type', /json/)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('id')
      expect(response.body.data).toHaveProperty('data')
      expect(response.body.data.data).toEqual(entityData.data)
      
      testEntityId = response.body.id
    })

    it('should return 400 for missing data', async () => {
      const response = await request(app)
        .post('/api/entities')
        .send({})
        .expect(400)
        .expect('Content-Type', /json/)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body.error).toHaveProperty('message')
    })
  })

  describe('GET /api/entities/:id', () => {
    it('should retrieve an entity by ID', async () => {
      if (!testEntityId) {
        // Create test entity first
        const entityData = {
          data: { name: 'Test Entity', type: 'test' }
        }
        const createResponse = await request(app)
          .post('/api/entities')
          .send(entityData)
        testEntityId = createResponse.body.id
      }

      const response = await request(app)
        .get(`/api/entities/${testEntityId}`)
        .expect(200)
        .expect('Content-Type', /json/)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toHaveProperty('id', testEntityId)
    })

    it('should return 404 for non-existent entity', async () => {
      const response = await request(app)
        .get('/api/entities/non-existent-id')
        .expect(404)
        .expect('Content-Type', /json/)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body.error).toHaveProperty('statusCode', 404)
    })
  })

  describe('POST /api/entities/search', () => {
    it('should search entities', async () => {
      const searchQuery = {
        query: 'test entity',
        limit: 5,
        threshold: 0.5
      }

      const response = await request(app)
        .post('/api/entities/search')
        .send(searchQuery)
        .expect(200)
        .expect('Content-Type', /json/)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('results')
      expect(response.body).toHaveProperty('query', searchQuery.query)
      expect(Array.isArray(response.body.results)).toBe(true)
    })

    it('should return 400 for missing query', async () => {
      const response = await request(app)
        .post('/api/entities/search')
        .send({})
        .expect(400)
        .expect('Content-Type', /json/)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body.error.message).toContain('Query is required')
    })
  })

  describe('GET /api/entities', () => {
    it('should list entities with pagination', async () => {
      const response = await request(app)
        .get('/api/entities?page=1&limit=10')
        .expect(200)
        .expect('Content-Type', /json/)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('pagination')
      expect(response.body.pagination).toHaveProperty('page', 1)
      expect(response.body.pagination).toHaveProperty('limit', 10)
      expect(Array.isArray(response.body.data)).toBe(true)
    })
  })
})