'use client'
import React, { useState } from 'react'
import Image from 'next/image'
import './NFTCard.css'
import { useMarketplace } from '@/contexts/MarketplaceContext'
import { PublicKey } from '@metaplex-foundation/js'

interface NFT {
  mint: string
  name: string
  image: string
  description?: string
  symbol?: string
  price?: number | null
  uri?: string
}

interface NFTCardProps {
  nft: NFT
  type: 'available' | 'listed'
}

export default function NFTCard({ nft, type }: NFTCardProps) {
  const [showListModal, setShowListModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [price, setPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const { createListing, cancelListing, nftListings } = useMarketplace()

  const handleListNFT = async () => {
    setLoading(true)
    try {
      // Convert SOL to lamports (1 SOL = 1e9 lamports)
      const priceInLamports = parseFloat(price) * 1e9
      await createListing(new PublicKey(nft.mint), priceInLamports)
      alert(`Successfully listed ${nft.name} for ${price} SOL`)
      setShowListModal(false)
      setPrice('')
    } catch (error) {
      console.error('Error listing NFT:', error)
      alert('Failed to list NFT')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelListing = async () => {
    setLoading(true)
    try {
      // Find the full listing data from marketplace context
      const listing = nftListings.find((l) => l.mint === nft.mint)
      if (!listing) {
        throw new Error('Listing not found')
      }

      // Convert to Listing format with PublicKeys
      await cancelListing({
        mint: new PublicKey(listing.mint),
        seller: new PublicKey(listing.seller),
        tokenAccount: new PublicKey(listing.tokenAccount),
        price: listing.price,
        isActive: listing.isActive,
        bump: 0, // bump is not used in the cancel function
      })

      alert(`Successfully canceled listing for ${nft.name}`)
    } catch (error) {
      console.error('Error canceling listing:', error)
      alert('Failed to cancel listing')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div
        className="nft-card"
        onClick={() => (type === 'listed' ? setShowDetailsModal(true) : setShowListModal(true))}
        style={{ cursor: 'pointer' }}
      >
        <div className="nft-image">
          {nft.image && nft.image.startsWith('http') ? (
            <Image src={nft.image} alt={nft.name} fill style={{ objectFit: 'cover' }} />
          ) : (
            <div className="nft-image-placeholder">🎨</div>
          )}
        </div>
        <div className="nft-content">
          <h3 className="nft-title">{nft.name}</h3>
          <p className="nft-mint">
            Mint: {nft.mint.substring(0, 4)}...{nft.mint.substring(nft.mint.length - 4)}
          </p>

          {type === 'available' ? (
            <button
              className="btn btn-primary btn-full"
              onClick={(e) => {
                e.stopPropagation()
                setShowListModal(true)
              }}
              disabled={loading}
            >
              📋 List for Sale
            </button>
          ) : (
            <div className="nft-price">{nft.price} SOL</div>
          )}
        </div>
      </div>

      {/* List Modal */}
      {showListModal && (
        <div className="modal-overlay" onClick={() => setShowListModal(false)}>
          <div className="modal-content-large" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowListModal(false)}>
              ✕
            </button>
            <div className="modal-image-container-large">
              {nft.image && nft.image.startsWith('http') ? (
                <Image
                  src={nft.image}
                  alt={nft.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 600px"
                  style={{ objectFit: 'contain' }}
                  className="modal-image"
                />
              ) : (
                <div className="modal-image-placeholder-large">
                  <span>🖼️</span>
                  <p>No Image</p>
                </div>
              )}
            </div>
            <div className="modal-details-large">
              <h2 className="modal-title-large">List NFT for Sale</h2>
              <p className="modal-description-large">{nft.name}</p>

              <div className="form-group-large">
                <label className="form-label-large">Price (SOL)</label>
                <input
                  type="number"
                  className="form-input-large"
                  placeholder="Enter price in SOL"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="modal-info-grid-large">
                <div className="modal-info-item-large">
                  <span className="modal-info-label-large">Marketplace Fee (2%)</span>
                  <span className="modal-info-value-large">
                    {price ? (parseFloat(price) * 0.02).toFixed(4) : '0'} SOL
                  </span>
                </div>
                <div className="modal-info-item-large">
                  <span className="modal-info-label-large">You'll Receive</span>
                  <span className="modal-info-value-large">
                    {price ? (parseFloat(price) * 0.98).toFixed(4) : '0'} SOL
                  </span>
                </div>
              </div>

              <div className="modal-button-group">
                <button
                  className="btn btn-secondary btn-half"
                  onClick={() => setShowListModal(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary btn-half"
                  onClick={handleListNFT}
                  disabled={loading || !price || parseFloat(price) <= 0}
                >
                  {loading ? 'Listing...' : 'List NFT'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal (for listed NFTs) */}
      {showDetailsModal && type === 'listed' && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content-large" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowDetailsModal(false)}>
              ✕
            </button>
            <div className="modal-image-container-large">
              {nft.image && nft.image.startsWith('http') ? (
                <Image
                  src={nft.image}
                  alt={nft.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 600px"
                  style={{ objectFit: 'contain' }}
                  className="modal-image"
                />
              ) : (
                <div className="modal-image-placeholder-large">
                  <span>🖼️</span>
                  <p>No Image</p>
                </div>
              )}
            </div>
            <div className="modal-details-large">
              <h2 className="modal-title-large">{nft.name}</h2>
              {nft.description && <p className="modal-description-large">{nft.description}</p>}
              <div className="modal-info-grid-large">
                <div className="modal-info-item-large">
                  <span className="modal-info-label-large">Listed Price</span>
                  <span className="modal-info-value-large">{nft.price} SOL</span>
                </div>
                <div className="modal-info-item-large">
                  <span className="modal-info-label-large">Mint Address</span>
                  <span className="modal-info-value-large" title={nft.mint}>
                    {nft.mint.slice(0, 8)}...{nft.mint.slice(-8)}
                  </span>
                </div>
                <div className="modal-info-item-large">
                  <span className="modal-info-label-large">Status</span>
                  <span className="modal-info-value-large">Active Listing</span>
                </div>
              </div>
              <button className="btn btn-danger modal-cancel-btn" onClick={handleCancelListing} disabled={loading}>
                {loading ? (
                  <>
                    <span className="loading-spinner-small"></span>
                    Canceling...
                  </>
                ) : (
                  '❌ Cancel Listing'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
