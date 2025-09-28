import { useQueryClient } from '@tanstack/react-query'
import { useNftmarketplaceAccountsQueryKey } from './use-nftmarketplace-accounts-query-key'

export function useNftmarketplaceAccountsInvalidate() {
  const queryClient = useQueryClient()
  const queryKey = useNftmarketplaceAccountsQueryKey()

  return () => queryClient.invalidateQueries({ queryKey })
}
