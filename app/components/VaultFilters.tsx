'use client';

import { useState } from 'react';

interface VaultFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  onSortChange: (sort: SortOption) => void;
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onSearch: (query: string) => void;
  viewMode: 'grid' | 'list';
}

export interface FilterState {
  riskLevel: string[];
  categories: string[];
  minTVL: number | null;
  maxTVL: number | null;
}

export type SortOption = '7d' | '30d' | 'tvl' | 'new' | 'risk';

const RISK_LEVELS = ['low', 'medium', 'high'];
const CATEGORIES = ['DeFi', 'Yield', 'Trading', 'Options', 'Staking'];

export default function VaultFilters({ 
  onFilterChange, 
  onSortChange, 
  onViewModeChange,
  onSearch,
  viewMode 
}: VaultFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    riskLevel: [],
    categories: [],
    minTVL: null,
    maxTVL: null
  });

  const handleFilterChange = (type: keyof FilterState, value: any) => {
    const newFilters = { ...filters };
    
    if (type === 'riskLevel' || type === 'categories') {
      if (newFilters[type].includes(value)) {
        newFilters[type] = newFilters[type].filter(item => item !== value);
      } else {
        newFilters[type] = [...newFilters[type], value];
      }
    } else {
      newFilters[type] = value;
    }
    
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch(query);
  };

  return (
    <div className="vault-filters">
      <div className="filters-header">
        <div className="search-bar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" 
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search vaults..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        
        <div className="view-toggle">
          <button 
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => onViewModeChange('grid')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 3H10V10H3V3Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M14 3H21V10H14V3Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M3 14H10V21H3V14Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M14 14H21V21H14V14Z" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
          <button 
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => onViewModeChange('list')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <button 
          className="filter-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M3 4H21M3 12H21M3 20H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Filters
        </button>
      </div>

      {isExpanded && (
        <div className="filters-expanded">
          <div className="filter-section">
            <h3>Sort By</h3>
            <div className="sort-options">
              {['7d', '30d', 'tvl', 'new', 'risk'].map((option) => (
                <button
                  key={option}
                  className="sort-btn"
                  onClick={() => onSortChange(option as SortOption)}
                >
                  {option === 'tvl' ? 'TVL' : 
                   option === '7d' ? '7D Return' :
                   option === '30d' ? '30D Return' :
                   option === 'new' ? 'Newest' : 'Risk Level'}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h3>Risk Level</h3>
            <div className="risk-filters">
              {RISK_LEVELS.map((level) => (
                <button
                  key={level}
                  className={`risk-btn ${filters.riskLevel.includes(level) ? 'active' : ''} ${level}`}
                  onClick={() => handleFilterChange('riskLevel', level)}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h3>Categories</h3>
            <div className="category-filters">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  className={`category-btn ${filters.categories.includes(category) ? 'active' : ''}`}
                  onClick={() => handleFilterChange('categories', category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h3>TVL Range</h3>
            <div className="tvl-range">
              <input
                type="number"
                placeholder="Min TVL"
                onChange={(e) => handleFilterChange('minTVL', e.target.value ? Number(e.target.value) : null)}
              />
              <span>to</span>
              <input
                type="number"
                placeholder="Max TVL"
                onChange={(e) => handleFilterChange('maxTVL', e.target.value ? Number(e.target.value) : null)}
              />
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .vault-filters {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 24px;
        }

        .filters-header {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .search-bar {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 8px 16px;
        }

        .search-bar input {
          flex: 1;
          background: none;
          border: none;
          color: white;
          font-size: 16px;
          outline: none;
        }

        .search-bar svg {
          color: rgba(255, 255, 255, 0.5);
        }

        .view-toggle {
          display: flex;
          gap: 8px;
          padding: 4px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        }

        .view-btn {
          padding: 8px;
          border: none;
          background: none;
          border-radius: 6px;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          transition: all 0.2s;
        }

        .view-btn.active {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .filter-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: none;
          border-radius: 8px;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-toggle:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .filters-expanded {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .filter-section {
          margin-bottom: 24px;
        }

        .filter-section h3 {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 12px;
        }

        .sort-options,
        .risk-filters,
        .category-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .sort-btn,
        .risk-btn,
        .category-btn {
          padding: 6px 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          background: none;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          transition: all 0.2s;
        }

        .sort-btn:hover,
        .risk-btn:hover,
        .category-btn:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .sort-btn.active,
        .risk-btn.active,
        .category-btn.active {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .risk-btn.low.active {
          background: rgba(34, 197, 94, 0.1);
          border-color: rgba(34, 197, 94, 0.2);
          color: rgb(34, 197, 94);
        }

        .risk-btn.medium.active {
          background: rgba(234, 179, 8, 0.1);
          border-color: rgba(234, 179, 8, 0.2);
          color: rgb(234, 179, 8);
        }

        .risk-btn.high.active {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.2);
          color: rgb(239, 68, 68);
        }

        .tvl-range {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .tvl-range input {
          flex: 1;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: white;
          font-size: 14px;
        }

        .tvl-range span {
          color: rgba(255, 255, 255, 0.5);
        }

        @media (max-width: 768px) {
          .filters-header {
            flex-wrap: wrap;
          }

          .search-bar {
            width: 100%;
            order: -1;
          }

          .view-toggle {
            margin-left: auto;
          }
        }
      `}</style>
    </div>
  );
}