'use client';

export default function VaultApp() {
  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <h1 className="header-title">CO-INVEST</h1>
          <div className="wallet-chip">
            <span className="wallet-label">USDC:</span>
            <span className="wallet-balance">240.00</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Discover Page */}
        <div id="discover-page" className="page active">
          <div className="page-header">
            <div className="sort-chips">
              <button className="chip active" data-sort="7d">7D Return</button>
              <button className="chip" data-sort="30d">30D</button>
              <button className="chip" data-sort="tvl">TVL</button>
              <button className="chip" data-sort="new">New</button>
            </div>
          </div>
          
          <div id="vault-list" className="vault-list">
            {/* Vault cards will be inserted here by client-side JS */}
          </div>

          <div id="discover-empty" className="empty-state" style={{display: 'none'}}>
            <p>No vaults yet. Save to get notified when a manager launches one.</p>
            <button className="btn-secondary">Save App</button>
          </div>
        </div>

        {/* Vault Detail Page */}
        <div id="vault-detail-page" className="page">
          <div className="detail-header">
            <button className="back-btn">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <div className="detail-title-section">
              <h2 id="vault-detail-name" className="vault-detail-name"></h2>
              <div id="vault-detail-manager" className="vault-manager-avatar"></div>
            </div>
          </div>

          <div className="vault-detail-content">
            <button onClick={() => (window as any).app?.downloadChartImage?.()} style={{width: '100%', padding: '12px', background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M4 16L4 17C4 18.6569 5.34315 20 7 20L17 20C18.6569 20 20 18.6569 20 17L20 16M16 12L12 16M12 16L8 12M12 16L12 4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Share Performance Chart
            </button>
            <div className="hero-section">
              <div className="performance-pill" id="vault-perf-pill"></div>
              <div className="nav-chart">
                <canvas id="nav-sparkline" width="300" height="80"></canvas>
              </div>
              <div className="chart-period-toggle">
                <button className="period-btn" data-period="24h">24h</button>
                <button className="period-btn active" data-period="7d">7D</button>
                <button className="period-btn" data-period="30d">30D</button>
                <button className="period-btn" data-period="all">All</button>
              </div>
            </div>

            <div className="metrics-row">
              <div className="metric">
                <span className="metric-label">TVL</span>
                <span className="metric-value" id="vault-tvl"></span>
              </div>
              <div className="metric">
                <span className="metric-label">7D</span>
                <span className="metric-value" id="vault-7d"></span>
              </div>
              <div className="metric">
                <span className="metric-label">30D</span>
                <span className="metric-value" id="vault-30d"></span>
              </div>
              <div className="metric">
                <span className="metric-label">Exit Fee</span>
                <span className="metric-value" id="vault-exit-fee"></span>
              </div>
              <div className="metric">
                <span className="metric-label">Lockup</span>
                <span className="metric-value" id="vault-lockup"></span>
              </div>
            </div>

            <div id="allocation-chips" className="allocation-chips"></div>

            <div className="manager-strip">
              <span>by <span id="manager-name"></span></span>
            </div>

            {/* Your Position Section */}
            <div id="position-section" className="position-section" style={{display: 'none'}}>
              <h3>Your Position</h3>
              <div className="position-details">
                <div className="position-stat">
                  <span className="label">Position Value</span>
                  <span className="value" id="position-value"></span>
                </div>
                <div className="position-stat">
                  <span className="label">Total Shares</span>
                  <span className="value" id="position-shares"></span>
                </div>
                <div className="position-stat">
                  <span className="label">PnL</span>
                  <span className="value" id="position-pnl"></span>
                </div>
              </div>
              
              <div id="tranches-list" className="tranches-list"></div>
            </div>

            {/* Disclosures */}
            <div className="disclosures">
              <div className="disclosure-item">
                <h4>Strategy Disclosed (EAS)</h4>
                <p>Whitelisted tokens/pools · Slippage ≤0.5% · Trade ≤20% TVL</p>
              </div>
              <div className="disclosure-item">
                <h4>Fee Disclosed (EAS)</h4>
                <p>Exit 1.00% (0.50% platform / 0.50% manager) · 48h timelock on changes</p>
              </div>
            </div>

            {/* Safety Banner */}
            <div className="safety-banner">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L3 5V9C3 13.5 6 17 10 18C14 17 17 13.5 17 9V5L10 2Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              </svg>
              <p>Non-custodial. Manager can&apos;t withdraw your funds. Trades fenced on-chain (≤0.5% slippage, ≤20% TVL). Withdraw anytime after lockup.</p>
            </div>
          </div>

          {/* Action Area */}
          <div className="action-area">
            <div className="wallet-balance-line">
              <span>USDC available:</span>
              <span className="balance">240.00</span>
            </div>

            {/* Buy/Sell Tabs */}
            <div id="action-tabs" className="action-tabs" style={{display: 'none'}}>
              <button className="tab-btn active" data-tab="buy">Buy</button>
              <button className="tab-btn" data-tab="sell">Sell</button>
            </div>

            {/* Buy Panel */}
            <div id="buy-panel" className="action-panel">
              <div className="input-group">
                <input type="text" inputMode="decimal" id="buy-amount" className="amount-input" placeholder="0.00" step="0.01" min="0"/>
                <span className="input-suffix">USDC</span>
              </div>
              <div className="quick-chips">
                <button className="quick-chip" data-amount="10">+10</button>
                <button className="quick-chip" data-amount="20">+20</button>
                <button className="quick-chip" data-amount="50">+50</button>
                <button className="quick-chip" data-amount="max">MAX</button>
              </div>
              
              <div className="preview-section">
                <div className="preview-item">
                  <span>Shares you&apos;ll receive</span>
                  <span id="shares-preview">0.0000</span>
                </div>
                <div className="preview-item">
                  <span>Unlock date/time</span>
                  <span id="unlock-preview"></span>
                </div>
                <div className="preview-item">
                  <span>Deposit fee</span>
                  <span>0%</span>
                </div>
              </div>

              <button id="buy-btn" className="btn-primary" disabled>Buy Shares</button>
              
              <div className="action-notes">
                <p>New shares lock for 7 days.</p>
                <p className="gasless-note">Gas-free · Powered by Base Paymaster</p>
              </div>
            </div>

            {/* Sell Panel */}
            <div id="sell-panel" className="action-panel" style={{display: 'none'}}>
              <div className="unlocked-info">
                <span>Unlocked shares:</span>
                <span id="unlocked-shares">0.0000 (~0.00 USDC)</span>
              </div>
              
              <div className="input-group">
                <input type="text" inputMode="decimal" id="sell-amount" className="amount-input" placeholder="0.0000" step="0.0001" min="0"/>
                <span className="input-suffix">shares</span>
              </div>
              <input type="range" id="sell-slider" className="sell-slider" min="0" max="100" defaultValue="0"/>
              
              <div className="preview-section">
                <div className="preview-item">
                  <span>Exit fee 1.00%</span>
                  <span className="fee-split">0.50% platform / 0.50% manager</span>
                </div>
                <div className="preview-item bold">
                  <span>Net you receive</span>
                  <span id="net-receive">0.00 USDC</span>
                </div>
              </div>

              <p className="sell-note">Vault may sell a small portion of assets to pay USDC (slippage ≤0.5%).</p>

              <button id="sell-btn" className="btn-primary" disabled>Sell Shares</button>
            </div>
          </div>
        </div>

        {/* My Vaults Page */}
        <div id="my-vaults-page" className="page">
          <h2 className="page-title">My Vaults</h2>
          <div id="my-vaults-list" className="my-vaults-list">
            {/* User's vault holdings will be inserted here */}
          </div>
          <div id="my-vaults-empty" className="empty-state">
            <p>You haven&apos;t bought any vault shares yet.</p>
            <button className="btn-primary">Discover Vaults</button>
          </div>
        </div>

      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button className="nav-item active" data-page="discover">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>Discover</span>
        </button>
        <button className="nav-item" data-page="my-vaults">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 7C3 5.89543 3.89543 5 5 5H19C20.1046 5 21 5.89543 21 7V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V7Z" stroke="currentColor" strokeWidth="2"/>
            <path d="M3 10H21" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <span>My Vaults</span>
        </button>
        <button className="nav-item" data-page="manager" onClick={() => window.location.href = '/manager'}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 4.75L19.25 9L12 13.25L4.75 9L12 4.75Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9.25 12L4.75 15L12 19.25L19.25 15L14.75 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Manager</span>
        </button>
      </nav>

      {/* Toast Notification */}
      <div id="toast" className="toast"></div>
    </>
  );
}