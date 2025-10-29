'use client'
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, SystemProgram } from '@solana/web3.js'
import { Program, AnchorProvider, web3, BN } from '@coral-xyz/anchor'
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddress } from '@solana/spl-token'

import MARKETPLACE_IDL from '../idl/nftmarketplace.json'
import { Metaplex } from '@metaplex-foundation/js'

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

interface MarketplaceContextType {
  program: Program | null
  listings: Listing[]
  nftListings: NFTListing[]
  loading: boolean
  marketplaceInitialized: boolean
  checkingMarketplace: boolean
  createListing: (nftMint: PublicKey, price: number) => Promise<void>
  buyNft: (listing: NFTListing) => Promise<void>
  cancelListing: (listing: Listing) => Promise<void>
  refreshListings: () => Promise<void>
  initializeMarketplace: (feePercentage: number) => Promise<void>
  checkMarketplaceStatus: () => Promise<void>
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
  const [nftListings, setNftListings] = useState<NFTListing[]>([])
  const [loading, setLoading] = useState(false)
  const [marketplaceInitialized, setMarketplaceInitialized] = useState(false)
  const [checkingMarketplace, setCheckingMarketplace] = useState(true)

  useEffect(() => {
    if (wallet && connection && wallet.signTransaction) {
      const provider = new AnchorProvider(connection, wallet as any, {})
      const programInstance = new Program(MARKETPLACE_IDL as any, provider)
      setProgram(programInstance)
    }
  }, [wallet, connection])

  const checkMarketplaceStatus = async () => {
    setCheckingMarketplace(true)
    try {
      if (!program) return

      const [marketplacePDA] = PublicKey.findProgramAddressSync([Buffer.from('marketplace')], PROGRAM_ID)

      try {
        await (program as any).account.nftMarketplace.fetch(marketplacePDA)
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

  useEffect(() => {
    if (program) {
      checkMarketplaceStatus()
    }
  }, [program])

  const refreshListings = async () => {
    if (!program || !marketplaceInitialized) return

    setLoading(true)
    try {
      const metaplex = Metaplex.make(connection)
      const listingAccounts = await (program as any).account.listing.all()

      const activeListings = listingAccounts.filter((account: any) => account.account.isActive)
      setListings(
        activeListings.map((account: any) => ({
          seller: account.account.seller,
          mint: account.account.mint,
          tokenAccount: account.account.tokenAccount,
          price: account.account.price.toNumber(),
          isActive: account.account.isActive,
          bump: account.account.bump,
        })),
      )

      // Fetch metadata for each listing
      const listingsWithMetadata = await Promise.all(
        activeListings.map(async (listing: any) => {
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

      setNftListings(listingsWithMetadata)
    } catch (error) {
      console.error('Error fetching listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const createListing = async (nftMint: PublicKey, price: number) => {
    if (!program || !wallet.publicKey) return

    try {
      const [listingPDA] = PublicKey.findProgramAddressSync([Buffer.from('listing'), nftMint.toBuffer()], PROGRAM_ID)

      const [marketplacePDA] = PublicKey.findProgramAddressSync([Buffer.from('marketplace')], PROGRAM_ID)

      const [nftTokenAccountPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('token_account'), nftMint.toBuffer()],
        PROGRAM_ID,
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

  const buyNft = async (listing: NFTListing) => {
    if (!program || !wallet.publicKey) return
    try {
      const mintPubkey = new PublicKey(listing.mint)
      const [marketplacePDA] = PublicKey.findProgramAddressSync([Buffer.from('marketplace')], PROGRAM_ID)
      const [listingPDA] = PublicKey.findProgramAddressSync([Buffer.from('listing'), mintPubkey.toBuffer()], PROGRAM_ID)

      const marketplaceAccount = await (program as any).account.nftMarketplace.fetch(marketplacePDA)
      const marketplaceAuthority = marketplaceAccount.authority as PublicKey

      const buyerNftTokenAccounts = await connection.getTokenAccountsByOwner(wallet.publicKey, { mint: mintPubkey })

      let buyerNftTokenAccount: PublicKey
      let createTokenAccountInstruction: web3.TransactionInstruction | null = null

      if (buyerNftTokenAccounts.value.length === 0) {
        buyerNftTokenAccount = await getAssociatedTokenAddress(mintPubkey, wallet.publicKey, false, TOKEN_PROGRAM_ID)

        createTokenAccountInstruction = createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          buyerNftTokenAccount,
          wallet.publicKey,
          mintPubkey,
          TOKEN_PROGRAM_ID,
        )
      } else {
        buyerNftTokenAccount = buyerNftTokenAccounts.value[0].pubkey
      }

      const transaction = new web3.Transaction()

      if (createTokenAccountInstruction) {
        transaction.add(createTokenAccountInstruction)
      }

      const buyNftInstruction = await (program as any).methods
        .buy()
        .accounts({
          listing: listingPDA,
          marketplace: marketplacePDA,
          tokenAccount: new PublicKey(listing.tokenAccount),
          buyerTokenAccount: buyerNftTokenAccount,
          buyer: wallet.publicKey,
          seller: new PublicKey(listing.seller),
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

  const cancelListing = async (listing: Listing) => {
    if (!program || !wallet.publicKey) return

    try {
      const [marketplacePDA] = PublicKey.findProgramAddressSync([Buffer.from('marketplace')], PROGRAM_ID)

      const [listingPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('listing'), listing.mint.toBuffer()],
        PROGRAM_ID,
      )

      // Get the seller's NFT token account
      const sellerNftTokenAccounts = await connection.getTokenAccountsByOwner(wallet.publicKey, { mint: listing.mint })
      if (sellerNftTokenAccounts.value.length === 0) {
        throw new Error('Seller NFT token account not found')
      }

      const sellerNftTokenAccount = sellerNftTokenAccounts.value[0].pubkey

      await program.methods
        .cancelNftListing()
        .accounts({
          listing: listingPDA,
          tokenAccount: listing.tokenAccount,
          marketplace: marketplacePDA,
          mint: listing.mint,
          sellerTokenAccount: sellerNftTokenAccount,
          seller: wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc()

      await refreshListings()
    } catch (error) {
      console.error('Error canceling NFT listing:', error)
      throw error
    }
  }

  const initializeMarketplace = async (feePercentage: number) => {
    if (!program || !wallet.publicKey) return

    try {
      const [marketplacePDA] = PublicKey.findProgramAddressSync([Buffer.from('marketplace')], PROGRAM_ID)

      await (program as any).methods
        .initializeMarketplace(feePercentage)
        .accounts({
          marketplace: marketplacePDA,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()

      setMarketplaceInitialized(true)
    } catch (error) {
      console.error('Error initializing marketplace:', error)
      throw error
    }
  }

  useEffect(() => {
    if (program && marketplaceInitialized) {
      refreshListings()
    }
  }, [program, marketplaceInitialized])

  const value: MarketplaceContextType = {
    program,
    listings,
    nftListings,
    loading,
    marketplaceInitialized,
    checkingMarketplace,
    createListing,
    buyNft,
    cancelListing,
    refreshListings,
    initializeMarketplace,
    checkMarketplaceStatus,
  }

  return <MarketplaceContext.Provider value={value}>{children}</MarketplaceContext.Provider>
}
