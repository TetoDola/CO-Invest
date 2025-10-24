'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { sdk } from "@farcaster/miniapp-sdk";
import { useAccount } from 'wagmi';
import UserProfile from './UserProfile';
import UserBalances from './UserBalances';
import TrustIndicators from './TrustIndicators';
import FAQ from './FAQ';
import { Address } from 'viem';

interface Vault {
  id: number;
  name: string;
  manager: string;
  address: Address;
  tvl: number;
  performance7d: number;
  performance30d?: number;
  exitFee: number;
}

export default function VaultAppWithAuth() {
  const [user, setUser] = useState<{
    fid: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
  } | null>(null);
  const router = useRouter();
  
  // Get wallet address from wagmi (for MetaMask/wallet connections)
  const { address: walletAddress } = useAccount();
  
  // User address can come from Farcaster SDK or wallet connection
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [showBalances, setShowBalances] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [myVaults, setMyVaults] = useState<Vault[]>([]);
  const [currentPage, setCurrentPage] = useState<'discover' | 'my-vaults' | 'info'>('discover');
  const [sortBy, setSortBy] = useState<'7d' | '30d' | 'tvl' | 'new'>('7d');

  // Load vaults function (moved outside useEffect so it can be reused)
  const loadVaults = async () => {
    try {
      console.log('Loading vaults...');
      const response = await fetch('/api/vaults');
      const data = await response.json();
      if (data.success && data.vaults) {
        setVaults(data.vaults);
        console.log('Vaults loaded:', data.vaults.length);
      }
    } catch (error) {
      console.error('Error loading vaults:', error);
    }
  };

  // Update userAddress when wallet connects
  useEffect(() => {
    if (walletAddress) {
      setUserAddress(walletAddress);
    }
  }, [walletAddress]);

  // Initial load
  useEffect(() => {
    const loadUserContext = async () => {
      try {
        const isInMiniApp = await sdk.isInMiniApp();
        
        if (isInMiniApp) {
          const context = await sdk.context;
          setUser(context.user);
          
          // Try to get wallet address from context (if available in the SDK)
          // Note: You may need to adjust this based on the actual SDK implementation
          if (context.user) {
            // The wallet address might be in different locations depending on SDK version
            // Check the actual context structure
            const address = (context.user as any).walletAddress ||
                          (context.user as any).address ||
                          null;
            if (address && !walletAddress) {
              setUserAddress(address);
            }
          }
        }
      } catch (error) {
        console.error("Error loading user context:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const initializeApp = async () => {
      await loadUserContext();
      await loadVaults();
      
      // Signal that the app is ready to display
      try {
        await sdk.actions.ready();
      } catch (error) {
        console.error('Error calling sdk.actions.ready():', error);
      }
    };

    initializeApp();
  }, []);

  // Reload vaults when page becomes visible or window gains focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page became visible, reloading vaults...');
        loadVaults();
      }
    };

    const handleFocus = () => {
      console.log('Window focused, reloading vaults...');
      loadVaults();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Reload vaults when navigating to discover page
  useEffect(() => {
    if (currentPage === 'discover') {
      console.log('Navigated to discover page, reloading vaults...');
      loadVaults();
    }
  }, [currentPage]);

  // Load user's vaults when address changes
  useEffect(() => {
    if (userAddress) {
      loadMyVaults();
    }
  }, [userAddress]);

  const loadMyVaults = async () => {
    // For now, My Vaults shows empty (no investments yet)
    // TODO: Implement when buy functionality is added
    setMyVaults([]);
  };

  const openVaultDetail = (vault: Vault) => {
    // Navigate to vault detail page
    router.push(`/vault/${vault.address}`);
  };

  // Sort vaults based on selected criteria
  const sortedVaults = React.useMemo(() => {
    const sorted = [...vaults];
    switch (sortBy) {
      case '7d':
        return sorted.sort((a, b) => b.performance7d - a.performance7d);
      case '30d':
        return sorted.sort((a, b) => (b.performance30d || 0) - (a.performance30d || 0));
      case 'tvl':
        return sorted.sort((a, b) => b.tvl - a.tvl);
      case 'new':
        // Sort by ID descending (newer vaults have higher IDs)
        return sorted.sort((a, b) => b.id - a.id);
      default:
        return sorted;
    }
  }, [vaults, sortBy]);

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <h1 className="header-title">CO-INVEST</h1>
          <div className="wallet-chip">
            <UserProfile onBalancesClick={() => setShowBalances(!showBalances)} />
          </div>
        </div>
      </header>

      {/* Balances Dropdown */}
      {userAddress && showBalances && (
        <div className="balances-dropdown">
          <UserBalances address={userAddress} />
        </div>
      )}

      {/* Main Content Area */}
      <main className="main-content">
        {/* Discover Page */}
        <div id="discover-page" className={`page ${currentPage === 'discover' ? 'active' : ''}`} style={{display: currentPage === 'discover' ? 'block' : 'none'}}>
          {/* Demo Warning */}
          <div className="demo-warning">
            ⚠️ Demo Version: While our ERC-4626 vault smart contracts are fully implemented and ready for deployment, we're using default addresses for demo purposes to avoid expensive contract deployments. Users can still purchase into demo funds through Account Abstraction (AA) transactions, with operations bundled as UserOperations via the EntryPoint contract (ERC-4337). No new vaults are minted in this demo, but the complete implementation including contracts and vault factory is ready for production deployment.
          </div>

          {/* Trust Indicators */}
          <TrustIndicators />
          
          <div className="page-header">
            <div className="sort-chips">
              <button
                className={`chip ${sortBy === '7d' ? 'active' : ''}`}
                onClick={() => setSortBy('7d')}
              >
                7D Return
              </button>
              <button
                className={`chip ${sortBy === '30d' ? 'active' : ''}`}
                onClick={() => setSortBy('30d')}
              >
                30D
              </button>
              <button
                className={`chip ${sortBy === 'tvl' ? 'active' : ''}`}
                onClick={() => setSortBy('tvl')}
              >
                TVL
              </button>
              <button
                className={`chip ${sortBy === 'new' ? 'active' : ''}`}
                onClick={() => setSortBy('new')}
              >
                New
              </button>
            </div>
          </div>
          
          <div id="vault-list" className="vault-list">
            {sortedVaults.length > 0 ? (
              sortedVaults.map((vault) => (
                <div key={vault.id} className="vault-card" onClick={() => openVaultDetail(vault)}>
                  <div className="vault-card-header">
                    <div className="vault-name">{vault.name}</div>
                    <div className="vault-subline">
                      by {vault.manager} · Exit {vault.exitFee}%
                    </div>
                  </div>
                  <div className="vault-metrics">
                    <div className="vault-metric">
                      TVL <span>${vault.tvl.toLocaleString()}</span>
                    </div>
                    <div className={`vault-metric ${vault.performance7d >= 0 ? 'positive' : 'negative'}`}>
                      7D <span>{vault.performance7d >= 0 ? '+' : ''}{vault.performance7d.toFixed(1)}%</span>
                    </div>
                  </div>
                  {/* NO badges, NO buy button - consistent across all filters */}
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>Loading vaults...</p>
              </div>
            )}
          </div>
        </div>

        {/* My Vaults Page */}
        <div id="my-vaults-page" className={`page ${currentPage === 'my-vaults' ? 'active' : ''}`} style={{display: currentPage === 'my-vaults' ? 'block' : 'none'}}>
          <h2 className="page-title">My Vaults</h2>
          <div id="my-vaults-list" className="vault-list">
            <div className="empty-state">
              <p>You haven&apos;t bought any vault shares yet.</p>
              <button className="btn-primary" onClick={() => setCurrentPage('discover')}>
                Discover Vaults
              </button>
            </div>
          </div>
        </div>

        {/* Info/FAQ Page */}
        <div id="info-page" className={`page ${currentPage === 'info' ? 'active' : ''}`} style={{display: currentPage === 'info' ? 'block' : 'none'}}>
          <FAQ />
        </div>

      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button className={`nav-item ${currentPage === 'discover' ? 'active' : ''}`} onClick={() => setCurrentPage('discover')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>Discover</span>
        </button>
        <button className={`nav-item ${currentPage === 'my-vaults' ? 'active' : ''}`} onClick={() => setCurrentPage('my-vaults')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 7C3 5.89543 3.89543 5 5 5H19C20.1046 5 21 5.89543 21 7V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V7Z" stroke="currentColor" strokeWidth="2"/>
            <path d="M3 10H21" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <span>My Vaults</span>
        </button>
        <button className={`nav-item ${currentPage === 'info' ? 'active' : ''}`} onClick={() => setCurrentPage('info')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>Info</span>
        </button>
        <button className="nav-item" onClick={() => window.location.href = '/manager'}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 4.75L19.25 9L12 13.25L4.75 9L12 4.75Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9.25 12L4.75 15L12 19.25L19.25 15L14.75 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Manager</span>
        </button>
      </nav>

      {/* Toast Notification */}
      <div id="toast" className="toast"></div>

      <style jsx>{`
        .demo-warning {
          background: rgba(255, 193, 7, 0.1);
          border: 1px solid rgba(255, 193, 7, 0.2);
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 20px;
          color: #ffc107;
          max-width: 1000px;
          font-size: 13px;
          line-height: 1.5;
          margin: 20px auto;
        }

        .balances-dropdown {
          position: fixed;
          top: 60px;
          right: 20px;
          z-index: 1000;
          background: #1a1b1e;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        .auth-required {
          padding: 24px;
          text-align: center;
          color: rgba(255, 255, 255, 0.7);
        }
        .wallet-chip {
          transition: opacity 0.2s;
        }
        .vault-card {
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .vault-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 82, 255, 0.2);
        }
        .vault-card:active {
          transform: translateY(0);
        }
        #discover-page {
          display: block;
        }
        #discover-page.active {
          display: block;
        }
      `}</style>
    </>
  );
}