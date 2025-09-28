import { NftmarketplaceAccount } from '@project/anchor'
import { UiWalletAccount } from '@wallet-ui/react'
import { Button } from '@/components/ui/button'

import { useNftmarketplaceDecrementMutation } from '../data-access/use-nftmarketplace-decrement-mutation'

export function NftmarketplaceUiButtonDecrement({ account, nftmarketplace }: { account: UiWalletAccount; nftmarketplace: NftmarketplaceAccount }) {
  const decrementMutation = useNftmarketplaceDecrementMutation({ account, nftmarketplace })

  return (
    <Button variant="outline" onClick={() => decrementMutation.mutateAsync()} disabled={decrementMutation.isPending}>
      Decrement
    </Button>
  )
}
