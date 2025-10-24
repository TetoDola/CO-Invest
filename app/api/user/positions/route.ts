import { NextRequest, NextResponse } from 'next/server';
import { getUserAllPositions } from '@/lib/blockchain';
import { Address } from 'viem';

/**
 * GET /api/user/positions?address=0x...&vaults=0x...,0x...
 * Fetch user's positions across all vaults
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const address = searchParams.get('address');
    const vaultsParam = searchParams.get('vaults');

    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      );
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address' },
        { status: 400 }
      );
    }

    // Parse vault addresses (comma-separated)
    const vaultAddresses = vaultsParam
      ? vaultsParam.split(',').filter(addr => /^0x[a-fA-F0-9]{40}$/.test(addr)) as Address[]
      : [];

    if (vaultAddresses.length === 0) {
      return NextResponse.json({
        success: true,
        address,
        positions: [],
        message: 'No vault addresses provided',
      });
    }

    const positions = await getUserAllPositions(address as Address, vaultAddresses);

    // Calculate total portfolio value
    const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0);

    return NextResponse.json({
      success: true,
      address,
      positions,
      totalValue,
      vaultCount: positions.length,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error fetching user positions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch positions' },
      { status: 500 }
    );
  }
}

