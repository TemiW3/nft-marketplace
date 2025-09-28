import { NFTMARKETPLACE_PROGRAM_ADDRESS } from '@project/anchor'
import { AppExplorerLink } from '@/components/app-explorer-link'
import { ellipsify } from '@wallet-ui/react'

export function NftmarketplaceUiProgramExplorerLink() {
  return <AppExplorerLink address={NFTMARKETPLACE_PROGRAM_ADDRESS} label={ellipsify(NFTMARKETPLACE_PROGRAM_ADDRESS)} />
}
