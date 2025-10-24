'use client';

import { useState, useEffect } from 'react';
import { Address } from 'viem';
import VaultCard from './VaultCard';
import VaultFilters, { FilterState, SortOption } from './VaultFilters';
import TrustIndicators from './TrustIndicators';

interface Vault {
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
  performanceHistory?: {
    timestamp: number;
    value: number;
  }[];
}

interface DiscoverPageProps {
  vaults: Vault[];
  onVaultSelect: (vault: Vault) => void;
}

export default function DiscoverPage({ vaults, onVaultSelect }: DiscoverPageProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('7d');
  const [filters, setFilters] = useState<FilterState>({
    riskLevel: [],
    categories: [],
    minTVL: null,
    maxTVL: null
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredVaults, setFilteredVaults] = useState<Vault[]>(vaults);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...vaults];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(vault => 
        vault.name.toLowerCase().includes(query) ||
        vault.manager.toLowerCase().includes(query) ||
        vault.strategy?.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (filters.riskLevel.length > 0) {
      result = result.filter(vault => 
        vault.riskLevel && filters.riskLevel.includes(vault.riskLevel)
      );
    }

    if (filters.categories.length > 0) {
      result = result.filter(vault =>
        vault.categories?.some(category => filters.categories.includes(category))
      );
    }

    if (filters.minTVL !== null) {
      result = result.filter(vault => vault.tvl >= filters.minTVL!);
    }

    if (filters.maxTVL !== null) {
      result = result.filter(vault => vault.tvl <= filters.maxTVL!);
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case '7d':
          return b.performance7d - a.performance7d;
        case '30d':
          return (b.performance30d || 0) - (a.performance30d || 0);
        case 'tvl':
          return b.tvl - a.tvl;
        case 'new':
          return b.id - a.id;
        case 'risk':
          const riskOrder = { low: 0, medium: 1, high: 2 };
          return (riskOrder[b.riskLevel || 'medium'] - riskOrder[a.riskLevel || 'medium']);
        default:
          return 0;
      }
    });

    setFilteredVaults(result);
  }, [vaults, filters, sortBy, searchQuery]);

  return (
    <div className="discover-page">
      <div className="demo-warning">
        ⚠️ Demo Version: While our ERC-4626 vault smart contracts are fully implemented and ready for deployment, we're using default addresses for demo purposes to avoid expensive contract deployments. Users can still purchase into demo funds through Account Abstraction (AA) transactions, with operations bundled as UserOperations via the EntryPoint contract (ERC-4337). No new vaults are minted in this demo, but the complete implementation including contracts and vault factory is ready for production deployment.
      </div>
      <TrustIndicators />

      <VaultFilters
        onFilterChange={setFilters}
        onSortChange={setSortBy}
        onViewModeChange={setViewMode}
        onSearch={setSearchQuery}
        viewMode={viewMode}
      />

      <div className={`vault-grid ${viewMode}`}>
        {filteredVaults.length > 0 ? (
          filteredVaults.map(vault => (
            <VaultCard
              key={vault.id}
              vault={vault}
              onClick={() => onVaultSelect(vault)}
              viewMode={viewMode}
            />
          ))
        ) : (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p>No vaults match your criteria</p>
            <button 
              className="btn-secondary"
              onClick={() => {
                setFilters({
                  riskLevel: [],
                  categories: [],
                  minTVL: null,
                  maxTVL: null
                });
                setSearchQuery('');
              }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

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
        }

        .discover-page {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .vault-grid {
          display: grid;
          gap: 20px;
          margin-top: 24px;
        }

        .vault-grid.grid {
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        }

        .vault-grid.list {
          grid-template-columns: 1fr;
        }

        .empty-state {
          text-align: center;
          padding: 48px 20px;
          color: rgba(255, 255, 255, 0.7);
          background: rgba(255, 255, 255, 0.03);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .empty-state svg {
          color: rgba(255, 255, 255, 0.3);
        }

        .empty-state p {
          margin: 0;
          font-size: 16px;
        }

        .btn-secondary {
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        @media (max-width: 768px) {
          .discover-page {
            padding: 16px;
          }

          .vault-grid.grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}