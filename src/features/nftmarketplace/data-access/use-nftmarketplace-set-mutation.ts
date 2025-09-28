import { NftmarketplaceAccount, getSetInstruction } from '@project/anchor'
import { useMutation } from '@tanstack/react-query'
import { UiWalletAccount, useWalletUiSigner } from '@wallet-ui/react'
import { useWalletUiSignAndSend } from '@wallet-ui/react-gill'
import { toastTx } from '@/components/toast-tx'
import { useNftmarketplaceAccountsInvalidate } from './use-nftmarketplace-accounts-invalidate'

export function useNftmarketplaceSetMutation({ account, nftmarketplace }: { account: UiWalletAccount; nftmarketplace: NftmarketplaceAccount }) {
  const invalidateAccounts = useNftmarketplaceAccountsInvalidate()
  const signAndSend = useWalletUiSignAndSend()
  const signer = useWalletUiSigner({ account })

  return useMutation({
    mutationFn: async (value: number) =>
      await signAndSend(
        getSetInstruction({
          nftmarketplace: nftmarketplace.address,
          value,
        }),
        signer,
      ),
    onSuccess: async (tx) => {
      toastTx(tx)
      await invalidateAccounts()
    },
  })
}
