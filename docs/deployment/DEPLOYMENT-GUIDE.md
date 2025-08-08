# 🚀 Brainy Server Deployment & Remote Connection Guide

## Deploy Brainy to a Server and Connect with Cortex

---

## Quick Start: Deploy in 5 Minutes

```bash
# 1. Clone and setup
git clone https://github.com/soulcraft-research/brainy.git
cd brainy
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your settings

# 3. Build and run with Docker
docker-compose up -d

# 4. Connect Cortex remotely
cortex connect https://your-server.com:3000

# 5. Add augmentation remotely
cortex augmentation add brainy-translator
```

---

## Table of Contents

1. [Server Architecture](#server-architecture)
2. [Deployment Options](#deployment-options)
3. [Step-by-Step Deployment](#step-by-step-deployment)
4. [Remote Cortex Connection](#remote-cortex-connection)
5. [Adding Augmentations Remotely](#adding-augmentations-remotely)
6. [Production Setup](#production-setup)
7. [Security & Authentication](#security--authentication)
8. [Monitoring & Management](#monitoring--management)

---

## Server Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Side                           │
├─────────────────────────────────────────────────────────┤
│  Cortex CLI          Web UI           Applications      │
│      ↓                 ↓                    ↓           │
└─────────────────────────────────────────────────────────┘
                           ↓
                    [HTTPS/WSS]
                           ↓
┌─────────────────────────────────────────────────────────┐
│                    Server Side                           │
├─────────────────────────────────────────────────────────┤
│  Nginx/Load Balancer                                    │
│           ↓                                              │
│  Brainy Server (Express + Socket.io)                    │
│           ↓                                              │
│  BrainyData Instance                                    │
│  ├─ Neural Import (Default)                            │
│  ├─ Premium Augmentations                              │
│  └─ Custom Augmentations                               │
│           ↓                                              │
│  Storage Backend (S3/R2/PostgreSQL)                     │
└─────────────────────────────────────────────────────────┘
```

---

## Deployment Options

### Option 1: Docker (Recommended)

**Best for:** Quick deployment, consistent environments, easy scaling

```bash
docker run -d \
  -p 3000:3000 \
  -e BRAINY_LICENSE_KEY=$LICENSE_KEY \
  -e AWS_ACCESS_KEY=$AWS_KEY \
  -v brainy-data:/data \
  soulcraft/brainy:latest
```

### Option 2: Node.js Direct

**Best for:** Development, custom configurations

```bash
npm install
npm run build
npm start
```

### Option 3: Kubernetes

**Best for:** Large scale, high availability

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: brainy
spec:
  replicas: 3
  selector:
    matchLabels:
      app: brainy
  template:
    metadata:
      labels:
        app: brainy
    spec:
      containers:
      - name: brainy
        image: soulcraft/brainy:latest
        ports:
        - containerPort: 3000
```

### Option 4: Serverless (AWS Lambda/Vercel)

**Best for:** Auto-scaling, pay-per-use

```typescript
// api/brainy.ts
import { BrainyData } from '@soulcraft/brainy'

const brainy = new BrainyData({
  storage: { type: 'memory' }
})

export default async function handler(req, res) {
  await brainy.init()
  // Handle requests
}
```

---

## Step-by-Step Deployment

### Step 1: Prepare the Server

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y nodejs npm docker.io nginx certbot

# CentOS/RHEL
sudo yum install -y nodejs npm docker nginx certbot
```

### Step 2: Create Brainy Server Application

```typescript
// server/index.ts
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { BrainyData } from '@soulcraft/brainy'
import { NotionConnector, SalesforceConnector } from '@soulcraft/brainy-quantum-vault'
import { CortexRemoteHandler } from './cortexHandler'

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.static('public'))

// Initialize Brainy with production storage
const brainy = new BrainyData({
  storage: {
    s3Storage: {
      bucketName: process.env.S3_BUCKET || 'brainy-production',
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  },
  cache: {
    maxSize: 10000,
    ttl: 3600
  },
  distributedConfig: {
    nodeId: process.env.NODE_ID || 'node-1',
    coordinatorUrl: process.env.COORDINATOR_URL
  }
})

// Initialize augmentations
async function initializeAugmentations() {
  await brainy.init() // Neural Import ready
  
  // Add premium augmentations if licensed
  if (process.env.BRAINY_LICENSE_KEY) {
    // Notion Connector
    if (process.env.NOTION_TOKEN) {
      const notion = new NotionConnector({
        licenseKey: process.env.BRAINY_LICENSE_KEY,
        notionToken: process.env.NOTION_TOKEN,
        syncMode: 'bidirectional',
        autoSync: true
      })
      
      await brainy.addAugmentation('CONDUIT', notion, {
        name: 'notion-connector',
        autoStart: true
      })
      console.log('✅ Notion Connector activated')
    }
    
    // Salesforce Connector
    if (process.env.SF_ACCESS_TOKEN) {
      const salesforce = new SalesforceConnector({
        licenseKey: process.env.BRAINY_LICENSE_KEY,
        instanceUrl: process.env.SF_INSTANCE_URL,
        accessToken: process.env.SF_ACCESS_TOKEN,
        refreshToken: process.env.SF_REFRESH_TOKEN
      })
      
      await brainy.addAugmentation('CONDUIT', salesforce, {
        name: 'salesforce-connector',
        autoStart: true
      })
      console.log('✅ Salesforce Connector activated')
    }
  }
  
  // Save configuration for Cortex
  await brainy.saveConfiguration('/data/.cortex/config.json')
}

// REST API Endpoints
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    version: '1.0.0',
    augmentations: brainy.listAugmentations()
  })
})

app.post('/api/add', async (req, res) => {
  try {
    const { data, metadata, options } = req.body
    const id = await brainy.add(data, metadata, options)
    res.json({ success: true, id })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/search', async (req, res) => {
  try {
    const { query, k = 10 } = req.query
    const results = await brainy.search(query, parseInt(k))
    res.json({ success: true, results })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/api/augmentations', async (req, res) => {
  const augmentations = brainy.listAugmentations()
  res.json({ augmentations })
})

app.post('/api/augmentations', async (req, res) => {
  try {
    const { type, name, config } = req.body
    
    // Dynamic augmentation loading
    let augmentation
    
    switch (config.source) {
      case 'community':
        const CommunityAug = await import(config.package)
        augmentation = new CommunityAug.default(config.options)
        break
        
      case 'premium':
        const PremiumAug = await import('@soulcraft/brainy-quantum-vault')
        const AugClass = PremiumAug[config.className]
        augmentation = new AugClass({
          ...config.options,
          licenseKey: process.env.BRAINY_LICENSE_KEY
        })
        break
        
      case 'custom':
        const CustomAug = await import(config.path)
        augmentation = new CustomAug.default(config.options)
        break
    }
    
    await brainy.addAugmentation(type, augmentation, {
      name,
      autoStart: true
    })
    
    res.json({ success: true, message: `Augmentation ${name} added` })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// WebSocket for Cortex Remote Commands
const cortexHandler = new CortexRemoteHandler(brainy)

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)
  
  // Handle Cortex commands
  socket.on('cortex:command', async (command, callback) => {
    try {
      const result = await cortexHandler.execute(command)
      callback({ success: true, result })
    } catch (error) {
      callback({ success: false, error: error.message })
    }
  })
  
  // Real-time augmentation events
  brainy.on('augmentation:added', (data) => {
    socket.emit('augmentation:added', data)
  })
  
  brainy.on('data:added', (data) => {
    socket.emit('data:added', data)
  })
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

// Start server
const PORT = process.env.PORT || 3000

initializeAugmentations().then(() => {
  server.listen(PORT, () => {
    console.log(`🧠⚛️ Brainy Server running on port ${PORT}`)
    console.log(`📡 WebSocket ready for Cortex connections`)
    console.log(`🔗 API endpoint: http://localhost:${PORT}/api`)
  })
}).catch(error => {
  console.error('Failed to initialize:', error)
  process.exit(1)
})
```

### Step 3: Create Docker Configuration

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build
RUN npm run build

# Download models for offline use
RUN npm run download-models

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/models ./models
COPY --from=builder /app/package.json ./

# Create data directory
RUN mkdir -p /data/.cortex

EXPOSE 3000

CMD ["node", "dist/server/index.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  brainy:
    build: .
    container_name: brainy-server
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      # License
      - BRAINY_LICENSE_KEY=${BRAINY_LICENSE_KEY}
      # Storage
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - S3_BUCKET=${S3_BUCKET:-brainy-production}
      - AWS_REGION=${AWS_REGION:-us-east-1}
      # Premium Augmentations
      - NOTION_TOKEN=${NOTION_TOKEN}
      - SF_INSTANCE_URL=${SF_INSTANCE_URL}
      - SF_ACCESS_TOKEN=${SF_ACCESS_TOKEN}
      - SF_REFRESH_TOKEN=${SF_REFRESH_TOKEN}
    volumes:
      - brainy-data:/data
      - ./augmentations:/app/augmentations
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    container_name: brainy-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs
    depends_on:
      - brainy
    restart: unless-stopped

volumes:
  brainy-data:
```

### Step 4: Configure Nginx

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream brainy_backend {
        server brainy:3000;
    }

    server {
        listen 80;
        server_name brainy.example.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name brainy.example.com;

        ssl_certificate /etc/nginx/certs/fullchain.pem;
        ssl_certificate_key /etc/nginx/certs/privkey.pem;

        # API endpoints
        location /api {
            proxy_pass http://brainy_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket for Cortex
        location /socket.io {
            proxy_pass http://brainy_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Health check
        location /health {
            proxy_pass http://brainy_backend;
        }
    }
}
```

### Step 5: Deploy

```bash
# Clone repository
git clone https://github.com/soulcraft-research/brainy-server.git
cd brainy-server

# Configure environment
cp .env.example .env
vim .env  # Add your credentials

# Get SSL certificate
sudo certbot certonly --standalone -d brainy.example.com

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f

# Verify deployment
curl https://brainy.example.com/health
```

---

## Remote Cortex Connection

### Method 1: Direct API Connection

```bash
# Configure Cortex for remote server
cortex config set server.url https://brainy.example.com
cortex config set server.apiKey your-api-key-here

# Test connection
cortex status
# Connected to: https://brainy.example.com
# Server version: 1.0.0
# Augmentations: 5 active

# Use normally
cortex add "Data to add on remote server"
cortex search "query remote server"
cortex augmentations  # Shows remote augmentations
```

### Method 2: WebSocket Connection (Real-time)

```bash
# Connect via WebSocket
cortex connect wss://brainy.example.com

# You'll see:
# 🔌 Connecting to wss://brainy.example.com...
# ✅ Connected to Brainy server
# 🧠 Neural Import: Active
# 🔧 Notion Connector: Active
# 💼 Salesforce Connector: Active

# Now all commands execute remotely in real-time
cortex add "Real-time data"
# Data added to remote server instantly
```

### Method 3: SSH Tunnel (Development)

```bash
# Create SSH tunnel
ssh -L 3000:localhost:3000 user@your-server.com

# In another terminal
cortex connect http://localhost:3000

# Secure connection through SSH
cortex augmentations
cortex add "Secure data through tunnel"
```

---

## Adding Augmentations Remotely

### Via Cortex CLI

```bash
# Connect to remote
cortex connect https://brainy.example.com

# Add community augmentation
cortex augmentation install brainy-sentiment-analyzer
cortex augmentation add sentiment --type PERCEPTION
# ✅ Augmentation 'sentiment' added to remote server

# Add premium augmentation
cortex license activate lic_xxxxxxxxxxxxx
cortex augmentation activate notion-connector \
  --notion-token secret_xxxxxxxxx \
  --sync-mode bidirectional
# ✅ Premium augmentation 'notion-connector' activated

# Upload and add custom augmentation
cortex augmentation upload ./my-custom.js
cortex augmentation add my-custom --type COGNITION
# ✅ Custom augmentation uploaded and activated

# List all remote augmentations
cortex augmentations
# Neural Import (SENSE): Active [Default]
# sentiment (PERCEPTION): Active [Community]
# notion-connector (CONDUIT): Active [Premium]
# my-custom (COGNITION): Active [Custom]
```

### Via REST API

```bash
# Add augmentation via API
curl -X POST https://brainy.example.com/api/augmentations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "type": "CONDUIT",
    "name": "slack-connector",
    "config": {
      "source": "premium",
      "className": "SlackConnector",
      "options": {
        "slackToken": "xoxb-xxxxxxxxxxxxx",
        "channels": ["general", "engineering"]
      }
    }
  }'

# Response:
# {"success": true, "message": "Augmentation slack-connector added"}
```

### Via Admin UI

```typescript
// admin-ui/pages/augmentations.tsx
import { useState } from 'react'
import { useWebSocket } from '../hooks/useWebSocket'

export default function AugmentationsPage() {
  const { socket, connected } = useWebSocket('wss://brainy.example.com')
  const [augmentations, setAugmentations] = useState([])
  
  async function addAugmentation(config) {
    socket.emit('cortex:command', {
      command: 'augmentation',
      action: 'add',
      ...config
    }, (response) => {
      if (response.success) {
        console.log('Augmentation added:', response.result)
        loadAugmentations()
      }
    })
  }
  
  async function loadAugmentations() {
    const res = await fetch('/api/augmentations')
    const data = await res.json()
    setAugmentations(data.augmentations)
  }
  
  return (
    <div className="p-8">
      <h1>🧠⚛️ Remote Augmentation Manager</h1>
      
      <div className="grid grid-cols-3 gap-4">
        <AugmentationList 
          items={augmentations}
          onRemove={(id) => removeAugmentation(id)}
        />
        
        <AddAugmentationForm 
          onAdd={addAugmentation}
          connected={connected}
        />
        
        <AugmentationMonitor 
          socket={socket}
        />
      </div>
    </div>
  )
}
```

---

## Production Setup

### High Availability Configuration

```yaml
# kubernetes-deployment.yaml
apiVersion: v1
kind: Service
metadata:
  name: brainy-service
spec:
  selector:
    app: brainy
  ports:
    - port: 3000
      targetPort: 3000
  type: LoadBalancer

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: brainy-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: brainy
  template:
    metadata:
      labels:
        app: brainy
    spec:
      containers:
      - name: brainy
        image: soulcraft/brainy:latest
        ports:
        - containerPort: 3000
        env:
        - name: BRAINY_LICENSE_KEY
          valueFrom:
            secretKeyRef:
              name: brainy-secrets
              key: license-key
        - name: AWS_ACCESS_KEY_ID
          valueFrom:
            secretKeyRef:
              name: aws-credentials
              key: access-key
        - name: AWS_SECRET_ACCESS_KEY
          valueFrom:
            secretKeyRef:
              name: aws-credentials
              key: secret-key
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
```

### Auto-scaling

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: brainy-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: brainy-deployment
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

---

## Security & Authentication

### API Key Authentication

```typescript
// middleware/auth.ts
export function authenticateAPIKey(req, res, next) {
  const apiKey = req.headers['authorization']?.replace('Bearer ', '')
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' })
  }
  
  // Validate API key
  if (!isValidAPIKey(apiKey)) {
    return res.status(403).json({ error: 'Invalid API key' })
  }
  
  req.user = getUserFromAPIKey(apiKey)
  next()
}

// Apply to routes
app.use('/api', authenticateAPIKey)
```

### JWT Authentication

```typescript
// auth/jwt.ts
import jwt from 'jsonwebtoken'

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  )
}

export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET)
}
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
})

app.use('/api', limiter)
```

---

## Monitoring & Management

### Health Checks

```bash
# Check server health
curl https://brainy.example.com/health

# Check via Cortex
cortex status --verbose

# Monitor augmentations
cortex monitor --dashboard
```

### Logging

```typescript
import winston from 'winston'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
})

// Log all operations
brainy.on('data:added', (data) => {
  logger.info('Data added', { id: data.id, size: data.size })
})

brainy.on('augmentation:error', (error) => {
  logger.error('Augmentation error', error)
})
```

### Metrics with Prometheus

```typescript
import { register, Counter, Histogram } from 'prom-client'

const addCounter = new Counter({
  name: 'brainy_add_total',
  help: 'Total number of add operations'
})

const searchDuration = new Histogram({
  name: 'brainy_search_duration_seconds',
  help: 'Search operation duration'
})

app.get('/metrics', (req, res) => {
  res.set('Content-Type', register.contentType)
  res.end(register.metrics())
})
```

---

## Complete Example: Production Deployment

```bash
# 1. Setup server (Ubuntu 22.04)
ssh admin@brainy-prod.example.com

# 2. Install dependencies
sudo apt update
sudo apt install -y docker.io docker-compose nginx certbot

# 3. Clone and configure
git clone https://github.com/soulcraft-research/brainy-server.git
cd brainy-server

# 4. Configure environment
cat > .env << EOF
NODE_ENV=production
BRAINY_LICENSE_KEY=lic_xxxxxxxxxxxxx
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxx
S3_BUCKET=brainy-production
NOTION_TOKEN=secret_xxxxxxxxxx
SF_INSTANCE_URL=https://mycompany.salesforce.com
SF_ACCESS_TOKEN=xxxxxxxxxx
SF_REFRESH_TOKEN=xxxxxxxxxx
JWT_SECRET=$(openssl rand -base64 32)
EOF

# 5. Get SSL certificate
sudo certbot certonly --standalone -d brainy.example.com

# 6. Start services
docker-compose up -d

# 7. Setup auto-renewal
echo "0 0 * * * root certbot renew --quiet" | sudo tee -a /etc/crontab

# 8. Connect Cortex
cortex config set server.url https://brainy.example.com
cortex config set server.apiKey $(cat .api-key)

# 9. Add augmentations
cortex license activate $LICENSE_KEY
cortex augmentation activate notion-connector
cortex augmentation activate salesforce-connector

# 10. Verify
cortex status
cortex augmentations
cortex add "Test data on production server"
cortex search "test"

echo "✅ Brainy deployed and ready!"
```

---

## Troubleshooting

### Connection Issues

```bash
# Test connectivity
curl -v https://brainy.example.com/health

# Check firewall
sudo ufw status
sudo ufw allow 3000/tcp

# Check Docker
docker ps
docker logs brainy-server

# Test WebSocket
wscat -c wss://brainy.example.com
```

### Augmentation Issues

```bash
# Check augmentation status
cortex augmentations --verbose

# Restart augmentation
cortex augmentation restart notion-connector

# Check logs
docker logs brainy-server | grep augmentation
```

### Performance Issues

```bash
# Check resource usage
docker stats brainy-server

# Scale horizontally
docker-compose up -d --scale brainy=3

# Monitor metrics
curl https://brainy.example.com/metrics
```

---

*🧠⚛️ Deploy Brainy anywhere, connect from everywhere, augment everything!*