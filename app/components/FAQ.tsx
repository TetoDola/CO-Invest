'use client';

import InfoCard from './InfoCard';

export default function FAQ() {
  return (
    <div className="faq-section">
      <h2 className="faq-title">Common Questions</h2>
      
      <InfoCard 
        title="How does CO-Invest work?"
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        }
      >
        <p>
          CO-Invest is a <strong>non-custodial platform</strong> where expert managers create investment vaults.
          You buy shares using USDC, and managers trade on your behalf while you maintain full control of your funds.
        </p>
        <p>
          When you want to exit, you simply redeem your shares back to USDC. The platform takes a small exit fee 
          (1%), but managers cannot withdraw your funds without your approval.
        </p>
      </InfoCard>

      <InfoCard 
        title="Is my money safe?"
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M10 20L10 14L14 14L14 20M10 20H14M10 20H4C2.89543 20 2 19.1046 2 18V4C2 2.89543 2.89543 2 4 2H20C21.1046 2 22 2.89543 22 4V18C22 19.1046 21.1046 20 20 20H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        }
      >
        <p>
          <strong>Yes!</strong> CO-Invest is built with security as the top priority:
        </p>
        <ul>
          <li><strong>Non-custodial:</strong> Funds are held in smart contracts, not by us</li>
          <li><strong>Pro-rata withdrawals:</strong> Managers can only withdraw their own share</li>
          <li><strong>On-chain transparency:</strong> All trades are verifiable on Base</li>
          <li><strong>Gas-free:</strong> Powered by Base Paymaster</li>
        </ul>
      </InfoCard>

      <InfoCard 
        title="What fees do I pay?"
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M16 8H17C18.1046 8 19 8.89543 19 10V17C19 18.1046 18.1046 19 17 19H7C5.89543 19 5 18.1046 5 17V10C5 8.89543 5.89543 8 7 8H8M16 8C16 6.89543 15.1046 6 14 6H10C8.89543 6 8 6.89543 8 8M16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        }
      >
        <p>
          Fees are minimal and transparent:
        </p>
        <ul>
          <li><strong>Deposit:</strong> 0% (free)</li>
          <li><strong>Exit/Withdraw:</strong> 1% (0.5% platform, 0.5% manager)</li>
          <li><strong>Management:</strong> 0% (no ongoing fees)</li>
        </ul>
        <p>
          The exit fee is only charged when you redeem shares, not while holding them.
        </p>
      </InfoCard>

      <InfoCard 
        title="Can I withdraw anytime?"
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M8 6H16M8 6C8 5.44772 8.44772 5 9 5H15C15.5523 5 16 5.44772 16 6M8 6H6M16 6H18M4 9H20M4 9L5 19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19L20 9M4 9L5 6M20 9L19 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        }
      >
        <p>
          After the initial <strong>7-day lockup period</strong>, you can withdraw anytime. New shares 
          you purchase are locked for 7 days to align incentives with the manager's trading strategy.
        </p>
        <p>
          Once unlocked, redeem your shares instantly back to USDC with a 1% exit fee.
        </p>
      </InfoCard>

      <InfoCard 
        title="How do I get started?"
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M5 12H19M5 12L9 8M5 12L9 16M19 12L15 8M19 12L15 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        }
      >
        <p>
          Getting started is simple:
        </p>
        <ol>
          <li>Make sure you have USDC in your wallet</li>
          <li>Browse available vaults on the Discover page</li>
          <li>Click on a vault to see its performance and strategy</li>
          <li>Enter the amount you want to invest</li>
          <li>Click "Buy Shares" and approve the transaction</li>
        </ol>
        <p>
          That's it! You're now investing with expert managers.
        </p>
      </InfoCard>

      <style jsx>{`
        .faq-section {
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .faq-title {
          font-size: 24px;
          font-weight: 700;
          color: #fff;
          margin: 0 0 24px 0;
          text-align: center;
        }
        
        @media (max-width: 768px) {
          .faq-section {
            padding: 16px;
          }
          
          .faq-title {
            font-size: 20px;
            margin-bottom: 20px;
          }
        }
      `}</style>
    </div>
  );
}

