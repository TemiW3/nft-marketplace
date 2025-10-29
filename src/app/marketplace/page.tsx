'use client'
import React, { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import Image from 'next/image'
import './marketplace.css'
import { useMarketplace } from '@/contexts/MarketplaceContext'
import NotificationModal from '@/components/NotificationModal'

const ITEMS_PER_PAGE = 9

export default function MarketplacePage() {
  const { publicKey, connected } = useWallet()
  const { nftListings, loading, marketplaceInitialized, checkingMarketplace, initializeMarketplace, buyNft } =
    useMarketplace()

  const [feePercentage, setFeePercentage] = useState<string>('2')
  const [selectedNFT, setSelectedNFT] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [initializing, setInitializing] = useState(false)

  // Notification state
  const [notification, setNotification] = useState<{
    isOpen: boolean
    title: string
    message: string
    type: 'success' | 'error' | 'info'
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  })

  const showNotification = (title: string, message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ isOpen: true, title, message, type })
  }

  const closeNotification = () => {
    setNotification({ ...notification, isOpen: false })
  }

  const handleInitializeMarketplace = async () => {
    if (!publicKey || !connected) {
      setError('Please connect your wallet first')
      return
    }

    const fee = parseFloat(feePercentage)
    if (isNaN(fee) || fee < 0 || fee > 100) {
      setError('Please enter a valid fee percentage between 0 and 100')
      return
    }

    setInitializing(true)
    setError(null)

    try {
      // Convert percentage to basis points (e.g., 2% = 200 basis points)
      const feeBasisPoints = Math.round(fee * 100)
      await initializeMarketplace(feeBasisPoints)
    } catch (err: any) {
      console.error('Error initializing marketplace:', err)
      setError(err.message || 'Failed to initialize marketplace')
    } finally {
      setInitializing(false)
    }
  }

  const openNFTModal = (listing: any) => {
    setSelectedNFT(listing)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedNFT(null)
  }

  const handleBuyFromModal = async () => {
    if (!selectedNFT) return

    try {
      await buyNft(selectedNFT)
      showNotification('Success!', `Successfully purchased ${selectedNFT.name}!`, 'success')
      // Close modal after showing notification
      closeModal()
    } catch (err: any) {
      console.error('Error buying NFT:', err)
      showNotification('Error', err.message || 'Failed to purchase NFT', 'error')
    }
  }

  // Pagination logic
  const totalPages = Math.ceil(nftListings.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentListings = nftListings.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (checkingMarketplace) {
    return (
      <div className="marketplace-page">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p className="text-gray" style={{ marginTop: '20px' }}>
            Checking marketplace status...
          </p>
        </div>
      </div>
    )
  }

  if (!marketplaceInitialized) {
    return (
      <div className="marketplace-page">
        <h1 className="section-title">Marketplace</h1>
        <div className="marketplace-not-initialized">
          <div className="init-icon">🏪</div>
          <h2>Marketplace Not Initialized</h2>
          <p className="text-gray">The marketplace needs to be initialized before NFTs can be listed or purchased.</p>
          {error && (
            <div className="error-message">
              <p>⚠️ {error}</p>
            </div>
          )}
          {!connected ? (
            <p className="text-gray" style={{ marginTop: '20px' }}>
              Connect your wallet to initialize the marketplace
            </p>
          ) : (
            <div className="init-form">
              <div className="form-group">
                <label htmlFor="feePercentage" className="form-label">
                  Marketplace Fee Percentage
                </label>
                <div className="input-with-suffix">
                  <input
                    id="feePercentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={feePercentage}
                    onChange={(e) => setFeePercentage(e.target.value)}
                    className="form-input"
                    placeholder="2.0"
                  />
                  <span className="input-suffix">%</span>
                </div>
                <p className="form-help-text">
                  This fee will be charged on all sales (e.g., 2% means 2% of each sale goes to the marketplace
                  authority)
                </p>
              </div>
              <button className="btn-primary" onClick={handleInitializeMarketplace} disabled={initializing}>
                {initializing ? (
                  <>
                    <span className="loading-spinner-small"></span>
                    Initializing...
                  </>
                ) : (
                  'Initialize Marketplace'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="marketplace-page">
      <h1 className="section-title">Marketplace</h1>
      <p className="text-center text-gray mb-8">Browse and purchase NFTs from our marketplace</p>

      {error && (
        <div className="error-message">
          <p>⚠️ {error}</p>
        </div>
      )}

      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p className="text-gray" style={{ marginTop: '20px' }}>
            Loading marketplace listings...
          </p>
        </div>
      ) : nftListings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏷️</div>
          <h3>No Listings Available</h3>
          <p className="text-gray">There are currently no NFTs listed for sale on the marketplace.</p>
        </div>
      ) : (
        <>
          <div className="marketplace-stats">
            <p className="text-gray">
              Showing {startIndex + 1}-{Math.min(endIndex, nftListings.length)} of {nftListings.length} listings
            </p>
          </div>

          <div className="marketplace-grid">
            {currentListings.map((listing) => (
              <div key={listing.mint} className="marketplace-nft-card" onClick={() => openNFTModal(listing)}>
                <div className="nft-image-container">
                  {listing.image ? (
                    <Image
                      src={listing.image}
                      alt={listing.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      style={{ objectFit: 'cover' }}
                      className="nft-image"
                    />
                  ) : (
                    <div className="nft-image-placeholder">
                      <span>🖼️</span>
                      <p>No Image</p>
                    </div>
                  )}
                </div>
                <div className="nft-details">
                  <h3 className="nft-name">{listing.name}</h3>
                  {listing.description && <p className="nft-description">{listing.description}</p>}
                  <div className="nft-info">
                    <div className="info-row">
                      <span className="info-label">Price:</span>
                      <span className="info-value">{(listing.price / 1e9).toFixed(2)} SOL</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Seller:</span>
                      <span className="info-value">
                        {listing.seller.slice(0, 4)}...{listing.seller.slice(-4)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button className="pagination-btn" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                ← Previous
              </button>

              <div className="pagination-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`pagination-number ${page === currentPage ? 'active' : ''}`}
                    onClick={() => goToPage(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                className="pagination-btn"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* NFT Detail Modal */}
      {showModal && selectedNFT && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              ✕
            </button>
            <div className="modal-image-container">
              {selectedNFT.image ? (
                <Image
                  src={selectedNFT.image}
                  alt={selectedNFT.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 600px"
                  style={{ objectFit: 'contain' }}
                  className="modal-image"
                />
              ) : (
                <div className="modal-image-placeholder">
                  <span>🖼️</span>
                  <p>No Image</p>
                </div>
              )}
            </div>
            <div className="modal-details">
              <h2 className="modal-title">{selectedNFT.name}</h2>
              {selectedNFT.description && <p className="modal-description">{selectedNFT.description}</p>}
              <div className="modal-info-grid">
                <div className="modal-info-item">
                  <span className="modal-info-label">Price</span>
                  <span className="modal-info-value">{(selectedNFT.price / 1e9).toFixed(2)} SOL</span>
                </div>
                <div className="modal-info-item">
                  <span className="modal-info-label">Seller</span>
                  <span className="modal-info-value" title={selectedNFT.seller}>
                    {selectedNFT.seller.slice(0, 8)}...{selectedNFT.seller.slice(-8)}
                  </span>
                </div>
                <div className="modal-info-item">
                  <span className="modal-info-label">Mint Address</span>
                  <span className="modal-info-value" title={selectedNFT.mint}>
                    {selectedNFT.mint.slice(0, 8)}...{selectedNFT.mint.slice(-8)}
                  </span>
                </div>
              </div>
              <button
                className="btn-primary modal-buy-btn"
                onClick={handleBuyFromModal}
                disabled={!connected || selectedNFT.seller === publicKey?.toString()}
              >
                {!connected
                  ? 'Connect Wallet to Buy'
                  : selectedNFT.seller === publicKey?.toString()
                    ? 'This is Your Listing'
                    : `Buy for ${(selectedNFT.price / 1e9).toFixed(2)} SOL`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />
    </div>
  )
}
