import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, SystemProgram } from '@solana/web3.js'
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor'

import MARKETPLACE_IDL from '../idl/nftmarketplace.json'
const PROGRAM_ID = new PublicKey('EKReNxVoonN5sRAVgvNQiMWFfvkyRYSqWnNoYgAUaQRW')

interface Listing {
  seller: PublicKey
  nftMint: PublicKey
  nftTokenAccount: PublicKey
  price: number
  isActive: boolean
  bump: number
}

interface MarketplaceContextType {
  program: Program | null
  listings: Listing[]
  loading: boolean
  createListing: (nftMint: PublicKey, price: number) => Promise<void>
  buyNft: (listing: Listing) => Promise<void>
  cancelListing: (listing: Listing) => Promise<void>
  refreshListings: () => Promise<void>
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined)

export const useMarketplace = () => {
  const context = useContext(MarketplaceContext)
  if (!context) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider')
  }
  return context
}

interface MarketplaceProviderProps {
  children: ReactNode
}

export const MarketplaceProvider: React.FC<MarketplaceProviderProps> = ({ children }) => {
  const { connection } = useConnection()
  const wallet = useWallet()
  const [program, setProgram] = useState<Program | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (wallet && connection && wallet.signTransaction) {
      const provider = new AnchorProvider(connection, wallet as any, {})
      const programInstance = new Program(MARKETPLACE_IDL as any, provider)
      setProgram(programInstance)
    }
  }, [wallet, connection])

  const refreshListings = async () => {
    if (!program) return

    setLoading(true)
    try {
      const listingAccounts = await (program as any).account.listing.all()
      const listingsData = listingAccounts
        .filter((account: any) => account.account.isActive)
        .map((account: any) => ({
          seller: account.account.seller,
          nftMint: account.account.nftMint,
          nftTokenAccount: account.account.nftTokenAccount,
          price: account.account.price.toNumber(),
          isActive: account.account.isActive,
          bump: account.account.bump,
        }))
      setListings(listingsData)
    } catch (error) {
      console.error('Error fetching listings:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (program) {
      refreshListings()
    }
  }, [program])

  const value: MarketplaceContextType = {
    program,
    listings,
    loading,
    createListing,
    buyNft,
    cancelListing,
    refreshListings,
  }

  return <MarketplaceContext.Provider value={value}>{children}</MarketplaceContext.Provider>
}
