const ROOT_URL = process.env.NEXT_PUBLIC_ROOT_URL || 'https://your-app-url.vercel.app';

export const minikitConfig = {
  accountAssociation: {
    "header": "eyJmaWQiOjEzOTA4OTgsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHhlQ0ViNjljODJDMEE2OTM3MkEzYUU0OTkwMzcwNkVENDdiMjdlOGJiIn0",
    "payload": "eyJkb21haW4iOiJiYXNlLWhhY2thdGhvbi1waS52ZXJjZWwuYXBwIn0",
    "signature": "5qB448MWSZZFn4H4T10Jk7gGScwKM5vCI5lWAJq2h+pKnWnnxbEU++X38nhT6KK40zjBxnj3D/WLZWM62FPXxhw="
  },
  miniapp: {
    version: "1",
    name: "CO-INVEST",
    subtitle: "Invest with Top DeFi Managers",
    description: "Co-invest with expert DeFi vault managers on Base. Browse vetted investment vaults, buy shares with USDC, and track your portfolio. Fully non-custodial and transparent - managers can't withdraw your funds. Create your own vault and build a track record as a manager.",
    screenshotUrls: [`${ROOT_URL}/screenshot-portrait.png`],
    iconUrl: `${ROOT_URL}/icon.png`,
    splashImageUrl: `${ROOT_URL}/splash.png`,
    splashBackgroundColor: "#0a0b0d",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "finance",
    tags: ["defi", "investing", "vaults", "finance", "web3"],
    heroImageUrl: `${ROOT_URL}/hero.png`,
    tagline: "Non-custodial vaults. Expert managers. Your control.",
    ogTitle: "Co-Invest - Non-Custodial DeFi Vaults on Base",
    ogDescription: "Invest alongside expert managers in non-custodial DeFi vaults. Browse strategies, buy shares, track performance. Create your own vault and build your reputation.",
    ogImageUrl: `${ROOT_URL}/og-image.png`,
  },
} as const;