import { http, createConfig } from 'wagmi';
import { base } from 'wagmi/chains';
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector';
import { coinbaseWallet, injected } from 'wagmi/connectors';

export const wagmiConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'),
  },
  connectors: [
    miniAppConnector(),
    coinbaseWallet({
      appName: 'Co-Invest Vaults',
      preference: 'smartWalletOnly',
    }),
    injected({ shimDisconnect: true }),
  ]
});