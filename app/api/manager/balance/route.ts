import { NextRequest, NextResponse } from 'next/server';
import { updateManagerBalance, checkManagerEligibility } from '@/lib/database';
import { getUserUSDCBalance } from '@/lib/blockchain';
import { Address } from 'viem';

/**
 * POST /api/manager/balance
 * Update manager's USDC balance from blockchain
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    // Fetch current balance from blockchain
    const usdcBalance = await getUserUSDCBalance(walletAddress as Address);
    
    // Update in database
    updateManagerBalance(walletAddress.toLowerCase(), usdcBalance);

    // Check eligibility
    const eligibility = checkManagerEligibility(walletAddress.toLowerCase());

    return NextResponse.json({
      success: true,
      balance: usdcBalance,
      eligibility,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating manager balance:', error);
    return NextResponse.json(
      { error: 'Failed to update balance' },
      { status: 500 }
    );
  }
}