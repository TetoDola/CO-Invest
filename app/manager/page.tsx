'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { sdk } from '@farcaster/miniapp-sdk';
import ManagerRegistration from '../components/ManagerRegistration';

interface ManagerVault {
  id: number;
  vault_address: string;
  vault_name: string;
  vault_symbol: string;
  safety_deposit_amount: number;
  lock_until: string;
  is_withdrawn: boolean;
  created_at: string;
  canWithdraw: boolean;
  daysUntilUnlock: number;
}

interface ManagerStats {
  totalVaults: number;
  activeVaults: number;
  totalSafetyDeposits: number;
  lockedDeposits: number;
  availableWithdrawals: number;
}

export default function ManagerPage() {
  const { address } = useAccount();
  const [user, setUser] = useState<any>(null);
  const [userFid, setUserFid] = useState<number | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [vaults, setVaults] = useState<ManagerVault[]>([]);
  const [stats, setStats] = useState<ManagerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState<any>(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const context = await sdk.context;
        setUser(context.user);
        setUserFid(context.user?.fid || null);
        console.log('Manager dashboard - Base context FID:', context.user?.fid);
        
        // Signal that the app is ready to display
        await sdk.actions.ready();
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    loadUserData();
  }, []);

  useEffect(() => {
    if (!address && !userFid) {
      setLoading(false);
      return;
    }

    if (address || userFid) {
      loadManagerData();
    }
  }, [address, userFid]);

  // Reload vaults when page becomes visible (handles navigation back from create page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && (address || userFid)) {
        console.log('Page became visible, reloading vaults...');
        loadManagerData();
      }
    };

    const handleFocus = () => {
      if (address || userFid) {
        console.log('Window focused, reloading vaults...');
        loadManagerData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    // Also reload when navigating to this page with a timestamp parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('t')) {
      console.log('Timestamp parameter detected, loading fresh data...');
      loadManagerData();
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [address, userFid]);

  const loadManagerData = async () => {
    if (!address && !userFid) return;

    setLoading(true);

    try {
      // For demo mode, everyone is eligible
      setEligibility({ isEligible: true });

      // Load vaults using FID if available, otherwise address
      const queryParam = userFid ? `fid=${userFid}` : `address=${address}`;
      // Add cache-busting parameter to ensure fresh data
      const vaultsRes = await fetch(`/api/manager/vaults?${queryParam}&t=${Date.now()}`);
      const vaultsData = await vaultsRes.json();
      
      if (vaultsData.success) {
        setVaults(vaultsData.vaults);
        setStats(vaultsData.stats);
        console.log('Loaded vaults for FID/address:', userFid || address, vaultsData.vaults);
      }
    } catch (error) {
      console.error('Error loading manager data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrationComplete = () => {
    setShowRegistration(false);
    loadManagerData();
  };

  if (loading) {
    return (
      <div className="manager-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading manager profile...</p>
        </div>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="manager-page">
        <div className="empty-state-card">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
            <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/>
            <path d="M9 9h.01M15 9h.01M9 15h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <h2>Connect Wallet</h2>
          <p>Please connect your wallet to access manager features.</p>
        </div>
      </div>
    );
  }

  // Skip registration in demo mode - everyone can create vaults

  return (
    <div className="manager-page">
      {/* Header */}
      <div className="manager-header">
        <button className="back-button" onClick={() => window.location.href = '/'}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Home
        </button>
        <div className="header-content-main">
          <h1 className="page-title">Manager Dashboard</h1>
          {user && (
            <div className="manager-info">
              {user.pfpUrl && (
                <img src={user.pfpUrl} alt="Profile" className="manager-avatar" />
              )}
              <div>
                <div className="manager-name">{user.displayName || user.username}</div>
                {user.username && <div className="manager-username">@{user.username}</div>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Vaults List */}
      <div className="vaults-section">
        <div className="section-header">
          <h2>My Vaults</h2>
          <button className="btn-primary-small" onClick={() => window.location.href = '/manager/create'}>
            + Create New Vault
          </button>
        </div>

        {vaults.length === 0 ? (
          <div className="empty-vaults">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M12 4v16m8-8H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <h3>No Vaults Yet</h3>
            <p>Create your first vault to start managing investments</p>
            <button className="btn-primary" onClick={() => window.location.href = '/manager/create'}>
              Create Your First Vault
            </button>
          </div>
        ) : (
          <div className="vaults-list">
            {vaults.map((vault) => (
              <div key={vault.id} className="vault-card-manager">
                <div className="vault-card-header">
                  <div>
                    <h3 className="vault-name">{vault.vault_name}</h3>
                    <div className="vault-symbol">{vault.vault_symbol}</div>
                  </div>
                  <div className="vault-status">
                    {vault.is_withdrawn ? (
                      <span className="status-badge withdrawn">Withdrawn</span>
                    ) : vault.canWithdraw ? (
                      <span className="status-badge unlocked">Unlocked</span>
                    ) : (
                      <span className="status-badge locked">Locked</span>
                    )}
                  </div>
                </div>

                <div className="vault-card-body">
                  <div className="vault-detail-row">
                    <span className="label">Safety Deposit:</span>
                    <span className="value">${vault.safety_deposit_amount.toFixed(2)}</span>
                  </div>

                  <div className="vault-detail-row">
                    <span className="label">Lock Status:</span>
                    <span className="value">
                      {vault.is_withdrawn ? (
                        'Withdrawn'
                      ) : vault.canWithdraw ? (
                        'Ready to withdraw'
                      ) : (
                        `${vault.daysUntilUnlock} days remaining`
                      )}
                    </span>
                  </div>

                  <div className="vault-detail-row">
                    <span className="label">Created:</span>
                    <span className="value">
                      {new Date(vault.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="vault-detail-row">
                    <span className="label">Address:</span>
                    <span className="value mono">
                      {vault.vault_address.slice(0, 6)}...{vault.vault_address.slice(-4)}
                    </span>
                  </div>
                </div>

                <div className="vault-card-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => window.location.href = `/?vault=${vault.vault_address}`}
                  >
                    View Details
                  </button>
                  {vault.canWithdraw && !vault.is_withdrawn && (
                    <button className="btn-primary-small">
                      Withdraw Deposit
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
        .manager-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: var(--spacing-lg);
          padding-bottom: 100px;
        }

        .manager-header {
          margin-bottom: var(--spacing-xl);
        }

        .back-button {
          display: inline-flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: 10px 16px;
          background: transparent;
          color: var(--color-text-primary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: var(--spacing-md);
        }

        .back-button:hover {
          background: var(--color-bg-secondary);
          border-color: var(--color-primary);
          transform: translateX(-2px);
        }

        .back-button svg {
          transition: transform 0.2s;
        }

        .back-button:hover svg {
          transform: translateX(-2px);
        }

        .header-content-main {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--spacing-md);
        }

        .page-title {
          font-size: 28px;
          font-weight: 700;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .manager-info {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .manager-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
        }

        .manager-name {
          font-size: 16px;
          font-weight: 600;
        }

        .manager-username {
          font-size: 14px;
          color: var(--color-text-secondary);
        }

        .vaults-section {
          margin-top: var(--spacing-xl);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg);
        }

        .section-header h2 {
          font-size: 24px;
          font-weight: 700;
        }

        .btn-primary-small {
          padding: 10px 20px;
          background: var(--gradient-primary);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary-small:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        .empty-vaults {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: var(--spacing-xl);
          background: var(--color-bg-secondary);
          border: 2px dashed var(--color-border);
          border-radius: var(--radius-lg);
        }

        .empty-vaults svg {
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-md);
        }

        .empty-vaults h3 {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: var(--spacing-sm);
        }

        .empty-vaults p {
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-lg);
        }

        .vaults-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: var(--spacing-md);
        }

        .vault-card-manager {
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          transition: all 0.2s;
        }

        .vault-card-manager:hover {
          border-color: var(--color-primary);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .vault-card-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: var(--spacing-md);
          padding-bottom: var(--spacing-md);
          border-bottom: 1px solid var(--color-border);
        }

        .vault-name {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: var(--spacing-xs);
        }

        .vault-symbol {
          font-family: var(--font-mono);
          font-size: 13px;
          color: var(--color-text-secondary);
        }

        .vault-status {
          flex-shrink: 0;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: var(--radius-full);
          font-size: 12px;
          font-weight: 600;
        }

        .status-badge.locked {
          background: rgba(245, 158, 11, 0.1);
          color: var(--color-warning);
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .status-badge.unlocked {
          background: rgba(16, 185, 129, 0.1);
          color: var(--color-success);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .status-badge.withdrawn {
          background: rgba(107, 110, 138, 0.1);
          color: var(--color-text-tertiary);
          border: 1px solid var(--color-border);
        }

        .vault-card-body {
          margin-bottom: var(--spacing-md);
        }

        .vault-detail-row {
          display: flex;
          justify-content: space-between;
          padding: var(--spacing-sm) 0;
          font-size: 14px;
        }

        .vault-detail-row .label {
          color: var(--color-text-secondary);
        }

        .vault-detail-row .value {
          font-weight: 600;
        }

        .vault-detail-row .value.mono {
          font-family: var(--font-mono);
          font-size: 12px;
        }

        .vault-card-actions {
          display: flex;
          gap: var(--spacing-sm);
        }

        .vault-card-actions button {
          flex: 1;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-xl);
          min-height: 400px;
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

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty-state-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: var(--spacing-xl);
          background: var(--color-bg-secondary);
          border: 2px solid var(--color-border);
          border-radius: var(--radius-lg);
        }

        .empty-state-card svg {
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-md);
        }

        .empty-state-card h2 {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: var(--spacing-sm);
        }

        .empty-state-card p {
          color: var(--color-text-secondary);
        }

        @media (max-width: 768px) {
          .manager-page {
            padding: var(--spacing-md);
          }

          .header-content-main {
            flex-direction: column;
            align-items: flex-start;
          }

          .vaults-list {
            grid-template-columns: 1fr;
          }

          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--spacing-md);
          }

          .section-header .btn-primary-small {
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .vault-card-header {
            flex-direction: column;
            gap: var(--spacing-sm);
          }

          .vault-card-actions {
            flex-direction: column;
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