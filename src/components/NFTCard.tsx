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
  const [price, setPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const { createListing, cancelListing } = useMarketplace()

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
      // TODO: Implement actual cancel listing logic here
      console.log('Canceling listing for:', nft.mint)
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate transaction
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
      <div className="nft-card">
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
            <button className="btn btn-primary btn-full" onClick={() => setShowListModal(true)} disabled={loading}>
              📋 List for Sale
            </button>
          ) : (
            <>
              <div className="nft-price">{nft.price} SOL</div>
              <div className="nft-actions">
                <button className="btn btn-danger btn-small btn-full" onClick={handleCancelListing} disabled={loading}>
                  {loading ? 'Canceling...' : '❌ Cancel Listing'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* List Modal */}
      {showListModal && (
        <div className="modal-overlay" onClick={() => setShowListModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>List NFT for Sale</h2>
              <button className="modal-close" onClick={() => setShowListModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-nft-preview">
                <div className="modal-nft-image">
                  <Image src={nft.image} alt={nft.name} fill style={{ objectFit: 'cover' }} />
                </div>
                {/* <h3>{nft.name}</h3> */}
              </div>
              <div className="form-group">
                <label>Price (SOL)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="Enter price in SOL"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="marketplace-fee">
                <p className="text-gray">
                  Marketplace Fee (2%): {price ? (parseFloat(price) * 0.02).toFixed(4) : '0'} SOL
                </p>
                <p className="text-white">You'll receive: {price ? (parseFloat(price) * 0.98).toFixed(4) : '0'} SOL</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowListModal(false)} disabled={loading}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleListNFT}
                disabled={loading || !price || parseFloat(price) <= 0}
              >
                {loading ? 'Listing...' : 'List NFT'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
