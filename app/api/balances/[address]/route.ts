import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/balances/[address]
 * Fetches user balances (ETH + ERC-20 tokens like USDC) using CDP Data API
 * Falls back to direct blockchain reads if CDP API key not available
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;

  if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
    return NextResponse.json(
      { error: 'Invalid address format' },
      { status: 400 }
    );
  }

  const cdpApiKey = process.env.CDP_DATA_API_KEY || process.env.NEXT_PUBLIC_CDP_API_KEY;

  // Option A: Use CDP Data API (fast, indexed)
  if (cdpApiKey) {
    try {
      const url = `https://api.cdp.coinbase.com/v1/data/balances/${address}?chain=base-mainnet`;

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'x-cdp-api-key': cdpApiKey,
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        console.error('CDP API error:', response.status, response.statusText);
        throw new Error(`CDP API failed: ${response.status}`);
      }

      const data = await response.json();
      
      return NextResponse.json({
        success: true,
        source: 'cdp',
        balances: data?.data?.balances || [],
      });
    } catch (error) {
      console.error('Error fetching from CDP API:', error);
      // Fall through to Option B
    }
  }

  // Option B: Direct blockchain reads using viem
  try {
    const { createPublicClient, http, formatUnits } = await import('viem');
    const { base } = await import('viem/chains');

    const client = createPublicClient({
      chain: base,
      transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'),
    });

    // Get ETH balance
    const ethBalance = await client.getBalance({
      address: address as `0x${string}`,
    });

    // Get USDC balance (native USDC on Base)
    const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
    const ERC20_ABI = [
      {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ type: 'uint256' }],
      },
    ] as const;

    const usdcBalance = await client.readContract({
      address: USDC_ADDRESS as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
    });

    const balances = [
      {
        symbol: 'ETH',
        decimals: 18,
        amount: ethBalance.toString(),
        contractAddress: null,
      },
      {
        symbol: 'USDC',
        decimals: 6,
        amount: usdcBalance.toString(),
        contractAddress: USDC_ADDRESS,
      },
    ];

    return NextResponse.json({
      success: true,
      source: 'rpc',
      balances,
    });
  } catch (error) {
    console.error('Error fetching balances from blockchain:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch balances',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}