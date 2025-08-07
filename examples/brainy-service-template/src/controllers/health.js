import { logger } from '../utils/logger.js'

export const healthController = {
  async check(req, res, next) {
    try {
      const { brainyService } = req.app.locals
      
      // Get Brainy health status
      const brainyHealth = await brainyService.getHealth()
      
      // Overall system health
      const health = {
        status: brainyHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: Math.floor(process.uptime()),
        services: {
          brainy: brainyHealth
        },
        system: {
          memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            external: Math.round(process.memoryUsage().external / 1024 / 1024)
          },
          cpu: process.cpuUsage()
        }
      }

      const statusCode = health.status === 'healthy' ? 200 : 503
      
      res.status(statusCode).json(health)
    } catch (error) {
      logger.error('Health check failed:', error)
      
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        services: {
          brainy: { status: 'error', error: error.message }
        }
      })
    }
  },

  async readiness(req, res, next) {
    try {
      const { brainyService } = req.app.locals
      
      // Check if services are ready
      const brainyHealth = await brainyService.getHealth()
      const isReady = brainyHealth.status === 'healthy'
      
      const readiness = {
        ready: isReady,
        timestamp: new Date().toISOString(),
        checks: {
          brainy: {
            ready: brainyHealth.status === 'healthy',
            details: brainyHealth
          }
        }
      }

      const statusCode = readiness.ready ? 200 : 503
      res.status(statusCode).json(readiness)
    } catch (error) {
      logger.error('Readiness check failed:', error)
      
      res.status(503).json({
        ready: false,
        timestamp: new Date().toISOString(),
        error: error.message
      })
    }
  },

  async liveness(req, res, next) {
    try {
      // Simple liveness check - just verify the process is running
      res.status(200).json({
        alive: true,
        timestamp: new Date().toISOString(),
        pid: process.pid,
        uptime: Math.floor(process.uptime())
      })
    } catch (error) {
      logger.error('Liveness check failed:', error)
      
      res.status(503).json({
        alive: false,
        timestamp: new Date().toISOString(),
        error: error.message
      })
    }
  },

  async metrics(req, res, next) {
    try {
      const { brainyService } = req.app.locals
      
      // Get detailed metrics
      const brainyMetrics = await brainyService.getMetrics()
      
      const metrics = {
        timestamp: new Date().toISOString(),
        brainy: brainyMetrics.database,
        system: {
          ...brainyMetrics.performance,
          process: {
            pid: process.pid,
            version: process.version,
            platform: process.platform,
            arch: process.arch,
            env: process.env.NODE_ENV || 'development'
          }
        }
      }

      res.json({
        success: true,
        data: metrics
      })
    } catch (error) {
      next(error)
    }
  }
}