import React from 'react'
import { WalletContextProvider } from './contexts/WalletContext'
import { MarketplaceProvider } from './contexts/MarketplaceContext'
import Header from './components/Header'
import Hero from './components/Hero'

function App() {
  return (
    <WalletContextProvider>
      <MarketplaceProvider>
        <div className="App">
          <Header />
          <main>
            <Hero />
          </main>
        </div>
      </MarketplaceProvider>
    </WalletContextProvider>
  )
}

export default App
