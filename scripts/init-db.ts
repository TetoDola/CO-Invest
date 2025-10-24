import { initializeDatabase } from '../lib/database';
import fs from 'fs';
import path from 'path';

/**
 * Initialize the JSON-based database
 * Creates data directory and JSON files if they don't exist
 */
async function main() {
  console.log('🔧 Initializing database...');

  // Ensure data directory exists
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('📁 Created data directory');
  }

  try {
    // Initialize database files
    initializeDatabase();
    console.log('✅ Database initialized successfully!');
    console.log('📄 Created files:');
    console.log('   - data/managers.json');
    console.log('   - data/vaults.json');
    console.log('   - data/balance_history.json');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

main();