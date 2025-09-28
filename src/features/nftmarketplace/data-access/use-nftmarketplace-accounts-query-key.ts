import { useSolana } from '@/components/solana/use-solana'

export function useNftmarketplaceAccountsQueryKey() {
  const { cluster } = useSolana()

  return ['nftmarketplace', 'accounts', { cluster }]
}
