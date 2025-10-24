import { NextRequest, NextResponse } from 'next/server';
import { getUserUSDCBalance } from '@/lib/blockchain';
import { Address } from 'viem';

/**
 * GET /api/user/balance?address=0x...
 * Fetch user's USDC balance from Base chain
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const address = searchParams.get('address');

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

    const balance = await getUserUSDCBalance(address as Address);

    return NextResponse.json({
      success: true,
      address,
      balance,
      currency: 'USDC',
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error fetching user balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}

