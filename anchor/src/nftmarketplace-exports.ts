// Here we export some useful types and functions for interacting with the Anchor program.
import { Account, getBase58Decoder, SolanaClient } from 'gill'
import { getProgramAccountsDecoded } from './helpers/get-program-accounts-decoded'
import { Nftmarketplace, NFTMARKETPLACE_DISCRIMINATOR, NFTMARKETPLACE_PROGRAM_ADDRESS, getNftmarketplaceDecoder } from './client/js'
import NftmarketplaceIDL from '../target/idl/nftmarketplace.json'

export type NftmarketplaceAccount = Account<Nftmarketplace, string>

// Re-export the generated IDL and type
export { NftmarketplaceIDL }

export * from './client/js'

export function getNftmarketplaceProgramAccounts(rpc: SolanaClient['rpc']) {
  return getProgramAccountsDecoded(rpc, {
    decoder: getNftmarketplaceDecoder(),
    filter: getBase58Decoder().decode(NFTMARKETPLACE_DISCRIMINATOR),
    programAddress: NFTMARKETPLACE_PROGRAM_ADDRESS,
  })
}
