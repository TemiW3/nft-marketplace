import type { Metadata } from 'next'
import './globals.css'
import '@solana/wallet-adapter-react-ui/styles.css'
import { WalletContextProvider } from '@/contexts/WalletContext'
import { MarketplaceProvider } from '@/contexts/MarketplaceContext'
import Header from '@/components/Header'
import React from 'react'

export const metadata: Metadata = {
  title: 'NFT Marketplace',
  description: 'Discover, Create & Trade Unique NFTs on Solana',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`antialiased`}>
        {/* <AppProviders> */}
        <WalletContextProvider>
          <MarketplaceProvider>
            <div className="App">
              <Header />
              <main>{children}</main>
            </div>
          </MarketplaceProvider>
        </WalletContextProvider>
        {/* </AppProviders> */}
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
