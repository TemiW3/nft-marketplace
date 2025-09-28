import { NftmarketplaceAccount, getIncrementInstruction } from '@project/anchor'
import { UiWalletAccount, useWalletUiSigner } from '@wallet-ui/react'
import { useWalletUiSignAndSend } from '@wallet-ui/react-gill'
import { useMutation } from '@tanstack/react-query'
import { toastTx } from '@/components/toast-tx'
import { useNftmarketplaceAccountsInvalidate } from './use-nftmarketplace-accounts-invalidate'

export function useNftmarketplaceIncrementMutation({
  account,
  nftmarketplace,
}: {
  account: UiWalletAccount
  nftmarketplace: NftmarketplaceAccount
}) {
  const invalidateAccounts = useNftmarketplaceAccountsInvalidate()
  const signAndSend = useWalletUiSignAndSend()
  const signer = useWalletUiSigner({ account })

  return useMutation({
    mutationFn: async () => await signAndSend(getIncrementInstruction({ nftmarketplace: nftmarketplace.address }), signer),
    onSuccess: async (tx) => {
      toastTx(tx)
      await invalidateAccounts()
    },
  })
}
