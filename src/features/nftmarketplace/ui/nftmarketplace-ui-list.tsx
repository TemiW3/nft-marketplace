import { NftmarketplaceUiCard } from './nftmarketplace-ui-card'
import { useNftmarketplaceAccountsQuery } from '@/features/nftmarketplace/data-access/use-nftmarketplace-accounts-query'
import { UiWalletAccount } from '@wallet-ui/react'

export function NftmarketplaceUiList({ account }: { account: UiWalletAccount }) {
  const nftmarketplaceAccountsQuery = useNftmarketplaceAccountsQuery()

  if (nftmarketplaceAccountsQuery.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>
  }

  if (!nftmarketplaceAccountsQuery.data?.length) {
    return (
      <div className="text-center">
        <h2 className={'text-2xl'}>No accounts</h2>
        No accounts found. Initialize one to get started.
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {nftmarketplaceAccountsQuery.data?.map((nftmarketplace) => (
        <NftmarketplaceUiCard account={account} key={nftmarketplace.address} nftmarketplace={nftmarketplace} />
      ))}
    </div>
  )
}
