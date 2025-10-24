// MiniKit SDK Type Declarations for Base Mini Apps

interface MiniKitUser {
  fid: number;
  username?: string;
  walletAddress: string;
}

interface MiniKitContext {
  user?: MiniKitUser;
}

interface MiniKitQuickAuth {
  getToken: () => Promise<{ token: string }>;
  fetch: (url: string, options?: RequestInit) => Promise<Response>;
}

interface MiniKitTransactionParams {
  to: string;
  value: string;
  data: string;
}

interface MiniKitTransactionResult {
  hash: string;
}

interface MiniKit {
  quickAuth: MiniKitQuickAuth;
  context?: MiniKitContext;
  sendTransaction: (params: MiniKitTransactionParams) => Promise<MiniKitTransactionResult>;
}

declare global {
  interface Window {
    MiniKit?: MiniKit;
  }
}

export {};