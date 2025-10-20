import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, SystemProgram } from '@solana/web3.js'
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor'

import MARKETPLACE_IDL from '../idl/nftmarketplace.json'

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
