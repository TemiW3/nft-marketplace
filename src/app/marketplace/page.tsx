'use client'
import React, { useState, useEffect } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'
import { Metaplex } from '@metaplex-foundation/js'
import Image from 'next/image'
import './marketplace.css'
import { Nftmarketplace } from '../../../anchor/target/types/nftmarketplace'
import idl from '../../idl/nftmarketplace.json'

const PROGRAM_ID = new PublicKey('EKReNxVoonN5sRAVgvNQiMWFfvkyRYSqWnNoYgAUaQRW')
const ITEMS_PER_PAGE = 9

interface NFTListing {
  mint: string
  seller: string
  price: number
  tokenAccount: string
  isActive: boolean
  name: string
  image: string
  description: string
}

export default function MarketplacePage() {
  const wallet = useWallet()
  const { publicKey, connected } = wallet
  const { connection } = useConnection()
  const [marketplaceInitialized, setMarketplaceInitialized] = useState(false)
  const [checkingMarketplace, setCheckingMarketplace] = useState(true)
  const [initializing, setInitializing] = useState(false)
  const [listings, setListings] = useState<NFTListing[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [feePercentage, setFeePercentage] = useState<string>('2')
  const [selectedNFT, setSelectedNFT] = useState<NFTListing | null>(null)
  const [showModal, setShowModal] = useState(false)

  // Check if marketplace is initialized
  useEffect(() => {
    const checkMarketplace = async () => {
      setCheckingMarketplace(true)
      try {
        const provider = new AnchorProvider(connection, wallet as any, {})
        const program = new Program(idl as Nftmarketplace, provider)

        const [marketplacePDA] = PublicKey.findProgramAddressSync([Buffer.from('marketplace')], PROGRAM_ID)

        try {
          await program.account.nftMarketplace.fetch(marketplacePDA)
          setMarketplaceInitialized(true)
        } catch (err) {
          setMarketplaceInitialized(false)
        }
      } catch (err) {
        console.error('Error checking marketplace:', err)
      } finally {
        setCheckingMarketplace(false)
      }
    }

    checkMarketplace()
  }, [connection, wallet])

  // Fetch listings when marketplace is initialized
  useEffect(() => {
    if (!marketplaceInitialized) return

    const fetchListings = async () => {
      setLoading(true)
      setError(null)
      try {
        const provider = new AnchorProvider(connection, wallet as any, {})
        const program = new Program(idl as Nftmarketplace, provider)
        const metaplex = Metaplex.make(connection)

        // Fetch all active listings
        const listingAccounts = await program.account.listing.all([
          {
            memcmp: {
              offset: 8 + 32 + 32 + 32 + 8, // discriminator + seller + mint + token_account + price
              bytes: '2', // isActive = true (base58 encoded)
            },
          },
        ])

        // Fetch metadata for each listing
        const listingsWithMetadata = await Promise.all(
          listingAccounts.map(async (listing) => {
            try {
              const mintAddress = new PublicKey(listing.account.mint)
              const nft = await metaplex.nfts().findByMint({ mintAddress })

              let image = ''
              let name = listing.account.mint.toString().slice(0, 8)
              let description = ''

              if (nft.json) {
                name = nft.json.name || name
                // Clean up image URL - remove @ prefix if present
                let rawImage = nft.json.image || ''
                if (rawImage.startsWith('@')) {
                  rawImage = rawImage.substring(1)
                }
                image = rawImage
                description = nft.json.description || ''
              }

              return {
                mint: listing.account.mint.toString(),
                seller: listing.account.seller.toString(),
                price: listing.account.price.toNumber(),
                tokenAccount: listing.account.tokenAccount.toString(),
                isActive: listing.account.isActive,
                name,
                image,
                description,
              }
            } catch (err) {
              console.error('Error fetching NFT metadata:', err)
              return {
                mint: listing.account.mint.toString(),
                seller: listing.account.seller.toString(),
                price: listing.account.price.toNumber(),
                tokenAccount: listing.account.tokenAccount.toString(),
                isActive: listing.account.isActive,
                name: listing.account.mint.toString().slice(0, 8),
                image: '',
                description: '',
              }
            }
          }),
        )

        setListings(listingsWithMetadata)
      } catch (err) {
        console.error('Error fetching listings:', err)
        setError('Failed to load marketplace listings')
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
  }, [marketplaceInitialized, connection, wallet])

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
      const provider = new AnchorProvider(connection, wallet as any, {})
      const program = new Program(idl as Nftmarketplace, provider)

      const [marketplacePDA] = PublicKey.findProgramAddressSync([Buffer.from('marketplace')], PROGRAM_ID)

      // Convert percentage to basis points (e.g., 2% = 200 basis points)
      const feeBasisPoints = Math.round(fee * 100)

      await program.methods
        .initializeMarketplace(feeBasisPoints)
        .accounts({
          marketplace: marketplacePDA,
          authority: publicKey,
          systemProgram: PublicKey.default,
        })
        .rpc()

      setMarketplaceInitialized(true)
    } catch (err: any) {
      console.error('Error initializing marketplace:', err)
      setError(err.message || 'Failed to initialize marketplace')
    } finally {
      setInitializing(false)
    }
  }

  const openNFTModal = (listing: NFTListing) => {
    setSelectedNFT(listing)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedNFT(null)
  }

  const handleBuyNFT = async (listing: NFTListing) => {
    if (!publicKey || !connected) {
      alert('Please connect your wallet first')
      return
    }

    try {
      const provider = new AnchorProvider(connection, wallet as any, {})
      const program = new Program(idl as Nftmarketplace, provider)

      const mintPubkey = new PublicKey(listing.mint)
      const [marketplacePDA] = PublicKey.findProgramAddressSync([Buffer.from('marketplace')], PROGRAM_ID)
      const [listingPDA] = PublicKey.findProgramAddressSync([Buffer.from('listing'), mintPubkey.toBuffer()], PROGRAM_ID)

      // Get marketplace authority
      const marketplaceAccount = await program.account.nftMarketplace.fetch(marketplacePDA)
      const marketplaceAuthority = marketplaceAccount.authority as PublicKey

      // Get buyer's token account (or create placeholder)
      const buyerTokenAccounts = await connection.getTokenAccountsByOwner(publicKey, { mint: mintPubkey })
      const buyerTokenAccount =
        buyerTokenAccounts.value.length > 0 ? buyerTokenAccounts.value[0].pubkey : PublicKey.default

      await program.methods
        .buy()
        .accounts({
          listing: listingPDA,
          marketplace: marketplacePDA,
          tokenAccount: new PublicKey(listing.tokenAccount),
          buyerTokenAccount: buyerTokenAccount,
          buyer: publicKey,
          seller: new PublicKey(listing.seller),
          marketplaceAuthority: marketplaceAuthority,
          tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          systemProgram: PublicKey.default,
        })
        .rpc()

      alert('NFT purchased successfully!')
      closeModal()
      // Refresh listings
      window.location.reload()
    } catch (err: any) {
      console.error('Error buying NFT:', err)
      alert(err.message || 'Failed to purchase NFT')
    }
  }

  const handleBuyFromModal = () => {
    if (selectedNFT) {
      handleBuyNFT(selectedNFT)
    }
  }

  // Pagination logic
  const totalPages = Math.ceil(listings.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentListings = listings.slice(startIndex, endIndex)

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
      ) : listings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏷️</div>
          <h3>No Listings Available</h3>
          <p className="text-gray">There are currently no NFTs listed for sale on the marketplace.</p>
        </div>
      ) : (
        <>
          <div className="marketplace-stats">
            <p className="text-gray">
              Showing {startIndex + 1}-{Math.min(endIndex, listings.length)} of {listings.length} listings
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
    </div>
  )
}
