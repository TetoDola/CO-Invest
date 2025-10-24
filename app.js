
// ===== Application State =====
const state = {
    currentPage: 'discover',
    currentVault: null,
    userBalance: 240.00,
    userVaults: [],
    activities: [],
    vaults: [
        {
            id: 1,
            name: "Start Fund",
            manager: "whale.eth",
            managerAddress: "0x1234...5678",
            exitFee: 1.0,
            tvl: 9200,
            performance7d: 3.4,
            performance30d: 12.8,
            lockupDays: 7,
            allocation: [
                { token: 'USDC', percentage: 62 },
                { token: 'wstETH', percentage: 38 }
            ],
            nav: 1.0234,
            navHistory: [1.00, 1.01, 1.005, 1.015, 1.02, 1.018, 1.0234],
            strategyDisclosed: true,
            feeDisclosed: true
        },
        {
            id: 2,
            name: "Blue Chip DeFi Vault",
            manager: "defi.pro",
            managerAddress: "0xabcd...efgh",
            exitFee: 1.0,
            tvl: 15400,
            performance7d: 2.1,
            performance30d: 8.5,
            lockupDays: 7,
            allocation: [
                { token: 'WETH', percentage: 45 },
                { token: 'USDC', percentage: 35 },
                { token: 'wstETH', percentage: 20 }
            ],
            nav: 1.0156,
            navHistory: [1.00, 1.005, 1.008, 1.012, 1.014, 1.015, 1.0156],
            strategyDisclosed: true,
            feeDisclosed: true
        },
        {
            id: 3,
            name: "Stable Yields Max",
            manager: "yield.master",
            managerAddress: "0x9876...5432",
            exitFee: 1.0,
            tvl: 28600,
            performance7d: 0.8,
            performance30d: 3.2,
            lockupDays: 7,
            allocation: [
                { token: 'USDC', percentage: 70 },
                { token: 'DAI', percentage: 30 }
            ],
            nav: 1.0087,
            navHistory: [1.00, 1.002, 1.004, 1.006, 1.007, 1.008, 1.0087],
            strategyDisclosed: true,
            feeDisclosed: true
        },
        {
            id: 4,
            name: "ETH Supremacy Fund",
            manager: "eth.bull",
            managerAddress: "0x5555...6666",
            exitFee: 1.0,
            tvl: 6800,
            performance7d: -1.2,
            performance30d: 5.4,
            lockupDays: 7,
            allocation: [
                { token: 'WETH', percentage: 80 },
                { token: 'USDC', percentage: 20 }
            ],
            nav: 0.9912,
            navHistory: [1.00, 0.998, 0.995, 0.993, 0.990, 0.992, 0.9912],
            strategyDisclosed: true,
            feeDisclosed: true
        }
    ]
};

// ===== Application Core =====
const app = {
    init() {
        this.setupEventListeners();
        this.renderDiscoverPage();
        this.renderMyVaults();
        
        // Check if there's a vault parameter in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const vaultAddress = urlParams.get('vault');
        if (vaultAddress) {
            // Find vault by address and open it
            const vault = state.vaults.find(v => v.address.toLowerCase() === vaultAddress.toLowerCase());
            if (vault) {
                setTimeout(() => this.openVaultDetail(vault.id), 100);
            }
        }
    },

    setupEventListeners() {
        // Bottom navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.navigateTo(page);
            });
        });

        // Sort and filter chips
        document.querySelectorAll('.sort-chips .chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                document.querySelectorAll('.sort-chips .chip').forEach(c => c.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.renderDiscoverPage();
            });
        });


        // Buy/Sell tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                
                if (tab === 'buy') {
                    document.getElementById('buy-panel').style.display = 'block';
                    document.getElementById('sell-panel').style.display = 'none';
                } else {
                    document.getElementById('buy-panel').style.display = 'none';
                    document.getElementById('sell-panel').style.display = 'block';
                }
            });
        });

        // Buy amount input and quick chips
        const buyInput = document.getElementById('buy-amount');
        buyInput.addEventListener('input', (e) => {
            // Convert comma to dot for European keyboard users
            e.target.value = e.target.value.replace(/,/g, '.');
            this.updateBuyPreview();
        });

        document.querySelectorAll('.quick-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                const amount = e.currentTarget.dataset.amount;
                if (amount === 'max') {
                    buyInput.value = state.userBalance.toFixed(2);
                } else {
                    buyInput.value = amount;
                }
                this.updateBuyPreview();
            });
        });

        // Buy button
        document.getElementById('buy-btn').addEventListener('click', () => this.handleBuyShares());

        // Sell amount input and slider
        const sellInput = document.getElementById('sell-amount');
        const sellSlider = document.getElementById('sell-slider');

        sellInput.addEventListener('input', (e) => {
            // Convert comma to dot for European keyboard users
            e.target.value = e.target.value.replace(/,/g, '.');
            this.updateSellPreview();
            if (state.currentVault) {
                const userVault = this.getUserVaultHolding(state.currentVault.id);
                if (userVault) {
                    const percentage = (parseFloat(sellInput.value) / userVault.unlockedShares) * 100;
                    sellSlider.value = percentage;
                }
            }
        });

        sellSlider.addEventListener('input', (e) => {
            if (state.currentVault) {
                const userVault = this.getUserVaultHolding(state.currentVault.id);
                if (userVault) {
                    const shares = (userVault.unlockedShares * parseFloat(e.target.value)) / 100;
                    sellInput.value = shares.toFixed(4);
                    this.updateSellPreview();
                }
            }
        });

        // Sell button
        document.getElementById('sell-btn').addEventListener('click', () => this.handleSellShares());

        // Chart period toggle
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.renderSparkline(state.currentVault);
            });
        });
    },

    navigateTo(page) {
        state.currentPage = page;
        
        // Update nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) {
                item.classList.add('active');
            }
        });

        // Show correct page
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(`${page}-page`).classList.add('active');

        // Refresh page content
        if (page === 'my-vaults') {
            this.renderMyVaults();
        }
    },

    renderDiscoverPage() {
        const container = document.getElementById('vault-list');
        const emptyState = document.getElementById('discover-empty');

        if (state.vaults.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }

        container.style.display = 'grid';
        emptyState.style.display = 'none';

        container.innerHTML = state.vaults.map(vault => `
            <div class="vault-card" onclick="app.openVaultDetail(${vault.id})">
                <div class="vault-card-header">
                    <div class="vault-name">${vault.name}</div>
                    <div class="vault-subline">
                        by ${vault.manager} · Exit ${vault.exitFee}%
                    </div>
                </div>
                <div class="vault-metrics">
                    <div class="vault-metric">
                        TVL <span>$${this.formatNumber(vault.tvl)}</span>
                    </div>
                    <div class="vault-metric ${vault.performance7d >= 0 ? 'positive' : 'negative'}">
                        7D <span>${vault.performance7d >= 0 ? '+' : ''}${vault.performance7d.toFixed(1)}%</span>
                    </div>
                </div>
                <div class="vault-badges">
                    ${vault.strategyDisclosed ? '<span class="badge">Strategy Disclosed</span>' : ''}
                    ${vault.feeDisclosed ? '<span class="badge">Fee Disclosed</span>' : ''}
                </div>
                <div class="vault-actions">
                    <button class="btn-primary" onclick="event.stopPropagation(); app.openVaultDetail(${vault.id}, true)">
                        Buy Shares
                    </button>
                </div>
            </div>
        `).join('');
    },

    openVaultDetail(vaultId, focusBuy = false) {
        const vault = state.vaults.find(v => v.id === vaultId);
        if (!vault) return;

        state.currentVault = vault;
        
        // Update detail page
        document.getElementById('vault-detail-name').textContent = vault.name;
        document.getElementById('manager-name').textContent = vault.manager;
        
        // Performance pill
        const perfPill = document.getElementById('vault-perf-pill');
        perfPill.textContent = `7D ${vault.performance7d >= 0 ? '+' : ''}${vault.performance7d.toFixed(1)}%`;
        perfPill.className = `performance-pill ${vault.performance7d < 0 ? 'negative' : ''}`;
        
        // Metrics
        document.getElementById('vault-tvl').textContent = `$${this.formatNumber(vault.tvl)}`;
        document.getElementById('vault-7d').textContent = `${vault.performance7d >= 0 ? '+' : ''}${vault.performance7d.toFixed(1)}%`;
        document.getElementById('vault-30d').textContent = `${vault.performance30d >= 0 ? '+' : ''}${vault.performance30d.toFixed(1)}%`;
        document.getElementById('vault-exit-fee').textContent = `${vault.exitFee}%`;
        document.getElementById('vault-lockup').textContent = `${vault.lockupDays}d`;
        
        // Allocation chips
        const allocationContainer = document.getElementById('allocation-chips');
        allocationContainer.innerHTML = vault.allocation.map(a => 
            `<div class="allocation-chip">${a.token} ${a.percentage}%</div>`
        ).join('');
        
        // Render chart
        this.renderSparkline(vault);
        
        // Check if user has position
        const userVault = this.getUserVaultHolding(vaultId);
        if (userVault) {
            // Calculate unlocked shares
            userVault.unlockedShares = userVault.tranches
                .filter(t => new Date(t.unlockDate) <= new Date())
                .reduce((sum, t) => sum + t.shares, 0);
            this.showPositionSection(userVault, vault);
        } else {
            document.getElementById('position-section').style.display = 'none';
            document.getElementById('action-tabs').style.display = 'none';
            document.getElementById('buy-panel').style.display = 'block';
        }

        // Update unlock preview
        this.updateBuyPreview();
        
        // Navigate to detail page
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById('vault-detail-page').classList.add('active');
    },

    showPositionSection(userVault, vault) {
        const positionSection = document.getElementById('position-section');
        positionSection.style.display = 'block';
        
        const positionValue = userVault.totalShares * vault.nav;
        const pnl = positionValue - userVault.totalInvested;
        const pnlPercent = (pnl / userVault.totalInvested) * 100;
        
        document.getElementById('position-value').textContent = `$${positionValue.toFixed(2)}`;
        document.getElementById('position-shares').textContent = userVault.totalShares.toFixed(4);
        
        const pnlElement = document.getElementById('position-pnl');
        pnlElement.textContent = `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%)`;
        pnlElement.style.color = pnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)';
        
        // Render tranches
        const tranchesContainer = document.getElementById('tranches-list');
        tranchesContainer.innerHTML = userVault.tranches.map(tranche => {
            if (!tranche || tranche.amount === undefined) return '';
            
            const isUnlocked = new Date(tranche.unlockDate) <= new Date();
            const timeToUnlock = this.getTimeToUnlock(tranche.unlockDate);
            
            return `
                <div class="tranche-item">
                    <div class="tranche-info">
                        Deposited ${tranche.amount.toFixed(2)} USDC · ${isUnlocked ? 'Unlocked' : `Unlocks ${timeToUnlock}`}
                    </div>
                    <div class="tranche-status ${isUnlocked ? 'unlocked' : 'locked'}">
                        ${isUnlocked ? 'Unlocked' : 'Locked'}
                    </div>
                </div>
            `;
        }).join('');
        
        // Show tabs if user has unlocked shares
        if (userVault.unlockedShares > 0) {
            document.getElementById('action-tabs').style.display = 'flex';
            this.updateSellPanel(userVault, vault);
        } else {
            document.getElementById('action-tabs').style.display = 'none';
        }
    },

    updateSellPanel(userVault, vault) {
        if (!userVault || !vault || userVault.unlockedShares === undefined) {
            return;
        }
        
        const unlockedValue = userVault.unlockedShares * vault.nav;
        document.getElementById('unlocked-shares').textContent =
            `${userVault.unlockedShares.toFixed(4)} (~${unlockedValue.toFixed(2)} USDC)`;
        
        const sellSlider = document.getElementById('sell-slider');
        sellSlider.max = userVault.unlockedShares;
    },

    updateBuyPreview() {
        const amount = parseFloat(document.getElementById('buy-amount').value) || 0;
        const buyBtn = document.getElementById('buy-btn');
        
        if (amount <= 0 || amount > state.userBalance) {
            buyBtn.disabled = true;
        } else {
            buyBtn.disabled = false;
        }
        
        if (state.currentVault) {
            const shares = amount / state.currentVault.nav;
            document.getElementById('shares-preview').textContent = shares.toFixed(4);
            
            const unlockDate = new Date();
            unlockDate.setDate(unlockDate.getDate() + state.currentVault.lockupDays);
            document.getElementById('unlock-preview').textContent = this.formatDate(unlockDate);
        }
    },

    updateSellPreview() {
        const shares = parseFloat(document.getElementById('sell-amount').value) || 0;
        const sellBtn = document.getElementById('sell-btn');
        
        if (!state.currentVault) {
            sellBtn.disabled = true;
            document.getElementById('net-receive').textContent = '0.00 USDC';
            return;
        }
        
        const userVault = this.getUserVaultHolding(state.currentVault.id);
        if (!userVault || shares <= 0 || shares > userVault.unlockedShares) {
            sellBtn.disabled = true;
        } else {
            sellBtn.disabled = false;
        }
        
        if (shares > 0) {
            const grossValue = shares * state.currentVault.nav;
            const fee = grossValue * (state.currentVault.exitFee / 100);
            const netValue = grossValue - fee;
            
            document.getElementById('net-receive').textContent = `${netValue.toFixed(2)} USDC`;
        } else {
            document.getElementById('net-receive').textContent = '0.00 USDC';
        }
    },

    handleBuyShares() {
        const amount = parseFloat(document.getElementById('buy-amount').value);
        if (!amount || amount <= 0 || amount > state.userBalance) return;
        
        const vault = state.currentVault;
        const shares = amount / vault.nav;
        const unlockDate = new Date();
        unlockDate.setDate(unlockDate.getDate() + vault.lockupDays);
        
        // Update user balance
        state.userBalance -= amount;
        document.querySelector('.wallet-chip .wallet-balance').textContent = state.userBalance.toFixed(2);
        document.querySelector('.wallet-balance-line .balance').textContent = state.userBalance.toFixed(2);
        
        // Add or update user vault holding
        let userVault = this.getUserVaultHolding(vault.id);
        if (!userVault) {
            userVault = {
                vaultId: vault.id,
                totalShares: 0,
                totalInvested: 0,
                unlockedShares: 0,
                tranches: []
            };
            state.userVaults.push(userVault);
        }
        
        userVault.totalShares += shares;
        userVault.totalInvested += amount;
        userVault.tranches.push({
            amount: amount,
            shares: shares,
            unlockDate: unlockDate.toISOString()
        });
        
        // Add activity
        state.activities.unshift({
            type: 'buy',
            vaultId: vault.id,
            vaultName: vault.name,
            amount: amount,
            shares: shares,
            timestamp: new Date().toISOString()
        });
        
        // Reset form
        document.getElementById('buy-amount').value = '';
        this.updateBuyPreview();
        
        // Show toast
        this.showToast(`Bought ${amount.toFixed(2)} USDC of ${vault.name} · Unlocks ${this.formatDate(unlockDate)}`);
        
        // Refresh detail page
        this.openVaultDetail(vault.id);
        this.renderMyVaults();
    },

    handleSellShares() {
        const shares = parseFloat(document.getElementById('sell-amount').value);
        const userVault = this.getUserVaultHolding(state.currentVault.id);
        
        if (!shares || shares <= 0 || !userVault || shares > userVault.unlockedShares) return;
        
        const vault = state.currentVault;
        const grossValue = shares * vault.nav;
        const fee = grossValue * (vault.exitFee / 100);
        const netValue = grossValue - fee;
        
        // Update user balance
        state.userBalance += netValue;
        document.querySelector('.wallet-chip .wallet-balance').textContent = state.userBalance.toFixed(2);
        document.querySelector('.wallet-balance-line .balance').textContent = state.userBalance.toFixed(2);
        
        // Update user vault
        userVault.totalShares -= shares;
        userVault.unlockedShares -= shares;
        
        // Remove tranches (FIFO)
        let sharesToRemove = shares;
        userVault.tranches = userVault.tranches.filter(tranche => {
            if (sharesToRemove <= 0) return true;
            if (new Date(tranche.unlockDate) > new Date()) return true; // Keep locked
            
            if (tranche.shares <= sharesToRemove) {
                sharesToRemove -= tranche.shares;
                return false; // Remove this tranche
            } else {
                tranche.shares -= sharesToRemove;
                tranche.amount = tranche.shares * vault.nav;
                sharesToRemove = 0;
                return true;
            }
        });
        
        // Remove vault if no shares left
        if (userVault.totalShares <= 0.0001) {
            state.userVaults = state.userVaults.filter(v => v.vaultId !== vault.id);
        }
        
        // Add activity
        state.activities.unshift({
            type: 'sell',
            vaultId: vault.id,
            vaultName: vault.name,
            shares: shares,
            netValue: netValue,
            fee: fee,
            timestamp: new Date().toISOString()
        });
        
        // Reset form
        document.getElementById('sell-amount').value = '';
        document.getElementById('sell-slider').value = '0';
        this.updateSellPreview();
        
        // Show toast
        this.showToast(`Sold ${shares.toFixed(4)} shares → ${netValue.toFixed(2)} USDC net (${vault.exitFee}% exit fee)`);
        
        // Refresh pages
        if (userVault.totalShares > 0) {
            this.openVaultDetail(vault.id);
        } else {
            this.navigateTo('my-vaults');
        }
        this.renderMyVaults();
    },

    renderMyVaults() {
        const container = document.getElementById('my-vaults-list');
        const emptyState = document.getElementById('my-vaults-empty');
        
        // Update unlocked shares for all vaults
        state.userVaults.forEach(userVault => {
            userVault.unlockedShares = userVault.tranches
                .filter(t => new Date(t.unlockDate) <= new Date())
                .reduce((sum, t) => sum + t.shares, 0);
        });
        
        if (state.userVaults.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }
        
        container.style.display = 'flex';
        emptyState.style.display = 'none';
        
        container.innerHTML = state.userVaults.map(userVault => {
            const vault = state.vaults.find(v => v.id === userVault.vaultId);
            if (!vault) return '';
            
            const positionValue = userVault.totalShares * vault.nav;
            const nextUnlock = userVault.tranches
                .filter(t => new Date(t.unlockDate) > new Date())
                .sort((a, b) => new Date(a.unlockDate) - new Date(b.unlockDate))[0];
            
            const unlockStatus = userVault.unlockedShares > 0 
                ? { text: 'Unlocked', class: 'unlocked' }
                : nextUnlock 
                    ? { text: `Unlocks ${this.getTimeToUnlock(nextUnlock.unlockDate)}`, class: 'locked' }
                    : { text: 'No unlocks', class: 'locked' };
            
            return `
                <div class="my-vault-card">
                    <div class="my-vault-header">
                        <div class="my-vault-info">
                            <h3>${vault.name}</h3>
                            <div class="performance-pill ${vault.performance7d < 0 ? 'negative' : ''}" style="font-size: 14px; margin-top: 8px;">
                                7D ${vault.performance7d >= 0 ? '+' : ''}${vault.performance7d.toFixed(1)}%
                            </div>
                        </div>
                    </div>
                    <div class="my-vault-stats">
                        <div class="my-vault-stat">
                            <span class="label">Position Value</span>
                            <span class="value">$${positionValue.toFixed(2)}</span>
                        </div>
                        <div class="my-vault-stat">
                            <span class="label">Total Shares</span>
                            <span class="value">${userVault.totalShares.toFixed(4)}</span>
                        </div>
                        <div class="my-vault-stat">
                            <span class="label">Status</span>
                            <span class="unlock-chip ${unlockStatus.class}">${unlockStatus.text}</span>
                        </div>
                    </div>
                    <div class="my-vault-actions">
                        <button class="btn-secondary" onclick="app.openVaultDetail(${vault.id}, true)">
                            Buy Shares
                        </button>
                        <button class="btn-primary" onclick="app.openVaultDetail(${vault.id})" ${userVault.unlockedShares === 0 ? 'disabled' : ''}>
                            Sell Shares
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },


    renderSparkline(vault) {
        const canvas = document.getElementById('nav-sparkline');
        const ctx = canvas.getContext('2d');
        const data = vault.navHistory;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Check if vault has data (needs at least 2 data points for a graph)
        if (vault.hasData === false || !data || data.length < 2) {
            // Display "No data available" message
            ctx.fillStyle = '#6b7280';
            ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
            return;
        }
        
        const padding = 10;
        const width = canvas.width - padding * 2;
        const height = canvas.height - padding * 2;
        
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;
        
        // Draw line
        ctx.beginPath();
        ctx.strokeStyle = vault.performance7d >= 0 ? '#10b981' : '#ef4444';
        ctx.lineWidth = 2;
        
        data.forEach((value, i) => {
            const x = padding + (i / (data.length - 1)) * width;
            const y = padding + height - ((value - min) / range) * height;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Draw gradient fill
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, vault.performance7d >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
        
        ctx.lineTo(padding + width, padding + height);
        ctx.lineTo(padding, padding + height);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
    },

    getUserVaultHolding(vaultId) {
        return state.userVaults.find(v => v.vaultId === vaultId);
    },

    showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    },

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        return num.toString();
    },

    formatDate(date) {
        const d = new Date(date);
        const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return d.toLocaleDateString('en-US', options);
    },

    formatTimeAgo(timestamp) {
        const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
        
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    },

    getTimeToUnlock(unlockDate) {
        const now = new Date();
        const unlock = new Date(unlockDate);
        const diff = unlock - now;
        
        if (diff <= 0) return 'now';
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (days > 0) {
            return `in ${days}d ${hours}h`;
        }
        return `in ${hours}h`;
    },

    downloadChartImage() {
        if (!state.currentVault) return;
        
        const vault = state.currentVault;
        
        // Create a larger canvas for the download image
        const downloadCanvas = document.createElement('canvas');
        downloadCanvas.width = 1200;
        downloadCanvas.height = 800;
        const ctx = downloadCanvas.getContext('2d');
        
        // Background
        ctx.fillStyle = '#13141a';
        ctx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);
        
        // Header
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(vault.name, 60, 80);
        
        // Performance indicator
        const perfColor = vault.hasData === false ? '#6b7280' : (vault.performance7d >= 0 ? '#10b981' : '#ef4444');
        ctx.fillStyle = perfColor;
        ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const perfText = vault.hasData === false ? '7D No data' : `7D ${vault.performance7d >= 0 ? '+' : ''}${vault.performance7d.toFixed(1)}%`;
        ctx.fillText(perfText, 60, 140);
        
        // Draw chart if data available
        if (vault.hasData !== false && vault.navHistory && vault.navHistory.length >= 2) {
            const chartX = 60;
            const chartY = 200;
            const chartWidth = 1080;
            const chartHeight = 400;
            
            const data = vault.navHistory;
            const min = Math.min(...data);
            const max = Math.max(...data);
            const range = max - min || 1;
            
            // Draw grid lines
            ctx.strokeStyle = '#2a2d3a';
            ctx.lineWidth = 1;
            for (let i = 0; i <= 4; i++) {
                const y = chartY + (i * chartHeight / 4);
                ctx.beginPath();
                ctx.moveTo(chartX, y);
                ctx.lineTo(chartX + chartWidth, y);
                ctx.stroke();
            }
            
            // Draw chart line
            ctx.beginPath();
            ctx.strokeStyle = perfColor;
            ctx.lineWidth = 4;
            
            data.forEach((value, i) => {
                const x = chartX + (i / (data.length - 1)) * chartWidth;
                const y = chartY + chartHeight - ((value - min) / range) * chartHeight;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            ctx.stroke();
            
            // Draw gradient fill
            const gradient = ctx.createLinearGradient(0, chartY, 0, chartY + chartHeight);
            gradient.addColorStop(0, vault.performance7d >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)');
            gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
            
            ctx.lineTo(chartX + chartWidth, chartY + chartHeight);
            ctx.lineTo(chartX, chartY + chartHeight);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();
        } else {
            // Show "No data available" message
            ctx.fillStyle = '#6b7280';
            ctx.font = '32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('No data available', downloadCanvas.width / 2, 400);
            ctx.textAlign = 'left';
        }
        
        // Footer info
        ctx.fillStyle = '#a0a3bd';
        ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(`TVL: $${this.formatNumber(vault.tvl)}`, 60, 680);
        ctx.fillText(`Exit Fee: ${vault.exitFee}%`, 400, 680);
        ctx.fillText(`Lockup: ${vault.lockupDays}d`, 700, 680);
        
        // Watermark
        ctx.fillStyle = '#3b82f6';
        ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('CO-INVEST', 60, 750);
        
        // Convert to blob and download
        downloadCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${vault.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_performance.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showToast('Chart downloaded successfully!');
        }, 'image/png');
    }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}