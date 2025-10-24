'use client';

import { useEffect, useState } from 'react';

interface Balance {
  symbol: string;
  contractAddress?: string | null;
  decimals: number;
  amount: string;
}

interface BalancesResponse {
  success: boolean;
  source: 'cdp' | 'rpc';
  balances: Balance[];
}

interface UserBalancesProps {
  address: string;
}

export default function UserBalances({ address }: UserBalancesProps) {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;

    const fetchBalances = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/balances/${address}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch balances');
        }

        const data: BalancesResponse = await response.json();
        
        if (data.success && data.balances) {
          setBalances(data.balances);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load balances');
        console.error('Balance fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBalances();
  }, [address]);

  const formatBalance = (balance: Balance): string => {
    const amount = Number(balance.amount) / Math.pow(10, balance.decimals);
    return amount.toFixed(balance.decimals === 6 ? 2 : 4);
  };

  if (loading) {
    return (
      <div className="balances-container">
        <h2 className="balances-title">Your Balances</h2>
        <div className="loading">Loading balances...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="balances-container">
        <h2 className="balances-title">Your Balances</h2>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="balances-container">
      <h2 className="balances-title">Your Balances</h2>
      <div className="balances-list">
        {balances.map((balance, index) => (
          <div key={index} className="balance-item">
            <span className="balance-symbol">{balance.symbol}</span>
            <span className="balance-amount">{formatBalance(balance)}</span>
          </div>
        ))}
      </div>
      <style jsx>{`
        .balances-container {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
        }
        .balances-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #fff;
        }
        .balances-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .balance-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .balance-symbol {
          font-weight: 600;
          color: #fff;
          font-size: 16px;
        }
        .balance-amount {
          font-family: monospace;
          font-size: 16px;
          color: #4ade80;
        }
        .loading, .error-message {
          padding: 16px;
          text-align: center;
          color: rgba(255, 255, 255, 0.7);
        }
        .error-message {
          color: #ef4444;
        }
      `}</style>
    </div>
  );
}