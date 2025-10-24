import { NextRequest, NextResponse } from 'next/server';
import { getVaultData } from '@/lib/blockchain';
import { Address } from 'viem';
import fs from 'fs';
import path from 'path';
import { addDemoVault, getAllDemoVaults } from './demo-store';

/**
 * GET /api/vaults?addresses=0x...,0x...
 * Fetch vault data from blockchain
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const addressesParam = searchParams.get('addresses');

    if (!addressesParam) {
      // Return demo vaults + mock vaults
      const demoVaults = await getAllDemoVaults();
      const mockVaults = getMockVaults();
      
      return NextResponse.json({
        success: true,
        vaults: [...demoVaults, ...mockVaults],
        source: 'demo',
      });
    }

    // Parse vault addresses (comma-separated)
    const vaultAddresses = addressesParam
      .split(',')
      .filter(addr => /^0x[a-fA-F0-9]{40}$/.test(addr)) as Address[];

    if (vaultAddresses.length === 0) {
      return NextResponse.json(
        { error: 'No valid vault addresses provided' },
        { status: 400 }
      );
    }

    // Fetch vault data from blockchain
    const vaultsData = await Promise.all(
      vaultAddresses.map(address => getVaultData(address))
    );

    return NextResponse.json({
      success: true,
      vaults: vaultsData,
      source: 'blockchain',
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error fetching vaults:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vault data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vaults
 * Save a new vault to the database
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vaultName, vaultSymbol, managerAddress, managerFid, strategy, txHash } = body;

    // Validate required fields (vaultAddress no longer required - will be generated)
    if (!vaultName || !vaultSymbol || !managerFid) {
      return NextResponse.json(
        { error: 'Missing required fields: vaultName, vaultSymbol, managerFid' },
        { status: 400 }
      );
    }

    // Create new vault record (address will be auto-generated)
    const newVault = {
      vault_name: vaultName,
      vault_symbol: vaultSymbol,
      manager_address: managerAddress || '', // Optional, can be empty
      manager_fid: managerFid, // Required - used for FID-based vault tracking
      strategy: strategy || '',
      total_value_locked: '0',
      share_price: '1.0',
      created_at: new Date().toISOString(),
      tx_hash: txHash || '',
    };

    // Add to persistent store (address generated automatically)
    const savedVault = await addDemoVault(newVault);

    console.log(`✅ Vault created for FID ${managerFid}: ${savedVault.vault_address}`);

    return NextResponse.json({
      success: true,
      vault: savedVault,
      message: 'Vault created with auto-generated address'
    });
    
  } catch (error) {
    console.error('Error saving vault:', error);
    return NextResponse.json(
      { error: 'Failed to save vault' },
      { status: 500 }
    );
  }
}

// Mock vaults for development (before contracts are deployed)
function getMockVaults() {
  return [
    {
      id: 1,
      address: '0x0000000000000000000000000000000000000001',
      name: "Start Fund",
      manager: "whale.eth",
      managerAddress: "0xb8cEDA3103Ed470b9a3A8A64323F4BCd36C61739",
      exitFee: 1.0,
      tvl: 9200,
      performance7d: 3.4,
      performance30d: 12.8,
      lockupDays: 7,
      allocation: [
        { token: 'USDC', percentage: 62 },
        { token: 'wstETH', percentage: 38 }
      ],
      nav: 1.0234,
      navHistory: [1.00, 1.01, 1.005, 1.015, 1.02, 1.018, 1.0234],
      strategyDisclosed: true,
      feeDisclosed: true
    },
    {
      id: 2,
      address: '0x0000000000000000000000000000000000000002',
      name: "Blue Chip DeFi Vault",
      manager: "defi.pro",
      managerAddress: "0xb8cEDA3103Ed470b9a3A8A64323F4BCd36C61739",
      exitFee: 1.0,
      tvl: 15400,
      performance7d: 2.1,
      performance30d: 8.5,
      lockupDays: 7,
      allocation: [
        { token: 'WETH', percentage: 45 },
        { token: 'USDC', percentage: 35 },
        { token: 'wstETH', percentage: 20 }
      ],
      nav: 1.0156,
      navHistory: [1.00, 1.005, 1.008, 1.012, 1.014, 1.015, 1.0156],
      strategyDisclosed: true,
      feeDisclosed: true
    },
    {
      id: 3,
      address: '0x0000000000000000000000000000000000000003',
      name: "Stable Yields Max",
      manager: "yield.master",
      managerAddress: "0xb8cEDA3103Ed470b9a3A8A64323F4BCd36C61739",
      exitFee: 1.0,
      tvl: 28600,
      performance7d: 0.8,
      performance30d: 3.2,
      lockupDays: 7,
      allocation: [
        { token: 'USDC', percentage: 70 },
        { token: 'DAI', percentage: 30 }
      ],
      nav: 1.0087,
      navHistory: [1.00, 1.002, 1.004, 1.006, 1.007, 1.008, 1.0087],
      strategyDisclosed: true,
      feeDisclosed: true
    },
    {
      id: 4,
      address: '0x0000000000000000000000000000000000000004',
      name: "ETH Supremacy Fund",
      manager: "eth.bull",
      managerAddress: "0xb8cEDA3103Ed470b9a3A8A64323F4BCd36C61739",
      exitFee: 1.0,
      tvl: 6800,
      performance7d: -1.2,
      performance30d: 5.4,
      lockupDays: 7,
      allocation: [
        { token: 'WETH', percentage: 80 },
        { token: 'USDC', percentage: 20 }
      ],
      nav: 0.9912,
      navHistory: [1.00, 0.998, 0.995, 0.993, 0.990, 0.992, 0.9912],
      strategyDisclosed: true,
      feeDisclosed: true
    }
  ];
}

