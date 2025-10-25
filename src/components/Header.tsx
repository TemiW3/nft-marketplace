'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { WalletMultiButton } from '../contexts/WalletContext'
import './Header.css'

const Header: React.FC = () => {
  const pathname = usePathname()

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Marketplace', path: '/marketplace' },
    { name: 'My Listings', path: '/my-listings' },
  ]

  return (
    <header className="header">
      <div className="header-content">
        <Link href="/" className="logo">
          🎨 Solana NFT Market
        </Link>
        <nav className="nav">
          <ul className="nav-links">
            {navLinks.map((link) => (
              <li key={link.path}>
                <Link href={link.path} className={`nav-link ${pathname === link.path ? 'active' : ''}`}>
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
          <WalletMultiButton />
        </nav>
      </div>
    </header>
  )
}

export default Header
