import { NftmarketplaceAccount, getDecrementInstruction } from '@project/anchor'
import { useMutation } from '@tanstack/react-query'
import { UiWalletAccount, useWalletUiSigner } from '@wallet-ui/react'
import { useWalletUiSignAndSend } from '@wallet-ui/react-gill'
import { toastTx } from '@/components/toast-tx'
import { useNftmarketplaceAccountsInvalidate } from './use-nftmarketplace-accounts-invalidate'

export function useNftmarketplaceDecrementMutation({
  account,
  nftmarketplace,
}: {
  account: UiWalletAccount
  nftmarketplace: NftmarketplaceAccount
}) {
  const invalidateAccounts = useNftmarketplaceAccountsInvalidate()
  const signer = useWalletUiSigner({ account })
  const signAndSend = useWalletUiSignAndSend()

  return useMutation({
    mutationFn: async () => await signAndSend(getDecrementInstruction({ nftmarketplace: nftmarketplace.address }), signer),
    onSuccess: async (tx) => {
      toastTx(tx)
      await invalidateAccounts()
    },
  })
}
