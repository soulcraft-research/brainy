#!/usr/bin/env node

/**
 * Google Cloud Platform Deployment Script for Brainy Cloud Wrapper
 * 
 * This script helps deploy the Brainy cloud wrapper to Google Cloud Run.
 * It uses the Google Cloud SDK to create and configure the necessary resources.
 * 
 * Prerequisites:
 * - Google Cloud SDK installed and configured with appropriate credentials
 * - Node.js 23.11.0 or higher
 * - Brainy cloud wrapper built (npm run build)
 * - Docker installed (for building container images)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const config = {
  projectId: process.env.GCP_PROJECT_ID,
  region: process.env.GCP_REGION || 'us-central1',
  serviceName: process.env.GCP_SERVICE_NAME || 'brainy-cloud-service',
  imageName: process.env.GCP_IMAGE_NAME || 'brainy-cloud-service',
  memory: process.env.GCP_MEMORY || '512Mi',
  cpu: process.env.GCP_CPU || '1',
  maxInstances: process.env.GCP_MAX_INSTANCES || '10',
  minInstances: process.env.GCP_MIN_INSTANCES || '0'
};

// Validate configuration
if (!config.projectId) {
  console.error('Error: GCP_PROJECT_ID environment variable is required');
  process.exit(1);
}

// Create Dockerfile
function createDockerfile() {
  console.log('Creating Dockerfile...');
  
  const dockerfileContent = `
FROM node:23-slim

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production --legacy-peer-deps

# Copy built application
COPY dist/ ./dist/

# Copy environment variables
COPY .env ./

# Expose port
EXPOSE 8080

# Start the application
CMD ["node", "dist/index.js"]
`;
  
  try {
    fs.writeFileSync('Dockerfile', dockerfileContent);
    console.log('Dockerfile created successfully');
  } catch (error) {
    console.error('Error creating Dockerfile:', error);
    process.exit(1);
  }
}

// Build and push Docker image
function buildAndPushImage() {
  console.log('Building and pushing Docker image...');
  
  try {
    // Set Google Cloud project
    execSync(`gcloud config set project ${config.projectId}`);
    
    // Build the Docker image
    execSync(`docker build -t gcr.io/${config.projectId}/${config.imageName} .`);
    
    // Configure Docker to use gcloud as a credential helper
    execSync('gcloud auth configure-docker');
    
    // Push the image to Google Container Registry
    execSync(`docker push gcr.io/${config.projectId}/${config.imageName}`);
    
    console.log('Docker image built and pushed successfully');
  } catch (error) {
    console.error('Error building and pushing Docker image:', error);
    process.exit(1);
  }
}

// Deploy to Google Cloud Run
function deployToCloudRun() {
  console.log('Deploying to Google Cloud Run...');
  
  try {
    // Create environment variables string
    const envVars = [
      `NODE_ENV=production`,
      `PORT=8080`,
      `STORAGE_TYPE=${process.env.STORAGE_TYPE || 'filesystem'}`
    ];
    
    // Add S3 environment variables if using S3 storage
    if (process.env.STORAGE_TYPE === 's3') {
      envVars.push(`S3_BUCKET_NAME=${process.env.S3_BUCKET_NAME}`);
      envVars.push(`S3_ACCESS_KEY_ID=${process.env.S3_ACCESS_KEY_ID}`);
      envVars.push(`S3_SECRET_ACCESS_KEY=${process.env.S3_SECRET_ACCESS_KEY}`);
      envVars.push(`S3_REGION=${process.env.S3_REGION || 'us-east-1'}`);
      
      if (process.env.S3_ENDPOINT) {
        envVars.push(`S3_ENDPOINT=${process.env.S3_ENDPOINT}`);
      }
    }
    
    // Add embedding and HNSW configuration if provided
    if (process.env.USE_SIMPLE_EMBEDDING) {
      envVars.push(`USE_SIMPLE_EMBEDDING=${process.env.USE_SIMPLE_EMBEDDING}`);
    }
    
    if (process.env.HNSW_M) {
      envVars.push(`HNSW_M=${process.env.HNSW_M}`);
      envVars.push(`HNSW_EF_CONSTRUCTION=${process.env.HNSW_EF_CONSTRUCTION || '200'}`);
      envVars.push(`HNSW_EF_SEARCH=${process.env.HNSW_EF_SEARCH || '50'}`);
    }
    
    // Deploy to Cloud Run
    const envVarsString = envVars.map(env => `--set-env-vars="${env}"`).join(' ');
    
    execSync(`gcloud run deploy ${config.serviceName} \
      --image=gcr.io/${config.projectId}/${config.imageName} \
      --platform=managed \
      --region=${config.region} \
      --memory=${config.memory} \
      --cpu=${config.cpu} \
      --max-instances=${config.maxInstances} \
      --min-instances=${config.minInstances} \
      --allow-unauthenticated \
      ${envVarsString}`);
    
    console.log('Deployed to Google Cloud Run successfully');
    
    // Get the service URL
    const serviceUrl = execSync(`gcloud run services describe ${config.serviceName} --region=${config.region} --format="value(status.url)"`).toString().trim();
    console.log(`Service URL: ${serviceUrl}`);
  } catch (error) {
    console.error('Error deploying to Google Cloud Run:', error);
    process.exit(1);
  }
}

// Clean up
function cleanup() {
  console.log('Cleaning up...');
  
  try {
    // Remove Dockerfile
    fs.unlinkSync('Dockerfile');
    
    console.log('Cleanup completed');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

// Main function
async function main() {
  try {
    console.log('Starting Google Cloud Platform deployment...');
    
    createDockerfile();
    buildAndPushImage();
    deployToCloudRun();
    cleanup();
    
    console.log('Deployment completed successfully');
  } catch (error) {
    console.error('Deployment failed:', error);
    cleanup();
    process.exit(1);
  }
}

// Run the script
main();
