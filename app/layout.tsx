import './globals.css';
import Script from 'next/script';
import Providers from './providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
        {/* MiniKit SDK - loads from Base/Farcaster when running in mini app */}
        <Script
          src="https://cdn.jsdelivr.net/npm/@worldcoin/minikit-js@latest/dist/minikit.js"
          strategy="beforeInteractive"
        />
        {/* Old app.js removed - now using React components */}
      </body>
    </html>
  );
}