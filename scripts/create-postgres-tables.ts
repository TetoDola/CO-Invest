import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for DigitalOcean
  },
});

async function createTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔌 Connecting to DigitalOcean PostgreSQL...');
    console.log('📊 Creating tables...\n');
    
    // Create managers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS managers (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(42) UNIQUE NOT NULL,
        fid INTEGER NOT NULL,
        username VARCHAR(255),
        display_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_verified BOOLEAN DEFAULT FALSE,
        total_vaults_created INTEGER DEFAULT 0,
        usdc_balance DECIMAL(18, 6) DEFAULT 0,
        last_balance_check TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table "managers" created');
    
    // Create index on FID for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_managers_fid ON managers(fid);
    `);
    console.log('✅ Index "idx_managers_fid" created');
    
    // Create vaults table
    await client.query(`
      CREATE TABLE IF NOT EXISTS vaults (
        id SERIAL PRIMARY KEY,
        manager_address VARCHAR(42) NOT NULL,
        manager_fid INTEGER NOT NULL,
        vault_address VARCHAR(42) UNIQUE NOT NULL,
        vault_name VARCHAR(255) NOT NULL,
        vault_symbol VARCHAR(10) NOT NULL,
        safety_deposit_amount DECIMAL(18, 6) NOT NULL,
        lock_until TIMESTAMP NOT NULL,
        is_withdrawn BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table "vaults" created');
    
    // Create indexes for faster queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_vaults_manager_fid ON vaults(manager_fid);
    `);
    console.log('✅ Index "idx_vaults_manager_fid" created');
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_vaults_manager_address ON vaults(manager_address);
    `);
    console.log('✅ Index "idx_vaults_manager_address" created');
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_vaults_created_at ON vaults(created_at DESC);
    `);
    console.log('✅ Index "idx_vaults_created_at" created');
    
    // Create balance_history table
    await client.query(`
      CREATE TABLE IF NOT EXISTS balance_history (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(42) NOT NULL,
        usdc_balance DECIMAL(18, 6) NOT NULL,
        checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table "balance_history" created');
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_balance_wallet ON balance_history(wallet_address);
    `);
    console.log('✅ Index "idx_balance_wallet" created');
    
    console.log('\n🎉 All tables and indexes created successfully!');
    console.log('\n📋 Tables created:');
    console.log('  - managers');
    console.log('  - vaults');
    console.log('  - balance_history');
    
    // Show table counts
    const managersCount = await client.query('SELECT COUNT(*) FROM managers');
    const vaultsCount = await client.query('SELECT COUNT(*) FROM vaults');
    const historyCount = await client.query('SELECT COUNT(*) FROM balance_history');
    
    console.log('\n📊 Current record counts:');
    console.log(`  - Managers: ${managersCount.rows[0].count}`);
    console.log(`  - Vaults: ${vaultsCount.rows[0].count}`);
    console.log(`  - Balance History: ${historyCount.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createTables();