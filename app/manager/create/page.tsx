'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { sdk } from '@farcaster/miniapp-sdk';
import { useRouter } from 'next/navigation';
import { parseAbi, decodeEventLog } from 'viem';

interface VaultFormData {
  vaultName: string;
  vaultSymbol: string;
  safetyDeposit: string;
  strategy: string;
  lockPeriod: number;
}

// VaultFactory ABI
const VAULT_FACTORY_ABI = parseAbi([
  'function createVault(address asset, string memory name, string memory symbol, address manager) external returns (address vault)',
  'event VaultCreated(address indexed vault, address indexed asset, address indexed manager, string name, string symbol)'
]);

// Base USDC address sd
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;

export default function CreateVaultPage() {
  const router = useRouter();
  const { address } = useAccount();
  const [user, setUser] = useState<any>(null);
  const [userFid, setUserFid] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [createdVaultAddress, setCreatedVaultAddress] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [formData, setFormData] = useState<VaultFormData>({
    vaultName: '',
    vaultSymbol: '',
    safetyDeposit: '',
    strategy: '',
    lockPeriod: 90,
  });

  // Wagmi hooks for contract interaction
  const { data: hash, writeContract, isPending: isWritePending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash });
  const publicClient = usePublicClient();

  // Factory address from environment
  const factoryAddress = process.env.NEXT_PUBLIC_VAULT_FACTORY_ADDRESS as `0x${string}` | undefined;

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const context = await sdk.context;
        setUser(context.user);
        setUserFid(context.user?.fid || null);
        console.log('Base context user:', context.user);
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    loadUserData();
  }, []);

  useEffect(() => {
    setLoading(false);
  }, [address]);

  // Handle successful vault creation
  useEffect(() => {
    const saveVault = async () => {
      if (isSuccess && receipt && !createdVaultAddress) {
        try {
          // Get vault address from transaction logs
          const vaultCreatedLog = receipt.logs.find(log => {
            try {
              const decoded = decodeEventLog({
                abi: VAULT_FACTORY_ABI,
                data: log.data,
                topics: log.topics,
              });
              return decoded.eventName === 'VaultCreated';
            } catch {
              return false;
            }
          });

          if (vaultCreatedLog) {
            const decoded = decodeEventLog({
              abi: VAULT_FACTORY_ABI,
              data: vaultCreatedLog.data,
              topics: vaultCreatedLog.topics,
            }) as any;

            const vaultAddress = decoded.args.vault;
            setCreatedVaultAddress(vaultAddress);

            // Save vault to database
            const response = await fetch('/api/vaults', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                vaultAddress,
                vaultName: formData.vaultName,
                vaultSymbol: formData.vaultSymbol,
                managerAddress: address,
                strategy: formData.strategy,
                txHash: hash,
              }),
            });

            if (response.ok) {
              setShowSuccess(true);
              setSubmitting(false);
              // Scroll after UI updates
              setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
            } else {
              const error = await response.json();
              console.error('Failed to save vault:', error);
              // Still show success even if DB save fails
              setShowSuccess(true);
              setSubmitting(false);
              setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
            }
          }
        } catch (error) {
          console.error('Error processing vault creation:', error);
          // Still show success even if processing fails
          setShowSuccess(true);
          setSubmitting(false);
          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
        }
      }
    };

    saveVault();
  }, [isSuccess, receipt, hash, address, formData, createdVaultAddress]);

  const handleInputChange = (field: keyof VaultFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.vaultName.trim()) {
      setError('Vault name is required');
      return false;
    }
    if (!formData.vaultSymbol.trim()) {
      setError('Vault symbol is required');
      return false;
    }
    if (formData.vaultSymbol.length > 10) {
      setError('Vault symbol must be 10 characters or less');
      return false;
    }
    if (!formData.strategy.trim()) {
      setError('Investment strategy is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!address) {
      setError('Please connect your wallet');
      return;
    }
    
    setSubmitting(true);
    setError(null);

    try {
      // DEMO MODE - Vault address will be auto-generated based on FID
      console.log('Demo mode: Creating vault with:', formData);
      console.log('User FID:', userFid);
      console.log('User wallet:', address);
      
      if (!userFid) {
        throw new Error('FID is required to create a vault');
      }
      
      // Save to persistent file store (address auto-generated)
      try {
        const response = await fetch('/api/vaults', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // vaultAddress NOT included - will be auto-generated
            vaultName: formData.vaultName,
            vaultSymbol: formData.vaultSymbol,
            managerAddress: address || '', // Optional
            managerFid: userFid, // Required - used to generate unique address
            strategy: formData.strategy,
            txHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create vault');
        }
        
        const data = await response.json();
        console.log('✅ Vault created successfully:', data.vault);
        console.log('Generated address:', data.vault.vault_address);
        
        // Use the auto-generated address from server
        setCreatedVaultAddress(data.vault.vault_address);
      } catch (apiError) {
        console.error('Failed to create vault:', apiError);
        throw apiError;
      }
      
      // Show success only if API call succeeded
      setShowSuccess(true);
      setSubmitting(false);
      
      // Scroll to top after state updates
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } catch (error: any) {
      console.error('Error creating vault:', error);
      setError(error.message || 'Failed to create vault. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="create-vault-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="create-vault-page">
        <div className="empty-state-card">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
            <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/>
            <path d="M9 9h.01M15 9h.01M9 15h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <h2>Connect Wallet</h2>
          <p>Please connect your wallet to create a vault.</p>
        </div>
      </div>
    );
  }


  if (showSuccess && createdVaultAddress) {
    return (
      <div className="create-vault-page">
        <div className="success-container">
          <div className="success-icon">✅</div>
          <h1 className="success-title">{formData.vaultName} Created!</h1>
          <p className="success-subtitle">Test vault created (No gas fees)</p>

          <div className="test-mode-banner">
              <div className="banner-icon">🧪</div>
              <div className="banner-content">
                <h3>Test Mode</h3>
                <p>This is a demo vault. No blockchain deployment or gas fees required!</p>
                <div className="fee-breakdown">
                  <div className="fee-row">
                    <span>Deployment Fee:</span>
                    <span className="fee-value">$0.00</span>
                  </div>
                  <div className="fee-row">
                    <span>Gas Fee:</span>
                    <span className="fee-value">$0.00</span>
                  </div>
                  <div className="fee-row total">
                    <span>Total:</span>
                    <span className="fee-value">$0.00</span>
                  </div>
                </div>
              </div>
          </div>

          <div className="vault-info-card">
            <div className="vault-info-row">
              <span className="vault-info-label">Vault Name:</span>
              <span className="vault-info-value">{formData.vaultName}</span>
            </div>
            <div className="vault-info-row">
              <span className="vault-info-label">Symbol:</span>
              <span className="vault-info-value">{formData.vaultSymbol}</span>
            </div>
            <div className="vault-info-row">
              <span className="vault-info-label">Total Value Locked:</span>
              <span className="vault-info-value">$0.00</span>
            </div>
            <div className="vault-info-row">
              <span className="vault-info-label">Your Shares:</span>
              <span className="vault-info-value">0</span>
            </div>
          </div>

          <div className="action-buttons">
            <button
              className="btn-primary"
              onClick={() => {
                alert('Buy functionality will be implemented with Uniswap integration');
              }}
            >
              💰 Buy Shares
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                alert('Sell functionality will be implemented with Uniswap integration');
              }}
            >
              💸 Sell Shares
            </button>
          </div>

          <div className="vault-address-section">
            <p className="vault-address-label">Vault Contract Address:</p>
            <div className="vault-address-box">
              <code className="vault-address">{createdVaultAddress}</code>
              <button
                className="btn-copy"
                onClick={() => {
                  navigator.clipboard.writeText(createdVaultAddress);
                  alert('Address copied!');
                }}
              >
                📋 Copy
              </button>
            </div>
          </div>

          <div className="success-actions">
            <button
              className="btn-primary btn-large"
              onClick={() => {
                // Force reload to ensure new vault shows up
                window.location.href = `/manager?t=${Date.now()}`;
              }}
            >
              ✓ View My Vaults
            </button>
            <button
              className="btn-outline"
              onClick={() => window.location.href = '/'}
            >
              Browse All Vaults
            </button>
          </div>
        </div>

        <style jsx>{`
          .success-container {
            max-width: 600px;
            margin: 0 auto;
            padding: var(--spacing-xl);
            text-align: center;
          }

          .success-icon {
            font-size: 64px;
            margin-bottom: var(--spacing-lg);
            animation: scaleIn 0.5s ease-out;
          }

          @keyframes scaleIn {
            from { transform: scale(0); }
            to { transform: scale(1); }
          }

          .success-title {
            font-size: 32px;
            font-weight: 700;
            background: var(--gradient-primary);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: var(--spacing-sm);
          }

          .success-subtitle {
            color: var(--color-text-secondary);
            font-size: 16px;
            margin-bottom: var(--spacing-xl);
          }

          .vault-info-card {
            background: var(--color-bg-secondary);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
            padding: var(--spacing-lg);
            margin-bottom: var(--spacing-xl);
            text-align: left;
          }

          .vault-info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: var(--spacing-md) 0;
            border-bottom: 1px solid var(--color-border);
          }

          .vault-info-row:last-child {
            border-bottom: none;
          }

          .vault-info-label {
            font-size: 14px;
            color: var(--color-text-secondary);
            font-weight: 500;
          }

          .vault-info-value {
            font-size: 16px;
            color: var(--color-text-primary);
            font-weight: 600;
          }

          .action-buttons {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: var(--spacing-md);
            margin-bottom: var(--spacing-xl);
          }

          .btn-secondary {
            padding: 16px 24px;
            background: var(--color-bg-secondary);
            border: 2px solid var(--color-primary);
            border-radius: var(--radius-md);
            color: var(--color-primary);
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }

          .btn-secondary:hover {
            background: var(--color-primary);
            color: white;
            transform: translateY(-2px);
          }

          .vault-address-section {
            background: var(--color-bg-secondary);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
            padding: var(--spacing-lg);
            margin-bottom: var(--spacing-xl);
          }

          .vault-address-label {
            font-size: 14px;
            color: var(--color-text-secondary);
            margin-bottom: var(--spacing-sm);
            text-align: left;
          }

          .vault-address-box {
            display: flex;
            gap: var(--spacing-sm);
            align-items: center;
          }

          .vault-address {
            flex: 1;
            padding: 12px;
            background: var(--color-bg-tertiary);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            font-size: 13px;
            color: var(--color-text-primary);
            font-family: 'Courier New', monospace;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .btn-copy {
            padding: 12px 16px;
            background: var(--color-bg-tertiary);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            color: var(--color-text-primary);
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
            white-space: nowrap;
          }

          .btn-copy:hover {
            background: var(--color-bg-elevated);
            border-color: var(--color-primary);
          }

          .btn-outline {
            padding: 14px 24px;
            background: transparent;
            border: 2px solid var(--color-border);
            border-radius: var(--radius-md);
            color: var(--color-text-primary);
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            width: 100%;
          }

          .btn-large {
            padding: 18px 24px;
            font-size: 18px;
          }

          .success-actions {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-md);
            width: 100%;
          }

          .btn-outline:hover {
            border-color: var(--color-primary);
            color: var(--color-primary);
          }
          .test-mode-banner {
            display: flex;
            gap: var(--spacing-md);
            padding: var(--spacing-lg);
            background: rgba(99, 102, 241, 0.1);
            border: 2px solid rgba(99, 102, 241, 0.3);
            border-radius: var(--radius-lg);
            margin-bottom: var(--spacing-xl);
            text-align: left;
          }

          .banner-icon {
            font-size: 32px;
            flex-shrink: 0;
          }

          .banner-content h3 {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: var(--spacing-xs);
          }

          .banner-content p {
            font-size: 14px;
            color: var(--color-text-secondary);
            margin-bottom: var(--spacing-md);
          }

          .fee-breakdown {
            background: var(--color-bg-tertiary);
            border-radius: var(--radius-md);
            padding: var(--spacing-md);
          }

          .fee-row {
            display: flex;
            justify-content: space-between;
            padding: var(--spacing-xs) 0;
            font-size: 14px;
          }

          .fee-row.total {
            border-top: 1px solid var(--color-border);
            padding-top: var(--spacing-sm);
            margin-top: var(--spacing-sm);
            font-weight: 600;
          }

          .fee-value {
            color: var(--color-success);
            font-weight: 600;
          }


          @media (max-width: 768px) {
            .success-container {
              padding: var(--spacing-md);
            }

            .success-title {
              font-size: 24px;
            }

            .action-buttons {
              grid-template-columns: 1fr;
            }

            .vault-address {
              font-size: 11px;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="create-vault-page">
      {/* Header */}
      <div className="page-header">
        <button className="btn-back" onClick={() => window.location.href = `/manager?t=${Date.now()}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5m0 0l7 7m-7-7l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Back
        </button>
        <h1 className="page-title">Create New Vault</h1>
        <p className="subtitle">Set up your investment vault on Base</p>
      </div>

      {/* Progress Steps */}
      <div className="progress-steps">
        <div className="step active">
          <div className="step-number">1</div>
          <div className="step-label">Basic Info</div>
        </div>
        <div className="step">
          <div className="step-number">2</div>
          <div className="step-label">Strategy</div>
        </div>
        <div className="step">
          <div className="step-number">3</div>
          <div className="step-label">Review</div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="vault-form">
        {/* Quick Overview Card */}
        <div className="overview-card">
          <div className="overview-icon">🏦</div>
          <div className="overview-content">
            <h3>Create Your Investment Vault</h3>
            <p>Set up a secure, non-custodial vault on Base to manage investments. Your vault will use the ERC-4626 standard, ensuring transparency and security for your investors.</p>
            <div className="key-points">
              <div className="point">
                <span className="point-icon">🔒</span>
                <span>Non-custodial & secure</span>
              </div>
              <div className="point">
                <span className="point-icon">💰</span>
                <span>200 USDC deposit</span>
              </div>
              <div className="point">
                <span className="point-icon">📈</span>
                <span>1% exit fee earnings</span>
              </div>
            </div>
          </div>
        </div>

        {/* Basic Info Section */}
        <div className="form-section">
          <div className="form-group">
            <label htmlFor="vaultName" className="form-label">
              Vault Name *
            </label>
            <input
              id="vaultName"
              type="text"
              className="form-input"
              placeholder="e.g., Blue Chip Growth Fund"
              value={formData.vaultName}
              onChange={(e) => handleInputChange('vaultName', e.target.value)}
              maxLength={50}
            />
            <div className="form-hint">
              Choose a descriptive name for your vault
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="vaultSymbol" className="form-label">
              Vault Symbol *
            </label>
            <input
              id="vaultSymbol"
              type="text"
              className="form-input"
              placeholder="e.g., BCGF"
              value={formData.vaultSymbol}
              onChange={(e) => handleInputChange('vaultSymbol', e.target.value.toUpperCase())}
              maxLength={10}
            />
            <div className="form-hint">
              Short ticker symbol (max 10 characters)
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="strategy" className="form-label">
              Investment Strategy *
            </label>
            <textarea
              id="strategy"
              className="form-textarea"
              placeholder="Describe your investment strategy, target assets, and approach..."
              value={formData.strategy}
              onChange={(e) => handleInputChange('strategy', e.target.value)}
              rows={4}
              maxLength={500}
            />
            <div className="form-hint">
              {formData.strategy.length}/500 characters
            </div>
          </div>
        </div>

        {/* Vault Features Summary */}
        <div className="features-summary">
          <div className="feature-column">
            <h4>📊 Core Features</h4>
            <ul>
              <li>ERC-4626 compliant vault</li>
              <li>USDC deposits & shares</li>
              <li>Pro-rata withdrawals</li>
              <li>On-chain transparency</li>
            </ul>
          </div>
          <div className="feature-column">
            <h4>🔒 Security</h4>
            <ul>
              <li>Non-custodial design</li>
              <li>No manager withdrawals</li>
              <li>Immutable parameters</li>
              <li>Verifiable balances</li>
            </ul>
          </div>
          <div className="feature-column">
            <h4>💰 Economics</h4>
            <ul>
              <li>200 USDC deposit</li>
              <li>90-day lock period</li>
              <li>1% exit fee to you</li>
              <li>Instant withdrawals</li>
            </ul>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          {error && (
            <div className="error-message">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      stroke="currentColor" strokeWidth="2"/>
              </svg>
              <div className="error-content">
                <span className="error-title">Unable to Create Vault</span>
                <span className="error-desc">{error}</span>
              </div>
            </div>
          )}

          <div className="action-row">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => window.location.href = '/manager'}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`btn-primary ${error ? 'has-error' : ''}`}
              disabled={submitting || isWritePending || isConfirming}
            >
              {isConfirming ? (
                <>
                  <div className="spinner-small"></div>
                  Confirming Transaction...
                </>
              ) : (submitting || isWritePending) ? (
                <>
                  <div className="spinner-small"></div>
                  Creating Vault...
                </>
              ) : isSuccess ? (
                <>
                  ✅ Vault Created!
                </>
              ) : (
                'Deploy Vault'
              )}
            </button>
          </div>

          <div className="form-footer">
            <p className="small-text">
              By deploying this vault, you create a new ERC-4626 vault contract on Base.
              Gas fees apply for deployment. The vault will hold USDC and issue shares to depositors.
            </p>
          </div>
        </div>
      </form>

      <style jsx>{`
        .progress-steps {
          display: flex;
          justify-content: center;
          gap: var(--spacing-xl);
          margin-bottom: var(--spacing-xl);
        }

        .step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-xs);
          opacity: 0.5;
        }

        .step.active {
          opacity: 1;
        }

        .step-number {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--color-primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
        }

        .step-label {
          font-size: 14px;
          font-weight: 500;
        }

        .overview-card {
          display: flex;
          gap: var(--spacing-lg);
          padding: var(--spacing-lg);
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          margin-bottom: var(--spacing-xl);
        }

        .overview-icon {
          font-size: 48px;
          flex-shrink: 0;
        }

        .overview-content h3 {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: var(--spacing-sm);
        }

        .overview-content p {
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-md);
        }

        .key-points {
          display: flex;
          gap: var(--spacing-lg);
        }

        .point {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          font-size: 14px;
          color: var(--color-text-primary);
        }

        .point-icon {
          font-size: 20px;
        }

        .features-summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--spacing-lg);
          margin-top: var(--spacing-xl);
          padding: var(--spacing-lg);
          background: rgba(99, 102, 241, 0.05);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: var(--radius-lg);
        }

        .feature-column h4 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: var(--spacing-md);
          color: var(--color-primary);
        }

        .feature-column ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .feature-column li {
          font-size: 14px;
          color: var(--color-text-secondary);
          padding: var(--spacing-xs) 0;
        }

        .create-vault-page {
          max-width: 800px;
          margin: 0 auto;
          padding: var(--spacing-lg);
          padding-bottom: 100px;
        }

        .page-header {
          margin-bottom: var(--spacing-xl);
        }

        .btn-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          color: var(--color-text-primary);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: var(--spacing-md);
        }

        .btn-back:hover {
          background: var(--color-bg-tertiary);
          border-color: var(--color-primary);
        }

        .page-title {
          font-size: 32px;
          font-weight: 700;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: var(--spacing-sm);
        }

        .subtitle {
          color: var(--color-text-secondary);
          font-size: 16px;
        }

        .vault-form {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xl);
        }

        .form-section {
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
        }

        .section-title {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: var(--spacing-lg);
        }

        .form-group {
          margin-bottom: var(--spacing-lg);
        }

        .form-group:last-child {
          margin-bottom: 0;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: var(--spacing-sm);
          color: var(--color-text-primary);
        }

        .form-input,
        .form-textarea,
        .form-select {
          width: 100%;
          padding: 12px 16px;
          background: var(--color-bg-tertiary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          color: var(--color-text-primary);
          font-size: 15px;
          font-family: inherit;
          transition: all 0.2s;
        }

        .form-input:focus,
        .form-textarea:focus,
        .form-select:focus {
          outline: none;
          border-color: var(--color-primary);
          background: var(--color-bg-elevated);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }

        .input-with-addon {
          display: flex;
          align-items: center;
          gap: 0;
        }

        .input-with-addon .form-input {
          border-top-right-radius: 0;
          border-bottom-right-radius: 0;
        }

        .input-addon {
          padding: 12px 16px;
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
          border-left: none;
          border-radius: 0 var(--radius-md) var(--radius-md) 0;
          font-size: 15px;
          font-weight: 600;
          color: var(--color-text-secondary);
        }

        .form-hint {
          font-size: 13px;
          color: var(--color-text-secondary);
          margin-top: var(--spacing-xs);
        }

        .info-card {
          display: flex;
          gap: var(--spacing-lg);
          padding: var(--spacing-lg);
          background: rgba(99, 102, 241, 0.05);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: var(--radius-lg);
          margin-bottom: var(--spacing-lg);
        }

        .feature-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .feature-list li {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm) 0;
          font-size: 14px;
          color: var(--color-text-secondary);
          border-bottom: 1px solid rgba(99, 102, 241, 0.1);
        }

        .feature-list li:last-child {
          border-bottom: none;
        }

        .feature-list li strong {
          color: var(--color-text-primary);
          min-width: 120px;
          font-weight: 600;
        }

        .info-icon {
          font-size: 36px;
          margin-top: var(--spacing-sm);
        }

        .feature-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .feature-list li {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm) 0;
          font-size: 14px;
          color: var(--color-text-secondary);
          border-bottom: 1px solid rgba(99, 102, 241, 0.1);
        }

        .feature-list li:last-child {
          border-bottom: none;
        }

        .feature-list li strong {
          color: var(--color-text-primary);
          min-width: 140px;
        }

        .info-icon {
          font-size: 32px;
          flex-shrink: 0;
        }

        .info-content h3 {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: var(--spacing-xs);
        }

        .info-content p {
          font-size: 14px;
          color: var(--color-text-secondary);
          line-height: 1.6;
          margin: 0;
        }

        .form-actions {
          margin-top: var(--spacing-xl);
          padding-top: var(--spacing-lg);
          border-top: 1px solid var(--color-border);
        }

        .action-row {
          display: flex;
          gap: var(--spacing-md);
          margin-top: var(--spacing-lg);
        }

        .error-message {
          display: flex;
          align-items: flex-start;
          gap: var(--spacing-md);
          padding: var(--spacing-lg);
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: var(--radius-md);
          color: var(--color-danger);
          margin-bottom: var(--spacing-lg);
        }

        .error-content {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .error-title {
          font-weight: 600;
          font-size: 14px;
        }

        .error-desc {
          color: var(--color-text-secondary);
          font-size: 14px;
        }

        .btn-primary.has-error {
          background: var(--color-danger);
          border-color: var(--color-danger);
        }

        .btn-primary.has-error:hover {
          background: var(--color-danger-dark);
          border-color: var(--color-danger-dark);
        }

        .form-footer {
          text-align: center;
          margin-top: var(--spacing-md);
        }

        .small-text {
          font-size: 13px;
          color: var(--color-text-tertiary);
          line-height: 1.6;
        }

        .loading-container,
        .empty-state-card,
        .warning-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: var(--spacing-xl);
          background: var(--color-bg-secondary);
          border: 2px solid var(--color-border);
          border-radius: var(--radius-lg);
        }

        .warning-card {
          border-color: var(--color-warning);
        }

        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: var(--color-bg-secondary);
          border-top: 1px solid var(--color-border);
          display: flex;
          justify-content: space-around;
          padding: 8px 0;
          z-index: 100;
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 8px 16px;
          background: none;
          border: none;
          color: var(--color-text-secondary);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .nav-item.active {
          color: var(--color-primary);
        }

        .nav-item svg {
          stroke: currentColor;
        }

        .warning-card svg,
        .empty-state-card svg {
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-md);
        }

        .warning-card svg {
          color: var(--color-warning);
        }

        .warning-card h2,
        .empty-state-card h2 {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: var(--spacing-sm);
        }

        .warning-card p,
        .empty-state-card p {
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-lg);
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid var(--color-bg-tertiary);
          border-top-color: var(--color-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: var(--spacing-md);
        }

        .spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .create-vault-page {
            padding: var(--spacing-md);
          }

          .page-title {
            font-size: 24px;
          }

          .form-section {
            padding: var(--spacing-md);
          }
        }
      `}</style>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button className="nav-item" onClick={() => router.push('/')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>Discover</span>
        </button>
        <button className="nav-item" onClick={() => router.push('/')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 7C3 5.89543 3.89543 5 5 5H19C20.1046 5 21 5.89543 21 7V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V7Z" stroke="currentColor" strokeWidth="2"/>
            <path d="M3 10H21" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <span>My Vaults</span>
        </button>
        <button className="nav-item active" onClick={() => window.location.href = `/manager?t=${Date.now()}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 4.75L19.25 9L12 13.25L4.75 9L12 4.75Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9.25 12L4.75 15L12 19.25L19.25 15L14.75 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Manager</span>
        </button>
      </nav>
    </div>
  );
}