import { NftmarketplaceAccount } from '@project/anchor'
import { UiWalletAccount } from '@wallet-ui/react'
import { Button } from '@/components/ui/button'

import { useNftmarketplaceCloseMutation } from '@/features/nftmarketplace/data-access/use-nftmarketplace-close-mutation'

export function NftmarketplaceUiButtonClose({ account, nftmarketplace }: { account: UiWalletAccount; nftmarketplace: NftmarketplaceAccount }) {
  const closeMutation = useNftmarketplaceCloseMutation({ account, nftmarketplace })

  return (
    <Button
      variant="destructive"
      onClick={() => {
        if (!window.confirm('Are you sure you want to close this account?')) {
          return
        }
        return closeMutation.mutateAsync()
      }}
      disabled={closeMutation.isPending}
    >
      Close
    </Button>
  )
}
