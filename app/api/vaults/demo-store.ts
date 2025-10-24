// Redis store for demo vaults using node-redis
// Persists across all serverless function instances
// Perfect for production on Vercel!

import { createClient } from 'redis';
import { createHash } from 'crypto';

// Create Redis client (singleton pattern)
let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedisClient() {
  if (redisClient) {
    return redisClient;
  }

  try {
    // Vercel automatically sets REDIS_REDIS_URL when you create a Redis database
    const client = createClient({
      url: process.env.REDIS_REDIS_URL,
    });

    await client.connect();
    redisClient = client;
    console.log('✅ Connected to Redis');
    return client;
  } catch (error) {
    console.error('❌ Redis connection error:', error);
    console.warn('⚠️ Running without Redis - data will not persist');
    return null;
  }
}

interface DemoVault {
  vault_address: string;
  vault_name: string;
  vault_symbol: string;
  manager_address: string;
  manager_fid?: number; // Base FID for user tracking
  strategy: string;
  total_value_locked: string;
  share_price: string;
  created_at: string;
  tx_hash: string;
}

// Generate a deterministic but unique vault address based on FID and timestamp
function generateVaultAddress(fid: number, timestamp: string): string {
  const hash = createHash('sha256')
    .update(`vault-${fid}-${timestamp}`)
    .digest('hex');
  // Take first 40 characters (20 bytes) and prefix with 0x
  return `0x${hash.substring(0, 40)}`;
}

// Use /tmp for Vercel serverless compatibility
const REDIS_VAULTS_KEY = 'demo-vaults';
let vaultIdCounter = 1000; // Start at 1000 to avoid conflicts with mock vaults

// Load vaults from Redis (with fallback for local dev)
async function loadVaults(): Promise<DemoVault[]> {
  const client = await getRedisClient();
  
  if (!client) {
    // No Redis available - return empty array
    console.warn('⚠️ Redis not available - returning empty vault list');
    return [];
  }

  try {
    const data = await client.get(REDIS_VAULTS_KEY);
    if (data) {
      const vaults = JSON.parse(data);
      console.log(`📊 Loaded ${vaults.length} vaults from Redis`);
      return vaults;
    }
    return [];
  } catch (error) {
    console.error('Error loading demo vaults from Redis:', error);
    return [];
  }
}

// Save vaults to Redis (with fallback for local dev)
// Default manager address for all vaults
const DEFAULT_MANAGER_ADDRESS = '0xb8cEDA3103Ed470b9a3A8A64323F4BCd36C61739';

async function saveVaults(vaults: DemoVault[]): Promise<void> {
  const client = await getRedisClient();
  
  if (!client) {
    console.warn('⚠️ Redis not available - changes will not persist');
    return;
  }

  try {
    await client.set(REDIS_VAULTS_KEY, JSON.stringify(vaults));
    console.log(`✅ Saved ${vaults.length} vaults to Redis`);
  } catch (error) {
    console.error('Error saving demo vaults to Redis:', error);
  }
}

export async function addDemoVault(vault: Omit<DemoVault, 'vault_address'> & { vault_address?: string }): Promise<DemoVault> {
  const vaults = await loadVaults();
  
  // Set default manager address and generate unique vault address
  const timestamp = vault.created_at || new Date().toISOString();
  const fid = vault.manager_fid || Date.now();
  
  const newVault = {
    ...vault,
    manager_address: DEFAULT_MANAGER_ADDRESS,
    vault_address: vault.vault_address || generateVaultAddress(fid, timestamp)
  } as DemoVault;
  vaults.push(newVault);
  await saveVaults(vaults);
  
  console.log(`✅ Added vault: ${newVault.vault_name} (${newVault.vault_address})`);
  return newVault;
}

// Get vaults by manager FID
export async function getVaultsByFid(fid: number): Promise<DemoVault[]> {
  const vaults = await loadVaults();
  return vaults.filter(v => v.manager_fid === fid);
}

export async function getAllDemoVaults() {
  const demoVaults = await loadVaults();
  // Convert demo vaults to match the expected format for the main page
  return demoVaults.map((vault, index) => {
    // Check if vault has enough history for performance data
    // Only show performance after at least 1 full day
    const daysSinceCreation = Math.floor((Date.now() - new Date(vault.created_at).getTime()) / (1000 * 60 * 60 * 24));
    const hasData = daysSinceCreation >= 1;
    
    // Only generate performance numbers for vaults with history
    let performance7d = 0;
    let performance30d = 0;
    
    if (hasData) {
      const baseReturn = Math.random() * 5 - 1; // Between -1% and 4%
      const volatility = Math.random() * 2;
      performance7d = Number((baseReturn + (Math.random() - 0.5) * volatility).toFixed(2));
      performance30d = Number((baseReturn * 4 + (Math.random() - 0.5) * volatility * 2).toFixed(2));
    }
    
    return {
      id: vaultIdCounter + index,
      address: vault.vault_address,
      name: vault.vault_name,
      manager: vault.manager_fid ? `FID ${vault.manager_fid}` : (vault.manager_address.slice(0, 6) + '...' + vault.manager_address.slice(-4)),
      managerAddress: vault.manager_address,
      managerFid: vault.manager_fid,
      exitFee: 1.0,
      tvl: parseFloat(vault.total_value_locked) || 0,
      performance7d,
      performance30d,
      lockupDays: 7,
      allocation: [
        { token: 'USDC', percentage: 100 }
      ],
      nav: parseFloat(vault.share_price) || 1.0,
      navHistory: hasData ? generateNavHistory(daysSinceCreation) : [1.00], // Only initial NAV for new vaults
      strategyDisclosed: true,
      feeDisclosed: true,
      vault_symbol: vault.vault_symbol,
      strategy: vault.strategy,
      created_at: vault.created_at,
      hasData, // Add flag to indicate if vault has performance data
    };
  });
}

// Generate realistic NAV history based on days since creation
function generateNavHistory(days: number): number[] {
  const points = Math.min(days, 30); // Max 30 data points
  const history: number[] = [1.00];
  
  for (let i = 1; i <= points; i++) {
    const lastNav = history[i - 1];
    // Small random changes each day (-0.5% to +0.5%)
    const change = (Math.random() - 0.5) * 0.01;
    const newNav = Number((lastNav * (1 + change)).toFixed(4));
    history.push(newNav);
  }
  
  return history;
}

export async function clearDemoVaults(): Promise<void> {
  await saveVaults([]);
  vaultIdCounter = 1000;
  console.log('🗑️ Cleared all demo vaults');
}