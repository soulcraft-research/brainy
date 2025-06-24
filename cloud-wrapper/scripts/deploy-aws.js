#!/usr/bin/env node

/**
 * AWS Deployment Script for Brainy Cloud Wrapper
 * 
 * This script helps deploy the Brainy cloud wrapper to AWS Lambda and API Gateway.
 * It uses the AWS SDK to create and configure the necessary resources.
 * 
 * Prerequisites:
 * - AWS CLI installed and configured with appropriate credentials
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
  region: process.env.AWS_REGION || 'us-east-1',
  functionName: process.env.AWS_FUNCTION_NAME || 'brainy-cloud-service',
  s3Bucket: process.env.S3_BUCKET_NAME,
  s3Key: process.env.S3_ACCESS_KEY_ID,
  s3Secret: process.env.S3_SECRET_ACCESS_KEY,
  apiGatewayName: process.env.AWS_API_GATEWAY_NAME || 'brainy-api',
  stageName: process.env.AWS_STAGE_NAME || 'prod'
};

// Validate configuration
if (!config.s3Bucket && process.env.STORAGE_TYPE === 's3') {
  console.error('Error: S3 bucket name is required when using S3 storage');
  process.exit(1);
}

// Create deployment package
function createDeploymentPackage() {
  console.log('Creating deployment package...');
  
  try {
    // Create a temporary directory for the deployment package
    if (!fs.existsSync('deploy')) {
      fs.mkdirSync('deploy');
    }
    
    // Copy necessary files
    execSync('cp -r dist deploy/');
    execSync('cp package.json deploy/');
    execSync('cp .env deploy/');
    
    // Create a zip file
    execSync('cd deploy && zip -r ../deployment.zip .');
    
    console.log('Deployment package created successfully');
  } catch (error) {
    console.error('Error creating deployment package:', error);
    process.exit(1);
  }
}

// Deploy to AWS Lambda
function deployToLambda() {
  console.log('Deploying to AWS Lambda...');
  
  try {
    // Check if function exists
    try {
      execSync(`aws lambda get-function --function-name ${config.functionName} --region ${config.region}`);
      
      // Update existing function
      execSync(`aws lambda update-function-code --function-name ${config.functionName} --zip-file fileb://deployment.zip --region ${config.region}`);
      console.log(`Lambda function ${config.functionName} updated successfully`);
    } catch (error) {
      // Create new function
      execSync(`aws lambda create-function --function-name ${config.functionName} --runtime nodejs20.x --handler dist/index.handler --zip-file fileb://deployment.zip --role arn:aws:iam::${process.env.AWS_ACCOUNT_ID}:role/lambda-basic-execution --region ${config.region}`);
      console.log(`Lambda function ${config.functionName} created successfully`);
    }
    
    // Configure environment variables
    const envVars = {
      Variables: {
        NODE_ENV: 'production',
        STORAGE_TYPE: process.env.STORAGE_TYPE || 'filesystem',
        S3_BUCKET_NAME: config.s3Bucket,
        S3_ACCESS_KEY_ID: config.s3Key,
        S3_SECRET_ACCESS_KEY: config.s3Secret,
        S3_REGION: config.region
      }
    };
    
    execSync(`aws lambda update-function-configuration --function-name ${config.functionName} --environment '${JSON.stringify(envVars)}' --region ${config.region}`);
    console.log('Lambda function environment variables configured');
    
  } catch (error) {
    console.error('Error deploying to AWS Lambda:', error);
    process.exit(1);
  }
}

// Create API Gateway
function createApiGateway() {
  console.log('Creating API Gateway...');
  
  try {
    // Check if API Gateway exists
    let apiId;
    try {
      const result = execSync(`aws apigateway get-rest-apis --region ${config.region}`).toString();
      const apis = JSON.parse(result).items;
      const api = apis.find(api => api.name === config.apiGatewayName);
      
      if (api) {
        apiId = api.id;
        console.log(`Using existing API Gateway: ${apiId}`);
      } else {
        throw new Error('API Gateway not found');
      }
    } catch (error) {
      // Create new API Gateway
      const result = execSync(`aws apigateway create-rest-api --name ${config.apiGatewayName} --region ${config.region}`).toString();
      apiId = JSON.parse(result).id;
      console.log(`API Gateway created: ${apiId}`);
    }
    
    // Get root resource ID
    const resourcesResult = execSync(`aws apigateway get-resources --rest-api-id ${apiId} --region ${config.region}`).toString();
    const rootResourceId = JSON.parse(resourcesResult).items.find(resource => resource.path === '/').id;
    
    // Create proxy resource
    let proxyResourceId;
    try {
      const proxyResource = JSON.parse(resourcesResult).items.find(resource => resource.path === '/{proxy+}');
      if (proxyResource) {
        proxyResourceId = proxyResource.id;
      } else {
        throw new Error('Proxy resource not found');
      }
    } catch (error) {
      const proxyResult = execSync(`aws apigateway create-resource --rest-api-id ${apiId} --parent-id ${rootResourceId} --path-part {proxy+} --region ${config.region}`).toString();
      proxyResourceId = JSON.parse(proxyResult).id;
    }
    
    // Create ANY method
    try {
      execSync(`aws apigateway put-method --rest-api-id ${apiId} --resource-id ${proxyResourceId} --http-method ANY --authorization-type NONE --region ${config.region}`);
    } catch (error) {
      console.log('Method already exists, skipping...');
    }
    
    // Create integration
    try {
      execSync(`aws apigateway put-integration --rest-api-id ${apiId} --resource-id ${proxyResourceId} --http-method ANY --type AWS_PROXY --integration-http-method POST --uri arn:aws:apigateway:${config.region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${config.region}:${process.env.AWS_ACCOUNT_ID}:function:${config.functionName}/invocations --region ${config.region}`);
    } catch (error) {
      console.log('Integration already exists, skipping...');
    }
    
    // Deploy API
    execSync(`aws apigateway create-deployment --rest-api-id ${apiId} --stage-name ${config.stageName} --region ${config.region}`);
    
    console.log(`API Gateway deployed: https://${apiId}.execute-api.${config.region}.amazonaws.com/${config.stageName}`);
    
  } catch (error) {
    console.error('Error creating API Gateway:', error);
    process.exit(1);
  }
}

// Clean up
function cleanup() {
  console.log('Cleaning up...');
  
  try {
    execSync('rm -rf deploy');
    execSync('rm -f deployment.zip');
    
    console.log('Cleanup completed');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

// Main function
async function main() {
  try {
    console.log('Starting AWS deployment...');
    
    createDeploymentPackage();
    deployToLambda();
    createApiGateway();
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
