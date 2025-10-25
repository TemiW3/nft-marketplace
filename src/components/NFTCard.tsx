'use client'
import React, { useState } from 'react'
import './NFTCard.css'

interface NFT {
  mint: string
  name: string
  image: string
  price: number | null
}

interface NFTCardProps {
  nft: NFT
  type: 'available' | 'listed'
}

export default function NFTCard({ nft, type }: NFTCardProps) {
  const [showListModal, setShowListModal] = useState(false)
  const [price, setPrice] = useState('')
  const [loading, setLoading] = useState(false)

  const handleListNFT = async () => {
    setLoading(true)
    try {
      // TODO: Implement actual listing logic here
      console.log('Listing NFT:', nft.mint, 'for', price, 'SOL')
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate transaction
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
        <div className="nft-image">{nft.image}</div>
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
                <div className="modal-nft-image">{nft.image}</div>
                <h3>{nft.name}</h3>
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
                  Marketplace Fee (2.5%): {price ? (parseFloat(price) * 0.025).toFixed(4) : '0'} SOL
                </p>
                <p className="text-white">You'll receive: {price ? (parseFloat(price) * 0.975).toFixed(4) : '0'} SOL</p>
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
