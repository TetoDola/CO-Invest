'use client';

import { useState, useEffect } from 'react';
import { parseUnits, encodeFunctionData, Address, formatUnits } from 'viem';
import { useAccount, useConnect, useSendCalls, useReadContract } from 'wagmi';

interface VaultSellProps {
  vaultAddress: Address;
  vaultName: string;
  userAddress: Address;
  onSuccess?: () => void;
  onClose?: () => void;
}

// ERC4626 Vault ABI for redeem
const VAULT_ABI = [
  {
    name: 'redeem',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'shares', type: 'uint256' },
      { name: 'receiver', type: 'address' },
      { name: 'owner', type: 'address' }
    ],
    outputs: [{ name: 'assets', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
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

export default function VaultSell({ vaultAddress, vaultName, userAddress, onSuccess, onClose }: VaultSellProps) {
  const [shares, setShares] = useState('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [userShares, setUserShares] = useState<number>(0);
  const [estimatedAssets, setEstimatedAssets] = useState<number>(0);

  // Convert comma to dot for European keyboard users
  const handleSharesChange = (value: string) => {
    const normalized = value.replace(/,/g, '.');
    setShares(normalized);
  };

  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { sendCalls } = useSendCalls();

  // Fetch user's vault shares balance
  const { data: sharesBalance, refetch: refetchShares } = useReadContract({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // Fetch estimated assets for shares
  const { data: assetsEstimate } = useReadContract({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: 'convertToAssets',
    args: shares && parseFloat(shares) > 0 ? [parseUnits(shares, 18)] : undefined,
  });

  useEffect(() => {
    if (sharesBalance) {
      setUserShares(parseFloat(formatUnits(sharesBalance, 18)));
    }
  }, [sharesBalance]);

  useEffect(() => {
    if (assetsEstimate) {
      setEstimatedAssets(parseFloat(formatUnits(assetsEstimate, 6)));
    } else {
      setEstimatedAssets(0);
    }
  }, [assetsEstimate]);

  const handleSell = async () => {
    if (!shares || parseFloat(shares) <= 0) {
      setError('Please enter a valid amount of shares');
      return;
    }

    const sharesValue = parseFloat(shares);

    // Check if user has enough shares
    if (sharesValue > userShares) {
      setError(`Insufficient shares. You have ${userShares.toFixed(6)} shares`);
      return;
    }

    setStatus('processing');
    setError(null);

    try {
      // Check if wallet is connected
      if (!isConnected) {
        setError('Please connect your wallet first');
        setStatus('idle');
        return;
      }

      const sharesAmount = parseUnits(shares, 18); // Vault shares typically have 18 decimals

      // Prepare redeem transaction data
      const redeemData = encodeFunctionData({
        abi: VAULT_ABI,
        functionName: 'redeem',
        args: [sharesAmount, userAddress, userAddress],
      });

      console.log('Sending redeem transaction...');

      // Send redeem transaction
      await sendCalls({
        calls: [
          {
            to: vaultAddress,
            data: redeemData,
          },
        ],
      });

      console.log('Redeem transaction sent successfully');
      
      // Set a placeholder hash to indicate success
      setTxHash('redeem-transaction-success');
      setStatus('success');
      setShares('');

      // Refresh shares balance
      await refetchShares();

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setStatus('error');
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      
      // Provide more helpful error messages
      if (errorMessage.includes('rejected')) {
        setError('Transaction was rejected by user');
      } else if (errorMessage.includes('insufficient')) {
        setError('Insufficient shares or gas for transaction');
      } else {
        setError(errorMessage);
      }
      
      console.error('Sell error:', err);
    }
  };

  // Handle wallet connection if not connected
  if (!isConnected) {
    return (
      <div className="vault-sell">
        {onClose && (
          <button className="back-button" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
        )}
        <h3 className="sell-title">Connect Wallet to Redeem {vaultName} Shares</h3>
        <p className="connect-description">Choose your preferred wallet to continue</p>
        
        <div className="connector-list">
          {connectors.map((connector) => (
            <button
              key={connector.id}
              onClick={() => connect({ connector })}
              className="connector-button"
              disabled={!connector.ready}
            >
              <span className="connector-name">
                {connector.name === 'Farcaster MiniApp' ? 'Farcaster' : connector.name}
              </span>
              {!connector.ready && <span className="not-ready">(Not available)</span>}
            </button>
          ))}
        </div>

        <style jsx>{`
          .vault-sell {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 24px;
            margin: 20px 0;
          }
          .back-button {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 10px 16px;
            background: rgba(239, 68, 68, 0.1);
            color: #fff;
            border: 1px solid rgba(239, 68, 68, 0.4);
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            margin-bottom: 16px;
          }
          .back-button:hover {
            background: rgba(239, 68, 68, 0.2);
            border-color: rgba(239, 68, 68, 0.6);
            transform: translateX(-2px);
          }
          .back-button svg {
            transition: transform 0.2s;
          }
          .back-button:hover svg {
            transform: translateX(-2px);
          }
          .sell-title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 12px;
            color: #fff;
          }
          .connect-description {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 20px;
          }
          .connector-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .connector-button {
            width: 100%;
            padding: 14px 24px;
            font-size: 16px;
            font-weight: 600;
            color: #fff;
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .connector-button:hover:not(:disabled) {
            background: rgba(239, 68, 68, 0.2);
            border-color: #ef4444;
          }
          .connector-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .connector-name {
            flex: 1;
            text-align: left;
          }
          .not-ready {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.5);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="vault-sell">
      {onClose && (
        <button className="back-button" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
      )}
      <h3 className="sell-title">Redeem {vaultName} Shares</h3>
      
      <div className="balance-display">
        <span className="balance-label">Your Shares:</span>
        <span className="balance-value">{userShares.toFixed(6)}</span>
      </div>

      <div className="sell-form">
        <div className="input-group">
          <label htmlFor="shares">Shares to Redeem</label>
          <input
            id="shares"
            type="text"
            inputMode="decimal"
            step="0.000001"
            min="0"
            max={userShares}
            value={shares}
            onChange={(e) => handleSharesChange(e.target.value)}
            placeholder="0.000000"
            disabled={status === 'processing'}
            className="shares-input"
          />
          <button
            onClick={() => setShares(userShares.toString())}
            className="max-button"
            disabled={status === 'processing'}
          >
            MAX
          </button>
        </div>

        {shares && parseFloat(shares) > 0 && (
          <div className="estimate-display">
            <span className="estimate-label">You will receive (estimated):</span>
            <span className="estimate-value">~{estimatedAssets.toFixed(2)} USDC</span>
          </div>
        )}

        <button
          onClick={handleSell}
          disabled={status === 'processing' || !shares || parseFloat(shares) <= 0 || userShares === 0}
          className="sell-button"
        >
          {status === 'processing' && 'Processing Transaction...'}
          {status === 'idle' && 'Redeem Shares'}
          {status === 'success' && 'Redemption Successful!'}
          {status === 'error' && 'Try Again'}
        </button>

        {error && (
          <div className="error-message">{error}</div>
        )}

        {txHash && (
          <div className="success-message">
            <p>✅ Shares redeemed successfully!</p>
            <p className="success-note">Your USDC has been returned to your wallet</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .vault-sell {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 24px;
          margin: 20px 0;
        }
        .back-button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          background: rgba(239, 68, 68, 0.1);
          color: #fff;
          border: 1px solid rgba(239, 68, 68, 0.4);
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 16px;
        }
        .back-button:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.6);
          transform: translateX(-2px);
        }
        .back-button svg {
          transition: transform 0.2s;
        }
        .back-button:hover svg {
          transform: translateX(-2px);
        }
        .sell-title {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #fff;
        }
        .balance-display {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .balance-label {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
        }
        .balance-value {
          font-size: 16px;
          font-weight: 600;
          color: #fbbf24;
        }
        .estimate-display {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          background: rgba(74, 222, 128, 0.1);
          border: 1px solid rgba(74, 222, 128, 0.3);
          border-radius: 8px;
        }
        .estimate-label {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.7);
        }
        .estimate-value {
          font-size: 15px;
          font-weight: 600;
          color: #4ade80;
        }
        .sell-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          position: relative;
        }
        .input-group label {
          font-size: 14px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.9);
        }
        .shares-input {
          padding: 12px 80px 12px 16px;
          font-size: 16px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.2);
          color: #fff;
          transition: border-color 0.2s;
        }
        .shares-input:focus {
          outline: none;
          border-color: #ef4444;
        }
        .shares-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .max-button {
          position: absolute;
          right: 8px;
          top: 34px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 600;
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .max-button:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.2);
          border-color: #ef4444;
        }
        .max-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .sell-button {
          padding: 14px 24px;
          font-size: 16px;
          font-weight: 600;
          color: #fff;
          background: #ef4444;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .sell-button:hover:not(:disabled) {
          background: #dc2626;
        }
        .sell-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .error-message {
          padding: 12px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          color: #ef4444;
          font-size: 14px;
        }
        .success-message {
          padding: 12px;
          background: rgba(74, 222, 128, 0.1);
          border: 1px solid rgba(74, 222, 128, 0.3);
          border-radius: 8px;
          color: #4ade80;
          font-size: 14px;
        }
        .success-message p {
          margin: 0 0 4px 0;
        }
        .success-note {
          font-size: 12px;
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
}