'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Address } from 'viem';
import VaultBuy from '@/app/components/VaultBuy';
import VaultSell from '@/app/components/VaultSell';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS componentssdfs
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Vault {
  id: number;
  name: string;
  manager: string;
  address: Address;
  tvl: number;
  performance7d: number;
  performance30d: number;
  exitFee: number;
  lockPeriod: number;
}

export default function VaultDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vaultAddress = params.address as string;
  
  const [vault, setVault] = useState<Vault | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionMode, setActionMode] = useState<'buy' | 'sell'>('buy');
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | 'all'>('7d');

  // Function to download chart as image for sharing
  const downloadChartImage = () => {
    if (!vault) return;

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#0a0b0d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(vault.name, 60, 80);

    // Performance indicator
    const perfColor = vault.performance7d >= 0 ? '#4ade80' : '#ef4444';
    ctx.fillStyle = perfColor;
    ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`7D ${vault.performance7d >= 0 ? '+' : ''}${vault.performance7d.toFixed(1)}%`, 60, 140);

    // Draw chart
    const chartX = 60;
    const chartY = 200;
    const chartWidth = 1080;
    const chartHeight = 400;
    const data = performanceData.data;

    if (data.length >= 2) {
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
      gradient.addColorStop(0, vault.performance7d >= 0 ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)');
      gradient.addColorStop(1, 'rgba(74, 222, 128, 0)');

      ctx.lineTo(chartX + chartWidth, chartY + chartHeight);
      ctx.lineTo(chartX, chartY + chartHeight);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Footer info
    ctx.fillStyle = '#a0a3bd';
    ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`TVL: $${vault.tvl.toLocaleString()}`, 60, 680);
    ctx.fillText(`Exit Fee: ${vault.exitFee}%`, 400, 680);
    ctx.fillText(`Lockup: ${vault.lockPeriod}d`, 700, 680);

    // Watermark
    ctx.fillStyle = '#0052ff';
    ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('CO-INVEST', 60, 750);

    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${vault.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_performance.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  // Generate mock performance data
  const generatePerformanceData = (days: number) => {
    const data = [];
    const labels = [];
    let value = 10000; // Starting value
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      
      // Random walk with slight upward bias
      const change = (Math.random() - 0.45) * 100;
      value += change;
      data.push(value);
    }
    
    return { labels, data };
  };

  // Recalculate performance data when timeframe changes
  const performanceData = React.useMemo(() => {
    const daysMap = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      'all': 180
    };
    return generatePerformanceData(daysMap[timeframe]);
  }, [timeframe]);

  const chartData = React.useMemo(() => ({
    labels: performanceData.labels,
    datasets: [
      {
        label: 'Vault NAV',
        data: performanceData.data,
        borderColor: '#0052ff',
        backgroundColor: 'rgba(0, 82, 255, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        borderWidth: 2,
      },
    ],
  }), [performanceData]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#0052ff',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            return `NAV: $${context.parsed.y.toFixed(2)}`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          maxTicksLimit: 6,
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          }
        },
      },
    },
  };

  useEffect(() => {
    const loadVault = async () => {
      try {
        const response = await fetch('/api/vaults');
        const data = await response.json();
        if (data.success && data.vaults) {
          const foundVault = data.vaults.find(
            (v: Vault) => v.address.toLowerCase() === vaultAddress.toLowerCase()
          );
          if (foundVault) {
            setVault(foundVault);
          }
        }
      } catch (error) {
        console.error('Error loading vault:', error);
      } finally {
        setLoading(false);
      }
    };

    loadVault();
  }, [vaultAddress]);

  if (loading) {
    return (
      <div className="vault-detail-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading vault details...</p>
        </div>
      </div>
    );
  }

  if (!vault) {
    return (
      <div className="vault-detail-page">
        <div className="error-container">
          <h2>Vault Not Found</h2>
          <button onClick={() => router.push('/')} className="btn-primary">
            Back to Vaults
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="vault-detail-page">
      <header className="vault-header">
        <button className="back-btn" onClick={() => router.push('/')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Back
        </button>
        <div className="vault-header-info">
          <h1>{vault.name}</h1>
          <p className="manager-info">Managed by {vault.manager}</p>
        </div>
      </header>

      <main className="vault-content">
        {/* Share Button */}
        <button
          onClick={downloadChartImage}
          className="share-chart-btn"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M4 16L4 17C4 18.6569 5.34315 20 7 20L17 20C18.6569 20 20 18.6569 20 17L20 16M16 12L12 16M12 16L8 12M12 16L12 4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Share Performance Chart
        </button>

        {/* Performance Section */}
        <section className="performance-section">
          <div className="performance-header">
            <h2>Performance</h2>
            <div className="timeframe-selector">
              <button 
                className={timeframe === '7d' ? 'active' : ''} 
                onClick={() => setTimeframe('7d')}
              >
                7D
              </button>
              <button 
                className={timeframe === '30d' ? 'active' : ''} 
                onClick={() => setTimeframe('30d')}
              >
                30D
              </button>
              <button 
                className={timeframe === '90d' ? 'active' : ''} 
                onClick={() => setTimeframe('90d')}
              >
                90D
              </button>
              <button 
                className={timeframe === 'all' ? 'active' : ''} 
                onClick={() => setTimeframe('all')}
              >
                All
              </button>
            </div>
          </div>
          
          <div className="chart-container">
            <Line data={chartData} options={chartOptions} />
          </div>
        </section>

        {/* Metrics Grid */}
        <section className="metrics-grid">
          <div className="metric-card">
            <span className="metric-label">TVL</span>
            <span className="metric-value">${vault.tvl.toLocaleString()}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">7D Return</span>
            <span className={`metric-value ${vault.performance7d >= 0 ? 'positive' : 'negative'}`}>
              {vault.performance7d >= 0 ? '+' : ''}{vault.performance7d.toFixed(1)}%
            </span>
          </div>
          <div className="metric-card">
            <span className="metric-label">30D Return</span>
            <span className={`metric-value ${vault.performance30d >= 0 ? 'positive' : 'negative'}`}>
              {vault.performance30d >= 0 ? '+' : ''}{vault.performance30d.toFixed(1)}%
            </span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Exit Fee</span>
            <span className="metric-value">{vault.exitFee}%</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Lock Period</span>
            <span className="metric-value">{vault.lockPeriod} days</span>
          </div>
        </section>

        {/* Buy/Sell Section */}
        <section className="action-section">
          <div className="action-toggle">
            <button
              className={`toggle-btn ${actionMode === 'buy' ? 'active' : ''}`}
              onClick={() => setActionMode('buy')}
            >
              Buy Shares
            </button>
            <button
              className={`toggle-btn ${actionMode === 'sell' ? 'active' : ''}`}
              onClick={() => setActionMode('sell')}
            >
              Redeem Shares
            </button>
          </div>

          {actionMode === 'buy' ? (
            <VaultBuy
              vaultAddress={vault.address}
              vaultName={vault.name}
              userAddress={'0x0000000000000000000000000000000000000000' as `0x${string}`}
              onSuccess={() => {
                console.log('Purchase successful!');
              }}
            />
          ) : (
            <VaultSell
              vaultAddress={vault.address}
              vaultName={vault.name}
              userAddress={'0x0000000000000000000000000000000000000000' as `0x${string}`}
              onSuccess={() => {
                console.log('Redemption successful!');
              }}
            />
          )}
        </section>
      </main>

      <style jsx>{`
        .vault-detail-page {
          min-height: 100vh;
          background: #0a0b0d;
          color: #fff;
          padding-bottom: 40px;
        }
        .loading-container, .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          gap: 16px;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-top-color: #0052ff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .vault-header {
          padding: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #fff;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 16px;
        }
        .back-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateX(-2px);
        }
        .vault-header-info h1 {
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }
        .manager-info {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
        }
        .vault-content {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .performance-section {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
        }
        .performance-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .performance-header h2 {
          font-size: 20px;
          font-weight: 600;
          margin: 0;
        }
        .timeframe-selector {
          display: flex;
          gap: 8px;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px;
          border-radius: 8px;
        }
        .timeframe-selector button {
          padding: 6px 12px;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          font-size: 13px;
          font-weight: 600;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .timeframe-selector button.active {
          background: #0052ff;
          color: #fff;
        }
        .timeframe-selector button:hover:not(.active) {
          color: #fff;
          background: rgba(255, 255, 255, 0.1);
        }
        .chart-container {
          height: 300px;
          margin-top: 20px;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .metric-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .metric-label {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 500;
        }
        .metric-value {
          font-size: 24px;
          font-weight: 700;
          color: #fff;
        }
        .metric-value.positive {
          color: #4ade80;
        }
        .metric-value.negative {
          color: #ef4444;
        }
        .action-section {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
        }
        .action-toggle {
          display: flex;
          gap: 8px;
          padding: 4px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          margin-bottom: 16px;
        }
        .toggle-btn {
          flex: 1;
          padding: 12px 20px;
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .toggle-btn.active {
          background: rgba(0, 82, 255, 0.2);
          color: #fff;
          border: 1px solid rgba(0, 82, 255, 0.4);
        }
        .toggle-btn:hover:not(.active) {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.9);
        }
        .btn-primary {
          padding: 12px 24px;
          background: #0052ff;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-primary:hover {
          background: #0041cc;
        }
        .share-chart-btn {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .share-chart-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
        }
        .share-chart-btn:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}