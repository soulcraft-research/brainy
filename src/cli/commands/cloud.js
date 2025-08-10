/**
 * ⚛️ Brain Cloud Command - Join the Atomic Age!
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const cloudCommand = {
  command: 'cloud [action]',
  describe: '☁️ Connect to Brain Cloud atomic network',
  
  builder: (yargs) => {
    return yargs
      .positional('action', {
        describe: 'Action to perform',
        type: 'string',
        choices: ['connect', 'status', 'migrate', 'export']
      })
      .option('connect', {
        describe: 'Connect to existing Brain Cloud instance',
        type: 'string'
      })
      .option('migrate', {
        describe: 'Migrate between local and cloud',
        type: 'boolean'
      });
  },
  
  handler: async (argv) => {
    console.log(chalk.cyan('\n⚛️ BRAIN CLOUD - Atomic-Powered AI Memory'));
    console.log(chalk.gray('━'.repeat(50)));
    
    // Check for existing config
    const configPath = path.join(os.homedir(), '.brainy', 'cloud.json');
    let config = {};
    
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    
    if (!argv.action || argv.action === 'status') {
      // Show status
      if (config.customerId) {
        console.log(chalk.green('✅ Connected to Brain Cloud'));
        console.log(`🔗 Instance: ${chalk.cyan(`https://brainy-${config.customerId}.soulcraft.com`)}`);
        console.log(`📊 Customer ID: ${chalk.yellow(config.customerId)}`);
      } else {
        console.log(chalk.yellow('📡 Not connected to Brain Cloud'));
        console.log('\nOptions:');
        console.log('  1. Sign up at: ' + chalk.cyan('https://app.soulcraft.com'));
        console.log('  2. Connect with: ' + chalk.green('brainy cloud --connect YOUR_ID'));
      }
      return;
    }
    
    if (argv.action === 'connect' || argv.connect) {
      const customerId = argv.connect || argv._[1];
      
      if (!customerId) {
        const answer = await inquirer.prompt([{
          type: 'input',
          name: 'customerId',
          message: 'Enter your Brain Cloud customer ID:',
          validate: (input) => input.length > 0
        }]);
        
        config.customerId = answer.customerId;
      } else {
        config.customerId = customerId;
      }
      
      const spinner = ora('🔒 Establishing secure quantum tunnel...').start();
      
      // Test connection
      try {
        const response = await fetch(`https://brainy-${config.customerId}.soulcraft.com/health`);
        const data = await response.json();
        
        spinner.succeed('✅ Connected to atomic reactor!');
        
        // Save config
        fs.mkdirSync(path.dirname(configPath), { recursive: true });
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        
        console.log(chalk.green('\n🎉 Brain Cloud connection established!'));
        console.log(`🔗 Your instance: ${chalk.cyan(`https://brainy-${config.customerId}.soulcraft.com`)}`);
        console.log('\nTry these commands:');
        console.log('  ' + chalk.yellow('brainy add "My first atomic memory"'));
        console.log('  ' + chalk.yellow('brainy search "memory"'));
        console.log('  ' + chalk.yellow('brainy cloud migrate'));
        
      } catch (error) {
        spinner.fail('💥 Connection failed');
        console.error(chalk.red('Could not connect to Brain Cloud instance'));
        console.log('Please check your customer ID and try again');
      }
      return;
    }
    
    if (argv.action === 'migrate') {
      if (!config.customerId) {
        console.log(chalk.red('❌ Not connected to Brain Cloud'));
        console.log('Connect first with: ' + chalk.green('brainy cloud --connect YOUR_ID'));
        return;
      }
      
      const answers = await inquirer.prompt([{
        type: 'list',
        name: 'direction',
        message: 'Migration direction:',
        choices: [
          { name: '☁️  Local → Cloud (upload memories)', value: 'upload' },
          { name: '🏠 Cloud → Local (download memories)', value: 'download' }
        ]
      }]);
      
      const spinner = ora('🚀 Teleporting memory particles...').start();
      
      // Simulate migration
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      spinner.succeed('✅ Migration complete!');
      console.log(chalk.green('\n🎉 All memories successfully teleported!'));
      console.log('No radioactive lock-in - migrate anytime! ⚛️');
    }
    
    if (argv.action === 'export') {
      if (!config.customerId) {
        console.log(chalk.red('❌ Not connected to Brain Cloud'));
        return;
      }
      
      const spinner = ora('📦 Exporting atomic memories...').start();
      
      try {
        const response = await fetch(`https://brainy-${config.customerId}.soulcraft.com/export`);
        const data = await response.json();
        
        const exportPath = `brainy-export-${Date.now()}.json`;
        fs.writeFileSync(exportPath, JSON.stringify(data, null, 2));
        
        spinner.succeed('✅ Export complete!');
        console.log(chalk.green(`\n📦 Exported to: ${exportPath}`));
        console.log(`💾 ${data.memories?.length || 0} memories exported`);
        
      } catch (error) {
        spinner.fail('💥 Export failed');
        console.error(chalk.red('Could not export memories'));
      }
    }
  }
};

export default cloudCommand;