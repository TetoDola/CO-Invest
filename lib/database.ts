/**
 * Simple JSON-based database for manager profiles
 * Serverless-friendly, no native dependencies required
 */

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const MANAGERS_FILE = path.join(DATA_DIR, 'managers.json');
const VAULTS_FILE = path.join(DATA_DIR, 'vaults.json');
const BALANCE_HISTORY_FILE = path.join(DATA_DIR, 'balance_history.json');

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Read JSON file
function readJSON<T>(filePath: string, defaultValue: T): T {
  ensureDataDir();
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
  }
  return defaultValue;
}

// Write JSON file
function writeJSON<T>(filePath: string, data: T): void {
  ensureDataDir();
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
  }
}

export interface ManagerProfile {
  id: number;
  wallet_address: string;
  fid: number;
  username?: string;
  display_name?: string;
  created_at: string;
  updated_at: string;
  is_verified: boolean;
  total_vaults_created: number;
  usdc_balance: number;
  last_balance_check: string;
}

export interface ManagerVault {
  id: number;
  manager_address: string;
  vault_address: string;
  vault_name: string;
  vault_symbol: string;
  safety_deposit_amount: number;
  lock_until: string;
  is_withdrawn: boolean;
  created_at: string;
}

export interface BalanceHistory {
  id: number;
  wallet_address: string;
  usdc_balance: number;
  checked_at: string;
}

interface DatabaseStore {
  managers: ManagerProfile[];
  vaults: ManagerVault[];
  balanceHistory: BalanceHistory[];
  nextId: {
    manager: number;
    vault: number;
    balance: number;
  };
}

// Initialize empty database structure
const emptyStore: DatabaseStore = {
  managers: [],
  vaults: [],
  balanceHistory: [],
  nextId: {
    manager: 1,
    vault: 1,
    balance: 1,
  },
};

/**
 * Initialize database (creates files if needed)
 */
export function initializeDatabase() {
  ensureDataDir();
  
  // Initialize managers file
  if (!fs.existsSync(MANAGERS_FILE)) {
    writeJSON(MANAGERS_FILE, []);
  }
  
  // Initialize vaults file
  if (!fs.existsSync(VAULTS_FILE)) {
    writeJSON(VAULTS_FILE, []);
  }
  
  // Initialize balance history file
  if (!fs.existsSync(BALANCE_HISTORY_FILE)) {
    writeJSON(BALANCE_HISTORY_FILE, []);
  }
  
  console.log('✅ Database initialized');
}

/**
 * Get or create manager profile
 */
export function getOrCreateManager(
  walletAddress: string,
  fid: number,
  username?: string,
  displayName?: string
): ManagerProfile {
  const managers = readJSON<ManagerProfile[]>(MANAGERS_FILE, []);
  const existing = managers.find(m => m.wallet_address === walletAddress.toLowerCase());

  if (existing) {
    // Update username/display name if provided
    if (username || displayName) {
      existing.username = username || existing.username;
      existing.display_name = displayName || existing.display_name;
      existing.updated_at = new Date().toISOString();
      writeJSON(MANAGERS_FILE, managers);
    }
    return existing;
  }

  // Create new manager
  const newManager: ManagerProfile = {
    id: managers.length > 0 ? Math.max(...managers.map(m => m.id)) + 1 : 1,
    wallet_address: walletAddress.toLowerCase(),
    fid,
    username,
    display_name: displayName,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_verified: false,
    total_vaults_created: 0,
    usdc_balance: 0,
    last_balance_check: new Date().toISOString(),
  };

  managers.push(newManager);
  writeJSON(MANAGERS_FILE, managers);
  
  return newManager;
}

/**
 * Update manager's USDC balance
 */
export function updateManagerBalance(
  walletAddress: string,
  usdcBalance: number
): void {
  const managers = readJSON<ManagerProfile[]>(MANAGERS_FILE, []);
  const manager = managers.find(m => m.wallet_address === walletAddress.toLowerCase());

  if (manager) {
    manager.usdc_balance = usdcBalance;
    manager.last_balance_check = new Date().toISOString();
    manager.updated_at = new Date().toISOString();
    writeJSON(MANAGERS_FILE, managers);
  }

  // Record in balance history
  const history = readJSON<BalanceHistory[]>(BALANCE_HISTORY_FILE, []);
  const newEntry: BalanceHistory = {
    id: history.length > 0 ? Math.max(...history.map(h => h.id)) + 1 : 1,
    wallet_address: walletAddress.toLowerCase(),
    usdc_balance: usdcBalance,
    checked_at: new Date().toISOString(),
  };
  
  history.push(newEntry);
  // Keep only last 100 entries per wallet to prevent unlimited growth
  const walletHistory = history.filter(h => h.wallet_address === walletAddress.toLowerCase());
  if (walletHistory.length > 100) {
    const toKeep = history.filter(h => h.wallet_address !== walletAddress.toLowerCase());
    toKeep.push(...walletHistory.slice(-100));
    writeJSON(BALANCE_HISTORY_FILE, toKeep);
  } else {
    writeJSON(BALANCE_HISTORY_FILE, history);
  }
}

/**
 * Check if manager meets minimum balance requirement
 */
export function checkManagerEligibility(
  walletAddress: string,
  minBalance: number = 500
): {
  isEligible: boolean;
  currentBalance: number;
  lastChecked: string;
} {
  const managers = readJSON<ManagerProfile[]>(MANAGERS_FILE, []);
  const manager = managers.find(m => m.wallet_address === walletAddress.toLowerCase());

  if (!manager) {
    return {
      isEligible: false,
      currentBalance: 0,
      lastChecked: new Date().toISOString(),
    };
  }

  return {
    isEligible: manager.usdc_balance >= minBalance,
    currentBalance: manager.usdc_balance,
    lastChecked: manager.last_balance_check,
  };
}

/**
 * Register a new vault for a manager
 */
export function registerManagerVault(
  managerAddress: string,
  vaultAddress: string,
  vaultName: string,
  vaultSymbol: string,
  safetyDepositAmount: number,
  lockDays: number = 90
): ManagerVault {
  const vaults = readJSON<ManagerVault[]>(VAULTS_FILE, []);
  
  // Check if vault already exists
  if (vaults.some(v => v.vault_address === vaultAddress.toLowerCase())) {
    throw new Error('Vault address already registered');
  }

  const lockUntil = new Date();
  lockUntil.setDate(lockUntil.getDate() + lockDays);

  const newVault: ManagerVault = {
    id: vaults.length > 0 ? Math.max(...vaults.map(v => v.id)) + 1 : 1,
    manager_address: managerAddress.toLowerCase(),
    vault_address: vaultAddress.toLowerCase(),
    vault_name: vaultName,
    vault_symbol: vaultSymbol,
    safety_deposit_amount: safetyDepositAmount,
    lock_until: lockUntil.toISOString(),
    is_withdrawn: false,
    created_at: new Date().toISOString(),
  };

  vaults.push(newVault);
  writeJSON(VAULTS_FILE, vaults);

  // Increment vault count for manager
  const managers = readJSON<ManagerProfile[]>(MANAGERS_FILE, []);
  const manager = managers.find(m => m.wallet_address === managerAddress.toLowerCase());
  if (manager) {
    manager.total_vaults_created++;
    manager.updated_at = new Date().toISOString();
    writeJSON(MANAGERS_FILE, managers);
  }

  return newVault;
}

/**
 * Get manager's vaults
 */
export function getManagerVaults(managerAddress: string): ManagerVault[] {
  const vaults = readJSON<ManagerVault[]>(VAULTS_FILE, []);
  return vaults
    .filter(v => v.manager_address === managerAddress.toLowerCase())
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/**
 * Get vault by address
 */
export function getVaultByAddress(vaultAddress: string): ManagerVault | undefined {
  const vaults = readJSON<ManagerVault[]>(VAULTS_FILE, []);
  return vaults.find(v => v.vault_address === vaultAddress.toLowerCase());
}

/**
 * Check if safety deposit can be withdrawn
 */
export function canWithdrawSafetyDeposit(vaultAddress: string): boolean {
  const vault = getVaultByAddress(vaultAddress);
  if (!vault) return false;

  const now = new Date();
  const lockUntil = new Date(vault.lock_until);

  return now >= lockUntil && !vault.is_withdrawn;
}

/**
 * Mark safety deposit as withdrawn
 */
export function markSafetyDepositWithdrawn(vaultAddress: string): void {
  const vaults = readJSON<ManagerVault[]>(VAULTS_FILE, []);
  const vault = vaults.find(v => v.vault_address === vaultAddress.toLowerCase());
  
  if (vault) {
    vault.is_withdrawn = true;
    writeJSON(VAULTS_FILE, vaults);
  }
}

/**
 * Get manager stats
 */
export function getManagerStats(walletAddress: string): {
  totalVaults: number;
  activeVaults: number;
  totalSafetyDeposits: number;
  lockedDeposits: number;
  availableWithdrawals: number;
} {
  const vaults = getManagerVaults(walletAddress);
  const now = new Date();

  const activeVaults = vaults.filter(v => !v.is_withdrawn).length;
  const totalSafetyDeposits = vaults.reduce((sum, v) => sum + v.safety_deposit_amount, 0);
  const lockedDeposits = vaults.filter(v => {
    const lockUntil = new Date(v.lock_until);
    return now < lockUntil && !v.is_withdrawn;
  }).length;
  const availableWithdrawals = vaults.filter(v => {
    const lockUntil = new Date(v.lock_until);
    return now >= lockUntil && !v.is_withdrawn;
  }).length;

  return {
    totalVaults: vaults.length,
    activeVaults,
    totalSafetyDeposits,
    lockedDeposits,
    availableWithdrawals,
  };
}

/**
 * Get all managers
 */
export function getAllManagers(): ManagerProfile[] {
  const managers = readJSON<ManagerProfile[]>(MANAGERS_FILE, []);
  return managers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/**
 * Get balance history for a wallet
 */
export function getBalanceHistory(
  walletAddress: string,
  limit: number = 30
): BalanceHistory[] {
  const history = readJSON<BalanceHistory[]>(BALANCE_HISTORY_FILE, []);
  return history
    .filter(h => h.wallet_address === walletAddress.toLowerCase())
    .sort((a, b) => new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime())
    .slice(0, limit);
}

// Auto-initialize on first import
initializeDatabase();