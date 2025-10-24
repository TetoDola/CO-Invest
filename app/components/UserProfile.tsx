"use client";
import { sdk } from "@farcaster/miniapp-sdk";
import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

interface UserProfileProps {
  onBalancesClick?: () => void;
}

export default function UserProfile({ onBalancesClick }: UserProfileProps) {
  const [user, setUser] = useState<{
    fid: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
  } | null>(null);
  const [isInMiniApp, setIsInMiniApp] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Wagmi hooks for wallet connection
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Check if we're in a Mini App
        const miniAppStatus = await sdk.isInMiniApp();
        setIsInMiniApp(miniAppStatus);

        if (miniAppStatus) {
          // Get context and extract user info
          const context = await sdk.context;
          setUser(context.user);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleConnectMetaMask = () => {
    const injectedConnector = connectors.find(c => c.id === 'injected');
    if (injectedConnector) {
      connect({ connector: injectedConnector });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="user-profile-loading">
        <span className="loading-text">Loading...</span>
        <style jsx>{`
          .user-profile-loading {
            display: flex;
            align-items: center;
          }
          .loading-text {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.7);
          }
        `}</style>
      </div>
    );
  }

  // In Farcaster Mini App - show Farcaster user
  if (isInMiniApp && user) {
    return (
      <div className="user-profile" onClick={onBalancesClick}>
        {user.pfpUrl && (
          <img 
            src={user.pfpUrl} 
            alt="Profile" 
            className="profile-pic"
          />
        )}
        <div className="user-info">
          <span className="display-name">
            {user.displayName || user.username || `FID ${user.fid}`}
          </span>
          {user.username && (
            <span className="username">@{user.username}</span>
          )}
        </div>
        
        <style jsx>{`
          .user-profile {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            padding: 6px 12px;
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.05);
            transition: background 0.2s;
            max-width: 100%;
            overflow: hidden;
          }
          .user-profile:hover {
            background: rgba(255, 255, 255, 0.1);
          }
          .profile-pic {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            object-fit: cover;
            flex-shrink: 0;
          }
          .user-info {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 2px;
            min-width: 0;
            flex: 1;
          }
          .display-name {
            font-size: 14px;
            font-weight: 600;
            color: #fff;
            line-height: 1.2;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
          }
          .username {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
            line-height: 1.2;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
          }
          
          @media (max-width: 768px) {
            .user-profile {
              gap: 6px;
              padding: 4px 10px;
            }
            .profile-pic {
              width: 28px;
              height: 28px;
            }
            .display-name {
              font-size: 13px;
            }
            .username {
              font-size: 11px;
            }
          }
          
          @media (max-width: 480px) {
            .user-profile {
              gap: 6px;
              padding: 4px 8px;
            }
            .profile-pic {
              width: 24px;
              height: 24px;
            }
            .display-name {
              font-size: 12px;
            }
            .username {
              font-size: 10px;
            }
          }
        `}</style>
      </div>
    );
  }

  // Not in Mini App - show wallet connection
  if (!isInMiniApp) {
    // Connected via wallet (MetaMask, etc.)
    if (isConnected && address) {
      return (
        <div className="wallet-profile" onClick={onBalancesClick}>
          <div className="wallet-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M21 18V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V6M21 6H17C14.7909 6 13 7.79086 13 10V14C13 16.2091 14.7909 18 17 18H21V6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M17 12H17.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="wallet-info">
            <span className="wallet-address">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
            <span className="wallet-label">Connected</span>
          </div>
          
          <style jsx>{`
            .wallet-profile {
              display: flex;
              align-items: center;
              gap: 8px;
              cursor: pointer;
              padding: 6px 12px;
              border-radius: 20px;
              background: rgba(59, 130, 246, 0.1);
              border: 1px solid rgba(59, 130, 246, 0.3);
              transition: all 0.2s;
              max-width: 100%;
              overflow: hidden;
            }
            .wallet-profile:hover {
              background: rgba(59, 130, 246, 0.15);
              border-color: rgba(59, 130, 246, 0.5);
            }
            .wallet-icon {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: rgba(59, 130, 246, 0.2);
              flex-shrink: 0;
            }
            .wallet-icon svg {
              stroke: #3b82f6;
            }
            .wallet-info {
              display: flex;
              flex-direction: column;
              align-items: flex-start;
              gap: 2px;
              min-width: 0;
              flex: 1;
            }
            .wallet-address {
              font-size: 14px;
              font-weight: 600;
              color: #fff;
              font-family: var(--font-mono);
              line-height: 1.2;
            }
            .wallet-label {
              font-size: 11px;
              color: #3b82f6;
              line-height: 1.2;
            }
            
            @media (max-width: 768px) {
              .wallet-profile {
                gap: 6px;
                padding: 4px 10px;
              }
              .wallet-icon {
                width: 28px;
                height: 28px;
              }
              .wallet-icon svg {
                width: 16px;
                height: 16px;
              }
              .wallet-address {
                font-size: 13px;
              }
              .wallet-label {
                font-size: 10px;
              }
            }
            
            @media (max-width: 480px) {
              .wallet-profile {
                gap: 6px;
                padding: 4px 8px;
              }
              .wallet-icon {
                width: 24px;
                height: 24px;
              }
              .wallet-icon svg {
                width: 14px;
                height: 14px;
              }
              .wallet-address {
                font-size: 12px;
              }
            }
          `}</style>
        </div>
      );
    }

    // Not connected - show connect button
    return (
      <button className="connect-wallet-btn" onClick={handleConnectMetaMask}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M21 18V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V6M21 6H17C14.7909 6 13 7.79086 13 10V14C13 16.2091 14.7909 18 17 18H21V6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M17 12H17.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>Connect Wallet</span>
        
        <style jsx>{`
          .connect-wallet-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            border: none;
            border-radius: 20px;
            color: white;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            white-space: nowrap;
          }
          .connect-wallet-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          }
          .connect-wallet-btn:active {
            transform: translateY(0);
          }
          .connect-wallet-btn svg {
            stroke: currentColor;
            flex-shrink: 0;
          }
          
          @media (max-width: 768px) {
            .connect-wallet-btn {
              padding: 6px 12px;
              font-size: 13px;
            }
            .connect-wallet-btn svg {
              width: 18px;
              height: 18px;
            }
          }
          
          @media (max-width: 480px) {
            .connect-wallet-btn {
              padding: 6px 10px;
              font-size: 12px;
            }
            .connect-wallet-btn svg {
              width: 16px;
              height: 16px;
            }
            .connect-wallet-btn span {
              display: none;
            }
          }
        `}</style>
      </button>
    );
  }

  return null;
}