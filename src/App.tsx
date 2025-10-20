import React from 'react'
import { WalletContextProvider } from './contexts/WalletContext'
import { MarketplaceProvider } from './contexts/MarketplaceContext'

function App() {
  return (
    <WalletContextProvider>
      <MarketplaceProvider>
        <div className="App">
          {/* <Header /> */}
          <main></main>
        </div>
      </MarketplaceProvider>
    </WalletContextProvider>
  )
}
