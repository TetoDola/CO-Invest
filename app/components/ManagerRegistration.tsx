'use client';

import { useState, useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { useAccount } from 'wagmi';

interface ManagerRegistrationProps {
  onComplete?: () => void;
}

export default function ManagerRegistration({ onComplete }: ManagerRegistrationProps) {
  const { address } = useAccount();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<number>(0);
  const [eligibility, setEligibility] = useState<{
    isEligible: boolean;
    currentBalance: number;
    lastChecked: string;
  } | null>(null);
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user data from Farcaster SDK
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const context = await sdk.context;
        setUser(context.user);
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, []);

  // Auto-approve all users as eligible
  useEffect(() => {
    if (!address) return;
    
    // Set everyone as eligible for MVP
    setEligibility({
      isEligible: true,
      currentBalance: 0,
      lastChecked: new Date().toISOString()
    });
    setBalance(0);
  }, [address]);

  const refreshBalance = async () => {
    if (!address) return;

    setCheckingBalance(true);
    setError(null);

    try {
      const response = await fetch('/api/manager/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address }),
      });

      const data = await response.json();

      if (data.success) {
        setBalance(data.balance);
        setEligibility(data.eligibility);
      } else {
        setError(data.error || 'Failed to check balance');
      }
    } catch (error) {
      console.error('Error refreshing balance:', error);
      setError('Failed to refresh balance');
    } finally {
      setCheckingBalance(false);
    }
  };

  const createManagerProfile = async () => {
    // Skip profile creation and go directly to vault creation
    // Profile will be created automatically when vault is deployed
    window.location.href = '/manager/create';
  };

  if (loading) {
    return (
      <div className="registration-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="registration-container">
        <div className="warning-card">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  stroke="currentColor" strokeWidth="2"/>
          </svg>
          <h3>Wallet Not Connected</h3>
          <p>Please connect your Farcaster wallet to continue.</p>
        </div>
      </div>
    );
  }

  const isEligible = true; // Everyone is eligible in MVP

  return (
    <div className="registration-container">
      {/* Header */}
      <div className="registration-header">
        <h1 className="page-title">Become a Vault Manager</h1>
        <p className="subtitle">
          Create and manage investment vaults on Base
        </p>
      </div>

      {/* Getting Started Card */}
      <div className="eligibility-card eligible">
        <div className="eligibility-header">
          <h3>✅ Ready to Create Vaults</h3>
        </div>

        <div className="info-content">
          <p>You can now create and manage investment vaults on Base. Your vault will be deployed as an ERC-4626 compliant smart contract.</p>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="requirements-card">
        <h3>How It Works</h3>
        <div className="requirements-list">
          <div className="requirement-item met">
            <div className="requirement-icon">1️⃣</div>
            <div className="requirement-content">
              <div className="requirement-title">Deploy Your Vault</div>
              <div className="requirement-desc">
                Create an ERC-4626 vault contract on Base with your chosen name and symbol
              </div>
            </div>
          </div>

          <div className="requirement-item met">
            <div className="requirement-icon">2️⃣</div>
            <div className="requirement-content">
              <div className="requirement-title">Accept Deposits</div>
              <div className="requirement-desc">
                Investors can deposit USDC and receive vault shares representing their position
              </div>
            </div>
          </div>

          <div className="requirement-item met">
            <div className="requirement-icon">3️⃣</div>
            <div className="requirement-content">
              <div className="requirement-title">Pro-Rata Withdrawals</div>
              <div className="requirement-desc">
                Users can withdraw their fair share anytime - fully non-custodial and secure
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  stroke="currentColor" strokeWidth="2"/>
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Action Button */}
      {isEligible && (
        <button
          className="btn-primary"
          onClick={createManagerProfile}
          disabled={loading}
        >
          {loading ? 'Creating Profile...' : 'Continue to Vault Creation'}
        </button>
      )}

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button className="nav-item" onClick={() => window.location.href = '/'}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>Discover</span>
        </button>
        <button className="nav-item" onClick={() => window.location.href = '/'}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 7C3 5.89543 3.89543 5 5 5H19C20.1046 5 21 5.89543 21 7V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V7Z" stroke="currentColor" strokeWidth="2"/>
            <path d="M3 10H21" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <span>My Vaults</span>
        </button>
        <button className="nav-item active">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 4.75L19.25 9L12 13.25L4.75 9L12 4.75Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9.25 12L4.75 15L12 19.25L19.25 15L14.75 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Manager</span>
        </button>
      </nav>

      <style jsx>{`
        .registration-container {
          max-width: 600px;
          margin: 0 auto;
          padding: var(--spacing-lg);
        }

        .registration-header {
          margin-bottom: var(--spacing-lg);
        }

        .page-title {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: var(--spacing-sm);
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .subtitle {
          color: var(--color-text-secondary);
          font-size: 16px;
        }

        .eligibility-card {
          background: var(--color-bg-secondary);
          border: 2px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          margin-bottom: var(--spacing-lg);
        }

        .eligibility-card.eligible {
          border-color: var(--color-success);
          background: rgba(16, 185, 129, 0.05);
        }

        .eligibility-card.ineligible {
          border-color: var(--color-warning);
          background: rgba(245, 158, 11, 0.05);
        }

        .eligibility-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
        }

        .eligibility-header h3 {
          font-size: 20px;
          font-weight: 600;
          margin: 0;
        }

        .btn-refresh {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: var(--color-bg-tertiary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          color: var(--color-text-primary);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-refresh:hover:not(:disabled) {
          background: var(--color-bg-elevated);
          border-color: var(--color-primary);
        }

        .btn-refresh:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .balance-display {
          text-align: center;
          padding: var(--spacing-lg) 0;
          border-bottom: 1px solid var(--color-border);
          margin-bottom: var(--spacing-md);
        }

        .balance-label {
          font-size: 14px;
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-sm);
        }

        .balance-amount {
          font-size: 36px;
          font-weight: 700;
          font-family: var(--font-mono);
          margin-bottom: var(--spacing-xs);
        }

        .balance-requirement {
          font-size: 13px;
          color: var(--color-text-tertiary);
        }

        .ineligibility-message {
          padding: var(--spacing-md);
          background: rgba(245, 158, 11, 0.1);
          border-radius: var(--radius-md);
        }

        .ineligibility-message p {
          margin: var(--spacing-sm) 0;
          font-size: 14px;
          line-height: 1.6;
        }

        .small-text {
          font-size: 13px;
          color: var(--color-text-secondary);
        }

        .requirements-card {
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          margin-bottom: var(--spacing-lg);
        }

        .requirements-card h3 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: var(--spacing-md);
        }

        .requirements-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .requirement-item {
          display: flex;
          gap: var(--spacing-md);
          padding: var(--spacing-md);
          background: var(--color-bg-tertiary);
          border-radius: var(--radius-md);
          transition: all 0.2s;
        }

        .requirement-item.met {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .requirement-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .requirement-content {
          flex: 1;
        }

        .requirement-title {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .requirement-desc {
          font-size: 13px;
          color: var(--color-text-secondary);
          line-height: 1.5;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-md);
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: var(--radius-md);
          color: var(--color-danger);
          font-size: 14px;
          margin-bottom: var(--spacing-lg);
        }

        .help-text {
          padding: var(--spacing-lg);
          background: var(--color-bg-tertiary);
          border-radius: var(--radius-md);
          margin-top: var(--spacing-lg);
        }

        .help-text p {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: var(--spacing-sm);
        }

        .help-text ul {
          margin: 0;
          padding-left: var(--spacing-lg);
        }

        .help-text li {
          font-size: 14px;
          color: var(--color-text-secondary);
          margin: var(--spacing-xs) 0;
          line-height: 1.6;
        }

        .warning-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: var(--spacing-xl);
          background: var(--color-bg-secondary);
          border: 2px solid var(--color-warning);
          border-radius: var(--radius-lg);
        }

        .warning-card svg {
          color: var(--color-warning);
          margin-bottom: var(--spacing-md);
        }

        .warning-card h3 {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: var(--spacing-sm);
        }

        .warning-card p {
          color: var(--color-text-secondary);
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: var(--spacing-xl);
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
          width: 14px;
          height: 14px;
          border: 2px solid var(--color-bg-elevated);
          border-top-color: var(--color-primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .registration-container {
            padding: var(--spacing-md);
          }

          .page-title {
            font-size: 24px;
          }

          .balance-amount {
            font-size: 28px;
          }

          .eligibility-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--spacing-sm);
          }

          .btn-refresh {
            width: 100%;
            justify-content: center;
          }
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
      `}</style>
    </div>
  );
}