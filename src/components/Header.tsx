import React from 'react'
import { WalletMultiButton } from '../contexts/WalletContext'
import './Header.css'

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">🎨 Solana NFT Market</div>
        <nav className="nav">
          <WalletMultiButton />
        </nav>
      </div>
    </header>
  )
}

export default Header
