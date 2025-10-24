import { NextRequest, NextResponse } from 'next/server';
import {
  registerManagerVault,
  getManagerVaults,
  getManagerStats,
  canWithdrawSafetyDeposit
} from '@/lib/database';
import { getAllDemoVaults, getVaultsByFid } from '../../vaults/demo-store';

/**
 * GET /api/manager/vaults?address=0x...
 * Get manager's vaults and stats
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const address = searchParams.get('address');
    const fid = searchParams.get('fid');

    if (!address && !fid) {
      return NextResponse.json(
        { error: 'Wallet address or FID required' },
        { status: 400 }
      );
    }

    // Get manager's vaults from database (if address provided)
    const dbVaults = address ? getManagerVaults(address.toLowerCase()) : [];
    
    // Get demo vaults created by this manager (filter by FID or address)
    let filteredDemoVaults: any[] = [];
    
    if (fid) {
      // Use dedicated FID lookup function for better performance
      const rawVaults = await getVaultsByFid(parseInt(fid));
      const allDemoVaults = await getAllDemoVaults();
      filteredDemoVaults = allDemoVaults.filter((v: any) =>
        rawVaults.some(rv => rv.vault_address === v.address)
      );
      console.log(`📊 Loaded ${filteredDemoVaults.length} vaults for FID ${fid}`);
    } else if (address) {
      // Fallback to address-based filtering
      const allDemoVaults = await getAllDemoVaults();
      filteredDemoVaults = allDemoVaults.filter((v: any) =>
        v.managerAddress?.toLowerCase() === address?.toLowerCase()
      );
    }
    
    const demoVaults = filteredDemoVaults
      .map((v: any) => ({
        id: v.id,
        vault_address: v.address,
        vault_name: v.name,
        vault_symbol: v.vault_symbol || v.name.substring(0, 4).toUpperCase(),
        safety_deposit_amount: 0, // Demo vaults have no deposit
        lock_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        is_withdrawn: false,
        created_at: v.created_at || new Date().toISOString(),
        canWithdraw: false,
        daysUntilUnlock: 90,
      }));
    
    // Combine database and demo vaults
    const allVaults = [...dbVaults, ...demoVaults];
    
    // Add withdrawal status to database vaults
    const dbVaultsWithStatus = dbVaults.map(vault => ({
      ...vault,
      canWithdraw: canWithdrawSafetyDeposit(vault.vault_address),
      daysUntilUnlock: Math.max(
        0,
        Math.ceil(
          (new Date(vault.lock_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      ),
    }));
    
    // Combine all vaults with status
    const vaultsWithStatus = [...dbVaultsWithStatus, ...demoVaults];
    
    // Get manager stats (update to include demo vaults)
    const stats = {
      totalVaults: vaultsWithStatus.length,
      activeVaults: vaultsWithStatus.filter((v: any) => !v.is_withdrawn).length,
      totalSafetyDeposits: vaultsWithStatus.reduce((sum: number, v: any) => sum + (v.safety_deposit_amount || 0), 0),
      lockedDeposits: vaultsWithStatus.filter((v: any) => !v.canWithdraw && !v.is_withdrawn).length,
      availableWithdrawals: vaultsWithStatus.filter((v: any) => v.canWithdraw && !v.is_withdrawn).length,
    };

    return NextResponse.json({
      success: true,
      vaults: vaultsWithStatus,
      stats,
    });
  } catch (error) {
    console.error('Error fetching manager vaults:', error);
    return NextResponse.json(
      { error: 'Failed to fetch manager vaults' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/manager/vaults
 * Register a new vault for a manager
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      managerAddress, 
      vaultAddress, 
      vaultName, 
      vaultSymbol, 
      safetyDepositAmount 
    } = body;

    if (!managerAddress || !vaultAddress || !vaultName || !vaultSymbol || !safetyDepositAmount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate safety deposit amount (min 200 USDC)
    if (safetyDepositAmount < 200) {
      return NextResponse.json(
        { error: 'Safety deposit must be at least 200 USDC' },
        { status: 400 }
      );
    }

    // Register vault in database
    const vault = registerManagerVault(
      managerAddress.toLowerCase(),
      vaultAddress.toLowerCase(),
      vaultName,
      vaultSymbol,
      safetyDepositAmount
    );

    return NextResponse.json({
      success: true,
      vault,
    });
  } catch (error: any) {
    console.error('Error registering vault:', error);
    
    // Handle duplicate vault address
    if (error.message?.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: 'Vault address already registered' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to register vault' },
      { status: 500 }
    );
  }
}