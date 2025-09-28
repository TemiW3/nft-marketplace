import { NftmarketplaceAccount } from '@project/anchor'
import { ellipsify, UiWalletAccount } from '@wallet-ui/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AppExplorerLink } from '@/components/app-explorer-link'
import { NftmarketplaceUiButtonClose } from './nftmarketplace-ui-button-close'
import { NftmarketplaceUiButtonDecrement } from './nftmarketplace-ui-button-decrement'
import { NftmarketplaceUiButtonIncrement } from './nftmarketplace-ui-button-increment'
import { NftmarketplaceUiButtonSet } from './nftmarketplace-ui-button-set'

export function NftmarketplaceUiCard({ account, nftmarketplace }: { account: UiWalletAccount; nftmarketplace: NftmarketplaceAccount }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nftmarketplace: {nftmarketplace.data.count}</CardTitle>
        <CardDescription>
          Account: <AppExplorerLink address={nftmarketplace.address} label={ellipsify(nftmarketplace.address)} />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 justify-evenly">
          <NftmarketplaceUiButtonIncrement account={account} nftmarketplace={nftmarketplace} />
          <NftmarketplaceUiButtonSet account={account} nftmarketplace={nftmarketplace} />
          <NftmarketplaceUiButtonDecrement account={account} nftmarketplace={nftmarketplace} />
          <NftmarketplaceUiButtonClose account={account} nftmarketplace={nftmarketplace} />
        </div>
      </CardContent>
    </Card>
  )
}
