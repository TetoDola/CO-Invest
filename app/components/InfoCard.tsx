'use client';

import { useState } from 'react';

interface InfoCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export default function InfoCard({ title, icon, children, defaultExpanded = false }: InfoCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="info-card">
      <button className="info-card-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="info-card-title">
          {icon}
          <span>{title}</span>
        </div>
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none"
          className={`expand-icon ${isExpanded ? 'expanded' : ''}`}
        >
          <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      
      {isExpanded && (
        <div className="info-card-content">
          {children}
        </div>
      )}

      <style jsx>{`
        .info-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 16px;
        }
        
        .info-card-header {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .info-card-header:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        
        .info-card-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 15px;
          font-weight: 600;
          color: #fff;
        }
        
        .info-card-title svg {
          flex-shrink: 0;
          color: #3b82f6;
        }
        
        .expand-icon {
          transition: transform 0.3s ease;
          color: rgba(255, 255, 255, 0.6);
        }
        
        .expand-icon.expanded {
          transform: rotate(180deg);
        }
        
        .info-card-content {
          padding: 0 16px 16px 16px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.6;
        }
        
        .info-card-content p {
          margin: 0 0 12px 0;
        }
        
        .info-card-content p:last-child {
          margin-bottom: 0;
        }
        
        .info-card-content ul {
          margin: 0;
          padding-left: 20px;
        }
        
        .info-card-content li {
          margin-bottom: 8px;
        }
        
        .info-card-content strong {
          color: #fff;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}

