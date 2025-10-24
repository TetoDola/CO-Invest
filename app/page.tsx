import { minikitConfig } from '@/minikit.config';
import { Metadata } from 'next';
import VaultAppWithAuth from './components/VaultAppWithAuth';

const ROOT_URL = process.env.NEXT_PUBLIC_ROOT_URL || 'https://your-app-url.vercel.app';

// Base Mini App embed metadata for social sharing
// This is REQUIRED for the app to render correctly in Base
const embedMetadata = {
  version: "next",
  imageUrl: `${ROOT_URL}/hero.png`, // 3:2 aspect ratio preview image
  button: {
    title: "Open Co-Invest",
    action: {
      type: "launch_frame",
      url: ROOT_URL,
      name: minikitConfig.miniapp.name,
      splashImageUrl: minikitConfig.miniapp.splashImageUrl,
      splashBackgroundColor: minikitConfig.miniapp.splashBackgroundColor,
    },
  },
};

export const metadata: Metadata = {
  title: minikitConfig.miniapp.ogTitle,
  description: minikitConfig.miniapp.ogDescription,
  openGraph: {
    title: minikitConfig.miniapp.ogTitle,
    description: minikitConfig.miniapp.ogDescription,
    images: [minikitConfig.miniapp.ogImageUrl],
  },
  other: {
    // Base Mini App embed metadata (REQUIRED)
    'fc:miniapp': JSON.stringify(embedMetadata),
  },
};

export default function Home() {
  return <VaultAppWithAuth />;
}