import { useSolana } from '@/components/solana/use-solana'
import { useQuery } from '@tanstack/react-query'
import { getNftmarketplaceProgramAccounts } from '@project/anchor'
import { useNftmarketplaceAccountsQueryKey } from './use-nftmarketplace-accounts-query-key'

export function useNftmarketplaceAccountsQuery() {
  const { client } = useSolana()

  return useQuery({
    queryKey: useNftmarketplaceAccountsQueryKey(),
    queryFn: async () => await getNftmarketplaceProgramAccounts(client.rpc),
  })
}
