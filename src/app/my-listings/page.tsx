'use client'
import React, { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import NFTCard from '@/components/NFTCard'
import './my-listings.css'

export default function MyListingsPage() {
  const { publicKey, connected } = useWallet()
  const [activeTab, setActiveTab] = useState<'available' | 'listed'>('available')

  // TODO: Replace with actual data fetching
  // Placeholder NFTs - will be replaced with real data from wallet
  const mockAvailableNFTs = [
    { mint: '1', name: 'Cool NFT #1', image: '🎨', price: null },
    { mint: '2', name: 'Cool NFT #2', image: '🖼️', price: null },
    { mint: '3', name: 'Cool NFT #3', image: '🎭', price: null },
  ]

  const mockListedNFTs = [
    { mint: '4', name: 'Listed NFT #1', image: '🌟', price: 2.5 },
    { mint: '5', name: 'Listed NFT #2', image: '💎', price: 1.8 },
  ]

  if (!connected) {
    return (
      <div className="my-nfts-page">
        <h1 className="section-title">My NFTs</h1>
        <div className="connect-wallet-prompt">
          <div className="prompt-icon">🔒</div>
          <h2>Connect Your Wallet</h2>
          <p className="text-gray">Connect your wallet to view and manage your NFTs</p>
        </div>
      </div>
    )
  }

  return (
    <div className="my-nfts-page">
      <h1 className="section-title">My NFTs</h1>
      <p className="text-center text-gray mb-8">View and manage your NFT collection</p>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab ${activeTab === 'available' ? 'active' : ''}`}
          onClick={() => setActiveTab('available')}
        >
          <span className="tab-icon">📦</span>
          Available to List
          <span className="tab-count">{mockAvailableNFTs.length}</span>
        </button>
        <button className={`tab ${activeTab === 'listed' ? 'active' : ''}`} onClick={() => setActiveTab('listed')}>
          <span className="tab-icon">🏷️</span>
          Currently Listed
          <span className="tab-count">{mockListedNFTs.length}</span>
        </button>
      </div>

      {/* Content */}
      <div className="tab-content">
        {activeTab === 'available' ? (
          <div className="nfts-section">
            {mockAvailableNFTs.length > 0 ? (
              <>
                <p className="section-description text-gray">
                  Select an NFT below to list it for sale on the marketplace
                </p>
                <div className="marketplace-grid">
                  {mockAvailableNFTs.map((nft) => (
                    <NFTCard key={nft.mint} nft={nft} type="available" />
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>No NFTs Available</h3>
                <p className="text-gray">You don't have any NFTs available to list</p>
              </div>
            )}
          </div>
        ) : (
          <div className="nfts-section">
            {mockListedNFTs.length > 0 ? (
              <>
                <p className="section-description text-gray">Your active listings on the marketplace</p>
                <div className="marketplace-grid">
                  {mockListedNFTs.map((nft) => (
                    <NFTCard key={nft.mint} nft={nft} type="listed" />
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🏷️</div>
                <h3>No Active Listings</h3>
                <p className="text-gray">You haven't listed any NFTs for sale yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
