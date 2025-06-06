#!/usr/bin/env node

/**
 * Cloudflare Deployment Script for Brainy Cloud Wrapper
 * 
 * This script helps deploy the Brainy cloud wrapper to Cloudflare Workers.
 * It uses the Wrangler CLI to create and configure the necessary resources.
 * 
 * Prerequisites:
 * - Wrangler CLI installed and configured with appropriate credentials
 * - Node.js 23.11.0 or higher
 * - Brainy cloud wrapper built (npm run build)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const config = {
  workerName: process.env.CF_WORKER_NAME || 'brainy-cloud-service',
  accountId: process.env.CF_ACCOUNT_ID,
  kvNamespace: process.env.CF_KV_NAMESPACE || 'BRAINY_STORAGE',
  r2Bucket: process.env.CF_R2_BUCKET || 'brainy-storage'
};

// Validate configuration
if (!config.accountId) {
  console.error('Error: CF_ACCOUNT_ID environment variable is required');
  process.exit(1);
}

// Create wrangler.toml configuration
function createWranglerConfig() {
  console.log('Creating wrangler.toml configuration...');
  
  const wranglerContent = `
name = "${config.workerName}"
main = "dist/worker.js"
compatibility_date = "2023-12-01"
node_compat = true

account_id = "${config.accountId}"

[build]
command = "npm run build"

[vars]
NODE_ENV = "production"
STORAGE_TYPE = "${process.env.STORAGE_TYPE || 'memory'}"
USE_SIMPLE_EMBEDDING = "${process.env.USE_SIMPLE_EMBEDDING || 'false'}"

# KV Namespace for storage
[[kv_namespaces]]
binding = "BRAINY_KV"
id = "${process.env.CF_KV_NAMESPACE_ID || 'create_kv_namespace_and_add_id_here'}"

# R2 Bucket for storage (if using R2)
[[r2_buckets]]
binding = "BRAINY_R2"
bucket_name = "${config.r2Bucket}"
`;
  
  try {
    fs.writeFileSync('wrangler.toml', wranglerContent);
    console.log('wrangler.toml created successfully');
  } catch (error) {
    console.error('Error creating wrangler.toml:', error);
    process.exit(1);
  }
}

// Create Cloudflare Worker adapter
function createWorkerAdapter() {
  console.log('Creating Cloudflare Worker adapter...');
  
  const workerContent = `
import { createServer } from '@cloudflare/workers-adapter';
import app from './index.js';

// Create a fetch handler for the worker
export default {
  async fetch(request, env, ctx) {
    // Add environment variables to process.env
    process.env = {
      ...process.env,
      ...env.vars,
      CF_KV_NAMESPACE: env.BRAINY_KV,
      CF_R2_BUCKET: env.BRAINY_R2
    };

    // Create a server adapter
    const server = createServer(app);
    
    // Handle the request
    return server.fetch(request, env, ctx);
  }
};
`;
  
  try {
    // Create dist directory if it doesn't exist
    if (!fs.existsSync('dist')) {
      fs.mkdirSync('dist');
    }
    
    fs.writeFileSync('dist/worker.js', workerContent);
    console.log('Worker adapter created successfully');
  } catch (error) {
    console.error('Error creating worker adapter:', error);
    process.exit(1);
  }
}

// Update package.json to include Cloudflare Workers dependencies
function updatePackageJson() {
  console.log('Updating package.json...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Add Cloudflare Workers dependencies
    packageJson.dependencies = {
      ...packageJson.dependencies,
      '@cloudflare/workers-adapter': '^1.1.0',
      '@cloudflare/kv-asset-handler': '^0.3.0'
    };
    
    // Add Cloudflare Workers scripts
    packageJson.scripts = {
      ...packageJson.scripts,
      'deploy:cloudflare': 'wrangler deploy'
    };
    
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    console.log('package.json updated successfully');
    
    // Install new dependencies
    execSync('npm install --legacy-peer-deps');
  } catch (error) {
    console.error('Error updating package.json:', error);
    process.exit(1);
  }
}

// Create KV namespace if it doesn't exist
function createKVNamespace() {
  console.log('Creating KV namespace...');
  
  try {
    // Check if KV namespace ID is provided
    if (process.env.CF_KV_NAMESPACE_ID) {
      console.log(`Using existing KV namespace: ${process.env.CF_KV_NAMESPACE_ID}`);
      return;
    }
    
    // Create KV namespace
    const result = execSync(`wrangler kv:namespace create "${config.kvNamespace}"`).toString();
    const match = result.match(/id = "([^"]+)"/);
    
    if (match && match[1]) {
      const namespaceId = match[1];
      console.log(`KV namespace created with ID: ${namespaceId}`);
      
      // Update wrangler.toml with the new namespace ID
      let wranglerContent = fs.readFileSync('wrangler.toml', 'utf8');
      wranglerContent = wranglerContent.replace(/id = "create_kv_namespace_and_add_id_here"/, `id = "${namespaceId}"`);
      fs.writeFileSync('wrangler.toml', wranglerContent);
    } else {
      console.error('Failed to extract KV namespace ID from wrangler output');
    }
  } catch (error) {
    console.error('Error creating KV namespace:', error);
    console.log('You may need to create the KV namespace manually and update wrangler.toml');
  }
}

// Create R2 bucket if it doesn't exist
function createR2Bucket() {
  console.log('Creating R2 bucket...');
  
  try {
    // Only create R2 bucket if using R2 storage
    if (process.env.STORAGE_TYPE !== 'r2') {
      console.log('Skipping R2 bucket creation (not using R2 storage)');
      return;
    }
    
    // Create R2 bucket
    execSync(`wrangler r2 bucket create ${config.r2Bucket}`);
    console.log(`R2 bucket created: ${config.r2Bucket}`);
  } catch (error) {
    console.error('Error creating R2 bucket:', error);
    console.log('You may need to create the R2 bucket manually');
  }
}

// Deploy to Cloudflare Workers
function deployToCloudflare() {
  console.log('Deploying to Cloudflare Workers...');
  
  try {
    execSync('wrangler deploy', { stdio: 'inherit' });
    console.log('Deployed to Cloudflare Workers successfully');
  } catch (error) {
    console.error('Error deploying to Cloudflare Workers:', error);
    process.exit(1);
  }
}

// Clean up
function cleanup() {
  console.log('Cleaning up...');
  
  // No cleanup needed for now
  console.log('Cleanup completed');
}

// Main function
async function main() {
  try {
    console.log('Starting Cloudflare deployment...');
    
    createWranglerConfig();
    createWorkerAdapter();
    updatePackageJson();
    createKVNamespace();
    createR2Bucket();
    deployToCloudflare();
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
