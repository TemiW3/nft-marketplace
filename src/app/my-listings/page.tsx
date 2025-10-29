'use client'
import React, { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import NFTCard from '@/components/NFTCard'
import { useUserNFTs } from '@/hooks/useUserNFTs'
import { useMarketplace } from '@/contexts/MarketplaceContext'
import './my-listings.css'

export default function MyListingsPage() {
  const { publicKey, connected } = useWallet()
  const [activeTab, setActiveTab] = useState<'available' | 'listed'>('available')
  const { nfts, loading: nftsLoading, error: nftsError } = useUserNFTs()
  const { nftListings, loading: listingsLoading } = useMarketplace()

  // Get user's active listings (these are the NFTs they've listed)
  const userListings = nftListings.filter((listing) => listing.seller === publicKey?.toString() && listing.isActive)

  const userListedMints = new Set(userListings.map((listing) => listing.mint))

  // Split NFTs into available and listed
  // Available: NFTs in wallet that are NOT listed
  const availableNFTs = nfts.filter((nft) => !userListedMints.has(nft.mint))

  // Listed: Show the marketplace listings data (not from wallet since they're in escrow)
  const listedNFTs = userListings.map((listing) => ({
    mint: listing.mint,
    name: listing.name,
    image: listing.image,
    description: listing.description,
    price: listing.price / 1e9, // Convert lamports to SOL
  }))

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

  const isLoading = nftsLoading || listingsLoading

  return (
    <div className="my-nfts-page">
      <h1 className="section-title">My NFTs</h1>
      <p className="text-center text-gray mb-8">View and manage your NFT collection</p>

      {nftsError && (
        <div className="error-message">
          <p>⚠️ {nftsError}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab ${activeTab === 'available' ? 'active' : ''}`}
          onClick={() => setActiveTab('available')}
        >
          <span className="tab-icon">📦</span>
          Available to List
          <span className="tab-count">{availableNFTs.length}</span>
        </button>
        <button className={`tab ${activeTab === 'listed' ? 'active' : ''}`} onClick={() => setActiveTab('listed')}>
          <span className="tab-icon">🏷️</span>
          Currently Listed
          <span className="tab-count">{listedNFTs.length}</span>
        </button>
      </div>

      {/* Content */}
      <div className="tab-content">
        {isLoading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p className="text-gray" style={{ marginTop: '20px' }}>
              Loading your NFTs...
            </p>
          </div>
        ) : activeTab === 'available' ? (
          <div className="nfts-section">
            {availableNFTs.length > 0 ? (
              <>
                <p className="section-description text-gray">
                  Select an NFT below to list it for sale on the marketplace
                </p>
                <div className="marketplace-grid">
                  {availableNFTs.map((nft) => (
                    <NFTCard key={nft.mint} nft={nft} type="available" />
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>No NFTs Available</h3>
                <p className="text-gray">
                  {nfts.length === 0 ? "You don't have any NFTs in your wallet" : 'All your NFTs are currently listed'}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="nfts-section">
            {listedNFTs.length > 0 ? (
              <>
                <p className="section-description text-gray">Your active listings on the marketplace</p>
                <div className="marketplace-grid">
                  {listedNFTs.map((nft) => (
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
