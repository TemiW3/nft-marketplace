'use client'
import { useEffect, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Metaplex } from '@metaplex-foundation/js'
import { PublicKey } from '@solana/web3.js'

export interface NFTMetadata {
  mint: string
  name: string
  symbol: string
  uri: string
  image: string
  description: string
  sellerFeeBasisPoints: number
  creators: Array<{
    address: string
    verified: boolean
    share: number
  }>
  collection?: {
    verified: boolean
    key: string
  }
}

export function useUserNFTs() {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const [nfts, setNfts] = useState<NFTMetadata[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!publicKey) {
      setNfts([])
      return
    }

    const fetchNFTs = async () => {
      setLoading(true)
      setError(null)

      try {
        const metaplex = Metaplex.make(connection)

        // Find all token accounts owned by the wallet
        const nftList = await metaplex.nfts().findAllByOwner({
          owner: publicKey,
        })

        console.log(`Found ${nftList.length} NFTs`)

        // Fetch full metadata for each NFT
        const nftsWithMetadata = await Promise.all(
          nftList.map(async (nft) => {
            try {
              // Load full NFT data only when the model is Metadata; otherwise it's already loaded
              let fullNft: any = nft as any
              if ((nft as any).model === 'metadata') {
                fullNft = await metaplex.nfts().load({ metadata: nft as any })
              }

              // Fetch off-chain metadata
              let image = ''
              let description = ''

              if (fullNft.json?.image) {
                image = fullNft.json.image
              }

              if (fullNft.json?.description) {
                description = fullNft.json.description
              }

              // Resolve mint address across models (Metadata | Nft | Sft)
              const mintStr =
                (fullNft as any)?.mintAddress?.toString?.() ||
                (fullNft as any)?.address?.toString?.() ||
                (nft as any)?.mintAddress?.toString?.() ||
                (nft as any)?.address?.toString?.()

              return {
                mint: mintStr,
                name: (fullNft as any).name ?? (nft as any).name,
                symbol: (fullNft as any).symbol ?? (nft as any).symbol,
                uri: (fullNft as any).uri ?? (nft as any).uri,
                image,
                description,
                sellerFeeBasisPoints: (nft as any).sellerFeeBasisPoints,
                creators: ((nft as any).creators || []).map((creator: any) => ({
                  address: creator.address.toString(),
                  verified: creator.verified,
                  share: creator.share,
                })),
                collection: (nft as any).collection
                  ? {
                      verified: (nft as any).collection.verified,
                      key: (nft as any).collection.address.toString(),
                    }
                  : undefined,
              }
            } catch (err) {
              const mintId = (nft as any)?.mintAddress?.toString?.() || (nft as any)?.address?.toString?.() || 'unknown'
              console.error(`Error loading NFT ${mintId}:`, err)
              // Return basic info if full load fails
              return {
                mint: (nft as any)?.mintAddress?.toString?.() || (nft as any)?.address?.toString?.() || '',
                name: (nft as any).name,
                symbol: (nft as any).symbol,
                uri: (nft as any).uri,
                image: '',
                description: '',
                sellerFeeBasisPoints: (nft as any).sellerFeeBasisPoints,
                creators: [],
              }
            }
          }),
        )

        setNfts(nftsWithMetadata)
      } catch (err) {
        console.error('Error fetching NFTs:', err)
        setError('Failed to fetch NFTs. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchNFTs()
  }, [publicKey, connection])

  return { nfts, loading, error, refetch: () => {} }
}
