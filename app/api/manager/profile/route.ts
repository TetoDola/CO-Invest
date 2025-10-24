import { NextRequest, NextResponse } from 'next/server';
import { 
  getOrCreateManager, 
  updateManagerBalance,
  checkManagerEligibility 
} from '@/lib/database';
import { getUserUSDCBalance } from '@/lib/blockchain';
import { Address } from 'viem';

/**
 * GET /api/manager/profile?address=0x...
 * Get manager profile and check eligibility
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const address = searchParams.get('address') as Address | null;

    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    // Check eligibility (pulls from database)
    const eligibility = checkManagerEligibility(address.toLowerCase());

    return NextResponse.json({
      success: true,
      eligibility,
    });
  } catch (error) {
    console.error('Error fetching manager profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch manager profile' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/manager/profile
 * Create or update manager profile
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress, fid, username, displayName } = body;

    if (!walletAddress || !fid) {
      return NextResponse.json(
        { error: 'Wallet address and FID required' },
        { status: 400 }
      );
    }

    // Get or create manager
    const manager = getOrCreateManager(
      walletAddress.toLowerCase(),
      fid,
      username,
      displayName
    );

    // Fetch current USDC balance from blockchain
    try {
      const usdcBalance = await getUserUSDCBalance(walletAddress as Address);
      updateManagerBalance(walletAddress.toLowerCase(), usdcBalance);
    } catch (error) {
      console.error('Error fetching USDC balance:', error);
      // Continue anyway, balance will be checked again during vault creation
    }

    // Check eligibility
    const eligibility = checkManagerEligibility(walletAddress.toLowerCase());

    return NextResponse.json({
      success: true,
      manager: {
        ...manager,
        eligibility,
      },
    });
  } catch (error) {
    console.error('Error creating/updating manager profile:', error);
    return NextResponse.json(
      { error: 'Failed to create/update manager profile' },
      { status: 500 }
    );
  }
}