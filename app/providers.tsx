'use client';

import { OnchainKitProvider } from '@coinbase/onchainkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { base } from 'viem/chains';
import { ReactNode, useState } from 'react';
import { wagmiConfig } from '@/lib/wagmi.config';

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          chain={base}
          // Use CDP Node API key for RPC access
          apiKey={process.env.NEXT_PUBLIC_CDP_API_KEY || ''}
          // Enable MiniKit for Base Mini App runtime
          config={{
            appearance: {
              mode: 'dark',
              theme: 'default',
            },
          }}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}