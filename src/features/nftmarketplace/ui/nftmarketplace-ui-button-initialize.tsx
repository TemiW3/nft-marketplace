import { Button } from '@/components/ui/button'
import { UiWalletAccount } from '@wallet-ui/react'

import { useNftmarketplaceInitializeMutation } from '@/features/nftmarketplace/data-access/use-nftmarketplace-initialize-mutation'

export function NftmarketplaceUiButtonInitialize({ account }: { account: UiWalletAccount }) {
  const mutationInitialize = useNftmarketplaceInitializeMutation({ account })

  return (
    <Button onClick={() => mutationInitialize.mutateAsync()} disabled={mutationInitialize.isPending}>
      Initialize Nftmarketplace {mutationInitialize.isPending && '...'}
    </Button>
  )
}
