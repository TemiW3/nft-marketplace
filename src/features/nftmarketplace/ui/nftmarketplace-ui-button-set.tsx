import { NftmarketplaceAccount } from '@project/anchor'
import { UiWalletAccount } from '@wallet-ui/react'
import { Button } from '@/components/ui/button'

import { useNftmarketplaceSetMutation } from '@/features/nftmarketplace/data-access/use-nftmarketplace-set-mutation'

export function NftmarketplaceUiButtonSet({ account, nftmarketplace }: { account: UiWalletAccount; nftmarketplace: NftmarketplaceAccount }) {
  const setMutation = useNftmarketplaceSetMutation({ account, nftmarketplace })

  return (
    <Button
      variant="outline"
      onClick={() => {
        const value = window.prompt('Set value to:', nftmarketplace.data.count.toString() ?? '0')
        if (!value || parseInt(value) === nftmarketplace.data.count || isNaN(parseInt(value))) {
          return
        }
        return setMutation.mutateAsync(parseInt(value))
      }}
      disabled={setMutation.isPending}
    >
      Set
    </Button>
  )
}
