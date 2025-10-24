import { pool } from '../lib/database-postgres';
import fs from 'fs';
import path from 'path';

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting migration from JSON to PostgreSQL...\n');
    
    // Read JSON files
    const managersPath = path.join(process.cwd(), 'data', 'managers.json');
    const vaultsPath = path.join(process.cwd(), 'data', 'vaults.json');
    
    let managersCount = 0;
    let vaultsCount = 0;
    
    // Migrate managers
    if (fs.existsSync(managersPath)) {
      const managers = JSON.parse(fs.readFileSync(managersPath, 'utf-8'));
      console.log(`📊 Found ${managers.length} managers to migrate`);
      
      for (const manager of managers) {
        try {
          await client.query(
            `INSERT INTO managers (
              wallet_address, fid, username, display_name, created_at,
              updated_at, is_verified, total_vaults_created, usdc_balance,
              last_balance_check
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (wallet_address) DO UPDATE SET
              fid = EXCLUDED.fid,
              username = EXCLUDED.username,
              display_name = EXCLUDED.display_name,
              updated_at = EXCLUDED.updated_at`,
            [
              manager.wallet_address,
              manager.fid,
              manager.username,
              manager.display_name,
              manager.created_at,
              manager.updated_at,
              manager.is_verified,
              manager.total_vaults_created,
              manager.usdc_balance,
              manager.last_balance_check
            ]
          );
          managersCount++;
        } catch (error) {
          console.error(`❌ Error migrating manager ${manager.wallet_address}:`, error);
        }
      }
      
      console.log(`✅ Migrated ${managersCount}/${managers.length} managers`);
    } else {
      console.log('ℹ️  No managers.json file found');
    }
    
    // Migrate vaults
    if (fs.existsSync(vaultsPath)) {
      const vaults = JSON.parse(fs.readFileSync(vaultsPath, 'utf-8'));
      console.log(`\n📊 Found ${vaults.length} vaults to migrate`);
      
      for (const vault of vaults) {
        try {
          await client.query(
            `INSERT INTO vaults (
              manager_address, manager_fid, vault_address, vault_name,
              vault_symbol, safety_deposit_amount, lock_until,
              is_withdrawn, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (vault_address) DO UPDATE SET
              manager_fid = EXCLUDED.manager_fid,
              is_withdrawn = EXCLUDED.is_withdrawn`,
            [
              vault.manager_address,
              vault.manager_fid || 0, // Default to 0 if not set
              vault.vault_address,
              vault.vault_name,
              vault.vault_symbol,
              vault.safety_deposit_amount,
              vault.lock_until,
              vault.is_withdrawn,
              vault.created_at
            ]
          );
          vaultsCount++;
        } catch (error) {
          console.error(`❌ Error migrating vault ${vault.vault_address}:`, error);
        }
      }
      
      console.log(`✅ Migrated ${vaultsCount}/${vaults.length} vaults`);
    } else {
      console.log('ℹ️  No vaults.json file found');
    }
    
    console.log('\n🎉 Migration complete!');
    console.log(`\n📊 Summary:`);
    console.log(`  - Managers migrated: ${managersCount}`);
    console.log(`  - Vaults migrated: ${vaultsCount}`);
    
    // Verify migration
    const managerCheck = await client.query('SELECT COUNT(*) FROM managers');
    const vaultCheck = await client.query('SELECT COUNT(*) FROM vaults');
    
    console.log(`\n✅ Database now contains:`);
    console.log(`  - Managers: ${managerCheck.rows[0].count}`);
    console.log(`  - Vaults: ${vaultCheck.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();