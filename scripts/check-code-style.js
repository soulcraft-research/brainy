#!/usr/bin/env node

/**
 * Script to check code style and enforce no-semicolon rule
 * This script runs eslint and prettier checks on the codebase
 */

const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
}

console.log(`${colors.cyan}Checking code style...${colors.reset}`)
console.log(`${colors.cyan}====================${colors.reset}`)

// Run eslint
try {
  console.log(`${colors.blue}Running ESLint...${colors.reset}`)
  execSync('npm run lint', { stdio: 'inherit' })
  console.log(`${colors.green}ESLint check passed!${colors.reset}`)
} catch (error) {
  console.error(`${colors.red}ESLint check failed!${colors.reset}`)
  console.log(`${colors.yellow}Run 'npm run lint:fix' to automatically fix some issues.${colors.reset}`)
  process.exit(1)
}

// Run prettier check
try {
  console.log(`${colors.blue}Running Prettier check...${colors.reset}`)
  execSync('npm run check-format', { stdio: 'inherit' })
  console.log(`${colors.green}Prettier check passed!${colors.reset}`)
} catch (error) {
  console.error(`${colors.red}Prettier check failed!${colors.reset}`)
  console.log(`${colors.yellow}Run 'npm run format' to automatically format your code.${colors.reset}`)
  process.exit(1)
}

// Specific check for semicolons
console.log(`${colors.blue}Checking for semicolons in code...${colors.reset}`)
try {
  // Find all .ts and .js files in src directory
  const findCommand = "find src -type f -name '*.ts' -o -name '*.js'"
  const files = execSync(findCommand, { encoding: 'utf8' }).trim().split('\n')
  
  let semicolonFound = false
  
  for (const file of files) {
    if (!file) continue
    
    const content = fs.readFileSync(file, 'utf8')
    const lines = content.split('\n')
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      // Skip comments and strings
      if (line.trim().startsWith('//') || line.trim().startsWith('/*') || 
          line.trim().startsWith('*') || line.trim().startsWith('*/')) {
        continue
      }
      
      // Check for semicolons at the end of lines (excluding in string literals and comments)
      if (line.trim().endsWith(';') && !line.includes('//') && !line.includes('/*')) {
        console.error(`${colors.red}Semicolon found in ${file}:${i+1}${colors.reset}`)
        console.error(`${colors.yellow}${line}${colors.reset}`)
        semicolonFound = true
      }
    }
  }
  
  if (semicolonFound) {
    console.error(`${colors.red}Semicolons found in code! Please remove them.${colors.reset}`)
    process.exit(1)
  } else {
    console.log(`${colors.green}No semicolons found in code!${colors.reset}`)
  }
} catch (error) {
  console.error(`${colors.red}Error checking for semicolons: ${error}${colors.reset}`)
  process.exit(1)
}

console.log(`${colors.green}All code style checks passed!${colors.reset}`)
console.log(`${colors.cyan}Remember: No semicolons in code!${colors.reset}`)
