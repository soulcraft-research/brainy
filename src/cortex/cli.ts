#!/usr/bin/env node

/**
 * Cortex - The Command Center for Brainy
 * 
 * A powerful yet simple CLI for managing Brainy databases, configurations,
 * migrations, and distributed coordination.
 */

import { Command } from 'commander'
import { BrainyData } from '../brainyData.js'
import { CortexConfig } from './config.js'
import { CortexCommands } from './commands/index.js'
import { version } from '../../package.json' assert { type: 'json' }
import chalk from 'chalk'
import ora from 'ora'

const program = new Command()

program
  .name('cortex')
  .description(chalk.cyan('🧠 Cortex - Command Center for Brainy'))
  .version(version)

// Initialize command
program
  .command('init')
  .description('Initialize Cortex in your project')
  .option('-i, --interactive', 'Interactive setup mode', true)
  .option('-s, --storage <type>', 'Storage type (s3, filesystem, memory, opfs)')
  .action(async (options) => {
    const spinner = ora('Initializing Cortex...').start()
    try {
      await CortexCommands.init(options)
      spinner.succeed(chalk.green('✅ Cortex initialized successfully!'))
    } catch (error) {
      spinner.fail(chalk.red(`Failed to initialize: ${error.message}`))
      process.exit(1)
    }
  })

// Config management
const config = program.command('config')
config.description('Manage configuration and secrets')

config
  .command('set <key> [value]')
  .description('Set a configuration value')
  .option('-e, --encrypt', 'Encrypt the value', true)
  .option('--env', 'Set as environment variable')
  .action(async (key, value, options) => {
    await CortexCommands.configSet(key, value, options)
  })

config
  .command('get <key>')
  .description('Get a configuration value')
  .action(async (key) => {
    await CortexCommands.configGet(key)
  })

config
  .command('list')
  .description('List all configuration keys')
  .option('--show-values', 'Show decrypted values')
  .action(async (options) => {
    await CortexCommands.configList(options)
  })

config
  .command('import <file>')
  .description('Import configuration from .env file')
  .action(async (file) => {
    await CortexCommands.configImport(file)
  })

// Environment loading
program
  .command('env')
  .description('Load environment variables from Cortex')
  .option('--export', 'Export as shell commands')
  .action(async (options) => {
    await CortexCommands.envLoad(options)
  })

// Migration commands
program
  .command('migrate')
  .description('Migrate to new storage')
  .requiredOption('--to <storage>', 'Target storage URL (e.g., s3://new-bucket)')
  .option('--strategy <type>', 'Migration strategy (immediate, gradual, test)', 'gradual')
  .option('--dry-run', 'Test migration without making changes')
  .action(async (options) => {
    const spinner = ora('Planning migration...').start()
    try {
      await CortexCommands.migrate(options)
      spinner.succeed(chalk.green('✅ Migration completed successfully!'))
    } catch (error) {
      spinner.fail(chalk.red(`Migration failed: ${error.message}`))
      process.exit(1)
    }
  })

// Sync command
program
  .command('sync')
  .description('Synchronize all connected services')
  .option('--force', 'Force synchronization')
  .action(async (options) => {
    await CortexCommands.sync(options)
  })

// Query command
program
  .command('query <pattern>')
  .description('Query data from Brainy with advanced filtering')
  .option('-t, --type <type>', 'Filter by type (noun, verb)')
  .option('-f, --filter <json>', 'MongoDB-style filter (e.g., {"age": {"$gte": 18}})')
  .option('-m, --metadata <json>', 'Metadata filter (alias for --filter)')
  .option('-l, --limit <n>', 'Limit results', '10')
  .option('--json', 'Output as JSON')
  .option('--explain', 'Show query execution plan')
  .action(async (pattern, options) => {
    await CortexCommands.query(pattern, options)
  })

// Stats command
program
  .command('stats')
  .description('Show database statistics')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    await CortexCommands.stats(options)
  })

// Backup command
program
  .command('backup [destination]')
  .description('Backup Brainy data')
  .option('--include-config', 'Include configuration', true)
  .option('--compress', 'Compress backup', true)
  .action(async (destination, options) => {
    const spinner = ora('Creating backup...').start()
    try {
      const backupPath = await CortexCommands.backup(destination, options)
      spinner.succeed(chalk.green(`✅ Backup created: ${backupPath}`))
    } catch (error) {
      spinner.fail(chalk.red(`Backup failed: ${error.message}`))
      process.exit(1)
    }
  })

// Restore command
program
  .command('restore <source>')
  .description('Restore from backup')
  .option('--force', 'Overwrite existing data')
  .action(async (source, options) => {
    const spinner = ora('Restoring from backup...').start()
    try {
      await CortexCommands.restore(source, options)
      spinner.succeed(chalk.green('✅ Restore completed successfully!'))
    } catch (error) {
      spinner.fail(chalk.red(`Restore failed: ${error.message}`))
      process.exit(1)
    }
  })

// Inspect command
program
  .command('inspect <id>')
  .description('Inspect a specific noun or verb')
  .option('--raw', 'Show raw data')
  .action(async (id, options) => {
    await CortexCommands.inspect(id, options)
  })

// Reindex command
program
  .command('reindex')
  .description('Rebuild all indexes')
  .option('--type <type>', 'Index type to rebuild (metadata, hnsw, all)', 'all')
  .action(async (options) => {
    const spinner = ora('Rebuilding indexes...').start()
    try {
      await CortexCommands.reindex(options)
      spinner.succeed(chalk.green('✅ Indexes rebuilt successfully!'))
    } catch (error) {
      spinner.fail(chalk.red(`Reindex failed: ${error.message}`))
      process.exit(1)
    }
  })

// Health check
program
  .command('health')
  .description('Check system health')
  .option('--verbose', 'Show detailed health information')
  .action(async (options) => {
    await CortexCommands.health(options)
  })

// Interactive shell
program
  .command('shell')
  .description('Start interactive Cortex shell')
  .action(async () => {
    await CortexCommands.shell()
  })

// Status command
program
  .command('status')
  .description('Show Cortex and cluster status')
  .action(async () => {
    await CortexCommands.status()
  })

// Parse command line arguments
program.parse(process.argv)

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp()
}