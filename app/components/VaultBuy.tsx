'use client';

import { useState, useEffect } from 'react';
import { parseUnits, encodeFunctionData, Address, formatUnits } from 'viem';
import { useAccount, useConnect, useSendCalls, useReadContract } from 'wagmi';
import { getUserUSDCBalance } from '@/lib/blockchain';

interface VaultBuyProps {
  vaultAddress: Address;
  vaultName: string;
  userAddress: Address;
  onSuccess?: () => void;
  onClose?: () => void;
}

// ERC4626 Vault ABI for depositaa
const VAULT_ABI = [
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'assets', type: 'uint256' },
      { name: 'receiver', type: 'address' }
    ],
    outputs: [{ name: 'shares', type: 'uint256' }],
  },
] as const;

// USDC ABI for approve and balances sdf
const USDC_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
] as const;

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address;

export default function VaultBuy({ vaultAddress, vaultName, userAddress, onSuccess, onClose }: VaultBuyProps) {
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'processing' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<number>(0);

  // Convert comma to dot for European keyboard users
  const handleAmountChange = (value: string) => {
    const normalized = value.replace(/,/g, '.');
    setAmount(normalized);
  };

  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { sendCalls } = useSendCalls();

  // Fetch USDC balance
  const { data: usdcBalance, refetch: refetchBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  useEffect(() => {
    if (usdcBalance) {
      setUserBalance(parseFloat(formatUnits(usdcBalance, 6)));
    }
  }, [usdcBalance]);

  const handleBuy = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const amountValue = parseFloat(amount);

    // Check if user has enough balance
    if (amountValue > userBalance) {
      setError(`Insufficient balance. You have ${userBalance.toFixed(2)} USDC`);
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

      const amountInUSDC = parseUnits(amount, 6); // USDC has 6 decimals

      // Prepare approve transaction data
      const approveData = encodeFunctionData({
        abi: USDC_ABI,
        functionName: 'approve',
        args: [vaultAddress, amountInUSDC],
      });

      // Prepare deposit transaction data
      const depositData = encodeFunctionData({
        abi: VAULT_ABI,
        functionName: 'deposit',
        args: [amountInUSDC, userAddress],
      });

      console.log('Sending batch transaction (approve + deposit)...');

      // Use batch transactions (EIP-5792) - approve and deposit in one step
      await sendCalls({
        calls: [
          {
            to: USDC_ADDRESS,
            data: approveData,
          },
          {
            to: vaultAddress,
            data: depositData,
          },
        ],
      });

      console.log('Batch transaction sent successfully');
      
      // Set a placeholder hash to indicate success
      setTxHash('batch-transaction-success');
      setStatus('success');
      setAmount('');

      // Refresh balance
      await refetchBalance();

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setStatus('error');
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      
      // Provide more helpful error messages
      if (errorMessage.includes('rejected')) {
        setError('Transaction was rejected by user');
      } else if (errorMessage.includes('insufficient funds')) {
        setError('Insufficient funds for transaction');
      } else {
        setError(errorMessage);
      }
      
      console.error('Buy error:', err);
    }
  };

  // Handle wallet connection if not connected
  if (!isConnected) {
    return (
      <div className="vault-buy">
        {onClose && (
          <button className="back-button" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
        )}
        <h3 className="buy-title">Connect Wallet to Buy {vaultName}</h3>
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
          .vault-buy {
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
            background: rgba(59, 130, 246, 0.1);
            color: #fff;
            border: 1px solid rgba(59, 130, 246, 0.4);
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            margin-bottom: 16px;
          }
          .back-button:hover {
            background: rgba(59, 130, 246, 0.2);
            border-color: rgba(59, 130, 246, 0.6);
            transform: translateX(-2px);
          }
          .back-button svg {
            transition: transform 0.2s;
          }
          .back-button:hover svg {
            transform: translateX(-2px);
          }
          .buy-title {
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
            background: rgba(0, 82, 255, 0.1);
            border: 1px solid rgba(0, 82, 255, 0.3);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .connector-button:hover:not(:disabled) {
            background: rgba(0, 82, 255, 0.2);
            border-color: #0052ff;
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
    <div className="vault-buy">
      {onClose && (
        <button className="back-button" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
      )}
      <h3 className="buy-title">Buy {vaultName} Shares</h3>
      
      <div className="balance-display">
        <span className="balance-label">Available USDC:</span>
        <span className="balance-value">{userBalance.toFixed(2)}</span>
      </div>

      <div className="buy-form">
        <div className="input-group">
          <label htmlFor="amount">Amount (USDC)</label>
          <input
            id="amount"
            type="text"
            inputMode="decimal"
            step="0.01"
            min="0"
            max={userBalance}
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="0.00"
            disabled={status === 'processing'}
            className="amount-input"
          />
          <button
            onClick={() => setAmount(userBalance.toString())}
            className="max-button"
            disabled={status === 'processing'}
          >
            MAX
          </button>
        </div>

        <button
          onClick={handleBuy}
          disabled={status === 'processing' || !amount || parseFloat(amount) <= 0}
          className="buy-button"
        >
          {status === 'processing' && 'Processing Transaction...'}
          {status === 'idle' && 'Buy Shares (Approve + Deposit)'}
          {status === 'success' && 'Purchase Successful!'}
          {status === 'error' && 'Try Again'}
        </button>

        {error && (
          <div className="error-message">{error}</div>
        )}

        {txHash && (
          <div className="success-message">
            <p>✅ Transaction successful!</p>
            <p className="success-note">Batch transaction executed (approve + deposit)</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .vault-buy {
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
          background: rgba(59, 130, 246, 0.1);
          color: #fff;
          border: 1px solid rgba(59, 130, 246, 0.4);
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 16px;
        }
        .back-button:hover {
          background: rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 246, 0.6);
          transform: translateX(-2px);
        }
        .back-button svg {
          transition: transform 0.2s;
        }
        .back-button:hover svg {
          transform: translateX(-2px);
        }
        .buy-title {
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
          background: rgba(0, 82, 255, 0.1);
          border: 1px solid rgba(0, 82, 255, 0.3);
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
          color: #4ade80;
        }
        .buy-form {
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
        .amount-input {
          padding: 12px 80px 12px 16px;
          font-size: 16px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.2);
          color: #fff;
          transition: border-color 0.2s;
        }
        .amount-input:focus {
          outline: none;
          border-color: #0052ff;
        }
        .amount-input:disabled {
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
          color: #0052ff;
          background: rgba(0, 82, 255, 0.1);
          border: 1px solid rgba(0, 82, 255, 0.3);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .max-button:hover:not(:disabled) {
          background: rgba(0, 82, 255, 0.2);
          border-color: #0052ff;
        }
        .max-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .buy-button {
          padding: 14px 24px;
          font-size: 16px;
          font-weight: 600;
          color: #fff;
          background: #0052ff;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .buy-button:hover:not(:disabled) {
          background: #0041cc;
        }
        .buy-button:disabled {
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
