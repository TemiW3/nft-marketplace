import { NftmarketplaceAccount } from '@project/anchor'
import { UiWalletAccount } from '@wallet-ui/react'
import { Button } from '@/components/ui/button'
import { useNftmarketplaceIncrementMutation } from '../data-access/use-nftmarketplace-increment-mutation'

export function NftmarketplaceUiButtonIncrement({ account, nftmarketplace }: { account: UiWalletAccount; nftmarketplace: NftmarketplaceAccount }) {
  const incrementMutation = useNftmarketplaceIncrementMutation({ account, nftmarketplace })

  return (
    <Button variant="outline" onClick={() => incrementMutation.mutateAsync()} disabled={incrementMutation.isPending}>
      Increment
    </Button>
  )
}
