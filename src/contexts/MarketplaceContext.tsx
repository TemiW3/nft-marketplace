'use client'
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, SystemProgram } from '@solana/web3.js'
import { Program, AnchorProvider, web3, BN } from '@coral-xyz/anchor'
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddress } from '@solana/spl-token'

import MARKETPLACE_IDL from '../idl/nftmarketplace.json'
const PROGRAM_ID = new PublicKey('EKReNxVoonN5sRAVgvNQiMWFfvkyRYSqWnNoYgAUaQRW')
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')

interface Listing {
  seller: PublicKey
  mint: PublicKey
  tokenAccount: PublicKey
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
  //   cancelListing: (listing: Listing) => Promise<void>
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
          tokenAccount: account.account.tokenAccount,
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

  const createListing = async (nftMint: PublicKey, price: number) => {
    if (!program || !wallet.publicKey) return

    try {
      const [listingPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('listing'), nftMint.toBuffer()],
        program.programId,
      )

      const [marketplacePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('marketplace'), nftMint.toBuffer()],
        program.programId,
      )

      const [nftTokenAccountPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('token_account'), nftMint.toBuffer()],
        program.programId,
      )

      // Get the user's NFT token account
      const userNftTokenAccounts = await connection.getTokenAccountsByOwner(wallet.publicKey, { mint: nftMint })

      if (userNftTokenAccounts.value.length === 0) {
        throw new Error('No NFT token account found')
      }

      const userNftTokenAccount = userNftTokenAccounts.value[0].pubkey

      await program.methods
        .createNftListing(new BN(price))
        .accounts({
          listing: listingPDA,
          marketplace: marketplacePDA,
          tokenAccount: nftTokenAccountPDA,
          sellerTokenAccount: userNftTokenAccount,
          seller: wallet.publicKey,
          mint: nftMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc()

      await refreshListings()
    } catch (error) {
      console.error('Error creating listing:', error)
      throw error
    }
  }

  const buyNft = async (listing: Listing) => {
    if (!program || !wallet.publicKey) return
    try {
      const [marketplacePDA] = PublicKey.findProgramAddressSync([Buffer.from('marketplace')], program.programId)

      const [listingPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('listing'), listing.mint.toBuffer()],
        program.programId,
      )

      const buyerNftTokenAccounts = await connection.getTokenAccountsByOwner(wallet.publicKey, { mint: listing.mint })

      let buyerNftTokenAccount: PublicKey
      let createTokenAccountInstruction: web3.TransactionInstruction | null = null

      if (buyerNftTokenAccounts.value.length === 0) {
        buyerNftTokenAccount = await getAssociatedTokenAddress(listing.mint, wallet.publicKey, false, TOKEN_PROGRAM_ID)

        createTokenAccountInstruction = createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          buyerNftTokenAccount,
          wallet.publicKey,
          listing.mint,
          TOKEN_PROGRAM_ID,
        )
      } else {
        buyerNftTokenAccount = buyerNftTokenAccounts.value[0].pubkey
      }

      const marketplaceAccount = await program.account.marketplace.fetch(marketplacePDA)
      const marketplaceAuthority = marketplaceAccount.authority as PublicKey

      const transaction = new web3.Transaction()

      if (createTokenAccountInstruction) {
        transaction.add(createTokenAccountInstruction)
      }

      const buyNftInstruction = await program.methods
        .buy()
        .accounts({
          listing: listingPDA,
          marketplace: marketplacePDA,
          tokenAccount: listing.tokenAccount,
          buyerNftTokenAccount: buyerNftTokenAccount,
          buyer: wallet.publicKey,
          seller: listing.seller,
          marketplaceAuthority: marketplaceAuthority,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .instruction()

      transaction.add(buyNftInstruction)

      const signature = await wallet.sendTransaction(transaction, connection)
      await connection.confirmTransaction(signature, 'processed')

      await refreshListings()
    } catch (error) {
      console.error('Error buying NFT:', error)
      throw error
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
    // cancelListing,
    refreshListings,
  }

  return <MarketplaceContext.Provider value={value}>{children}</MarketplaceContext.Provider>
}
