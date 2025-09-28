import { useSolana } from '@/components/solana/use-solana'
import { WalletDropdown } from '@/components/wallet-dropdown'
import { AppHero } from '@/components/app-hero'
import { NftmarketplaceUiButtonInitialize } from './ui/nftmarketplace-ui-button-initialize'
import { NftmarketplaceUiList } from './ui/nftmarketplace-ui-list'
import { NftmarketplaceUiProgramExplorerLink } from './ui/nftmarketplace-ui-program-explorer-link'
import { NftmarketplaceUiProgramGuard } from './ui/nftmarketplace-ui-program-guard'

export default function NftmarketplaceFeature() {
  const { account } = useSolana()

  return (
    <NftmarketplaceUiProgramGuard>
      <AppHero
        title="Nftmarketplace"
        subtitle={
          account
            ? "Initialize a new nftmarketplace onchain by clicking the button. Use the program's methods (increment, decrement, set, and close) to change the state of the account."
            : 'Select a wallet to run the program.'
        }
      >
        <p className="mb-6">
          <NftmarketplaceUiProgramExplorerLink />
        </p>
        {account ? (
          <NftmarketplaceUiButtonInitialize account={account} />
        ) : (
          <div style={{ display: 'inline-block' }}>
            <WalletDropdown />
          </div>
        )}
      </AppHero>
      {account ? <NftmarketplaceUiList account={account} /> : null}
    </NftmarketplaceUiProgramGuard>
  )
}
