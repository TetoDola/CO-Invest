/**
 * Blockchain utilities for interacting with Base chain
 * Handles vault data fetching and transaction preparation
 */

import { createPublicClient, http, formatUnits, parseUnits, Address } from 'viem';
import { base } from 'viem/chains';

// Initialize Base public client
const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org')
});

// Contract ABIs (minimal - add full ABIs from your contracts)
const USDC_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ type: 'uint256' }],
  },
] as const;

const VAULT_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'totalAssets',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'convertToAssets',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'shares', type: 'uint256' }],
    outputs: [{ type: 'uint256' }],
  },
] as const;

// Contract addresses
const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913') as Address;

// Types
export interface VaultData {
  id: string;
  address: Address;
  name: string;
  manager: string;
  managerAddress: Address;
  tvl: number;
  performance7d: number;
  performance30d: number;
  exitFee: number;
  lockupDays: number;
  nav: number;
  totalSupply: number;
  totalAssets: number;
}

export interface UserVaultPosition {
  vaultAddress: Address;
  shares: number;
  value: number;
  locked: boolean;
  unlockDate?: Date;
}

/**
 * Fetch user's USDC balance
 */
export async function getUserUSDCBalance(userAddress: Address): Promise<number> {
  try {
    const balance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'balanceOf',
      args: [userAddress],
    });

    // USDC has 6 decimals
    return parseFloat(formatUnits(balance, 6));
  } catch (error) {
    console.error('Error fetching USDC balance:', error);
    return 0;
  }
}

/**
 * Fetch vault data from blockchain
 */
export async function getVaultData(vaultAddress: Address): Promise<Partial<VaultData>> {
  try {
    const [totalSupply, totalAssets] = await Promise.all([
      publicClient.readContract({
        address: vaultAddress,
        abi: VAULT_ABI,
        functionName: 'totalSupply',
      }),
      publicClient.readContract({
        address: vaultAddress,
        abi: VAULT_ABI,
        functionName: 'totalAssets',
      }),
    ]);

    const tvl = parseFloat(formatUnits(totalAssets, 6)); // USDC has 6 decimals
    const supply = parseFloat(formatUnits(totalSupply, 18)); // Shares have 18 decimals
    const nav = supply > 0 ? tvl / supply : 1.0;

    return {
      address: vaultAddress,
      tvl,
      totalSupply: supply,
      totalAssets: tvl,
      nav,
    };
  } catch (error) {
    console.error('Error fetching vault data:', error);
    return {
      address: vaultAddress,
      tvl: 0,
      nav: 1.0,
    };
  }
}

/**
 * Fetch user's position in a specific vault
 */
export async function getUserVaultPosition(
  userAddress: Address,
  vaultAddress: Address
): Promise<UserVaultPosition | null> {
  try {
    const shares = await publicClient.readContract({
      address: vaultAddress,
      abi: VAULT_ABI,
      functionName: 'balanceOf',
      args: [userAddress],
    });

    if (shares === BigInt(0)) {
      return null;
    }

    const sharesDecimal = parseFloat(formatUnits(shares, 18));

    // Get current value of shares
    const assets = await publicClient.readContract({
      address: vaultAddress,
      abi: VAULT_ABI,
      functionName: 'convertToAssets',
      args: [shares],
    });

    const value = parseFloat(formatUnits(assets, 6));

    return {
      vaultAddress,
      shares: sharesDecimal,
      value,
      locked: false, // TODO: Fetch from lockup contract
    };
  } catch (error) {
    console.error('Error fetching user vault position:', error);
    return null;
  }
}

/**
 * Fetch all user's vault positions
 */
export async function getUserAllPositions(
  userAddress: Address,
  vaultAddresses: Address[]
): Promise<UserVaultPosition[]> {
  try {
    const positions = await Promise.all(
      vaultAddresses.map(vaultAddress => 
        getUserVaultPosition(userAddress, vaultAddress)
      )
    );

    return positions.filter((p): p is UserVaultPosition => p !== null && p.shares > 0);
  } catch (error) {
    console.error('Error fetching user positions:', error);
    return [];
  }
}

/**
 * Encode deposit transaction data
 */
export function encodeDepositData(amount: bigint): `0x${string}` {
  // ERC4626 deposit function: deposit(uint256 assets, address receiver)
  // This is a placeholder - adjust based on your actual vault contract
  const functionSelector = '0x6e553f65'; // deposit(uint256,address)
  
  // In practice, use viem's encodeFunctionData
  return functionSelector as `0x${string}`;
}

/**
 * Encode withdraw transaction data
 */
export function encodeWithdrawData(shares: bigint): `0x${string}` {
  // ERC4626 redeem function: redeem(uint256 shares, address receiver, address owner)
  const functionSelector = '0xba087652'; // redeem(uint256,address,address)
  
  return functionSelector as `0x${string}`;
}

/**
 * Get transaction parameters for buying vault shares
 */
export async function prepareBuyTransaction(
  vaultAddress: Address,
  amountUSDC: number
) {
  const amount = parseUnits(amountUSDC.toString(), 6); // USDC has 6 decimals

  return {
    to: vaultAddress,
    value: BigInt(0),
    data: encodeDepositData(amount),
  };
}

/**
 * Get transaction parameters for selling vault shares
 */
export async function prepareSellTransaction(
  vaultAddress: Address,
  shares: number
) {
  const sharesAmount = parseUnits(shares.toString(), 18); // Shares have 18 decimals

  return {
    to: vaultAddress,
    value: BigInt(0),
    data: encodeWithdrawData(sharesAmount),
  };
}

/**
 * Check if user has approved USDC spending
 */
export async function checkUSDCAllowance(
  userAddress: Address,
  spenderAddress: Address
): Promise<number> {
  try {
    const allowance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'allowance',
      args: [userAddress, spenderAddress],
    });

    return parseFloat(formatUnits(allowance, 6));
  } catch (error) {
    console.error('Error checking USDC allowance:', error);
    return 0;
  }
}

export default publicClient;

