'use client';

import { Address } from 'viem';

interface VaultCardProps {
  vault: {
    id: number;
    name: string;
    manager: string;
    address: Address;
    tvl: number;
    performance7d: number;
    performance30d?: number;
    exitFee: number;
    categories?: string[];
    riskLevel?: 'low' | 'medium' | 'high';
    strategy?: string;
  };
  onClick: (address: Address) => void;
  viewMode?: 'grid' | 'list';
}

export default function VaultCard({ vault, onClick, viewMode = 'grid' }: VaultCardProps) {
  return (
    <div 
      className={`vault-card ${viewMode}`} 
      onClick={() => onClick(vault.address)}
    >
      <div className="vault-card-header">
        <div className="vault-name-section">
          <h3 className="vault-name">{vault.name}</h3>
          <div className="vault-manager">
            <div className="manager-avatar">
              {vault.manager.charAt(0).toUpperCase()}
            </div>
            <span className="manager-name">{vault.manager}</span>
          </div>
        </div>
        {vault.riskLevel && (
          <div className={`risk-badge ${vault.riskLevel}`}>
            {vault.riskLevel.charAt(0).toUpperCase() + vault.riskLevel.slice(1)} Risk
          </div>
        )}
      </div>

      <div className="vault-metrics">
        <div className="metric-group">
          <div className="vault-metric tvl">
            <span className="metric-label">TVL</span>
            <span className="metric-value">${vault.tvl.toLocaleString()}</span>
          </div>
          <div className={`vault-metric performance ${vault.performance7d >= 0 ? 'positive' : 'negative'}`}>
            <span className="metric-label">7D Return</span>
            <span className="metric-value">
              {vault.performance7d >= 0 ? '+' : ''}{vault.performance7d.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="metric-group">
          {vault.performance30d !== undefined && (
            <div className={`vault-metric performance ${vault.performance30d >= 0 ? 'positive' : 'negative'}`}>
              <span className="metric-label">30D Return</span>
              <span className="metric-value">
                {vault.performance30d >= 0 ? '+' : ''}{vault.performance30d.toFixed(1)}%
              </span>
            </div>
          )}
          <div className="vault-metric fee">
            <span className="metric-label">Exit Fee</span>
            <span className="metric-value">{vault.exitFee}%</span>
          </div>
        </div>
      </div>

      {vault.categories && (
        <div className="vault-categories">
          {vault.categories.map((category) => (
            <span key={category} className="category-tag">
              {category}
            </span>
          ))}
        </div>
      )}

      {vault.strategy && (
        <p className="vault-strategy">{vault.strategy}</p>
      )}

      <style jsx>{`
        .vault-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 20px;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .vault-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .vault-card.list {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr auto;
          gap: 20px;
          align-items: center;
          padding: 16px 24px;
        }

        .vault-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .vault-name-section {
          flex: 1;
        }

        .vault-name {
          font-size: 18px;
          font-weight: 600;
          color: #fff;
          margin: 0 0 8px 0;
        }

        .vault-manager {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .manager-avatar {
          width: 24px;
          height: 24px;
          border-radius: 12px;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 12px;
        }

        .manager-name {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
        }

        .risk-badge {
          padding: 4px 8px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
        }

        .risk-badge.low {
          background: rgba(34, 197, 94, 0.1);
          color: rgb(34, 197, 94);
        }

        .risk-badge.medium {
          background: rgba(234, 179, 8, 0.1);
          color: rgb(234, 179, 8);
        }

        .risk-badge.high {
          background: rgba(239, 68, 68, 0.1);
          color: rgb(239, 68, 68);
        }

        .vault-metrics {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .metric-group {
          display: flex;
          gap: 16px;
        }

        .vault-metric {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .metric-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
        }

        .metric-value {
          font-size: 16px;
          font-weight: 600;
          color: #fff;
        }

        .performance.positive .metric-value {
          color: rgb(34, 197, 94);
        }

        .performance.negative .metric-value {
          color: rgb(239, 68, 68);
        }

        .vault-categories {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 16px;
        }

        .category-tag {
          padding: 4px 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
        }

        .vault-strategy {
          margin: 16px 0 0 0;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.5;
        }

        /* List view specific styles */
        .list .vault-card-header {
          margin-bottom: 0;
        }

        .list .vault-metrics {
          flex-direction: row;
          align-items: center;
        }

        .list .vault-categories {
          margin-top: 0;
          justify-content: flex-end;
        }
      `}</style>
    </div>
  );
}