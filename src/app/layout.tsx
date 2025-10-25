import type { Metadata } from 'next'
import './globals.css'
import '@solana/wallet-adapter-react-ui/styles.css'
import '@/components/Header.css'
import '@/components/Home.css'
import { WalletContextProvider } from '@/contexts/WalletContext'
import { MarketplaceProvider } from '@/contexts/MarketplaceContext'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: 'NFT Marketplace | Solana',
  description: 'Discover, Create & Trade Unique NFTs on Solana with lightning-fast transactions and minimal fees.',
  keywords: ['NFT', 'Solana', 'Marketplace', 'Blockchain', 'Digital Art'],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <WalletContextProvider>
          <MarketplaceProvider>
            <div className="App">
              <Header />
              <main>{children}</main>
            </div>
          </MarketplaceProvider>
        </WalletContextProvider>
      </body>
    </html>
  )
}

// Patch BigInt so we can log it using JSON.stringify without any errors
declare global {
  interface BigInt {
    toJSON(): string
  }
}

BigInt.prototype.toJSON = function () {
  return this.toString()
}
