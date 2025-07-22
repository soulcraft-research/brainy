#!/usr/bin/env node
#!/usr/bin/env node
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { body, param, query, validationResult } from 'express-validator';
import { BrainyData, cosineDistance, createStorage } from '@soulcraft/brainy';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Configuration
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const DATA_PATH = process.env.BRAINY_DATA_PATH || join(__dirname, '..', 'data');
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW || '900000'); // 15 minutes
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '100'); // 100 requests per window
// Cloud Storage Configuration
// The createStorage function will automatically detect and use these environment variables:
// AWS S3: S3_BUCKET_NAME, S3_ACCESS_KEY_ID (or AWS_ACCESS_KEY_ID), S3_SECRET_ACCESS_KEY (or AWS_SECRET_ACCESS_KEY), S3_REGION (or AWS_REGION)
// Cloudflare R2: R2_BUCKET_NAME, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
// Google Cloud Storage: GCS_BUCKET_NAME, GCS_ACCESS_KEY_ID, GCS_SECRET_ACCESS_KEY, GCS_ENDPOINT
// Force local storage: FORCE_LOCAL_STORAGE=true
// Initialize Express app
const app = express();
// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
app.use(cors({
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
// Rate limiting
const limiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW,
    max: RATE_LIMIT_MAX,
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);
// Global BrainyData instance
let brainyInstance = null;
// Initialize BrainyData instance
async function initializeBrainy() {
    if (brainyInstance) {
        return brainyInstance;
    }
    try {
        console.log('Initializing Brainy database...');
        // Create storage adapter with cloud support
        const storageOptions = {
            requestPersistentStorage: true
        };
        // Check if local storage is forced
        if (process.env.FORCE_LOCAL_STORAGE === 'true') {
            console.log('Forcing local filesystem storage (FORCE_LOCAL_STORAGE=true)');
            storageOptions.forceFileSystemStorage = true;
            // Set the data path for local storage
            if (DATA_PATH) {
                // We'll need to import FileSystemStorage for forced local storage
                const { FileSystemStorage } = await import('@soulcraft/brainy');
                const storage = new FileSystemStorage(DATA_PATH);
                brainyInstance = new BrainyData({
                    dimensions: 384, // Default dimensions, can be overridden
                    storageAdapter: storage,
                    distanceFunction: cosineDistance
                });
            }
        }
        // If not forcing local storage or no specific data path, use createStorage
        if (!brainyInstance) {
            const storage = await createStorage(storageOptions);
            brainyInstance = new BrainyData({
                dimensions: 384, // Default dimensions, can be overridden
                storageAdapter: storage,
                distanceFunction: cosineDistance
            });
        }
        await brainyInstance.init();
        // Force read-only mode for security
        brainyInstance.setReadOnly(true);
        // Log storage information
        console.log(`Brainy database initialized in read-only mode`);
        console.log(`Database size: ${brainyInstance.size()} items`);
        return brainyInstance;
    }
    catch (error) {
        console.error('Failed to initialize Brainy database:', error);
        throw error;
    }
}
// Error handler middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }
    next();
};
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'brainy-web-service',
        version: '0.12.0'
    });
});
// API Documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        service: 'Brainy Web Service',
        version: '0.12.0',
        description: 'Read-only search service for Brainy vector graph database',
        endpoints: {
            'GET /health': 'Health check',
            'GET /api': 'API documentation',
            'GET /api/status': 'Database status',
            'POST /api/search': 'Search for similar vectors',
            'POST /api/search/text': 'Search using text query',
            'GET /api/item/:id': 'Get item by ID',
            'GET /api/items': 'Get all items (paginated)',
            'POST /api/similar/:id': 'Find similar items to given ID'
        },
        security: {
            readOnly: true,
            rateLimit: {
                windowMs: RATE_LIMIT_WINDOW,
                maxRequests: RATE_LIMIT_MAX
            }
        }
    });
});
// Database status endpoint
app.get('/api/status', async (req, res) => {
    try {
        const brainy = await initializeBrainy();
        const status = await brainy.status();
        res.json({
            ...status,
            readOnly: brainy.isReadOnly(),
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Status check failed:', error);
        res.status(500).json({
            error: 'Failed to get database status',
            message: error.message
        });
    }
});
// Search endpoint - vector search
app.post('/api/search', [
    body('vector').isArray().withMessage('Vector must be an array'),
    body('vector.*').isNumeric().withMessage('Vector elements must be numbers'),
    body('k').optional().isInt({ min: 1, max: 100 }).withMessage('k must be between 1 and 100'),
    body('nounTypes').optional().isArray().withMessage('nounTypes must be an array'),
    body('includeVerbs').optional().isBoolean().withMessage('includeVerbs must be boolean'),
    handleValidationErrors
], async (req, res) => {
    try {
        const brainy = await initializeBrainy();
        const { vector, k = 10, nounTypes, includeVerbs = false } = req.body;
        const results = await brainy.search(vector, k, {
            nounTypes,
            includeVerbs,
            searchMode: 'local' // Force local search for security
        });
        res.json({
            results,
            query: {
                vectorLength: vector.length,
                k,
                nounTypes,
                includeVerbs
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Search failed:', error);
        res.status(500).json({
            error: 'Search failed',
            message: error.message
        });
    }
});
// Text search endpoint
app.post('/api/search/text', [
    body('query').isString().isLength({ min: 1, max: 1000 }).withMessage('Query must be a string between 1 and 1000 characters'),
    body('k').optional().isInt({ min: 1, max: 100 }).withMessage('k must be between 1 and 100'),
    body('nounTypes').optional().isArray().withMessage('nounTypes must be an array'),
    body('includeVerbs').optional().isBoolean().withMessage('includeVerbs must be boolean'),
    handleValidationErrors
], async (req, res) => {
    try {
        const brainy = await initializeBrainy();
        const { query, k = 10, nounTypes, includeVerbs = false } = req.body;
        const results = await brainy.searchText(query, k, {
            nounTypes,
            includeVerbs
        });
        res.json({
            results,
            query: {
                text: query,
                k,
                nounTypes,
                includeVerbs
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Text search failed:', error);
        res.status(500).json({
            error: 'Text search failed',
            message: error.message
        });
    }
});
// Get item by ID
app.get('/api/item/:id', [
    param('id').isString().isLength({ min: 1, max: 100 }).withMessage('ID must be a string between 1 and 100 characters'),
    handleValidationErrors
], async (req, res) => {
    try {
        const brainy = await initializeBrainy();
        const { id } = req.params;
        const item = await brainy.get(id);
        if (!item) {
            return res.status(404).json({
                error: 'Item not found',
                id
            });
        }
        res.json({
            item,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Get item failed:', error);
        res.status(500).json({
            error: 'Failed to get item',
            message: error.message
        });
    }
});
// Get all items (paginated)
app.get('/api/items', [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    handleValidationErrors
], async (req, res) => {
    try {
        const brainy = await initializeBrainy();
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const allNouns = await brainy.getAllNouns();
        const total = allNouns.length;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const items = allNouns.slice(startIndex, endIndex);
        res.json({
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: endIndex < total,
                hasPrev: page > 1
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Get items failed:', error);
        res.status(500).json({
            error: 'Failed to get items',
            message: error.message
        });
    }
});
// Find similar items
app.post('/api/similar/:id', [
    param('id').isString().isLength({ min: 1, max: 100 }).withMessage('ID must be a string between 1 and 100 characters'),
    body('k').optional().isInt({ min: 1, max: 100 }).withMessage('k must be between 1 and 100'),
    body('includeVerbs').optional().isBoolean().withMessage('includeVerbs must be boolean'),
    handleValidationErrors
], async (req, res) => {
    try {
        const brainy = await initializeBrainy();
        const { id } = req.params;
        const { k = 10, includeVerbs = false } = req.body;
        const results = await brainy.findSimilar(id, {
            limit: k,
            includeVerbs
        });
        res.json({
            results,
            query: {
                id,
                k,
                includeVerbs
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Find similar failed:', error);
        res.status(500).json({
            error: 'Failed to find similar items',
            message: error.message
        });
    }
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method
    });
});
// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});
// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    if (brainyInstance) {
        await brainyInstance.shutDown();
    }
    process.exit(0);
});
process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    if (brainyInstance) {
        await brainyInstance.shutDown();
    }
    process.exit(0);
});
// Start server
async function startServer() {
    try {
        // Initialize Brainy on startup
        await initializeBrainy();
        app.listen(Number(PORT), HOST, () => {
            console.log(`🚀 Brainy Web Service started`);
            console.log(`📍 Server running on http://${HOST}:${PORT}`);
            console.log(`📊 API documentation available at http://${HOST}:${PORT}/api`);
            console.log(`🔒 Read-only mode: ${brainyInstance?.isReadOnly()}`);
            console.log(`📁 Data path: ${DATA_PATH}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Start the server
startServer().catch(console.error);
//# sourceMappingURL=server.js.map
