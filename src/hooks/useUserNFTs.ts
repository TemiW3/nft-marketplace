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
              // Load full NFT data
              const fullNft = await metaplex.nfts().load({ metadata: nft })

              // Fetch off-chain metadata
              let image = ''
              let description = ''

              if (fullNft.json?.image) {
                image = fullNft.json.image
              }

              if (fullNft.json?.description) {
                description = fullNft.json.description
              }

              return {
                mint: nft.mintAddress.toString(),
                name: nft.name,
                symbol: nft.symbol,
                uri: nft.uri,
                image,
                description,
                sellerFeeBasisPoints: nft.sellerFeeBasisPoints,
                creators: nft.creators.map((creator) => ({
                  address: creator.address.toString(),
                  verified: creator.verified,
                  share: creator.share,
                })),
                collection: nft.collection
                  ? {
                      verified: nft.collection.verified,
                      key: nft.collection.address.toString(),
                    }
                  : undefined,
              }
            } catch (err) {
              console.error(`Error loading NFT ${nft.mintAddress.toString()}:`, err)
              // Return basic info if full load fails
              return {
                mint: nft.mintAddress.toString(),
                name: nft.name,
                symbol: nft.symbol,
                uri: nft.uri,
                image: '',
                description: '',
                sellerFeeBasisPoints: nft.sellerFeeBasisPoints,
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
