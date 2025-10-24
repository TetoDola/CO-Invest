'use client';

export default function TrustIndicators() {
  return (
    <div className="trust-indicators">
      <div className="trust-item">
        <div className="trust-icon security">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
            <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="trust-content">
          <div className="trust-title">Non-Custodial</div>
          <div className="trust-desc">You keep full control of your funds</div>
        </div>
      </div>
      
      <div className="trust-item">
        <div className="trust-icon transparent">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="trust-content">
          <div className="trust-title">Transparent</div>
          <div className="trust-desc">All trades on-chain, verifiable</div>
        </div>
      </div>
      
      <div className="trust-item">
        <div className="trust-icon verified">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M22 10V15C22 20 20 22 15 22H9C4 22 2 20 2 15V9C2 4 4 2 9 2H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 10H18C15 10 14 9 14 6V2L22 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 13L9 15L13 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="trust-content">
          <div className="trust-title">Expert Managers</div>
          <div className="trust-desc">Vetted traders with proven track records</div>
        </div>
      </div>

      <style jsx>{`
        .trust-indicators {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          margin: 24px 20px;
        }
        
        .trust-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.03);
          border: solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          transition: all 0.2s;
        }
        
        .trust-item:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.12);
          transform: translateY(-2px);
        }
        
        .trust-icon {
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .trust-icon.security {
          background: rgba(74, 222, 128, 0.15);
          color: #4ade80;
        }
        
        .trust-icon.transparent {
          background: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
        }
        
        .trust-icon.verified {
          background: rgba(139, 92, 246, 0.15);
          color: #8b5cf6;
        }
        
        .trust-content {
          flex: 1;
        }
        
        .trust-title {
          font-size: 15px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 4px;
        }
        
        .trust-desc {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.4;
        }
        
        @media (max-width: 768px) {
          .trust-indicators {
            grid-template-columns: 1fr;
            margin: 16px;
          }
          
          .trust-item {
            padding: 14px;
          }
          
          .trust-icon {
            width: 36px;
            height: 36px;
          }
          
          .trust-title {
            font-size: 14px;
          }
          
          .trust-desc {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}

